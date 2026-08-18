"""
GRADSKOOL — Accounts Admin

Provides rich management interface for:
- Users (with inline login logs)
- Email verification tokens
- Password reset tokens
- Login audit logs
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import User, EmailVerificationToken, PasswordResetToken, LoginAuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'full_name', 'role', 'target_exam',
        'is_verified', 'is_google_auth', 'is_active', 'created_at'
    ]
    list_filter = ['role', 'target_exam', 'is_verified', 'is_active', 'is_google_auth']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'last_login', 'is_google_auth']

    fieldsets = (
        ('Login', {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'city', 'avatar_url')}),
        ('Platform', {'fields': ('role', 'target_exam', 'is_verified', 'is_google_auth')}),
        ('Access', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'last_login')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    # Override username field (we don't use it)
    USERNAME_FIELD = 'email'


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_short', 'created_at', 'expires_at', 'used', 'is_valid_display']
    list_filter = ['used']
    search_fields = ['user__email']
    readonly_fields = ['token', 'created_at', 'expires_at', 'used', 'used_at']
    ordering = ['-created_at']

    def token_short(self, obj):
        return str(obj.token)[:8] + '...'
    token_short.short_description = 'Token'

    def is_valid_display(self, obj):
        if obj.is_valid:
            return format_html('<span style="color:green;">✓ Valid</span>')
        return format_html('<span style="color:red;">✗ Invalid</span>')
    is_valid_display.short_description = 'Status'


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'expires_at', 'used']
    list_filter = ['used']
    search_fields = ['user__email']
    readonly_fields = ['token', 'created_at', 'expires_at']
    ordering = ['-created_at']


@admin.register(LoginAuditLog)
class LoginAuditLogAdmin(admin.ModelAdmin):
    list_display = ['email_attempted', 'outcome', 'failure_reason', 'user', 'ip_address', 'created_at']
    list_filter = ['outcome', 'failure_reason']
    search_fields = ['email_attempted', 'ip_address']
    readonly_fields = ['user', 'email_attempted', 'outcome', 'failure_reason', 'ip_address', 'user_agent', 'created_at']
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False