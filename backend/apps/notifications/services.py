"""
GRADSKOOL — Notifications Service

Public API for creating notifications across all channels.

create_notification(user, category, title, body, icon, action_url)
  → Creates InAppNotification.
  → Optionally sends WhatsApp if template_slug provided.

Convenience wrappers (called from signals):
  notify_enrollment_confirmed(user, plan, order)
  notify_payment_failed(user, plan)
  notify_session_reminder(user, session)
  notify_mock_available(user, mock)
  notify_new_video(user, video)

get_unread_count(user) → int
mark_all_read(user)
"""
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


def create_notification(
    user,
    category: str,
    title: str,
    body: str,
    icon: str = '',
    action_url: str = '',
    whatsapp_template: str = None,
    whatsapp_context: dict = None,
    idempotency_key: str = None,
) -> 'InAppNotification':
    """
    Create an in-app notification and optionally send WhatsApp.
    Safe to call from signals — never raises.
    """
    from .models import InAppNotification

    try:
        notif = InAppNotification.objects.create(
            user=user,
            category=category,
            title=title,
            body=body,
            icon=icon,
            action_url=action_url,
        )
    except Exception as exc:
        logger.exception(f'create_notification failed for {user.email}: {exc}')
        return None

    # WhatsApp disabled — enable by installing Interakt and setting INTERAKT_API_KEY
    # if whatsapp_template and user.phone:
    #     from .tasks import send_whatsapp_async
    #     send_whatsapp_async.delay(user_id=user.id, template=whatsapp_template,
    #         context=whatsapp_context or {}, idempotency_key=idempotency_key)

    return notif


# ── CONVENIENCE WRAPPERS ──────────────────────────────────────────────────────

def notify_enrollment_confirmed(user, plan, order):
    """Called after payment webhook confirms enrollment."""
    create_notification(
        user=user,
        category='enrollment',
        title='Enrollment confirmed',
        body=f'You\'re enrolled in {plan.name}. Invoice: {order.invoice_number}',
        icon='🎓',
        action_url='/dashboard',
    )


def notify_payment_failed(user, plan):
    """Called if a payment attempt fails."""
    create_notification(
        user=user,
        category='payment',
        title='Payment failed',
        body=f'Your payment for {plan.name} could not be processed. Please try again.',
        icon='⚠️',
        action_url=f'/checkout/{plan.exam.slug}',
    )


def notify_session_reminder(user, course, session_time: str, topic: str):
    """Called 30 minutes before a live session starts."""
    create_notification(
        user=user,
        category='session',
        title=f'Session starting in 30 minutes',
        body=f'{topic} — {session_time}',
        icon='📡',
        action_url='/dashboard',
    )


def notify_mock_available(user, mock):
    """Called when a new mock is published for an exam the user is enrolled in."""
    create_notification(
        user=user,
        category='mock',
        title=f'New mock available: {mock.title}',
        body=f'A new {mock.exam.short_name} mock test is ready. Take it now.',
        icon='📝',
        action_url=f'/dashboard',
    )


def notify_new_video(user, video):
    """Called when a new video is published in a course the user is enrolled in."""
    create_notification(
        user=user,
        category='content',
        title=f'New lecture: {video.title}',
        body=f'A new video has been added to your course.',
        icon='🎬',
        action_url=f'/watch/{video.course.exam.slug}/{video.bunny_video_id}',
    )


def notify_welcome(user):
    """Called after email verification."""
    create_notification(
        user=user,
        category='system',
        title='Welcome to GRADSKOOL',
        body='Your account is active. Explore free tools and browse courses.',
        icon='👋',
        action_url='/tools',
    )


# ── QUERY HELPERS ─────────────────────────────────────────────────────────────

def get_unread_count(user) -> int:
    from .models import InAppNotification
    return InAppNotification.objects.filter(
        user=user, is_read=False,
        expires_at__gt=timezone.now(),
    ).count()


def mark_all_read(user):
    from .models import InAppNotification
    InAppNotification.objects.filter(user=user, is_read=False).update(
        is_read=True, read_at=timezone.now()
    )


def get_notifications(user, limit=20):
    from .models import InAppNotification
    return (
        InAppNotification.objects
        .filter(user=user, expires_at__gt=timezone.now())
        .order_by('-created_at')[:limit]
    )
