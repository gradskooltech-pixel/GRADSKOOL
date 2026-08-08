"""
GRADSKOOL — Leads Models

Unified lead pipeline that captures, tracks, and nurtures
every prospect across all touch points:

  Lead            → A person (email) who has shown interest.
                    Created from: tool gate, blog subscribe, course page CTA,
                    manual import, or on user registration.

  LeadSource      → Where the lead came from (tool slug, page, UTM params).

  DripSequence    → A named email sequence (e.g. "CAT Tool Welcome Series",
                    "GMAT Nurture — No Purchase").

  DripEmail       → A single email within a sequence (subject, HTML body,
                    send delay in hours after sequence enrollment).

  DripEnrollment  → Tracks a lead's progress through a sequence.
                    Created by a Celery task or signal.

  EmailEvent      → Sent / opened / clicked / bounced events from Resend
                    webhooks. Used for analytics.

  LeadNote        → Internal admin notes on a lead (sales team use).

Key design decisions:
  - A Lead is identified by email (unique).
  - A Lead can enrol in multiple DripSequences simultaneously.
  - DripEnrollment tracks next_send_at and current step index.
  - Celery beat runs every 15 minutes and sends pending emails.
  - Resend webhooks update EmailEvent records.
  - Leads who convert (make a purchase) are marked status='converted'
    and paused from all drip sequences automatically (via signal).
"""
import uuid
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Lead(models.Model):
    STATUS = [
        ('new',       'New'),
        ('engaged',   'Engaged'),       # Opened an email / revisited
        ('nurtured',  'Nurtured'),      # In active drip sequence
        ('converted', 'Converted'),     # Made a purchase
        ('unsubscribed', 'Unsubscribed'),
        ('bounced',   'Bounced'),
    ]

    EXAM_CHOICES = [
        ('CAT', 'CAT'), ('GMAT', 'GMAT'), ('GRE', 'GRE'),
        ('IPMAT', 'IPMAT'), ('XAT', 'XAT'), ('SNAP', 'SNAP'),
        ('NMAT', 'NMAT'), ('CMAT', 'CMAT'), ('MHCET', 'MH CET'),
        ('CLAT', 'CLAT'), ('CUET', 'CUET'), ('OTHER', 'Other'),
    ]

    # Identity
    email       = models.EmailField(unique=True, db_index=True)
    first_name  = models.CharField(max_length=120, blank=True)
    last_name   = models.CharField(max_length=120, blank=True)
    phone       = models.CharField(max_length=15, blank=True)

    # Qualification
    target_exam    = models.CharField(max_length=20, choices=EXAM_CHOICES, blank=True)
    status         = models.CharField(max_length=20, choices=STATUS, default='new')
    lead_score     = models.IntegerField(default=0)
    # Scoring: +5 tool use, +3 email open, +10 page visit, +20 email click

    # Linked user (if they registered)
    user = models.OneToOneField(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='lead_profile'
    )

    # Conversion tracking
    converted_at   = models.DateTimeField(null=True, blank=True)
    converted_plan = models.ForeignKey(
        'courses.PricingPlan', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='converted_leads'
    )

    # Communication preferences
    is_subscribed       = models.BooleanField(default=True)
    unsubscribed_at     = models.DateTimeField(null=True, blank=True)
    unsubscribe_token   = models.UUIDField(default=uuid.uuid4, unique=True)

    # Metadata
    ip_address     = models.GenericIPAddressField(null=True, blank=True)
    utm_source     = models.CharField(max_length=100, blank=True)
    utm_medium     = models.CharField(max_length=100, blank=True)
    utm_campaign   = models.CharField(max_length=100, blank=True)
    utm_content    = models.CharField(max_length=100, blank=True)
    referrer_url   = models.URLField(blank=True)

    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
    last_seen_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'leads'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['status']),
            models.Index(fields=['target_exam', 'status']),
            models.Index(fields=['lead_score']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        name = f'{self.first_name} {self.last_name}'.strip() or '—'
        return f'{name} <{self.email}> [{self.status}]'

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.email.split('@')[0]

    def score_up(self, points: int, reason: str = ''):
        """Increment lead score and save."""
        self.lead_score += points
        self.updated_at = timezone.now()
        self.save(update_fields=['lead_score', 'updated_at'])

    def mark_converted(self, plan=None):
        self.status = 'converted'
        self.converted_at = timezone.now()
        self.converted_plan = plan
        self.save(update_fields=['status', 'converted_at', 'converted_plan', 'updated_at'])
        # Pause all active drip enrollments
        DripEnrollment.objects.filter(
            lead=self, status='active'
        ).update(status='paused')

    def unsubscribe(self):
        self.is_subscribed = False
        self.status = 'unsubscribed'
        self.unsubscribed_at = timezone.now()
        self.save(update_fields=['is_subscribed', 'status', 'unsubscribed_at', 'updated_at'])
        DripEnrollment.objects.filter(
            lead=self, status='active'
        ).update(status='paused')


class LeadSource(models.Model):
    """
    Tracks every touch point for a lead.
    Multiple sources per lead — first-touch and last-touch are both stored.
    """
    SOURCE_TYPES = [
        ('tool_gate',      'Tool Gate'),
        ('blog_subscribe', 'Blog Subscribe'),
        ('course_page',    'Course Page CTA'),
        ('checkout',       'Checkout (Abandoned)'),
        ('registration',   'Account Registration'),
        ('manual',         'Manual Import'),
        ('referral',       'Referral'),
        ('organic',        'Organic Search'),
        ('paid',           'Paid Ad'),
        ('social',         'Social Media'),
        ('whatsapp',       'WhatsApp'),
    ]

    lead        = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='sources')
    source_type = models.CharField(max_length=30, choices=SOURCE_TYPES)
    source_detail = models.CharField(max_length=255, blank=True)
    # e.g. tool slug, page URL, UTM campaign
    is_first_touch = models.BooleanField(default=False)
    is_last_touch  = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lead_sources'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.lead.email} ← {self.source_type}: {self.source_detail}'


