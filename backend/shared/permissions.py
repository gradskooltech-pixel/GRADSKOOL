"""
GRADSKOOL — Shared: Custom Permissions
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsInstructor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('instructor', 'admin')


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'student'


class IsVerified(BasePermission):
    """Requires authenticated + email verified."""
    message = 'Please verify your email address to access this resource.'

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_verified
