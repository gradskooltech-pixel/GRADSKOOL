"""
GRADSKOOL — Payments Service

Central orchestration layer for the entire payment lifecycle:

  create_razorpay_order(user, plan)
    → Creates a Razorpay order and our Order record.
    → Returns data for the frontend Razorpay widget.

  verify_payment_signature(order_id, payment_id, signature)
    → Verifies HMAC-SHA256 signature from client.
    → Returns bool. Does NOT activate enrollment (webhook does that).

  process_webhook(payload, signature)
    → Called by Razorpay server.
    → HMAC verified.
    → On 'payment.captured' → activates enrollment.
    → Idempotent — safe to call multiple times.

  process_refund(order, admin_user)
    → Issues Razorpay refund.
    → Suspends enrollment.
    → Sends confirmation email.
"""
import hmac
import hashlib
import logging
from decimal import Decimal

import razorpay
from django.conf import settings
from django.db import transaction

import resend

from apps.courses.models import PricingPlan
from apps.enrollments.services import rebuild_access
from apps.enrollments.models import Enrollment
from .models import Order

logger = logging.getLogger(__name__)

GST_RATE = Decimal('0.18')


def _razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


# ── CREATE ORDER ──────────────────────────────────────────────────────────────

def create_razorpay_order(user, plan: PricingPlan) -> dict:
    """
    Creates a Razorpay order and our Order DB record.

    Guards:
    - Active duplicate enrollment → raises ValueError
    - Race condition on seat count → select_for_update

    Returns dict consumed by the frontend Razorpay widget.
    """
    # Guard: already enrolled
    if Enrollment.objects.filter(
            user=user, plan=plan, status='active'
    ).exists():
        raise ValueError('You are already enrolled in this plan.')

    # price_inr is already GST-inclusive (confirmed pricing policy) — the
    # actual amount charged to the customer is price_inr itself. GST here
    # is reverse-calculated OUT of that total (standard backward-GST
    # formula) purely for the Order record's accounting/invoice breakdown —
    # it must NOT be added on top, or customers get overcharged ~18%.
    gst   = (plan.price_inr * GST_RATE / (1 + GST_RATE)).quantize(Decimal('0.01'))
    total = plan.price_inr
    amount_paise = int(total * 100)

    rz_order = _razorpay_client().order.create({
        'amount':   amount_paise,
        'currency': 'INR',
        'receipt':  f'{plan.razorpay_sku}-{user.id}',
        'notes': {
            'user_id': str(user.id),
            'plan_id': str(plan.id),
            'plan_name': plan.name,
            'exam': plan.exam.slug,
        },
    })

    order = Order.objects.create(
        user=user,
        plan=plan,
        razorpay_order_id=rz_order['id'],
        amount_inr=plan.price_inr - gst,
        gst_amount=gst,
        total_amount=total,
    )

    return {
        'order_id':    rz_order['id'],
        'amount':      amount_paise,
        'currency':    'INR',
        'key':         settings.RAZORPAY_KEY_ID,
        'name':        'GRADSKOOL',
        'description': plan.name,
        'image':       'https://gradskool.in/assets/logo.png',
        'prefill': {
            'name':    user.get_full_name(),
            'email':   user.email,
            'contact': user.phone or '',
        },
        'notes': {
            'plan': plan.name,
            'exam': plan.exam.slug,
        },
        'theme': {'color': '#ff5e5f'},
        # Internal reference
        'internal_order_id': order.id,
    }


# ── SIGNATURE VERIFICATION ────────────────────────────────────────────────────

def verify_payment_signature(razorpay_order_id: str,
                             razorpay_payment_id: str,
                             razorpay_signature: str) -> bool:
    """
    Verify the HMAC-SHA256 signature sent by Razorpay to the frontend
    after payment. This is a secondary client-side check.
    Enrollment activation happens via webhook only.
    """
    body = f'{razorpay_order_id}|{razorpay_payment_id}'
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)


# ── WEBHOOK HANDLER ───────────────────────────────────────────────────────────