# ── DRIP SEQUENCES ────────────────────────────────────────────────────────────

class DripSequence(models.Model):
    """
    A named email sequence. A lead can be enrolled in multiple sequences.

    trigger_exam: if set, this sequence is auto-triggered for leads
                  with this target exam who have not yet converted.

    Examples from GRADSKOOL:
      - "CAT Tool Welcome"         → 3 emails over 5 days
      - "GMAT Nurture"             → 5 emails over 14 days
      - "Post-Registration"        → 2 emails over 2 days
      - "Abandoned Checkout"       → 2 emails over 48 hours
      - "Monthly Newsletter"       → 1 email, recurring
    """
    TRIGGER_EVENTS = [
        ('tool_gate',       'Tool Gate Submit'),
        ('registration',    'Account Registration'),
        ('checkout_abandon','Checkout Abandoned'),
        ('manual',          'Manual Enrollment'),
        ('post_purchase',   'Post Purchase'),
    ]

    name          = models.CharField(max_length=200, unique=True)
    slug          = models.SlugField(unique=True, max_length=200)
    description   = models.TextField(blank=True)
    trigger_event = models.CharField(max_length=30, choices=TRIGGER_EVENTS, blank=True)
    trigger_exam  = models.CharField(max_length=20, blank=True)
    # Empty = triggers for all exams

    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'drip_sequences'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def email_count(self):
        return self.emails.count()


