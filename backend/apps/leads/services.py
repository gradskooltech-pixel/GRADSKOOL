"""
GRADSKOOL — Leads Service

All business logic for the lead pipeline.

Public API:
  upsert_lead(email, first_name, last_name, phone, target_exam,
              source_type, source_detail, user, ip, utm_*)
    → Returns (Lead, created). Safe to call multiple times.

  enroll_in_sequence(lead, trigger_event, exam=None)
    → Finds matching DripSequence and creates DripEnrollment.
    → Schedules first email send.

  process_resend_webhook(payload)
    → Handles opened / clicked / bounced events from Resend.
    → Updates EmailEvent + Lead.lead_score.

  get_lead_analytics()
    → Aggregate stats for the admin dashboard.
"""
import logging
from datetime import timedelta
from django.db import transaction
from django.utils import timezone

from .models import Lead, LeadSource, DripSequence, DripEnrollment, EmailEvent

logger = logging.getLogger(__name__)

# Lead score weights
SCORE_WEIGHTS = {
    'tool_gate':    5,
    'email_opened': 3,
    'email_clicked': 10,
    'page_visit':   2,
    'registration': 15,
    'checkout_start': 20,
}


# ── UPSERT LEAD ───────────────────────────────────────────────────────────────

@transaction.atomic
def upsert_lead(
    email: str,
    first_name: str = '',
    last_name: str = '',
    phone: str = '',
    target_exam: str = '',
    source_type: str = 'tool_gate',
    source_detail: str = '',
    user=None,
    ip: str = None,
    utm_source: str = '',
    utm_medium: str = '',
    utm_campaign: str = '',
    utm_content: str = '',
    referrer_url: str = '',
):
    """
    Find or create a lead record.
    Always records the source touch point.
    Merges field updates for existing leads (never overwrites
    with blanks — only fills in missing data).
    """
    email = email.lower().strip()

    lead, created = Lead.objects.get_or_create(
        email=email,
        defaults={
            'first_name':   first_name,
            'last_name':    last_name,
            'phone':        phone,
            'target_exam':  target_exam,
            'user':         user,
            'ip_address':   ip,
            'utm_source':   utm_source,
            'utm_medium':   utm_medium,
            'utm_campaign': utm_campaign,
            'utm_content':  utm_content,
            'referrer_url': referrer_url,
        }
    )

    if not created:
        # Fill in missing data without overwriting existing values
        updated = False
        for field, value in [
            ('first_name',  first_name),
            ('last_name',   last_name),
            ('phone',       phone),
            ('target_exam', target_exam),
            ('user',        user),
        ]:
            if value and not getattr(lead, field):
                setattr(lead, field, value)
                updated = True
        if updated:
            lead.save()

    # Record source touch point
    is_first = not LeadSource.objects.filter(lead=lead).exists()
    LeadSource.objects.create(
        lead=lead,
        source_type=source_type,
        source_detail=source_detail,
        is_first_touch=is_first,
        is_last_touch=True,
    )
    # Clear previous last-touch flag
    if not is_first:
        LeadSource.objects.filter(
            lead=lead, is_last_touch=True
        ).exclude(
            id=LeadSource.objects.filter(lead=lead).order_by('-created_at').first().id
        ).update(is_last_touch=False)

    # Score the action
    points = SCORE_WEIGHTS.get(source_type, 2)
    lead.score_up(points)

    logger.info(
        f'Lead {"created" if created else "updated"}: '
        f'{email} source={source_type} exam={target_exam}'
    )
    return lead, created


# ── SEQUENCE ENROLLMENT ───────────────────────────────────────────────────────

@transaction.atomic
def enroll_in_sequence(lead: Lead, trigger_event: str, exam: str = '') -> DripEnrollment | None:
    """
    Find the best matching DripSequence for the trigger and enroll the lead.

    Matching logic (most-specific first):
    1. Active sequence with trigger_event AND matching trigger_exam
    2. Active sequence with trigger_event AND no exam restriction
    3. No match → return None

    Will not create duplicate enrollments — silently returns existing one.
    """
    if not lead.is_subscribed or lead.status in ('unsubscribed', 'bounced'):
        return None

    exam_to_match = exam or lead.target_exam

    # Prefer exam-specific sequence
    sequence = (
        DripSequence.objects
        .filter(
            trigger_event=trigger_event,
            trigger_exam=exam_to_match,
            is_active=True,
        )
        .first()
    )

    # Fall back to generic
    if not sequence:
        sequence = (
            DripSequence.objects
            .filter(
                trigger_event=trigger_event,
                trigger_exam='',
                is_active=True,
            )
            .first()
        )

    if not sequence:
        logger.debug(
            f'No sequence found for trigger={trigger_event} exam={exam_to_match}'
        )
        return None

    # Check for existing enrollment
    enrollment, created = DripEnrollment.objects.get_or_create(
        lead=lead,
        sequence=sequence,
        defaults={'status': 'active'},
    )

    if not created:
        if enrollment.status in ('paused', 'cancelled'):
            # Reactivate
            enrollment.status = 'active'
            enrollment.save(update_fields=['status'])
        else:
            return enrollment  # Already active — no-op

    # Set first send time
    try:
        first_email = sequence.emails.get(step=1, is_active=True)
        enrollment.next_send_at = timezone.now() + timedelta(
            hours=first_email.send_delay_hours
        )
    except DripEmail.DoesNotExist:
        enrollment.next_send_at = timezone.now() + timedelta(hours=1)

    enrollment.save(update_fields=['next_send_at'])

    logger.info(
        f'Enrolled: {lead.email} → "{sequence.name}" '
        f'(send at {enrollment.next_send_at:%Y-%m-%d %H:%M})'
    )
    return enrollment


