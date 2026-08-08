"""
GRADSKOOL — Notifications Celery Tasks

send_whatsapp_async(user_id, template, context, idempotency_key)
  → Async wrapper around whatsapp.send_whatsapp().
  → Called from services.py to avoid blocking request threads.

cleanup_expired_notifications()
  → Daily task. Deletes InAppNotification records older than 30 days.

send_session_reminders()
  → Runs every 5 minutes via Beat.
  → Finds live sessions starting in 30 minutes.
  → Sends reminders to all enrolled students.
  → Idempotency key prevents duplicate sends.
"""
import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    name='notifications.send_whatsapp_async',
    max_retries=3,
    default_retry_delay=60,
)
def send_whatsapp_async(user_id: int, template: str, context: dict,
                         idempotency_key: str = None):
    """Async wrapper — called from services.create_notification()."""
    from apps.accounts.models import User
    from apps.notifications.whatsapp import send_whatsapp

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f'WhatsApp task: user {user_id} not found')
        return

    send_whatsapp(user, template, context, idempotency_key)


@shared_task(name='notifications.cleanup_expired')
def cleanup_expired_notifications():
    """Delete expired in-app notifications. Run daily."""
    from apps.notifications.models import InAppNotification
    deleted, _ = InAppNotification.objects.filter(
        expires_at__lt=timezone.now()
    ).delete()
    logger.info(f'Cleaned up {deleted} expired notifications')
    return deleted


@shared_task(name='notifications.send_session_reminders')
def send_session_reminders():
    """
    Find live sessions starting in 25-35 minutes
    and send reminders to all enrolled students.

    Runs every 5 minutes via Celery Beat.
    Idempotency key = 'session-{user_id}-{session_start_iso}'
    prevents double sends between beat runs.

    NOTE: This task is a stub — wire it to your live session
    scheduling model once sessions are tracked in the database.
    (Currently GRADSKOOL sessions are scheduled via WhatsApp/calendar.)
    """
    logger.debug('session_reminder task ran — no sessions model yet')
    return 0
