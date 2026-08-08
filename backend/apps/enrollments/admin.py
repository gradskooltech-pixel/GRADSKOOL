from django.contrib import admin
from django.utils.html import format_html
from .models import Enrollment, CourseAccess


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display  = ['user', 'plan', 'status', 'enrolled_at', 'expires_at', 'is_active_display']
    list_filter   = ['status', 'plan__exam']
    search_fields = ['user__email', 'plan__name']
    readonly_fields = ['enrolled_at', 'order']
    raw_id_fields = ['user', 'plan']

    actions = ['suspend_selected', 'reactivate_selected']

    def is_active_display(self, obj):
        if obj.is_active:
            return format_html('<span style="color:green;">✓ Active</span>')
        return format_html('<span style="color:red;">✗ Inactive</span>')
    is_active_display.short_description = 'Active?'

    def suspend_selected(self, request, queryset):
        for e in queryset:
            e.suspend()
    suspend_selected.short_description = 'Suspend selected enrollments'

    def reactivate_selected(self, request, queryset):
        queryset.update(status='active')
    reactivate_selected.short_description = 'Reactivate selected enrollments'


@admin.register(CourseAccess)
class CourseAccessAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'exam', 'can_attend_live', 'can_watch_recordings',
        'can_take_mocks', 'can_download_books', 'updated_at'
    ]
    list_filter  = ['exam', 'can_attend_live', 'can_take_mocks']
    search_fields = ['user__email', 'exam__slug']
    readonly_fields = ['updated_at']

    def has_add_permission(self, request):
        return False  # Access is always derived, never manually created
