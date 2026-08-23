"""
GRADSKOOL — PDFs Views (public + purchase)

GET  /api/v1/pdfs/                          → Browse published PDFs (?exam=cat filter)
GET  /api/v1/pdfs/my-library/               → Purchased PDFs for the current user
POST /api/v1/pdfs/verify/                   → Client-side signature check (UX only)
POST /api/v1/pdfs/webhook/                  → Razorpay server webhook (source of truth)
GET  /api/v1/pdfs/{slug}/                   → Single PDF detail
GET  /api/v1/pdfs/{slug}/preview/           → Blurred page-1 preview, no auth, no watermark
GET  /api/v1/pdfs/{slug}/pages/{n}/         → Watermarked page image — ownership re-checked
                                               on EVERY request. This is the real security
                                               boundary; the reader page's initial gate is UX only.
POST /api/v1/pdfs/{slug}/create-order/      → Create a Razorpay order for this PDF
"""
import logging

from django.core.cache import cache
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Server-side cache for rendered page images (Redis, already configured for
# the project — see config/settings/production.py). This exists purely to
# avoid re-running the PIL watermark/blur pipeline — the most memory- and
# CPU-heavy thing this app does — on every single request for a page that
# was just rendered moments ago. A student flipping Prev/Next across the
# same few pages, or just reloading, was previously paying the full render
# cost every time.
PREVIEW_CACHE_SECONDS = 6 * 60 * 60   # 6h — not user-specific, safe to hold longer
PAGE_CACHE_SECONDS = 15 * 60          # 15m — watermark bakes in the user's email,
# so this is per-user and kept shorter

from .models import Pdf, PdfPage, PdfPurchase
from .serializers import PdfListSerializer, PdfPurchaseSerializer
from .supabase_storage import fetch_bytes
from .tasks import render_watermarked_page
from .watermark import apply_watermark, blur_preview
from . import services

logger = logging.getLogger(__name__)


def _owns(user, pdf: Pdf) -> bool:
    """
    Uniform for free and paid: a free PDF is NOT auto-accessible. It still
    requires login and an explicit claim (which captures a phone number) —
    see ClaimFreePdfView. The only thing that grants access, either way, is
    a PdfPurchase row with status == 'paid'.
    """
    if not user or not user.is_authenticated:
        return False
    return PdfPurchase.objects.filter(user=user, pdf=pdf, status='paid').exists()


# ── BROWSE / DETAIL ────────────────────────────────────────────────────────────

class PdfListView(generics.ListAPIView):
    serializer_class = PdfListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # 'upcoming' included alongside 'ready' — genuinely sellable rows
        # (see Pdf.STATUS), just without content uploaded yet. Everything
        # else (draft, processing, failed) correctly stays invisible.
        qs = Pdf.objects.filter(is_published=True, status__in=['ready', 'upcoming']).select_related(
            'exam', 'foundation_class__series', 'fyq_question'
        )
        exam_slug = self.request.query_params.get('exam')
        fyq_only  = self.request.query_params.get('fyq_only')

        if fyq_only:
            # The "<EXAM> FYQs" card is populated two ways: PDFs attached to
            # a specific FYQ question (fyq_question set — also shows on that
            # question's own page), OR PDFs explicitly tagged fyq_category
            # (no question attachment, uses the PDF's own `exam` field instead
            # of fyq_question.exams since there's no question to inherit from).
            items = [p for p in qs if p.fyq_question or p.fyq_category]
            if exam_slug:
                items = [
                    p for p in items
                    if (p.fyq_question and exam_slug in (p.fyq_question.exams or []))
                       or (p.fyq_category and p.exam and p.exam.slug == exam_slug)
                ]
            return items

        if exam_slug:
            # A PDF counts toward an exam's card if EITHER it's directly
            # tagged with that exam, OR it's attached to a foundation class
            # that applies to that exam (a class's own exams override wins
            # when set, same inheritance rule used throughout foundations).
            # FYQ-linked/tagged PDFs are deliberately excluded here — those
            # live under their own separate "<EXAM> FYQs" card instead.
            items = []
            for p in qs:
                if p.fyq_question or p.fyq_category:
                    continue
                if p.exam and p.exam.slug == exam_slug:
                    items.append(p)
                elif p.foundation_class:
                    fc = p.foundation_class
                    if exam_slug in (fc.exams or fc.series.exams or []):
                        items.append(p)
            return items

        return qs

    def get_serializer_context(self):
        return {'request': self.request}


class PdfDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            pdf = Pdf.objects.select_related('exam').get(slug=slug, is_published=True)
        except Pdf.DoesNotExist:
            return Response({'error': {'message': 'PDF not found.'}}, status=404)

        data = PdfListSerializer(pdf, context={'request': request}).data
        return Response(data)


# ── PAGE IMAGES ────────────────────────────────────────────────────────────────

class PdfPreviewView(APIView):
    """The one route with no auth/purchase check — a blurred page-1 teaser.
    No watermark (there's no user to attribute it to), and the blur is the
    actual protection here: readable enough to show layout/length, not
    readable enough to be useful without buying/claiming."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            pdf = Pdf.objects.get(slug=slug, is_published=True)
            page = pdf.pages.get(page_number=1)
        except (Pdf.DoesNotExist, PdfPage.DoesNotExist):
            return Response({'error': {'message': 'Preview not available.'}}, status=404)

        cache_key = f'pdfpreview:{pdf.id}'
        blurred = cache.get(cache_key)

        if blurred is None:
            data = fetch_bytes(page.storage_path)
            if not data:
                return Response({'error': {'message': 'Preview unavailable.'}}, status=502)

            blurred = blur_preview(data)
            # Same output for every visitor — no personalization here, so this
            # is safe to hold in Redis and reused across everyone who hits it.
            cache.set(cache_key, blurred, PREVIEW_CACHE_SECONDS)

        response = HttpResponse(blurred, content_type='image/jpeg')
        response['Cache-Control'] = 'public, max-age=3600'  # safe to cache — it's blurred, not user-specific
        return response


class PdfPageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug, page_number):
        try:
            pdf = Pdf.objects.get(slug=slug, is_published=True)
        except Pdf.DoesNotExist:
            return Response({'error': {'message': 'PDF not found.'}}, status=404)

        if not _owns(request.user, pdf):
            return Response({'error': {'message': 'Purchase required.'}}, status=403)

        try:
            page = pdf.pages.get(page_number=page_number)
        except PdfPage.DoesNotExist:
            return Response({'error': {'message': 'Page not found.'}}, status=404)

        # Keyed per-user (the watermark bakes in this user's email, so the
        # bytes aren't interchangeable across users) — this only saves the
        # render cost for the SAME user re-requesting the SAME page, e.g.
        # clicking back to a page they already viewed, or a reload.
        cache_key = f'pdfpage:{pdf.id}:{page_number}:{request.user.id}'
        watermarked = cache.get(cache_key)

        if watermarked is None:
            # The actual PIL work happens in a Celery task (apps/pdfs/tasks.py),
            # on the `worker` process, not here — see that file's docstring
            # for why. We wait briefly for the result rather than doing the
            # rendering ourselves, so the frontend needs no changes at all
            # (still a plain GET expecting image bytes back).
            success = None
            try:
                async_result = render_watermarked_page.apply_async(
                    args=[pdf.id, page_number, request.user.id, request.user.email, page.storage_path]
                )
                # Must stay comfortably under the frontend's axios timeout
                # (lib/api.js: timeout: 15000) — if we wait longer than the
                # browser is willing to, the browser cancels the request
                # before we can even fall back to inline rendering, and the
                # user gets a hard failure instead of a (slightly slow) success.
                success = async_result.get(timeout=10)
            except Exception:
                logger.warning('Celery dispatch/wait failed for pdf page render — falling back to inline render', exc_info=True)

            if success:
                watermarked = cache.get(cache_key)

            if not watermarked:
                # Fallback: render inline, same as before this change existed.
                # Better a possible memory spike on this worker than a broken
                # PDF reader if Celery/Redis is briefly unavailable — this
                # path should be rare, not the normal case.
                raw = fetch_bytes(page.storage_path)
                if not raw:
                    return Response({'error': {'message': 'Page unavailable.'}}, status=502)
                watermarked = apply_watermark(raw, request.user.email)
                cache.set(cache_key, watermarked, PAGE_CACHE_SECONDS)

        response = HttpResponse(watermarked, content_type='image/jpeg')
        response['Cache-Control'] = 'private, no-store'  # browser/CDN still never caches this — it's Redis-side only
        return response


# ── PURCHASE ───────────────────────────────────────────────────────────────────

class CreatePdfOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        try:
            pdf = Pdf.objects.get(slug=slug, is_published=True)
        except Pdf.DoesNotExist:
            return Response({'error': {'message': 'PDF not found.'}}, status=404)

        # Same requirement as the free-PDF claim flow — a phone number is
        # captured before purchase, not left to Razorpay's own (often
        # skipped) checkout form field.
        phone = (request.data.get('phone') or getattr(request.user, 'phone', '') or '').strip()
        if not phone or len(phone) < 10:
            return Response({'error': {'message': 'A valid phone number is required.'}}, status=400)
        if getattr(request.user, 'phone', '') != phone:
            request.user.phone = phone
            request.user.save(update_fields=['phone'])

        try:
            order_data = services.create_pdf_order(request.user, pdf)
        except ValueError as e:
            return Response({'error': {'message': str(e)}}, status=400)
        except Exception as e:
            logger.exception(f'PDF order creation failed: {e}')
            return Response(
                {'error': {'message': 'Payment gateway error. Please try again.'}}, status=503
            )

        return Response(order_data, status=201)


class CreatePdfBundleOrderView(APIView):
    """
    POST /api/v1/pdfs/bundle/order/
    Body: { "pdf_ids": [1, 2, 3, ...], "phone": "9876543210" }

    Bundle equivalent of CreatePdfOrderView above. tier_count is derived
    from len(pdf_ids) server-side (see services.create_pdf_bundle_order) —
    never trust a client-sent price or tier label directly, since that's
    exactly the kind of value a modified request could tamper with.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pdf_ids = request.data.get('pdf_ids') or []
        if not isinstance(pdf_ids, list) or not pdf_ids:
            return Response({'error': {'message': 'Select at least one PDF.'}}, status=400)

        phone = (request.data.get('phone') or getattr(request.user, 'phone', '') or '').strip()
        if not phone or len(phone) < 10:
            return Response({'error': {'message': 'A valid phone number is required.'}}, status=400)
        if getattr(request.user, 'phone', '') != phone:
            request.user.phone = phone
            request.user.save(update_fields=['phone'])

        try:
            order_data = services.create_pdf_bundle_order(request.user, pdf_ids, phone)
        except ValueError as e:
            return Response({'error': {'message': str(e)}}, status=400)
        except Exception as e:
            logger.exception(f'PDF bundle order creation failed: {e}')
            return Response(
                {'error': {'message': 'Payment gateway error. Please try again.'}}, status=503
            )

        return Response(order_data, status=201)


def _capture_lead(user, pdf: Pdf, phone: str):
    """
    Every free-PDF claim is also a lead — reuses your existing leads app
    instead of inventing a parallel list. Defensive: a failure here never
    blocks the actual PDF claim, it just means that one claim didn't get
    logged as a lead.
    """
    try:
        from apps.leads.models import Lead, LeadSource

        exam_code = pdf.exam.slug.upper() if pdf.exam else ''
        if exam_code not in dict(Lead.EXAM_CHOICES):
            exam_code = 'OTHER'

        lead, _created = Lead.objects.get_or_create(
            email=user.email,
            defaults={
                'first_name': getattr(user, 'first_name', '') or '',
                'phone': phone,
                'target_exam': exam_code,
                'user': user,
            },
        )
        update_fields = []
        if not lead.phone:
            lead.phone = phone
            update_fields.append('phone')
        if not lead.user_id:
            lead.user = user
            update_fields.append('user')
        if update_fields:
            lead.save(update_fields=update_fields)

        LeadSource.objects.create(
            lead=lead, source_type='course_page',
            source_detail=f'pdf-claim:{pdf.slug}', is_last_touch=True,
        )
    except Exception as e:
        logger.warning(f'Lead capture failed for free PDF claim ({pdf.slug}): {e}')


class ClaimFreePdfView(APIView):
    """
    The free-PDF equivalent of CreatePdfOrderView — no Razorpay, but still
    requires login (enforced by IsAuthenticated below) AND a phone number.
    This is the ONLY way a free PDF's PdfPurchase ever gets created; nothing
    grants access without going through here.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        try:
            pdf = Pdf.objects.get(slug=slug, is_published=True)
        except Pdf.DoesNotExist:
            return Response({'error': {'message': 'PDF not found.'}}, status=404)

        if not pdf.is_free:
            return Response({'error': {'message': 'This PDF isn\'t free — buy it instead.'}}, status=400)

        phone = (request.data.get('phone') or getattr(request.user, 'phone', '') or '').strip()
        if not phone or len(phone) < 10:
            return Response({'error': {'message': 'A valid phone number is required.'}}, status=400)

        # Save it onto the user's profile too, if it's new/changed — same
        # phone field CreatePdfOrderView already prefills into Razorpay.
        if getattr(request.user, 'phone', '') != phone:
            request.user.phone = phone
            request.user.save(update_fields=['phone'])

        purchase, _created = PdfPurchase.objects.get_or_create(
            user=request.user, pdf=pdf,
            defaults={'amount_inr': 0, 'status': 'paid', 'paid_at': timezone.now(), 'phone_captured': phone},
        )
        if purchase.status != 'paid':
            purchase.status = 'paid'
            purchase.paid_at = timezone.now()
            purchase.phone_captured = phone
            purchase.save(update_fields=['status', 'paid_at', 'phone_captured'])

        _capture_lead(request.user, pdf, phone)

        return Response({'claimed': True, 'pdf_slug': pdf.slug}, status=201)


class VerifyPdfPaymentSerializer(serializers.Serializer):
    razorpay_order_id   = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature  = serializers.CharField()


class VerifyPdfPaymentView(APIView):
    """
    Client-side payment confirmation. Originally "secondary" — only showed
    a success screen while the real webhook (PdfWebhookView) did the
    actual activation. Changed to genuinely activate here too: GS does
    not control the Razorpay account this project uses, so a second
    webhook URL (needed alongside .../payments/webhook/ — see
    PdfWebhookView's own docstring) can't actually be registered. Without
    this fix, every PDF/bundle purchase would complete payment
    successfully but never grant access — confirmed as a real, live
    failure (see conversation: student paid ₹510 for a 30-PDF bundle,
    Razorpay showed the payment as successful, but no PdfPurchase rows
    were ever created because nothing ever told the backend the payment
    happened).

    This is genuinely safe to activate from, not a workaround that skips
    verification: razorpay_signature is real cryptographic proof from
    Razorpay's own servers (verify_payment_signature checks it against
    RAZORPAY_KEY_SECRET, which only Razorpay and this backend know) — the
    exact same trust mechanism the webhook itself relies on, just
    delivered through the browser's checkout-success callback instead of
    a server-to-server call. If Razorpay's webhook infrastructure IS
    fixed later, both paths safely co-exist: mark_paid() on both models is
    already idempotent (checks status=='paid' before doing anything), so
    whichever path reaches a given order first does the real work, and
    the other is a safe no-op.
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = VerifyPdfPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        is_valid = services.verify_payment_signature(
            d['razorpay_order_id'], d['razorpay_payment_id'], d['razorpay_signature'],
        )
        if not is_valid:
            return Response({'error': {'message': 'Payment signature verification failed.'}}, status=400)

        order_id = d['razorpay_order_id']

        # Try single-PDF purchase first, then bundle — an order_id only
        # ever belongs to one or the other (see create_pdf_order and
        # create_pdf_bundle_order, which each generate their own).
        try:
            purchase = PdfPurchase.objects.select_for_update().get(razorpay_order_id=order_id, user=request.user)
            if purchase.status != 'paid':
                purchase.mark_paid(d['razorpay_payment_id'], d['razorpay_signature'])
            return Response({'verified': True, 'pdf_slug': purchase.pdf.slug})
        except PdfPurchase.DoesNotExist:
            pass

        from .models import PdfBundlePurchase
        try:
            bundle = PdfBundlePurchase.objects.select_for_update().get(razorpay_order_id=order_id, user=request.user)
            if bundle.status != 'paid':
                bundle.mark_paid(d['razorpay_payment_id'], d['razorpay_signature'])
            return Response({'verified': True, 'bundle_id': bundle.id, 'tier_count': bundle.tier_count})
        except PdfBundlePurchase.DoesNotExist:
            pass

        return Response({'error': {'message': 'No matching order found for this payment.'}}, status=404)


class PdfWebhookView(APIView):
    """Called by Razorpay's servers. No JWT — HMAC verified. Point a second
    webhook URL at this from the Razorpay dashboard (alongside /payments/webhook/);
    each service ignores events it doesn't own via notes.kind."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get('X-Razorpay-Signature', '')
        success = services.process_webhook(request.data, raw_body, signature)
        if not success:
            return Response({'error': 'Invalid signature'}, status=400)
        return Response({'status': 'ok'})


class MyPdfLibraryView(generics.ListAPIView):
    serializer_class = PdfPurchaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            PdfPurchase.objects
            .filter(user=self.request.user, status='paid')
            .select_related('pdf')
            .order_by('-paid_at')
        )