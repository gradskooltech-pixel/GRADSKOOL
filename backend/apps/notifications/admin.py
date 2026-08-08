"""
GRADSKOOL — Notifications Admin
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import InAppNotification, WhatsAppLog, NotificationTemplate


@admin.register(InAppNotification)
class InAppNotificationAdmin(admin.ModelAdmin):
    list_display    = ['user', 'category', 'title', 'is_read', 'created_at']
    list_filter     = ['category', 'is_read']
    search_fields   = ['user__email', 'title']
    readonly_fields = ['created_at', 'read_at', 'expires_at']
    ordering        = ['-created_at']
    actions         = ['mark_selected_read']

    def mark_selected_read(self, request, queryset):
        queryset.update(is_read=True)
    mark_selected_read.short_description = 'Mark selected as read'


@admin.register(WhatsAppLog)
class WhatsAppLogAdmin(admin.ModelAdmin):
    list_display    = ['phone', 'user', 'template', 'status_badge',
                       'attempt_count', 'created_at', 'sent_at']
    list_filter     = ['status', 'template']
    search_fields   = ['phone', 'user__email']
    readonly_fields = ['idempotency_key', 'provider_msg_id',
                       'created_at', 'sent_at', 'delivered_at']
    ordering        = ['-created_at']

    def status_badge(self, obj):
        COLORS = {
            'queued':    '#9ca3af',
            'sent':      '#3b82f6',
            'delivered': '#10b981',
            'read':      '#059669',
            'failed':    '#ef4444',
        }
        color = COLORS.get(obj.status, '#9ca3af')
        return format_html(
            '<span style="padding:2px 8px;border-radius:3px;'
            'background:{};color:white;font-size:11px;font-weight:600;">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = 'Status'

    def has_add_permission(self, request):
        return False


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display        = ['name', 'slug', 'channel', 'category', 'is_active']
    list_filter         = ['channel', 'is_active']
    search_fields       = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
