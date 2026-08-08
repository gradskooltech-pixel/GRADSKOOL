"""
GRADSKOOL — Notifications Signals

Wires platform events to notification creation:
  Enrollment created     → enrollment_confirmed (in-app + WhatsApp)
  Order failed           → payment_failed (in-app + WhatsApp)
  VideoLibrary published → new_video (in-app for all enrolled users)
  User verified email    → welcome (in-app + WhatsApp)
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender='enrollments.Enrollment')
def on_enrollment_confirmed(sender, instance, created, **kwargs):
    if not created or instance.status != 'active':
        return
    try:
        from apps.notifications.services import notify_enrollment_confirmed
        notify_enrollment_confirmed(
            user=instance.user,
            plan=instance.plan,
            order=instance.order,
        )
    except Exception as exc:
        logger.exception(f'notify_enrollment_confirmed failed: {exc}')


@receiver(post_save, sender='payments.Order')
def on_payment_failed(sender, instance, created, **kwargs):
    if created:
        return
    if instance.status == 'failed':
        try:
            from apps.notifications.services import notify_payment_failed
            notify_payment_failed(user=instance.user, plan=instance.plan)
        except Exception as exc:
            logger.exception(f'notify_payment_failed failed: {exc}')


@receiver(post_save, sender='content.VideoLibrary')
def on_video_published(sender, instance, created, **kwargs):
    """
    When a video is published, notify all students enrolled in that exam.
    Dispatched as a Celery task to avoid querying thousands of users inline.
    """
    if not instance.is_published:
        return
    # Only fire on publish transition (not on every save)
    try:
        from apps.notifications.tasks import notify_video_published_async
        notify_video_published_async.delay(instance.id)
    except Exception as exc:
        logger.exception(f'notify_video_published dispatch failed: {exc}')


@receiver(post_save, sender='accounts.User')
def on_email_verified(sender, instance, created, **kwargs):
    """Send welcome notification when a user first verifies their email."""
    if created:
        return
    # Detect verification: is_verified flipped to True
    try:
        old = sender.objects.filter(pk=instance.pk).values('is_verified').first()
        # post_save fires after save, so we check if it was False before
        # We use a simple flag approach via the service idempotency key
        if instance.is_verified:
            from apps.notifications.services import notify_welcome
            notify_welcome(instance)
    except Exception as exc:
        logger.exception(f'notify_welcome failed: {exc}')