# ── RESEND WEBHOOK PROCESSOR ──────────────────────────────────────────────────

def process_resend_webhook(payload: dict):
    """
    Handle Resend webhook events:
      email.sent, email.delivered, email.opened,
      email.clicked, email.bounced, email.complained
    """
    event_type  = payload.get('type', '')
    data        = payload.get('data', {})
    resend_id   = data.get('email_id', '')
    to_email    = data.get('to', [])
    if isinstance(to_email, list):
        to_email = to_email[0] if to_email else ''
    to_email = to_email.lower().strip()

    if not to_email:
        return

    try:
        lead = Lead.objects.get(email=to_email)
    except Lead.DoesNotExist:
        logger.warning(f'Resend webhook: lead not found for {to_email}')
        return

    # Map Resend event type to our EmailEvent type
    EVENT_MAP = {
        'email.sent':        'sent',
        'email.delivered':   'delivered',
        'email.opened':      'opened',
        'email.clicked':     'clicked',
        'email.bounced':     'bounced',
        'email.complained':  'complained',
        'email.unsubscribed': 'unsubscribed',
    }
    our_event = EVENT_MAP.get(event_type)
    if not our_event:
        return

    # Find associated DripEmail (by resend_id if we stored it)
    drip_email = None
    # Try to match via stored email ID in EnrollmentSendLog (future enhancement)

    EmailEvent.objects.create(
        lead=lead,
        drip_email=drip_email,
        resend_email_id=resend_id,
        event_type=our_event,
        subject=data.get('subject', ''),
        link_clicked=data.get('click', {}).get('link', '') if our_event == 'clicked' else '',
    )

    # Update lead status and score
    if our_event == 'opened':
        lead.score_up(SCORE_WEIGHTS['email_opened'], 'email_opened')
        if lead.status == 'new':
            lead.status = 'engaged'
            lead.save(update_fields=['status'])

    elif our_event == 'clicked':
        lead.score_up(SCORE_WEIGHTS['email_clicked'], 'email_clicked')
        if lead.status in ('new', 'engaged'):
            lead.status = 'nurtured'
            lead.save(update_fields=['status'])

    elif our_event in ('bounced', 'complained'):
        lead.status = 'bounced'
        lead.is_subscribed = False
        lead.save(update_fields=['status', 'is_subscribed'])
        DripEnrollment.objects.filter(lead=lead, status='active').update(status='paused')
        logger.warning(f'Lead bounced/complained: {to_email}')

    elif our_event == 'unsubscribed':
        lead.unsubscribe()

    logger.info(f'Email event: {to_email} → {our_event}')


# ── ANALYTICS ─────────────────────────────────────────────────────────────────

def get_lead_analytics() -> dict:
    """
    Aggregate stats for the leads admin dashboard.
    Cached — call from a view with cache_page or cache.get_or_set.
    """
    from django.db.models import Count, Avg, Q
    from datetime import timedelta

    now   = timezone.now()
    today = now.date()
    week_ago  = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total = Lead.objects.count()

    by_status = dict(
        Lead.objects.values_list('status')
        .annotate(c=Count('id'))
        .values_list('status', 'c')
    )

    by_exam = list(
        Lead.objects.exclude(target_exam='')
        .values('target_exam')
        .annotate(count=Count('id'))
        .order_by('-count')[:8]
    )

    new_this_week  = Lead.objects.filter(created_at__gte=week_ago).count()
    new_this_month = Lead.objects.filter(created_at__gte=month_ago).count()
    converted      = Lead.objects.filter(status='converted').count()
    conversion_rate = round((converted / total) * 100, 1) if total else 0

    # Email performance
    email_stats = {
        'sent':      EmailEvent.objects.filter(event_type='sent').count(),
        'opened':    EmailEvent.objects.filter(event_type='opened').count(),
        'clicked':   EmailEvent.objects.filter(event_type='clicked').count(),
        'bounced':   EmailEvent.objects.filter(event_type='bounced').count(),
    }
    if email_stats['sent']:
        email_stats['open_rate'] = round(
            (email_stats['opened'] / email_stats['sent']) * 100, 1
        )
        email_stats['click_rate'] = round(
            (email_stats['clicked'] / email_stats['sent']) * 100, 1
        )
    else:
        email_stats['open_rate'] = 0
        email_stats['click_rate'] = 0

    # Drip sequence performance
    sequence_stats = list(
        DripEnrollment.objects
        .values('sequence__name')
        .annotate(
            total=Count('id'),
            active=Count('id', filter=Q(status='active')),
            completed=Count('id', filter=Q(status='completed')),
        )
        .order_by('-total')[:5]
    )

    # Recent conversions
    recent_conversions = list(
        Lead.objects
        .filter(status='converted', converted_at__gte=month_ago)
        .select_related('converted_plan__exam')
        .order_by('-converted_at')[:10]
        .values(
            'email', 'first_name', 'target_exam',
            'converted_at', 'converted_plan__name',
            'converted_plan__exam__slug'
        )
    )

    return {
        'total':           total,
        'by_status':       by_status,
        'by_exam':         by_exam,
        'new_this_week':   new_this_week,
        'new_this_month':  new_this_month,
        'conversion_rate': conversion_rate,
        'email':           email_stats,
        'sequences':       sequence_stats,
        'recent_conversions': recent_conversions,
    }
