"""
GRADSKOOL — Leads Celery Tasks

send_due_drip_emails()
  → Runs every 15 minutes (Celery Beat).
  → Finds DripEnrollments where next_send_at <= now.
  → Renders and sends the email via Resend.
  → Advances the enrollment to the next step.

trigger_sequence_for_lead(lead_id, trigger_event)
  → Called by signals after tool gate, registration, etc.
  → Wraps enroll_in_sequence in a Celery task for async execution.

send_single_drip_email(enrollment_id)
  → Sends one specific drip email for an enrollment.
  → Safe to call directly for testing or manual sends.

expire_stale_leads()
  → Weekly task. Marks leads who haven't engaged in 90 days
    as 'unsubscribed' from sequences (but preserves the lead record).
"""
import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    name='leads.send_due_drip_emails',
    max_retries=3,
    default_retry_delay=60,
)
def send_due_drip_emails():
    """
    Core drip send loop. Called by Celery Beat every 15 minutes.
    Sends all overdue emails in batches of 50.
    """
    from .models import DripEnrollment, DripEmail
    from .emails import send_drip_email

    due = (
        DripEnrollment.objects
        .filter(
            status='active',
            next_send_at__lte=timezone.now(),
            lead__is_subscribed=True,
        )
        .select_related('lead', 'sequence')
        .order_by('next_send_at')[:50]
    )

    sent_count = 0
    failed_count = 0

    for enrollment in due:
        try:
            email_step = DripEmail.objects.get(
                sequence=enrollment.sequence,
                step=enrollment.current_step,
                is_active=True,
            )
        except DripEmail.DoesNotExist:
            # Step not found — sequence may have changed. Mark complete.
            enrollment.status = 'completed'
            enrollment.completed_at = timezone.now()
            enrollment.save(update_fields=['status', 'completed_at'])
            continue

        success = send_drip_email(enrollment.lead, email_step)

        if success:
            enrollment.advance()
            sent_count += 1
        else:
            failed_count += 1
            # Retry in 1 hour
            enrollment.next_send_at = timezone.now() + __import__('datetime').timedelta(hours=1)
            enrollment.save(update_fields=['next_send_at'])

    logger.info(
        f'Drip send loop: {sent_count} sent, {failed_count} failed '
        f'(batch of {len(due)})'
    )
    return {'sent': sent_count, 'failed': failed_count}


@shared_task(
    name='leads.trigger_sequence_for_lead',
    max_retries=2,
    default_retry_delay=30,
)
def trigger_sequence_for_lead(lead_id: int, trigger_event: str, exam: str = ''):
    """
    Async wrapper around enroll_in_sequence.
    Called from signals to avoid blocking the request.
    """
    from .models import Lead
    from .services import enroll_in_sequence

    try:
        lead = Lead.objects.get(id=lead_id)
    except Lead.DoesNotExist:
        logger.error(f'Lead {lead_id} not found for sequence trigger')
        return

    enrollment = enroll_in_sequence(lead, trigger_event, exam)
    if enrollment:
        logger.info(
            f'Sequence enrolled: lead={lead.email} '
            f'trigger={trigger_event} sequence="{enrollment.sequence.name}"'
        )
    return enrollment.id if enrollment else None


@shared_task(name='leads.send_single_drip_email')
def send_single_drip_email(enrollment_id: int):
    """
    Send one email for a specific enrollment.
    Useful for testing a sequence without waiting for Celery Beat.

    Usage:
      from apps.leads.tasks import send_single_drip_email
      send_single_drip_email.delay(enrollment_id=42)
    """
    from .models import DripEnrollment, DripEmail
    from .emails import send_drip_email

    try:
        enrollment = DripEnrollment.objects.select_related(
            'lead', 'sequence'
        ).get(id=enrollment_id)
    except DripEnrollment.DoesNotExist:
        logger.error(f'DripEnrollment {enrollment_id} not found')
        return False

    try:
        email_step = DripEmail.objects.get(
            sequence=enrollment.sequence,
            step=enrollment.current_step,
            is_active=True,
        )
    except DripEmail.DoesNotExist:
        logger.warning(f'No active email at step {enrollment.current_step}')
        return False

    success = send_drip_email(enrollment.lead, email_step)
    if success:
        enrollment.advance()
    return success


@shared_task(name='leads.expire_stale_leads')
def expire_stale_leads():
    """
    Weekly cleanup. Pauses drip sequences for leads who haven't
    engaged in 90+ days. Preserves the lead record — just stops emails.
    """
    from datetime import timedelta
    from .models import DripEnrollment
    cutoff = timezone.now() - timedelta(days=90)

    stale_ids = list(
        DripEnrollment.objects
        .filter(
            status='active',
            lead__last_seen_at__lt=cutoff,
        )
        .values_list('id', flat=True)
    )

    if stale_ids:
        DripEnrollment.objects.filter(id__in=stale_ids).update(status='paused')
        logger.info(f'Expired {len(stale_ids)} stale drip enrollments (90d no engagement)')

    return len(stale_ids)
