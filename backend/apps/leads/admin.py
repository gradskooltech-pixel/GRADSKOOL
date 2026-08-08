"""
GRADSKOOL — Leads Admin

Provides a CRM-like interface for managing leads, sequences, and email analytics.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from django.http import HttpResponse
import csv

from .models import (
    Lead, LeadSource, DripSequence, DripEmail,
    DripEnrollment, EmailEvent, LeadNote,
)
from .services import enroll_in_sequence
from .tasks import send_due_drip_emails


# ── INLINES ───────────────────────────────────────────────────────────────────

class LeadSourceInline(admin.TabularInline):
    model      = LeadSource
    extra      = 0
    readonly_fields = ['source_type', 'source_detail', 'is_first_touch',
                       'is_last_touch', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class EmailEventInline(admin.TabularInline):
    model      = EmailEvent
    extra      = 0
    readonly_fields = ['event_type', 'subject', 'link_clicked', 'occurred_at']
    can_delete = False
    max_num    = 20

    def has_add_permission(self, request, obj=None):
        return False


class DripEnrollmentInline(admin.TabularInline):
    model      = DripEnrollment
    extra      = 0
    readonly_fields = ['sequence', 'status', 'current_step', 'next_send_at', 'enrolled_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class LeadNoteInline(admin.StackedInline):
    model  = LeadNote
    extra  = 1
    fields = ['body', 'author']
    readonly_fields = ['author', 'created_at']

    def has_delete_permission(self, request, obj=None):
        return False


class DripEmailInline(admin.StackedInline):
    model  = DripEmail
    extra  = 1
    fields = ['step', 'subject', 'preview_text', 'html_body', 'send_delay_hours', 'is_active']
    ordering = ['step']


# ── LEAD ADMIN ────────────────────────────────────────────────────────────────

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display   = [
        'email', 'full_name_display', 'target_exam',
        'status_badge', 'score_display', 'is_subscribed',
        'source_count', 'created_at'
    ]
    list_filter    = ['status', 'target_exam', 'is_subscribed']
    search_fields  = ['email', 'first_name', 'last_name', 'phone']
    readonly_fields = [
        'lead_score', 'status', 'converted_at', 'converted_plan',
        'unsubscribe_token', 'ip_address',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
        'created_at', 'updated_at', 'last_seen_at',
    ]
    ordering       = ['-created_at']
    inlines        = [
        LeadSourceInline,
        DripEnrollmentInline,
        EmailEventInline,
        LeadNoteInline,
    ]
    actions = [
        'enroll_in_tool_gate_sequence',
        'enroll_in_registration_sequence',
        'mark_subscribed',
        'export_csv',
    ]

    fieldsets = (
        ('Identity', {
            'fields': ('email', 'first_name', 'last_name', 'phone', 'target_exam')
        }),
        ('Status', {
            'fields': ('status', 'lead_score', 'is_subscribed', 'converted_at', 'converted_plan')
        }),
        ('UTM / Attribution', {
            'fields': ('utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
                       'referrer_url', 'ip_address'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_seen_at'),
            'classes': ('collapse',),
        }),
    )

    def full_name_display(self, obj):
        return obj.full_name
    full_name_display.short_description = 'Name'

    def status_badge(self, obj):
        COLORS = {
            'new':          '#9ca3af',
            'engaged':      '#3b82f6',
            'nurtured':     '#f59e0b',
            'converted':    '#10b981',
            'unsubscribed': '#6b7280',
            'bounced':      '#ef4444',
        }
        color = COLORS.get(obj.status, '#9ca3af')
        return format_html(
            '<span style="display:inline-block;padding:2px 8px;'
            'border-radius:3px;background:{};color:white;'
            'font-size:11px;font-weight:600;">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = 'Status'

    def score_display(self, obj):
        color = '#10b981' if obj.lead_score >= 30 else ('#f59e0b' if obj.lead_score >= 10 else '#9ca3af')
        return format_html(
            '<span style="font-weight:700;color:{};">{}</span>',
            color, obj.lead_score
        )
    score_display.short_description = 'Score'

    def source_count(self, obj):
        return obj.sources.count()
    source_count.short_description = 'Sources'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('sources')

    # ── BULK ACTIONS ────────────────────────────────────────────────────────

    def enroll_in_tool_gate_sequence(self, request, queryset):
        count = 0
        for lead in queryset.filter(is_subscribed=True):
            if enroll_in_sequence(lead, 'tool_gate'):
                count += 1
        self.message_user(request, f'Enrolled {count} leads in tool_gate sequence.')
    enroll_in_tool_gate_sequence.short_description = 'Enroll in tool gate sequence'

    def enroll_in_registration_sequence(self, request, queryset):
        count = 0
        for lead in queryset.filter(is_subscribed=True):
            if enroll_in_sequence(lead, 'registration'):
                count += 1
        self.message_user(request, f'Enrolled {count} leads in registration sequence.')
    enroll_in_registration_sequence.short_description = 'Enroll in registration sequence'

    def mark_subscribed(self, request, queryset):
        queryset.update(is_subscribed=True)
        self.message_user(request, f'Marked {queryset.count()} leads as subscribed.')
    mark_subscribed.short_description = 'Mark as subscribed'

    def export_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="leads_export.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'Email', 'First Name', 'Last Name', 'Phone',
            'Target Exam', 'Status', 'Lead Score',
            'Is Subscribed', 'UTM Source', 'UTM Campaign',
            'Created At', 'Last Seen At',
        ])
        for lead in queryset.iterator():
            writer.writerow([
                lead.email, lead.first_name, lead.last_name, lead.phone,
                lead.target_exam, lead.status, lead.lead_score,
                lead.is_subscribed, lead.utm_source, lead.utm_campaign,
                lead.created_at.strftime('%Y-%m-%d %H:%M'),
                lead.last_seen_at.strftime('%Y-%m-%d %H:%M') if lead.last_seen_at else '',
            ])
        return response
    export_csv.short_description = 'Export selected leads to CSV'


# ── DRIP SEQUENCE ADMIN ───────────────────────────────────────────────────────

@admin.register(DripSequence)
class DripSequenceAdmin(admin.ModelAdmin):
    list_display    = [
        'name', 'trigger_event', 'trigger_exam',
        'email_count', 'enrollment_count', 'is_active'
    ]
    list_filter     = ['trigger_event', 'trigger_exam', 'is_active']
    search_fields   = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    inlines         = [DripEmailInline]
    actions         = ['run_drip_send_now']

    def email_count(self, obj):
        return obj.emails.count()
    email_count.short_description = 'Emails'

    def enrollment_count(self, obj):
        return obj.enrollments.filter(status='active').count()
    enrollment_count.short_description = 'Active Enrollments'

    def run_drip_send_now(self, request, queryset):
        """Trigger the drip send loop immediately (without waiting for Celery Beat)."""
        result = send_due_drip_emails.delay()
        self.message_user(request, f'Drip send task queued. Task ID: {result.id}')
    run_drip_send_now.short_description = 'Run drip send loop now'


@admin.register(DripEmail)
class DripEmailAdmin(admin.ModelAdmin):
    list_display = ['sequence', 'step', 'subject', 'send_delay_hours', 'is_active']
    list_filter  = ['sequence', 'is_active']
    search_fields = ['subject', 'html_body']

    def sent_count(self, obj):
        return obj.events.filter(event_type='sent').count()
    sent_count.short_description = 'Sent'


@admin.register(DripEnrollment)
class DripEnrollmentAdmin(admin.ModelAdmin):
    list_display   = [
        'lead', 'sequence', 'status', 'current_step',
        'next_send_at', 'enrolled_at'
    ]
    list_filter    = ['status', 'sequence']
    search_fields  = ['lead__email']
    readonly_fields = ['enrolled_at', 'completed_at']
    ordering       = ['-enrolled_at']


@admin.register(EmailEvent)
class EmailEventAdmin(admin.ModelAdmin):
    list_display  = ['lead', 'event_type', 'subject', 'occurred_at']
    list_filter   = ['event_type']
    search_fields = ['lead__email', 'subject']
    readonly_fields = ['occurred_at']
    ordering      = ['-occurred_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
