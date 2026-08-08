"""
GRADSKOOL — Enrollment Permission Mixins

Reusable DRF permission classes and view mixins that
gate access to enrolled content.

Usage in views:
    class VideoListView(RequiresRecordingAccess, generics.ListAPIView):
        ...

    class MockTestView(RequiresMockAccess, generics.RetrieveAPIView):
        ...
"""
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework import status
from .services import check_access


# ── PERMISSION CLASSES ────────────────────────────────────────────────────────

class HasLiveAccess(BasePermission):
    """User must have an active enrollment with live session access."""
    message = 'Live session access requires an active live enrolment.'

    def has_permission(self, request, view):
        exam_slug = view.kwargs.get('exam_slug') or view.kwargs.get('slug')
        return check_access(request.user, exam_slug, 'can_attend_live')


class HasRecordingAccess(BasePermission):
    """User must have recording access (included with any live plan)."""
    message = 'Recording access requires an active enrolment.'

    def has_permission(self, request, view):
        exam_slug = view.kwargs.get('exam_slug') or view.kwargs.get('slug')
        return check_access(request.user, exam_slug, 'can_watch_recordings')


class HasMockAccess(BasePermission):
    """User must have mock access for this exam."""
    message = 'Mock test access requires an active mocks enrolment.'

    def has_permission(self, request, view):
        exam_slug = view.kwargs.get('exam_slug') or view.kwargs.get('slug')
        return check_access(request.user, exam_slug, 'can_take_mocks')


class HasBookAccess(BasePermission):
    """User must have book download access."""
    message = 'Book access requires an active enrolment with books.'

    def has_permission(self, request, view):
        exam_slug = view.kwargs.get('exam_slug') or view.kwargs.get('slug')
        return check_access(request.user, exam_slug, 'can_download_books')


# ── VIEW-LEVEL MIXINS ─────────────────────────────────────────────────────────

class AccessGateMixin:
    """
    Base mixin. Subclasses set `required_access_flag`.
    Provides check_exam_access() helper for use in get/post/etc.
    """
    required_access_flag = None

    def check_exam_access(self, request, exam_slug: str) -> bool:
        if not self.required_access_flag:
            return True
        return check_access(request.user, exam_slug, self.required_access_flag)

    def access_denied_response(self, flag: str):
        messages = {
            'can_watch_recordings': 'Purchase a course to access recorded lectures.',
            'can_attend_live':      'Purchase a live cohort plan to attend sessions.',
            'can_take_mocks':       'Purchase a mock test plan to access this test.',
            'can_download_books':   'Purchase a plan with books to download.',
            'can_access_gdpi':      'Purchase a GDPI plan to access interview prep.',
        }
        return Response(
            {
                'error': {
                    'code': 'access_denied',
                    'message': messages.get(flag, 'Access denied.'),
                    'upgrade_url': '/courses',
                }
            },
            status=status.HTTP_403_FORBIDDEN
        )
