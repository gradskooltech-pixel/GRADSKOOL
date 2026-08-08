"""
GRADSKOOL — Courses Views

GET  /api/v1/courses/exams/                  → All active exams (list)
GET  /api/v1/courses/exams/{slug}/           → Exam detail (full page payload)
GET  /api/v1/courses/exams/{slug}/plans/     → Pricing plans for an exam
GET  /api/v1/courses/instructors/            → All active instructors
GET  /api/v1/courses/instructors/{slug}/     → Single instructor detail
GET  /api/v1/courses/testimonials/           → All testimonials (filter ?exam=cat)
GET  /api/v1/courses/homepage/               → Homepage data (featured exams + global stats)
"""
import logging
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Exam, Instructor, PricingPlan, Testimonial
from .serializers import (
    ExamListSerializer,
    ExamDetailSerializer,
    InstructorSerializer,
    PricingPlanSerializer,
    TestimonialSerializer,
)

logger = logging.getLogger(__name__)

CACHE_5_MIN  = 60 * 5
CACHE_15_MIN = 60 * 15
CACHE_1_HOUR = 60 * 60


# ── EXAM LIST ─────────────────────────────────────────────────────────────────

class ExamListView(generics.ListAPIView):
    """
    GET /api/v1/courses/exams/

    Returns all active exams, grouped by category.
    Cached for 15 minutes — exam list rarely changes.

    Query params:
      ?category=mba_india|mba_abroad|ug|bundle
      ?featured=true
    """
    serializer_class = ExamListSerializer
    permission_classes = [AllowAny]

    @method_decorator(cache_page(CACHE_15_MIN))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = (
            Exam.objects
                .filter(is_active=True)
                .prefetch_related('stats')
                .order_by('sort_order', 'name')
        )
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            qs = qs.filter(is_featured=True)

        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Group by category for convenience
        grouped = {}
        for exam in serializer.data:
            cat = exam['category']
            grouped.setdefault(cat, []).append(exam)

        return Response({
            'exams': serializer.data,
            'grouped': grouped,
            'total': queryset.count(),
        })


# ── EXAM DETAIL ───────────────────────────────────────────────────────────────

class ExamDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/courses/exams/{slug}/

    Full exam page payload — curriculum, instructors, plans,
    testimonials, FAQs, stats, seat count.

    Cached for 5 minutes — seat count changes during enrollment.
    """
    serializer_class = ExamDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    @method_decorator(cache_page(CACHE_5_MIN))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return (
            Exam.objects
                .filter(is_active=True)
                .prefetch_related(
                    'stats', 'plans__features',
                    'testimonials', 'global_faqs',
                    'courses__modules__topics',
                    'courses__instructors',
                )
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})
        return Response(serializer.data)


# ── EXAM PLANS ────────────────────────────────────────────────────────────────

class ExamPlansView(generics.ListAPIView):
    """
    GET /api/v1/courses/exams/{slug}/plans/

    Slim endpoint used by the checkout modal — just the plans.
    """
    serializer_class = PricingPlanSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        slug = self.kwargs['slug']
        return (
            PricingPlan.objects
                .filter(exam__slug=slug, exam__is_active=True, is_active=True)
                .prefetch_related('features')
                .order_by('sort_order')
        )


# ── INSTRUCTORS ───────────────────────────────────────────────────────────────

class InstructorListView(generics.ListAPIView):
    """
    GET /api/v1/courses/instructors/

    All active instructors — used on About page and course pages.
    """
    serializer_class = InstructorSerializer
    permission_classes = [AllowAny]

    @method_decorator(cache_page(CACHE_1_HOUR))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return Instructor.objects.filter(is_active=True).order_by('-is_lead', 'sort_order')


class InstructorDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/courses/instructors/{slug}/
    """
    serializer_class = InstructorSerializer
    permission_classes = [AllowAny]
    queryset = Instructor.objects.filter(is_active=True)
    lookup_field = 'slug'


# ── TESTIMONIALS ──────────────────────────────────────────────────────────────

class TestimonialListView(generics.ListAPIView):
    """
    GET /api/v1/courses/testimonials/
    GET /api/v1/courses/testimonials/?exam=cat
    GET /api/v1/courses/testimonials/?featured=true
    """
    serializer_class = TestimonialSerializer
    permission_classes = [AllowAny]

    @method_decorator(cache_page(CACHE_15_MIN))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = Testimonial.objects.filter(is_active=True).order_by('-is_featured', 'sort_order')
        exam_slug = self.request.query_params.get('exam')
        if exam_slug:
            qs = qs.filter(exam__slug=exam_slug)
        if self.request.query_params.get('featured') == 'true':
            qs = qs.filter(is_featured=True)
        return qs


# ── HOMEPAGE ──────────────────────────────────────────────────────────────────

