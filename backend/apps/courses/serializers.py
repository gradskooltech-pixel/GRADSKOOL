"""
GRADSKOOL — Courses Serializers

Layered serializers for the catalogue API:

  ExamListSerializer      → Lightweight list card (homepage, courses index)
  ExamDetailSerializer    → Full page payload (exam landing page)
  InstructorSerializer    → Faculty card
  CurriculumTopicSerializer
  CurriculumModuleSerializer
  PlanFeatureSerializer
  PricingPlanSerializer   → Plan card with features
  TestimonialSerializer
  ExamFAQSerializer
  ExamStatSerializer
"""
from rest_framework import serializers
from .models import (
    Exam, ExamStat,
    Instructor, Course, CourseInstructor,
    CurriculumModule, CurriculumTopic,
    PricingPlan, PlanFeature,
    Testimonial, ExamFAQ,
)


# ── BUILDING BLOCKS ───────────────────────────────────────────────────────────

class ExamStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamStat
        fields = ['value', 'label']


class InstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Instructor
        fields = [
            'id', 'name', 'slug', 'title', 'bio',
            'credentials', 'percentile',
            'photo_url', 'linkedin_url', 'youtube_url',
            'is_lead',
        ]


class CurriculumTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurriculumTopic
        fields = ['id', 'title', 'sort_order']


class CurriculumModuleSerializer(serializers.ModelSerializer):
    topics = CurriculumTopicSerializer(many=True, read_only=True)

    class Meta:
        model = CurriculumModule
        fields = [
            'id', 'number', 'title', 'short_title',
            'description', 'duration_note', 'topics',
        ]


class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        fields = ['text', 'is_included']


class PricingPlanSerializer(serializers.ModelSerializer):
    features    = PlanFeatureSerializer(many=True, read_only=True)
    discount_pct = serializers.ReadOnlyField()
    gst_amount   = serializers.ReadOnlyField()
    total_with_gst = serializers.ReadOnlyField()

    class Meta:
        model = PricingPlan
        fields = [
            'id', 'name', 'slug', 'description',
            'price_inr', 'original_price',
            'badge_text', 'is_featured',
            'includes_live', 'includes_mocks', 'includes_books',
            'includes_gdpi', 'includes_recordings',
            'mock_exams_covered',
            'razorpay_sku',
            'features',
            'discount_pct', 'gst_amount', 'total_with_gst',
        ]


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = [
            'id', 'student_name', 'detail', 'text',
            'rating', 'photo_url',
        ]


class ExamFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamFAQ
        fields = ['id', 'question', 'answer']


# ── EXAM LIST (lightweight — used on homepage & /courses) ────────────────────

class ExamListSerializer(serializers.ModelSerializer):
    stats           = ExamStatSerializer(many=True, read_only=True)
    seats_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'slug', 'name', 'short_name', 'tagline',
            'category', 'og_image_url', 'is_featured',
            'stats', 'seats_remaining',
        ]

    def get_seats_remaining(self, obj):
        from apps.enrollments.models import Enrollment
        active = Enrollment.objects.filter(
            plan__exam=obj, status='active'
        ).count()
        return max(0, obj.cohort_size - active)


# ── EXAM DETAIL (full page payload) ──────────────────────────────────────────

# ── COURSE SUMMARY (cohorts under an exam — dates, status, open/closed) ────────

class CourseSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight — just what a public exam page needs to show cohort dates
    and enrollment status without pulling in the full curriculum/instructor
    payload (that's what CohortDetailView is for, if a page needs more).
    """
    seats_available = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = [
            'id', 'slug', 'title', 'cohort_label',
            'start_date', 'end_date', 'status', 'is_open',
            'batch_size', 'seats_filled', 'seats_available',
        ]


class ExamDetailSerializer(serializers.ModelSerializer):
    """
    Everything needed to render a single exam landing page.
    Includes active course curriculum, instructors, plans,
    testimonials, FAQs, stats — all in one request.
    """
    stats        = ExamStatSerializer(many=True, read_only=True)
    plans        = serializers.SerializerMethodField()
    testimonials = serializers.SerializerMethodField()
    faqs         = ExamFAQSerializer(many=True, read_only=True)
    curriculum   = serializers.SerializerMethodField()
    instructors  = serializers.SerializerMethodField()
    seats_available = serializers.SerializerMethodField()
    cohort_label = serializers.SerializerMethodField()
    courses      = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'slug', 'name', 'short_name', 'tagline', 'description',
            'category', 'exam_date',
            'og_image_url', 'meta_title', 'meta_desc', 'canonical_url',
            'stats',
            'plans',
            'curriculum',
            'instructors',
            'testimonials',
            'faqs',
            'seats_available',
            'cohort_label',
            'courses',
        ]

    def _get_active_course(self, obj):
        """Cache the active course on the serializer context."""
        if 'active_course' not in self.context:
            self.context['active_course'] = (
                obj.courses.filter(status='active')
                .prefetch_related('modules__topics', 'instructors')
                .first()
            )
        return self.context['active_course']

    def get_plans(self, obj):
        plans = (
            obj.plans
            .filter(is_active=True)
            .prefetch_related('features')
            .order_by('sort_order')
        )
        return PricingPlanSerializer(plans, many=True).data

    def get_curriculum(self, obj):
        course = self._get_active_course(obj)
        if not course:
            return []
        modules = course.modules.prefetch_related('topics').order_by('sort_order', 'number')
        return CurriculumModuleSerializer(modules, many=True).data

    def get_instructors(self, obj):
        course = self._get_active_course(obj)
        if course:
            instructors = course.instructors.filter(is_active=True).order_by(
                'courseinstructor__sort_order'
            )
        else:
            instructors = Instructor.objects.filter(is_lead=True, is_active=True)
        return InstructorSerializer(instructors, many=True).data

    def get_testimonials(self, obj):
        qs = (
            obj.testimonials
            .filter(is_active=True)
            .order_by('-is_featured', 'sort_order')[:6]
        )
        return TestimonialSerializer(qs, many=True).data

    def get_seats_available(self, obj):
        from apps.enrollments.models import Enrollment
        active = Enrollment.objects.filter(
            plan__exam=obj, status='active'
        ).count()
        remaining = max(0, obj.cohort_size - active)
        return {
            'cohort_size':  obj.cohort_size,
            'enrolled':     active,
            'remaining':    remaining,
            'is_full':      remaining == 0,
        }

    def get_cohort_label(self, obj):
        course = self._get_active_course(obj)
        return course.cohort_label if course else None

    def get_courses(self, obj):
        """All cohorts for this exam (not just the active one) — lets a page
        find e.g. a specific 'CAThlete' cohort by title/slug even if it isn't
        the currently-active one."""
        courses = obj.courses.all().order_by('-start_date')
        return CourseSummarySerializer(courses, many=True).data