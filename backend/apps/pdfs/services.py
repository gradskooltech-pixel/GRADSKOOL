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


def create_pdf_bundle_order(user, pdf_ids: list, phone: str) -> dict:
    """
    Bundle equivalent of create_pdf_order above — same shape, same
    Razorpay-order-first-then-webhook-confirms pattern, but creates a
    PdfBundlePurchase + N PdfBundleItem rows instead of one PdfPurchase.

    tier_count is derived from len(pdf_ids), not trusted from the client
    directly — and must be an EXACT match against BUNDLE_TIERS (see
    models.py's bundle_price_per_pdf) or this raises. Confirmed with GS:
    only the fixed tier sizes (1/10/20/30/40/50) are valid bundle sizes at
    all — there's no partial-credit pricing for e.g. 15 PDFs.
    """
    from .models import PdfBundlePurchase, PdfBundleItem, bundle_price_per_pdf

    unique_ids = list(dict.fromkeys(pdf_ids))  # de-dupe, preserve order
    tier_count = len(unique_ids)

    price_per_pdf = bundle_price_per_pdf(tier_count)  # raises ValueError if not a valid tier

    # fyq_category=True is the real, correct scope check — bundles are
    # specifically a FYQs-library thing (confirmed with GS), not something
    # that applies to foundation-class materials or general library PDFs,
    # which keep the original single-PDF ₹49 pricing unchanged. Without
    # this filter, any published paid PDF could be slipped into a bundle
    # request regardless of type.
    pdfs = list(Pdf.objects.filter(id__in=unique_ids, is_published=True, is_free=False, fyq_category=True))
    if len(pdfs) != tier_count:
        raise ValueError('One or more selected PDFs are unavailable or already free.')

    already_owned = PdfPurchase.objects.filter(
        user=user, pdf_id__in=unique_ids, status='paid',
    ).values_list('pdf_id', flat=True)
    if already_owned:
        titles = [p.title for p in pdfs if p.id in already_owned]
        raise ValueError(f'You already own: {", ".join(titles)}. Remove these from your selection.')

    amount_inr = price_per_pdf * tier_count
    amount_paise = int(amount_inr * 100)

    rz_order = _razorpay_client().order.create({
        'amount': amount_paise,
        'currency': 'INR',
        'receipt': f'pdf-bundle-{tier_count}-{user.id}',
        'notes': {
            'kind': 'pdf_bundle',
            'user_id': str(user.id),
            'tier_count': str(tier_count),
        },
    })

    with transaction.atomic():
        bundle = PdfBundlePurchase.objects.create(
            user=user,
            tier_count=tier_count,
            price_per_pdf=price_per_pdf,
            amount_inr=amount_inr,
            razorpay_order_id=rz_order['id'],
            phone_captured=phone,
        )
        PdfBundleItem.objects.bulk_create([
            PdfBundleItem(bundle=bundle, pdf=pdf) for pdf in pdfs
        ])

    return {
        'order_id': rz_order['id'],
        'amount': amount_paise,
        'currency': 'INR',
        'key': settings.RAZORPAY_KEY_ID,
        'name': 'GRADSKOOL',
        'description': f'{tier_count} PDFs — ₹{price_per_pdf}/each',
        'image': 'https://gradskool.in/assets/logo.png',
        'prefill': {
            'name': user.get_full_name(),
            'email': user.email,
            'contact': phone,
        },
        'theme': {'color': '#d94f50'},
        'internal_bundle_id': bundle.id,
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
    kind = entity.get('notes', {}).get('kind')

    if kind == 'pdf':
        if event == 'payment.captured':
            _handle_captured(entity)
        elif event == 'payment.failed':
            _handle_failed(entity)
    elif kind == 'pdf_bundle':
        if event == 'payment.captured':
            _handle_bundle_captured(entity)
        elif event == 'payment.failed':
            _handle_bundle_failed(entity)
    # else: not ours — ignore quietly, some other app's webhook

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


@transaction.atomic
def _handle_bundle_captured(payment: dict):
    """
    Same idempotency/locking pattern as _handle_captured above, but for
    PdfBundlePurchase — mark_paid() on that model (see models.py) is what
    actually does the real work of activating every PDF in the bundle,
    this function is just the webhook-side lookup/guard.
    """
    from .models import PdfBundlePurchase

    rz_order_id = payment.get('order_id')
    try:
        bundle = PdfBundlePurchase.objects.select_for_update().get(razorpay_order_id=rz_order_id)
    except PdfBundlePurchase.DoesNotExist:
        logger.error(f'PDF bundle webhook: bundle not found for order {rz_order_id}')
        return

    if bundle.status == 'paid':
        logger.info(f'PDF bundle webhook: order {rz_order_id} already processed (idempotent)')
        return

    bundle.mark_paid(payment.get('id'), payment.get('signature', ''))
    logger.info(f'PDF bundle confirmed: {bundle.user.email} — {bundle.tier_count} PDFs')


def _handle_bundle_failed(payment: dict):
    from .models import PdfBundlePurchase

    rz_order_id = payment.get('order_id')
    try:
        bundle = PdfBundlePurchase.objects.get(razorpay_order_id=rz_order_id)
        if bundle.status == 'created':
            bundle.status = 'failed'
            bundle.save(update_fields=['status'])
    except PdfBundlePurchase.DoesNotExist:
        pass