class DripEmail(models.Model):
    """
    A single email within a DripSequence.
    send_delay_hours: how many hours after the previous email
                      (or sequence enrollment for step 1) to send.
    """
    sequence        = models.ForeignKey(
        DripSequence, on_delete=models.CASCADE, related_name='emails'
    )
    step            = models.IntegerField()       # 1, 2, 3…
    subject         = models.CharField(max_length=255)
    preview_text    = models.CharField(max_length=160, blank=True)
    html_body       = models.TextField(
        help_text='Use {{ first_name }}, {{ exam }}, {{ unsubscribe_url }} as template vars.'
    )
    send_delay_hours = models.IntegerField(default=24)
    # Step 1: hours after enrollment. Steps 2+: hours after previous email sent.

    is_active       = models.BooleanField(default=True)

    class Meta:
        db_table       = 'drip_emails'
        ordering       = ['sequence', 'step']
        unique_together = ('sequence', 'step')

    def __str__(self):
        return f'[{self.sequence.slug}] Step {self.step}: {self.subject}'

    def render(self, lead: 'Lead', unsubscribe_url: str) -> str:
        """Interpolate template variables into html_body."""
        return (
            self.html_body
            .replace('{{ first_name }}',    lead.first_name or 'Aspirant')
            .replace('{{ full_name }}',     lead.full_name)
            .replace('{{ email }}',         lead.email)
            .replace('{{ exam }}',          lead.target_exam or 'your target exam')
            .replace('{{ unsubscribe_url }}', unsubscribe_url)
        )


class DripEnrollment(models.Model):
    """
    Tracks a lead's progress through a DripSequence.
    One row per (lead, sequence) pair.
    """
    STATUS = [
        ('active',    'Active'),
        ('paused',    'Paused'),     # Lead converted / unsubscribed
        ('completed', 'Completed'),  # All emails sent
        ('cancelled', 'Cancelled'),
    ]

    lead        = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='drip_enrollments')
    sequence    = models.ForeignKey(DripSequence, on_delete=models.CASCADE, related_name='enrollments')
    status      = models.CharField(max_length=20, choices=STATUS, default='active')
    current_step = models.IntegerField(default=1)
    next_send_at = models.DateTimeField(null=True, blank=True)
    enrolled_at  = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table       = 'drip_enrollments'
        unique_together = ('lead', 'sequence')
        indexes = [
            models.Index(fields=['status', 'next_send_at']),
        ]

    def __str__(self):
        return f'{self.lead.email} → {self.sequence.name} [step {self.current_step}]'

    def advance(self):
        """Move to next step after successfully sending current step."""
        try:
            next_email = self.sequence.emails.get(
                step=self.current_step + 1, is_active=True
            )
            self.current_step += 1
            self.next_send_at = timezone.now() + \
                __import__('datetime').timedelta(hours=next_email.send_delay_hours)
            self.save(update_fields=['current_step', 'next_send_at'])
        except DripEmail.DoesNotExist:
            # No more steps — sequence complete
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.save(update_fields=['status', 'completed_at'])


# ── EMAIL EVENTS ──────────────────────────────────────────────────────────────

class EmailEvent(models.Model):
    """
    Records Resend webhook events for sent drip emails.
    Used for open rate, click rate, and bounce analytics.
    """
    EVENT_TYPES = [
        ('sent',        'Sent'),
        ('delivered',   'Delivered'),
        ('opened',      'Opened'),
        ('clicked',     'Clicked'),
        ('bounced',     'Bounced'),
        ('complained',  'Spam Complaint'),
        ('unsubscribed', 'Unsubscribed'),
    ]

    lead          = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='email_events')
    drip_email    = models.ForeignKey(
        DripEmail, on_delete=models.CASCADE,
        null=True, blank=True, related_name='events'
    )
    resend_email_id = models.CharField(max_length=100, blank=True, db_index=True)
    event_type    = models.CharField(max_length=20, choices=EVENT_TYPES)
    subject       = models.CharField(max_length=255, blank=True)
    link_clicked  = models.URLField(blank=True)
    occurred_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_events'
        ordering = ['-occurred_at']
        indexes  = [
            models.Index(fields=['lead', 'event_type']),
            models.Index(fields=['event_type', '-occurred_at']),
        ]

    def __str__(self):
        return f'{self.lead.email} → {self.event_type} ({self.occurred_at:%Y-%m-%d})'


# ── LEAD NOTES ────────────────────────────────────────────────────────────────

class LeadNote(models.Model):
    """Internal admin notes on a lead. Used by the sales/support team."""
    lead      = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='notes')
    author    = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True
    )
    body      = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lead_notes'
        ordering = ['-created_at']

    def __str__(self):
        return f'Note on {self.lead.email} by {self.author}'
