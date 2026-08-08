"""
GRADSKOOL — Payments Views

POST /api/v1/payments/create-order/      → Create Razorpay order
POST /api/v1/payments/verify/            → Client-side signature verify
POST /api/v1/payments/webhook/           → Razorpay server webhook
GET  /api/v1/payments/orders/            → User's order history
GET  /api/v1/payments/orders/{id}/       → Single order detail
"""
import logging
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle

from apps.courses.models import PricingPlan
from .models import Order
from .services import (
    create_razorpay_order,
    verify_payment_signature,
    process_webhook,
)

logger = logging.getLogger(__name__)


# ── THROTTLE ──────────────────────────────────────────────────────────────────

class OrderCreateThrottle(UserRateThrottle):
    scope = 'order_create'


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

class CreateOrderSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()

    def validate_plan_id(self, value):
        try:
            plan = PricingPlan.objects.select_related('exam').get(
                id=value, is_active=True, exam__is_active=True
            )
        except PricingPlan.DoesNotExist:
            raise serializers.ValidationError('Plan not found or no longer available.')
        self.context['plan'] = plan
        return value


class VerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id   = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature  = serializers.CharField()


class OrderSerializer(serializers.ModelSerializer):
    plan_name  = serializers.CharField(source='plan.name', read_only=True)
    exam_slug  = serializers.CharField(source='plan.exam.slug', read_only=True)
    exam_name  = serializers.CharField(source='plan.exam.name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'razorpay_order_id', 'razorpay_payment_id',
            'plan_name', 'exam_slug', 'exam_name',
            'amount_inr', 'gst_amount', 'total_amount',
            'status', 'payment_method', 'invoice_number',
            'created_at', 'paid_at',
        ]
        read_only_fields = fields


# ── VIEWS ─────────────────────────────────────────────────────────────────────

class CreateOrderView(APIView):
    """
    POST /api/v1/payments/create-order/
    Body: { plan_id: 42 }

    Creates a Razorpay order and returns the widget payload.
    Throttled to 10/hour per user to prevent abuse.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [OrderCreateThrottle]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        plan = serializer.context['plan']

        try:
            order_data = create_razorpay_order(request.user, plan)
        except ValueError as e:
            return Response({'error': {'message': str(e)}}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f'Order creation failed: {e}')
            return Response(
                {'error': {'message': 'Payment gateway error. Please try again.'}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(order_data, status=status.HTTP_201_CREATED)


class VerifyPaymentView(APIView):
    """
    POST /api/v1/payments/verify/

    Verifies client-side signature. Returns success/failure.
    Does NOT activate enrollment (webhook does that).
    Used to show the success screen immediately while webhook processes.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        is_valid = verify_payment_signature(
            d['razorpay_order_id'],
            d['razorpay_payment_id'],
            d['razorpay_signature'],
        )

        if not is_valid:
            return Response(
                {'error': {'message': 'Payment signature verification failed.'}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find the order for the response
        try:
            order = Order.objects.get(
                razorpay_order_id=d['razorpay_order_id'],
                user=request.user
            )
            return Response({
                'verified': True,
                'order_id': order.id,
                'plan_name': order.plan.name,
                'exam_slug': order.plan.exam.slug,
            })
        except Order.DoesNotExist:
            return Response({'verified': True})


class RazorpayWebhookView(APIView):
    """
    POST /api/v1/payments/webhook/

    Called by Razorpay's servers. No auth header — HMAC verified.
    Must return 200 quickly (Razorpay retries on timeout).
    """
    permission_classes = [AllowAny]
    authentication_classes = []   # Skip JWT auth entirely

    def post(self, request):
        raw_body  = request.body
        signature = request.headers.get('X-Razorpay-Signature', '')

        success = process_webhook(request.data, raw_body, signature)

        if not success:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': 'ok'})


class OrderListView(generics.ListAPIView):
    """GET /api/v1/payments/orders/ — User's payment history"""
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .select_related('plan__exam')
            .exclude(status='created')   # Only show completed/failed orders
            .order_by('-created_at')
        )


class OrderDetailView(generics.RetrieveAPIView):
    """GET /api/v1/payments/orders/{id}/ — Single order detail"""
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related('plan__exam')
