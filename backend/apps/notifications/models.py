"""
GRADSKOOL — Notifications Models

InAppNotification  → Per-user bell notifications shown in the frontend.
                     Created by signals/tasks, read by the notifications API.

WhatsAppLog        → Audit trail for every WhatsApp message sent.
                     Prevents duplicate sends and enables delivery tracking.

NotificationTemplate → Admin-managed message templates for both channels.
                        Body supports {{ first_name }}, {{ exam }}, {{ plan }} etc.

Design:
  - InAppNotifications expire after 30 days (cleaned by periodic task).
  - WhatsApp is sent via Interakt (gradskool's chosen provider).
    Falls back gracefully if API key not configured.
  - All notification sends are async via Celery.
  - Every notification has a category for frontend filtering/icons.
"""
import uuid
from django.db import models
from django.utils import timezone


class InAppNotification(models.Model):
    """
    A notification shown in the student's bell/notification drawer.
    Cleared after 30 days or when explicitly dismissed.
    """
    CATEGORIES = [
        ('enrollment',  'Enrollment'),      # You've been enrolled
        ('payment',     'Payment'),          # Payment confirmed / failed
        ('session',     'Live Session'),     # Session starting soon
        ('mock',        'Mock Test'),        # New mock available / results
        ('content',     'New Content'),      # New video published
        ('system',      'System'),           # Platform announcements
        ('achievement', 'Achievement'),      # Milestone / streak
    ]

    user      = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE,
        related_name='notifications'
    )
    category  = models.CharField(max_length=20, choices=CATEGORIES, default='system')
    title     = models.CharField(max_length=200)
    body      = models.TextField()
    icon      = models.CharField(max_length=10, blank=True)  # emoji
    action_url = models.CharField(max_length=500, blank=True)
    # e.g. '/dashboard', '/watch/cat/vid-abc123'

    is_read   = models.BooleanField(default=False)
    read_at   = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'in_app_notifications'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f'[{self.category}] {self.user.email}: {self.title}'

    def save(self, *args, **kwargs):
        if not self.pk and not self.expires_at:
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class WhatsAppLog(models.Model):
    """
    Audit log for every WhatsApp message attempted.
    One row per send attempt — idempotency key prevents duplicates.
    """
    STATUS = [
        ('queued',    'Queued'),
        ('sent',      'Sent'),
        ('delivered', 'Delivered'),
        ('read',      'Read'),
        ('failed',    'Failed'),
    ]

    TEMPLATES = [
        ('enrollment_confirmed', 'Enrollment Confirmed'),
        ('session_reminder',     'Session Reminder'),
        ('payment_failed',       'Payment Failed'),
        ('mock_available',       'New Mock Available'),
        ('welcome',              'Welcome Message'),
        ('custom',               'Custom Message'),
    ]

    # Recipient
    user        = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='whatsapp_logs'
    )
    phone       = models.CharField(max_length=15, db_index=True)
    # Stored as E.164: +919876543210

    # Message
    template    = models.CharField(max_length=40, choices=TEMPLATES)
    body_preview = models.CharField(max_length=300, blank=True)
    # First 300 chars of rendered message — for admin visibility

    # Delivery
    status          = models.CharField(max_length=20, choices=STATUS, default='queued')
    provider_msg_id = models.CharField(max_length=100, blank=True)
    # Interakt message ID for webhook tracking

    # Idempotency — prevents double-sends from retries
    idempotency_key = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)

    # Error tracking
    error_message = models.TextField(blank=True)
    attempt_count = models.IntegerField(default=0)

    created_at  = models.DateTimeField(auto_now_add=True)
    sent_at     = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'whatsapp_logs'
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['phone', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['template', 'status']),
        ]

    def __str__(self):
        return f'WA {self.template} → {self.phone} [{self.status}]'

    def mark_sent(self, provider_msg_id=''):
        self.status = 'sent'
        self.provider_msg_id = provider_msg_id
        self.sent_at = timezone.now()
        self.attempt_count += 1
        self.save(update_fields=['status', 'provider_msg_id', 'sent_at', 'attempt_count'])

    def mark_failed(self, error=''):
        self.status = 'failed'
        self.error_message = error
        self.attempt_count += 1
        self.save(update_fields=['status', 'error_message', 'attempt_count'])


class NotificationTemplate(models.Model):
    """
    Admin-managed templates for both WhatsApp and in-app notifications.
    Supports {{ first_name }}, {{ exam }}, {{ plan }}, {{ session_time }} etc.
    """
    CHANNELS = [('whatsapp', 'WhatsApp'), ('in_app', 'In-App'), ('both', 'Both')]

    slug     = models.SlugField(unique=True)
    name     = models.CharField(max_length=200)
    channel  = models.CharField(max_length=20, choices=CHANNELS)
    category = models.CharField(max_length=20, blank=True)
    title_template = models.CharField(max_length=200, blank=True)
    body_template  = models.TextField()
    icon           = models.CharField(max_length=10, blank=True)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification_templates'
        ordering = ['name']

    def __str__(self):
        return f'[{self.channel}] {self.name}'

    def render(self, context: dict) -> tuple[str, str]:
        """Returns (rendered_title, rendered_body)."""
        title = self.title_template
        body  = self.body_template
        for key, value in context.items():
            placeholder = '{{ ' + key + ' }}'
            title = title.replace(placeholder, str(value))
            body  = body.replace(placeholder, str(value))
        return title, body
