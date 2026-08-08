"""
GRADSKOOL — WhatsApp Service (Interakt)

Interakt is GRADSKOOL's WhatsApp Business API provider.
Docs: https://docs.interakt.ai/

send_whatsapp(user, template, context)
  → Looks up the user's phone number
  → Renders the template
  → Sends via Interakt API
  → Logs to WhatsAppLog

All sends are idempotent — passing the same idempotency_key
twice will be a no-op (returns existing log).

Template IDs must be pre-approved by Meta before use.
Map of template slug → Interakt template name is in TEMPLATE_MAP.
"""
import logging
import uuid
import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

INTERAKT_API_URL = 'https://api.interakt.ai/v1/public/message/'

# Map our template slugs to Interakt-approved template names
# These must be approved by Meta via Interakt dashboard before use
TEMPLATE_MAP = {
    'enrollment_confirmed': {
        'name':     'gradskool_enrollment_confirmed',
        'language': 'en',
        'params':   ['first_name', 'plan_name', 'exam_name'],
    },
    'session_reminder': {
        'name':     'gradskool_session_reminder',
        'language': 'en',
        'params':   ['first_name', 'session_time', 'topic'],
    },
    'payment_failed': {
        'name':     'gradskool_payment_failed',
        'language': 'en',
        'params':   ['first_name', 'plan_name'],
    },
    'mock_available': {
        'name':     'gradskool_mock_available',
        'language': 'en',
        'params':   ['first_name', 'mock_name', 'exam_name'],
    },
    'welcome': {
        'name':     'gradskool_welcome',
        'language': 'en',
        'params':   ['first_name'],
    },
}


def _normalize_phone(phone: str) -> str:
    """
    Convert phone to E.164 format with India country code.
    Input:  '9876543210' or '+919876543210' or '09876543210'
    Output: '+919876543210'
    """
    phone = phone.strip().replace(' ', '').replace('-', '')
    if phone.startswith('+'):
        return phone
    if phone.startswith('0'):
        phone = phone[1:]
    if len(phone) == 10:
        return f'+91{phone}'
    return f'+{phone}'


def send_whatsapp(
    user,
    template: str,
    context: dict,
    idempotency_key: str = None,
) -> 'WhatsAppLog':
    """
    Main public interface. Sends a WhatsApp message to a user.

    Args:
        user:             accounts.User instance
        template:         One of TEMPLATE_MAP keys
        context:          Dict of template variable values
        idempotency_key:  Optional UUID string — prevents duplicate sends

    Returns:
        WhatsAppLog instance
    """
    from .models import WhatsAppLog

    if not user.phone:
        logger.warning(f'WhatsApp: no phone for user {user.email}')
        return None

    phone = _normalize_phone(user.phone)
    key   = idempotency_key or str(uuid.uuid4())

    # Idempotency check
    existing = WhatsAppLog.objects.filter(idempotency_key=key).first()
    if existing:
        logger.info(f'WhatsApp: duplicate send skipped (key={key})')
        return existing

    # Build body preview for admin
    tmpl_data = TEMPLATE_MAP.get(template, {})
    params    = [str(context.get(p, '')) for p in tmpl_data.get('params', [])]
    preview   = ' | '.join(params)[:300]

    log = WhatsAppLog.objects.create(
        user=user,
        phone=phone,
        template=template,
        body_preview=preview,
        idempotency_key=key,
        status='queued',
    )

    api_key = getattr(settings, 'INTERAKT_API_KEY', '')
    if not api_key:
        logger.info(f'[WHATSAPP DEV] {template} → {phone}: {preview}')
        log.status = 'sent'
        log.sent_at = timezone.now()
        log.provider_msg_id = f'dev_{key[:8]}'
        log.save(update_fields=['status', 'sent_at', 'provider_msg_id'])
        return log

    # Build Interakt payload
    payload = {
        'countryCode': '+91',
        'phoneNumber': phone.replace('+91', ''),
        'callbackData': f'gradskool_{log.id}',
        'type':         'Template',
        'template': {
            'name':     tmpl_data.get('name', template),
            'languageCode': tmpl_data.get('language', 'en'),
            'bodyValues': params,
        },
    }

    try:
        response = requests.post(
            INTERAKT_API_URL,
            json=payload,
            headers={
                'Authorization': f'Basic {api_key}',
                'Content-Type':  'application/json',
            },
            timeout=10,
        )
        response.raise_for_status()
        data           = response.json()
        provider_id    = data.get('id', '') or data.get('messageId', '')
        log.mark_sent(provider_id)
        logger.info(f'WhatsApp sent: {template} → {phone} (id={provider_id})')

    except requests.RequestException as exc:
        error = str(exc)
        log.mark_failed(error)
        logger.error(f'WhatsApp failed: {template} → {phone}: {error}')

    return log


def process_interakt_webhook(payload: dict):
    """
    Handle Interakt delivery webhooks.
    Updates WhatsAppLog status to delivered/read.

    Webhook events: message_sent, message_delivered, message_read, message_failed
    """
    from .models import WhatsAppLog

    event       = payload.get('type', '')
    msg_id      = payload.get('messageId', '') or payload.get('id', '')
    callback    = payload.get('callbackData', '')

    if not msg_id and not callback:
        return

    try:
        # Try by provider_msg_id first, then by callback data
        if msg_id:
            log = WhatsAppLog.objects.get(provider_msg_id=msg_id)
        else:
            log_id = callback.replace('gradskool_', '')
            log = WhatsAppLog.objects.get(id=int(log_id))
    except (WhatsAppLog.DoesNotExist, ValueError):
        logger.warning(f'WhatsApp webhook: log not found for msg_id={msg_id}')
        return

    if event in ('message_delivered', 'DELIVERED'):
        log.status = 'delivered'
        log.delivered_at = timezone.now()
        log.save(update_fields=['status', 'delivered_at'])

    elif event in ('message_read', 'READ'):
        log.status = 'read'
        log.save(update_fields=['status'])

    elif event in ('message_failed', 'FAILED'):
        error = payload.get('reason', 'Delivery failed')
        log.mark_failed(error)

    logger.info(f'WhatsApp webhook: {event} for log {log.id}')
