"""
GRADSKOOL — Enrollments Serializers + Views

GET  /api/v1/enrollments/              → Current user's enrollments
GET  /api/v1/enrollments/access/       → Flat access summary (used by frontend)
GET  /api/v1/enrollments/access/{exam_slug}/ → Access for a specific exam
"""
from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.serializers import PricingPlanSerializer
from apps.courses.models import Exam
from .models import Enrollment, CourseAccess
from .services import get_user_access_summary, check_access


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    plan_name  = serializers.CharField(source='plan.name', read_only=True)
    exam_slug  = serializers.CharField(source='plan.exam.slug', read_only=True)
    exam_name  = serializers.CharField(source='plan.exam.name', read_only=True)
    price_paid = serializers.SerializerMethodField()

    def get_price_paid(self, obj):
        if obj.order:
            return str(obj.order.amount_inr)
        return None
    enrolled_at = serializers.DateTimeField(format='%Y-%m-%d', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'plan_name', 'exam_slug', 'exam_name',
            'price_paid', 'status', 'enrolled_at', 'expires_at',
        ]


class CourseAccessSerializer(serializers.ModelSerializer):
    exam_slug = serializers.CharField(source='exam.slug', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    exam_og_image = serializers.URLField(source='exam.og_image_url', read_only=True)

    class Meta:
        model = CourseAccess
        fields = [
            'exam_slug', 'exam_name', 'exam_og_image',
            'can_attend_live', 'can_watch_recordings',
            'can_take_mocks', 'can_download_books', 'can_access_gdpi',
            'mock_exams_unlocked', 'updated_at',
        ]


# ── VIEWS ─────────────────────────────────────────────────────────────────────

class EnrollmentListView(generics.ListAPIView):
    """
    GET /api/v1/enrollments/
    Returns all enrollments for the authenticated user.
    """
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Enrollment.objects
            .filter(user=self.request.user)
            .select_related('plan__exam', 'order')
            .order_by('-enrolled_at')
        )


class AccessSummaryView(APIView):
    """
    GET /api/v1/enrollments/access/
    Returns all CourseAccess records for the user.
    Used by the dashboard to build the "My Courses" grid.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        accesses = get_user_access_summary(request.user)
        return Response(CourseAccessSerializer(accesses, many=True).data)


class ExamAccessView(APIView):
    """
    GET /api/v1/enrollments/access/{exam_slug}/
    Returns access flags for one specific exam.
    Used by the exam page to show/hide enrol CTAs.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug):
        try:
            access = CourseAccess.objects.get(user=request.user, exam__slug=exam_slug)
            return Response(CourseAccessSerializer(access).data)
        except CourseAccess.DoesNotExist:
            return Response({
                'exam_slug': exam_slug,
                'can_attend_live': False,
                'can_watch_recordings': False,
                'can_take_mocks': False,
                'can_download_books': False,
                'can_access_gdpi': False,
                'mock_exams_unlocked': [],
            })


class StudentProgrammeSettingsView(APIView):
    """
    GET /api/v1/enrollments/programme-settings/
    Returns per-tab visibility for each of the student's enrollments,
    based on the ProgrammeSettings for their plan.
    Called by the dashboard and learning portal.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.courses.models import ProgrammeSettings

        enrollments = Enrollment.objects.filter(
            user=request.user, status='active'
        ).select_related('plan__exam', 'plan__settings')

        result = []
        for e in enrollments:
            try:
                s = e.plan.settings
                tabs = {
                    'show_videos':           s.show_videos,
                    'show_practice_quiz':    s.show_practice_quiz,
                    'show_cheat_sheets':     s.show_cheat_sheets,
                    'show_live':             s.show_live,
                    'show_mocks':            s.show_mocks,
                    'show_books':            s.show_books,
                    'show_gdpi':             s.show_gdpi,
                    'mocks_redirect_url':    s.mocks_redirect_url,
                    'continue_learning_url': s.continue_learning_url,
                    'cta_label':             s.cta_label,
                    'card_note':             s.card_note,
                }
            except Exception:
                # No settings yet — show safe defaults
                tabs = {
                    'show_videos':           True,
                    'show_practice_quiz':    True,
                    'show_cheat_sheets':     True,
                    'show_live':             False,
                    'show_mocks':            False,
                    'show_books':            False,
                    'show_gdpi':             False,
                    'mocks_redirect_url':    '',
                    'continue_learning_url': '',
                    'cta_label':             '',
                    'card_note':             '',
                }

            result.append({
                'enrollment_id': e.id,
                'exam_slug':     e.plan.exam.slug,
                'exam_name':     e.plan.exam.name,
                'plan_name':     e.plan.name,
                'plan_slug':     e.plan.slug,
                **tabs,
            })

        return Response(result)

