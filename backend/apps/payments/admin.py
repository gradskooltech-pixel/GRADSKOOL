from django.contrib import admin
from django.utils.html import format_html
from .models import Order, RefundRequest
from .services import process_refund


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = [
        'razorpay_order_id', 'user', 'plan', 'total_amount',
        'status_badge', 'payment_method', 'invoice_number', 'created_at'
    ]
    list_filter   = ['status', 'payment_method', 'plan__exam']
    search_fields = ['razorpay_order_id', 'razorpay_payment_id',
                     'user__email', 'invoice_number']
    readonly_fields = [
        'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
        'amount_inr', 'gst_amount', 'total_amount', 'invoice_number',
        'created_at', 'paid_at', 'idempotency_key',
    ]
    ordering = ['-created_at']

    actions = ['issue_refund']

    def status_badge(self, obj):
        colors = {
            'created': '#999', 'paid': 'green', 'failed': 'red',
            'refunded': 'orange', 'cancelled': '#999'
        }
        return format_html(
            '<span style="color:{}; font-weight:600;">{}</span>',
            colors.get(obj.status, '#999'), obj.status.upper()
        )
    status_badge.short_description = 'Status'

    def issue_refund(self, request, queryset):
        for order in queryset.filter(status='paid'):
            try:
                process_refund(order, request.user)
                self.message_user(request, f'Refund issued for {order.razorpay_order_id}')
            except Exception as e:
                self.message_user(request, f'Refund failed: {e}', level='error')
    issue_refund.short_description = 'Issue Razorpay refund'


@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    list_display  = ['order', 'status', 'requested_at', 'resolved_at', 'resolved_by']
    list_filter   = ['status']
    search_fields = ['order__user__email', 'order__razorpay_order_id']
    readonly_fields = ['requested_at', 'resolved_at']

    actions = ['approve_refunds']

    def approve_refunds(self, request, queryset):
        for rr in queryset.filter(status='pending'):
            try:
                process_refund(rr.order, request.user, 'Admin approved')
                rr.approve(request.user, 'Admin approved via bulk action')
            except Exception as e:
                self.message_user(request, f'Failed: {e}', level='error')
    approve_refunds.short_description = 'Approve and issue refunds'
