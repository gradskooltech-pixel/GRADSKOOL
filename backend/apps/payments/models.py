"""
GRADSKOOL — Payments Models

Order         → Created before payment; updated by webhook.
RefundRequest → Student-initiated refund; reviewed by admin.

Key design decisions:
  - Orders are created BEFORE payment (Razorpay pre-authorisation model).
  - Webhook is the ONLY source of truth for payment confirmation.
  - Client-side verification is done as a secondary check but
    enrollment is NEVER activated from the frontend verify endpoint.
  - GST invoice number is generated on payment confirmation.
  - idempotency_key prevents duplicate orders for same (user, plan).
"""
import uuid
from django.db import models
from django.utils import timezone


class Order(models.Model):
    STATUS = [
        ('created',   'Created'),    # Razorpay order created, not paid
        ('paid',      'Paid'),       # Webhook confirmed
        ('failed',    'Failed'),     # Payment failed / expired
        ('refunded',  'Refunded'),   # Full refund issued
        ('cancelled', 'Cancelled'),  # User cancelled before payment
    ]

    user                = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='orders'
    )
    plan                = models.ForeignKey(
        'courses.PricingPlan', on_delete=models.CASCADE, related_name='orders'
    )

    # Razorpay identifiers
    razorpay_order_id   = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, db_index=True)
    razorpay_signature  = models.CharField(max_length=256, blank=True)

    # Amounts (INR, stored as decimal)
    amount_inr          = models.DecimalField(max_digits=8, decimal_places=2)
    gst_amount          = models.DecimalField(max_digits=8, decimal_places=2)
    total_amount        = models.DecimalField(max_digits=8, decimal_places=2)

    # Status
    status              = models.CharField(max_length=20, choices=STATUS, default='created')
    payment_method      = models.CharField(max_length=50, blank=True)
    # 'upi', 'card', 'netbanking', 'emi', 'wallet'

    # Invoice
    invoice_number      = models.CharField(max_length=50, blank=True, unique=True, null=True)
    # Format: INV-2026-000001

    # Metadata
    created_at          = models.DateTimeField(auto_now_add=True)
    paid_at             = models.DateTimeField(null=True, blank=True)

    # Idempotency — prevents duplicate orders (e.g. double-click)
    idempotency_key     = models.CharField(max_length=100, unique=True, blank=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['razorpay_order_id']),
        ]

    def __str__(self):
        return f'Order {self.razorpay_order_id} — {self.user.email} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.idempotency_key:
            self.idempotency_key = str(uuid.uuid4())
        super().save(*args, **kwargs)

    def mark_paid(self, payment_id: str, signature: str, method: str = ''):
        self.status = 'paid'
        self.razorpay_payment_id = payment_id
        self.razorpay_signature = signature
        self.payment_method = method
        self.paid_at = timezone.now()
        self.invoice_number = self._generate_invoice_number()
        self.save(update_fields=[
            'status', 'razorpay_payment_id', 'razorpay_signature',
            'payment_method', 'paid_at', 'invoice_number'
        ])

    def _generate_invoice_number(self) -> str:
        year = timezone.now().year
        last = (
            Order.objects
            .filter(invoice_number__startswith=f'INV-{year}-', status='paid')
            .order_by('-invoice_number')
            .values_list('invoice_number', flat=True)
            .first()
        )
        if last:
            seq = int(last.split('-')[-1]) + 1
        else:
            seq = 1
        return f'INV-{year}-{seq:06d}'


class RefundRequest(models.Model):
    STATUS = [
        ('pending',  'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    order       = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='refund_request')
    reason      = models.TextField()
    status      = models.CharField(max_length=20, choices=STATUS, default='pending')
    admin_notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    resolved_at  = models.DateTimeField(null=True, blank=True)
    resolved_by  = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='resolved_refunds'
    )

    class Meta:
        db_table = 'refund_requests'

    def approve(self, admin_user, notes=''):
        self.status = 'approved'
        self.admin_notes = notes
        self.resolved_at = timezone.now()
        self.resolved_by = admin_user
        self.save()
        # Trigger actual Razorpay refund + enrollment suspension in service layer