def process_webhook(payload: dict, raw_body: bytes, signature: str) -> bool:
    """
    Entry point for Razorpay server webhooks.
    Returns True if processed, False if signature invalid.
    """
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        logger.warning('Razorpay webhook: invalid signature')
        return False

    event = payload.get('event')
    entity = payload.get('payload', {}).get('payment', {}).get('entity', {})

    if event == 'payment.captured':
        _handle_payment_captured(entity)
    elif event == 'payment.failed':
        _handle_payment_failed(entity)
    elif event == 'refund.processed':
        _handle_refund_processed(payload.get('payload', {}).get('refund', {}).get('entity', {}))

    return True


@transaction.atomic
def _handle_payment_captured(payment: dict):
    """
    Core activation flow. Called only from webhook — never from client.
    Idempotent: if order already paid, no-op.
    """
    rz_order_id = payment.get('order_id')
    rz_payment_id = payment.get('id')
    method = payment.get('method', '')
    signature = payment.get('signature', '')

    try:
        order = Order.objects.select_for_update().get(
            razorpay_order_id=rz_order_id
        )
    except Order.DoesNotExist:
        logger.error(f'Webhook: order not found for {rz_order_id}')
        return

    if order.status == 'paid':
        logger.info(f'Webhook: order {rz_order_id} already processed (idempotent)')
        return

    # Mark order paid + generate invoice number
    order.mark_paid(rz_payment_id, signature, method)

    # Create enrollment
    enrollment = Enrollment.objects.create(
        user=order.user,
        plan=order.plan,
        order=order,
        status='active',
    )

    # Rebuild CourseAccess
    rebuild_access(order.user, order.plan.exam)

    logger.info(
        f'Payment captured: order={rz_order_id} user={order.user.email} '
        f'plan={order.plan.name} invoice={order.invoice_number}'
    )

    # Send confirmation email (fire-and-forget, don't block transaction)
    try:
        _send_enrollment_email(order)
    except Exception as e:
        logger.exception(f'Enrollment email failed: {e}')


def _handle_payment_failed(payment: dict):
    rz_order_id = payment.get('order_id')
    try:
        order = Order.objects.get(razorpay_order_id=rz_order_id)
        if order.status == 'created':
            order.status = 'failed'
            order.save(update_fields=['status'])
    except Order.DoesNotExist:
        pass


def _handle_refund_processed(refund: dict):
    rz_payment_id = refund.get('payment_id')
    try:
        order = Order.objects.select_related('user').get(
            razorpay_payment_id=rz_payment_id
        )
        order.status = 'refunded'
        order.save(update_fields=['status'])
        # Suspend enrollment
        try:
            order.enrollment.refund()
            rebuild_access(order.user, order.plan.exam)
        except Exception:
            pass
    except Order.DoesNotExist:
        pass


# ── REFUND ────────────────────────────────────────────────────────────────────

def process_refund(order: Order, admin_user, notes: str = '') -> bool:
    """
    Issue a full Razorpay refund and suspend the enrollment.
    Called from admin action or RefundRequest approval.
    """
    if order.status != 'paid':
        raise ValueError('Can only refund paid orders.')

    try:
        _razorpay_client().payment.refund(
            order.razorpay_payment_id,
            {'amount': int(order.total_amount * 100)}
        )
    except Exception as e:
        logger.exception(f'Razorpay refund failed for {order.id}: {e}')
        raise

    # Webhook will handle the rest, but set status now for UI responsiveness
    order.status = 'refunded'
    order.save(update_fields=['status'])

    try:
        order.enrollment.refund()
        rebuild_access(order.user, order.plan.exam)
    except Exception:
        pass

    logger.info(f'Refund issued: order={order.id} user={order.user.email}')
    return True


# ── EMAIL ─────────────────────────────────────────────────────────────────────