class HomepageDataView(APIView):
    """
    GET /api/v1/courses/homepage/

    Aggregated payload for the homepage:
      - Featured exams (by category)
      - Global platform stats
      - Featured testimonials
      - Featured instructors (lead only)

    Cached for 15 minutes.
    """
    permission_classes = [AllowAny]

    @method_decorator(cache_page(CACHE_15_MIN))
    def get(self, request):
        # Featured exams
        exams = (
            Exam.objects
                .filter(is_active=True, is_featured=True)
                .prefetch_related('stats')
                .order_by('sort_order')
        )

        # Featured testimonials
        testimonials = (
            Testimonial.objects
                .filter(is_active=True, is_featured=True)
                .order_by('sort_order')[:6]
        )

        # Lead instructors
        instructors = Instructor.objects.filter(is_active=True, is_lead=True).order_by('sort_order')

        return Response({
            'exams': ExamListSerializer(exams, many=True).data,
            'testimonials': TestimonialSerializer(testimonials, many=True).data,
            'instructors': InstructorSerializer(instructors, many=True).data,
            'platform_stats': PLATFORM_STATS,
        })


# Hard-coded global platform stats (matches index.html schema)
PLATFORM_STATS = [
    {'value': '5,000+', 'label': 'IIM & top B-school calls'},
    {'value': '100K+',  'label': 'Students mentored'},
    {'value': '4.9★',   'label': 'Average rating · 347 reviews'},
    {'value': '27',     'label': 'Students per cohort'},
]


# ── COHORT VIEWS ──────────────────────────────────────────────────────────────

class CohortListView(APIView):
    """
    GET /api/v1/courses/cohorts/           — admin only (full list)
    GET /api/v1/courses/cohorts/?exam=cat  — public (filtered, non-closed)
    """
    permission_classes = [AllowAny]

    def get(self, request):
        from .models import Course
        qs = Course.objects.select_related('exam').order_by('-start_date')

        # Public can filter by exam slug — shows non-closed cohorts
        exam_slug = request.query_params.get('exam')
        if exam_slug:
            qs = qs.filter(exam__slug=exam_slug).exclude(status='closed')
            return Response([_cohort_data(c) for c in qs])

        # Full list — admin only
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'error': 'Forbidden'}, status=403)

        return Response([_cohort_data(c) for c in qs])

    def post(self, request):
        """Create a new cohort."""
        if not request.user.is_staff:
            return Response({'error': 'Forbidden'}, status=403)

        from .models import Course

        exam_slug = request.data.get('exam_slug')
        try:
            exam = Exam.objects.get(slug=exam_slug)
        except Exam.DoesNotExist:
            return Response({'error': f'Exam not found: {exam_slug}'}, status=404)

        cohort = Course.objects.create(
            exam        = exam,
            title       = request.data.get('title', f'{exam.name} Cohort'),
            cohort_label= request.data.get('cohort_label', ''),
            batch_size  = request.data.get('batch_size', exam.cohort_size),
            start_date  = request.data.get('start_date') or None,
            end_date    = request.data.get('end_date') or None,
            status      = request.data.get('status', 'upcoming'),
            is_open     = request.data.get('is_open', False),
            description = request.data.get('description', ''),
        )
        return Response(_cohort_data(cohort), status=201)


class CohortDetailView(APIView):
    """
    GET  /api/v1/courses/cohorts/{slug}/  — public
    PATCH /api/v1/courses/cohorts/{slug}/ — admin only
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        from .models import Course
        try:
            cohort = Course.objects.select_related('exam').get(slug=slug)
        except Course.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response(_cohort_data(cohort, full=True))

    def patch(self, request, slug):
        if not request.user.is_staff:
            return Response({'error': 'Forbidden'}, status=403)

        from .models import Course
        try:
            cohort = Course.objects.select_related('exam').get(slug=slug)
        except Course.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        fields = ['title', 'cohort_label', 'batch_size',
                  'start_date', 'end_date', 'status', 'is_open', 'description']
        for field in fields:
            if field in request.data:
                val = request.data[field]
                if val == '': val = None
                setattr(cohort, field, val)

        # If marking as open, close all other cohorts for same exam
        if request.data.get('is_open'):
            Course.objects.filter(exam=cohort.exam, is_open=True).exclude(pk=cohort.pk).update(is_open=False)

        cohort.save()
        return Response(_cohort_data(cohort))


def _cohort_data(cohort, full=False):
    from apps.enrollments.models import Enrollment
    enrolled = cohort.enrolled_students.count()
    remaining = max(0, cohort.batch_size - enrolled)

    data = {
        'id':           cohort.id,
        'slug':         cohort.slug,
        'url':          f'/courses/{cohort.exam.slug}/cohorts/{cohort.slug}',
        'title':        cohort.title,
        'cohort_label': cohort.cohort_label,
        'exam_slug':    cohort.exam.slug,
        'exam_name':    cohort.exam.name,
        'exam_short':   cohort.exam.short_name,
        'batch_size':   cohort.batch_size,
        'enrolled':     enrolled,
        'remaining':    remaining,
        'is_full':      remaining == 0,
        'status':       cohort.status,
        'is_open':      cohort.is_open,
        'start_date':   str(cohort.start_date) if cohort.start_date else None,
        'end_date':     str(cohort.end_date) if cohort.end_date else None,
        'description':  cohort.description,
    }

    if full:
        # Include exam detail for the public cohort page
        from .serializers import ExamDetailSerializer
        try:
            data['exam_detail'] = ExamDetailSerializer(
                cohort.exam, context={'active_course': cohort}
            ).data
        except Exception:
            data['exam_detail'] = None

    return data
