"""
GRADSKOOL — PDFs Payment Service

Mirrors apps.payments.services exactly on purpose: an order is created before
payment, and the Razorpay webhook is the ONLY place a PdfPurchase is ever
marked paid — never the client-side verify call. Kept as its own service
(rather than reusing apps.payments.Order/PricingPlan) because a Pdf isn't a
PricingPlan/Enrollment — it's a one-off purchase, not course access.
"""
import hmac
import hashlib
import logging

from django.conf import settings
from django.db import transaction
from django.utils import timezone

import razorpay

from .models import Pdf, PdfPurchase

logger = logging.getLogger(__name__)


def _razorpay_client():
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


# ── CREATE ORDER ──────────────────────────────────────────────────────────────

def create_pdf_order(user, pdf: Pdf) -> dict:
    if pdf.is_free:
        raise ValueError('This PDF is free — no payment needed.')

    if PdfPurchase.objects.filter(user=user, pdf=pdf, status='paid').exists():
        raise ValueError('You already own this PDF.')

    amount_paise = int(pdf.price_inr * 100)

    rz_order = _razorpay_client().order.create({
        'amount': amount_paise,
        'currency': 'INR',
        'receipt': f'pdf-{pdf.id}-{user.id}',
        'notes': {
            'kind': 'pdf',
            'user_id': str(user.id),
            'pdf_id': str(pdf.id),
        },
    })

    purchase = PdfPurchase.objects.create(
        user=user,
        pdf=pdf,
        razorpay_order_id=rz_order['id'],
        amount_inr=pdf.price_inr,
    )

    return {
        'order_id': rz_order['id'],
        'amount': amount_paise,
        'currency': 'INR',
        'key': settings.RAZORPAY_KEY_ID,
        'name': 'GRADSKOOL',
        'description': pdf.title,
        'image': 'https://gradskool.in/assets/logo.png',
        'prefill': {
            'name': user.get_full_name(),
            'email': user.email,
            'contact': getattr(user, 'phone', '') or '',
        },
        'theme': {'color': '#d94f50'},
        'internal_purchase_id': purchase.id,
    }


# ── SIGNATURE VERIFICATION (client-side, secondary check) ────────────────────

def verify_payment_signature(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
    body = f'{razorpay_order_id}|{razorpay_payment_id}'
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)


# ── WEBHOOK (source of truth) ─────────────────────────────────────────────────

def process_webhook(payload: dict, raw_body: bytes, signature: str) -> bool:
    """
    Entry point for the Razorpay server webhook. Returns False only on a bad
    signature (so the view can 400). Any event not tagged notes.kind == 'pdf'
    is silently ignored here — it belongs to apps.payments' own webhook.
    """
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        logger.warning('PDF webhook: invalid signature')
        return False

    event = payload.get('event')
    entity = payload.get('payload', {}).get('payment', {}).get('entity', {})

    if entity.get('notes', {}).get('kind') != 'pdf':
        return True  # not ours — ignore quietly

    if event == 'payment.captured':
        _handle_captured(entity)
    elif event == 'payment.failed':
        _handle_failed(entity)

    return True


@transaction.atomic
def _handle_captured(payment: dict):
    rz_order_id = payment.get('order_id')
    try:
        purchase = PdfPurchase.objects.select_for_update().get(razorpay_order_id=rz_order_id)
    except PdfPurchase.DoesNotExist:
        logger.error(f'PDF webhook: purchase not found for order {rz_order_id}')
        return

    if purchase.status == 'paid':
        logger.info(f'PDF webhook: order {rz_order_id} already processed (idempotent)')
        return

    purchase.mark_paid(payment.get('id'), payment.get('signature', ''))
    logger.info(f'PDF purchase confirmed: {purchase.user.email} — {purchase.pdf.title}')


def _handle_failed(payment: dict):
    rz_order_id = payment.get('order_id')
    try:
        purchase = PdfPurchase.objects.get(razorpay_order_id=rz_order_id)
        if purchase.status == 'created':
            purchase.status = 'failed'
            purchase.save(update_fields=['status'])
    except PdfPurchase.DoesNotExist:
        pass
