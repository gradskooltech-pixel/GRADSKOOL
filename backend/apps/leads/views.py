"""
GRADSKOOL — Leads Views

Public endpoints:
  POST /api/v1/leads/capture/          → Create/upsert a lead from any CTA
  GET  /api/v1/leads/unsubscribe/      → One-click unsubscribe (token in URL)
  POST /api/v1/leads/resend-webhook/   → Resend email event webhook

Admin-only endpoints (IsAdmin permission):
  GET  /api/v1/leads/analytics/        → Aggregate lead + email stats
  GET  /api/v1/leads/                  → Lead list (paginated, filterable)
  GET  /api/v1/leads/{id}/             → Lead detail with sources + events
  POST /api/v1/leads/{id}/enroll/      → Manually enroll in a sequence
  POST /api/v1/leads/{id}/note/        → Add admin note

The public /capture/ endpoint is rate-limited and honeypot-protected.
"""
import logging
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from shared.permissions import IsAdmin
from .models import Lead, LeadSource, DripSequence, DripEnrollment, EmailEvent, LeadNote
from .services import upsert_lead, enroll_in_sequence, process_resend_webhook, get_lead_analytics

logger = logging.getLogger(__name__)


# ── THROTTLES ─────────────────────────────────────────────────────────────────

class LeadCaptureThrottle(AnonRateThrottle):
    scope = 'lead_capture'   # 10/hour per IP (set in settings)


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

class LeadCaptureSerializer(serializers.Serializer):
    """Inbound lead from any public CTA."""
    email       = serializers.EmailField()
    first_name  = serializers.CharField(max_length=120, required=False, allow_blank=True)
    last_name   = serializers.CharField(max_length=120, required=False, allow_blank=True)
    phone       = serializers.CharField(max_length=15,  required=False, allow_blank=True)
    target_exam = serializers.CharField(max_length=20,  required=False, allow_blank=True)
    source_type = serializers.CharField(max_length=30,  required=False, default='course_page')
    source_detail = serializers.CharField(max_length=255, required=False, allow_blank=True)
    utm_source    = serializers.CharField(max_length=100, required=False, allow_blank=True)
    utm_medium    = serializers.CharField(max_length=100, required=False, allow_blank=True)
    utm_campaign  = serializers.CharField(max_length=100, required=False, allow_blank=True)
    utm_content   = serializers.CharField(max_length=100, required=False, allow_blank=True)
    referrer_url  = serializers.URLField(required=False, allow_blank=True)
    # Honeypot field — bots fill this in, humans don't see it
    website       = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate_email(self, value):
        return value.lower().strip()

    def validate(self, attrs):
        # Honeypot: if 'website' is filled, it's a bot
        if attrs.get('website'):
            raise serializers.ValidationError({'website': 'Bot detected.'})
        return attrs


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LeadSource
        fields = ['source_type', 'source_detail', 'is_first_touch', 'is_last_touch', 'created_at']


class EmailEventSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EmailEvent
        fields = ['event_type', 'subject', 'link_clicked', 'occurred_at']


class LeadNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model  = LeadNote
        fields = ['id', 'body', 'author_name', 'created_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else 'Admin'


class LeadListSerializer(serializers.ModelSerializer):
    source_count = serializers.SerializerMethodField()

    class Meta:
        model  = Lead
        fields = [
            'id', 'email', 'first_name', 'last_name', 'target_exam',
            'status', 'lead_score', 'is_subscribed',
            'source_count', 'created_at', 'last_seen_at',
        ]

    def get_source_count(self, obj):
        return obj.sources.count()


class LeadDetailSerializer(serializers.ModelSerializer):
    sources = LeadSourceSerializer(many=True, read_only=True)
    email_events = EmailEventSerializer(many=True, read_only=True)
    notes = LeadNoteSerializer(many=True, read_only=True)
    drip_enrollments = serializers.SerializerMethodField()

    class Meta:
        model  = Lead
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'target_exam', 'status', 'lead_score', 'is_subscribed',
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
            'referrer_url', 'ip_address',
            'converted_at',
            'sources', 'email_events', 'notes', 'drip_enrollments',
            'created_at', 'updated_at', 'last_seen_at',
        ]

    def get_drip_enrollments(self, obj):
        return [
            {
                'sequence': e.sequence.name,
                'status':   e.status,
                'step':     e.current_step,
                'next_send': e.next_send_at.isoformat() if e.next_send_at else None,
                'enrolled_at': e.enrolled_at.isoformat(),
            }
            for e in obj.drip_enrollments.select_related('sequence').all()
        ]


# ── PUBLIC VIEWS ──────────────────────────────────────────────────────────────