def _send_enrollment_email(order: Order):
    if not settings.RESEND_API_KEY:
        logger.info(f'[EMAIL DEV] Enrollment confirmation for {order.user.email}')
        return

    resend.api_key = settings.RESEND_API_KEY

    # Most plans give access on GRADSKOOL's own dashboard — but the SNAP
    # EMV course runs entirely on a separate platform (Learnyst), so
    # "log in to your dashboard" would be actively wrong/misleading for it.
    # Checked by plan slug rather than exam+name, since that's the one
    # field guaranteed stable and unique regardless of how the plan's
    # display name gets edited later.
    if order.plan.slug == 'snap-emv':
        access_block = f"""
            <p style="margin:0 0 24px;font-family:sans-serif;font-size:13px;color:#555;line-height:1.6;">
              This course runs on our partner platform. Sign up or log in there using
              <strong>{order.user.email}</strong> — the same email you used to pay here — to access it.
            </p>
            <a href="https://courses.gradskool.in/learn/snap-2026-ethics-morality-values"
               style="display:inline-block;padding:14px 28px;background:#0f0f0f;color:#fff;
                      border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;
                      text-decoration:none;">Access Your Course →</a>
        """
    else:
        access_block = """
            <p style="margin:0 0 24px;font-family:sans-serif;font-size:13px;color:#555;line-height:1.6;">
              Access is now active. Log in to your dashboard to start learning.
            </p>
            <a href="https://gradskool.in/dashboard"
               style="display:inline-block;padding:14px 28px;background:#0f0f0f;color:#fff;
                      border-radius:3px;font-family:sans-serif;font-size:14px;font-weight:600;
                      text-decoration:none;">Go to Dashboard →</a>
        """

    html = f"""
    <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f3;font-family:Georgia,serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:40px 20px;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#fff;border:1px solid #e8e8e6;border-radius:4px;overflow:hidden;">
          <tr><td style="background:#0f0f0f;padding:28px 40px;">
            <p style="margin:0;font-family:sans-serif;font-size:20px;font-weight:700;letter-spacing:.05em;color:#fff;">
              GRAD<span style="color:#ff5e5f;">SKOOL</span>
            </p>
          </td></tr>
          <tr><td style="padding:40px;">
            <p style="margin:0 0 6px;font-family:sans-serif;font-size:11px;font-weight:600;
                       letter-spacing:.1em;text-transform:uppercase;color:#ff5e5f;">Enrolment Confirmed</p>
            <h1 style="margin:0 0 20px;font-size:26px;color:#0f0f0f;font-weight:700;line-height:1.15;">
              You're enrolled,<br>{order.user.first_name or 'Aspirant'}.
            </h1>
            <table style="width:100%;border:1px solid #e8e8e6;border-radius:3px;
                           margin-bottom:24px;border-collapse:collapse;">
              <tr style="background:#fafaf9;">
                <td style="padding:12px 16px;font-family:sans-serif;font-size:12px;
                            color:#999;letter-spacing:.05em;text-transform:uppercase;
                            border-bottom:1px solid #e8e8e6;">Plan</td>
                <td style="padding:12px 16px;font-family:sans-serif;font-size:13px;
                            color:#0f0f0f;font-weight:600;border-bottom:1px solid #e8e8e6;">
                  {order.plan.name}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-family:sans-serif;font-size:12px;
                            color:#999;letter-spacing:.05em;text-transform:uppercase;">Amount Paid</td>
                <td style="padding:12px 16px;font-family:sans-serif;font-size:13px;color:#0f0f0f;">
                  ₹{int(order.total_amount):,} (incl. GST)</td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-family:sans-serif;font-size:13px;color:#555;line-height:1.6;">
              Invoice: <strong>{order.invoice_number}</strong>
            </p>
            {access_block}
            <hr style="margin:32px 0;border:none;border-top:1px solid #e8e8e6;">
            <p style="margin:0;font-family:sans-serif;font-size:12px;color:#999;line-height:1.6;">
              Questions? WhatsApp us at +91 6360597966 · gradskool.in
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
    </body></html>
    """
    resend.Emails.send({
        'from':    'GRADSKOOL <enroll@gradskool.in>',
        'to':      order.user.email,
        'subject': f'Enrolled: {order.plan.name} — Invoice {order.invoice_number}',
        'html':    html,
    })