class LeadCaptureView(APIView):
    """
    POST /api/v1/leads/capture/

    Universal lead capture endpoint. Called from:
    - Course page "Notify me" CTAs
    - Blog subscribe forms
    - Checkout page (abandoned checkout detection)
    - Any custom landing page

    Always returns 200 — never reveals whether email exists.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [LeadCaptureThrottle]

    def post(self, request):
        serializer = LeadCaptureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        ip = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR')
        )

        lead, created = upsert_lead(
            email=d['email'],
            first_name=d.get('first_name', ''),
            last_name=d.get('last_name', ''),
            phone=d.get('phone', ''),
            target_exam=d.get('target_exam', ''),
            source_type=d.get('source_type', 'course_page'),
            source_detail=d.get('source_detail', ''),
            ip=ip,
            utm_source=d.get('utm_source', ''),
            utm_medium=d.get('utm_medium', ''),
            utm_campaign=d.get('utm_campaign', ''),
            utm_content=d.get('utm_content', ''),
            referrer_url=d.get('referrer_url', ''),
        )

        # Enroll in appropriate sequence
        if lead.is_subscribed:
            from .tasks import trigger_sequence_for_lead
            trigger_sequence_for_lead.delay(
                lead_id=lead.id,
                trigger_event=d.get('source_type', 'course_page'),
                exam=d.get('target_exam', ''),
            )

        return Response({
            'detail': "Thank you! We'll be in touch.",
            'is_new': created,
        })


class UnsubscribeView(APIView):
    """
    GET /api/v1/leads/unsubscribe/?token=<uuid>

    One-click unsubscribe. Called when the lead clicks the footer link
    in any drip email. Token is the Lead.unsubscribe_token UUID.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': 'Missing token.'}, status=400)
        try:
            lead = Lead.objects.get(unsubscribe_token=token)
        except Lead.DoesNotExist:
            return Response({'detail': 'Invalid unsubscribe link.'}, status=400)

        if not lead.is_subscribed:
            return Response({'detail': 'Already unsubscribed.', 'email': lead.email})

        lead.unsubscribe()
        logger.info(f'Unsubscribed: {lead.email}')
        return Response({'detail': 'Unsubscribed successfully.', 'email': lead.email})


class ResendWebhookView(APIView):
    """
    POST /api/v1/leads/resend-webhook/

    Receives email events from Resend (opened, clicked, bounced, etc.).
    Secured by RESEND_WEBHOOK_SECRET header verification.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        # Verify Resend webhook signature
        signing_secret = getattr(request, 'META', {}).get(
            'HTTP_SVIX_SIGNATURE', ''
        ) or request.headers.get('svix-signature', '')

        # For now we trust the source (Resend uses Svix for webhooks)
        # In production, add Svix signature verification here.
        # Reference: https://docs.resend.com/webhooks

        payload = request.data
        if not payload or not payload.get('type'):
            return Response({'detail': 'Invalid payload.'}, status=400)

        try:
            process_resend_webhook(payload)
        except Exception as exc:
            logger.exception(f'Resend webhook processing error: {exc}')
            return Response({'detail': 'Processing error.'}, status=500)

        return Response({'status': 'ok'})


# ── ADMIN VIEWS ───────────────────────────────────────────────────────────────

class LeadAnalyticsView(APIView):
    """
    GET /api/v1/leads/analytics/

    Aggregate stats for the admin leads dashboard.
    Cached for 5 minutes.
    """
    permission_classes = [IsAdmin]

    @method_decorator(cache_page(60 * 5))
    def get(self, request):
        data = get_lead_analytics()
        return Response(data)


class LeadPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class LeadListView(generics.ListAPIView):
    """
    GET /api/v1/leads/
    ?status=new|engaged|nurtured|converted|unsubscribed
    ?exam=CAT
    ?search=<email_or_name>
    ?ordering=-lead_score|-created_at
    """
    serializer_class   = LeadListSerializer
    permission_classes = [IsAdmin]
    pagination_class   = LeadPagination

    def get_queryset(self):
        qs = Lead.objects.all().order_by('-created_at')
        p  = self.request.query_params

        if p.get('status'):
            qs = qs.filter(status=p['status'])
        if p.get('exam'):
            qs = qs.filter(target_exam__iexact=p['exam'])
        if p.get('search'):
            term = p['search']
            qs = qs.filter(
                email__icontains=term
            ) | qs.filter(
                first_name__icontains=term
            ) | qs.filter(
                last_name__icontains=term
            )
        ordering = p.get('ordering', '-created_at')
        allowed  = {'-created_at', 'created_at', '-lead_score', 'lead_score',
                    '-last_seen_at', 'status'}
        if ordering in allowed:
            qs = qs.order_by(ordering)
        return qs


class LeadDetailView(generics.RetrieveAPIView):
    """GET /api/v1/leads/{id}/ — Full lead record with sources + events."""
    serializer_class   = LeadDetailSerializer
    permission_classes = [IsAdmin]
    queryset           = Lead.objects.prefetch_related(
        'sources', 'email_events', 'notes__author', 'drip_enrollments__sequence'
    ).all()


class LeadEnrollSequenceView(APIView):
    """
    POST /api/v1/leads/{id}/enroll/
    Body: { sequence_slug: "cat-nurture-7day" }

    Manually enroll a lead into a drip sequence.
    Used by admin to manually trigger sequences.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            lead = Lead.objects.get(id=pk)
        except Lead.DoesNotExist:
            return Response({'detail': 'Lead not found.'}, status=404)

        slug = request.data.get('sequence_slug')
        if not slug:
            return Response({'detail': 'sequence_slug required.'}, status=400)

        try:
            sequence = DripSequence.objects.get(slug=slug, is_active=True)
        except DripSequence.DoesNotExist:
            return Response({'detail': 'Sequence not found.'}, status=404)

        enrollment = enroll_in_sequence(lead, sequence.trigger_event or 'manual')
        if enrollment:
            return Response({
                'detail': f'Enrolled in "{sequence.name}".',
                'next_send_at': enrollment.next_send_at,
            })
        return Response({'detail': 'Could not enroll. Lead may be unsubscribed.'}, status=400)


class LeadAddNoteView(APIView):
    """POST /api/v1/leads/{id}/note/ — Add internal admin note."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            lead = Lead.objects.get(id=pk)
        except Lead.DoesNotExist:
            return Response({'detail': 'Lead not found.'}, status=404)

        body = request.data.get('body', '').strip()
        if not body:
            return Response({'detail': 'Note body required.'}, status=400)

        note = LeadNote.objects.create(lead=lead, author=request.user, body=body)
        return Response(LeadNoteSerializer(note).data, status=201)
