"""
GRADSKOOL — Courses Admin

Full admin for:
  Exam → ExamStat (inline)
  Course → CurriculumModule → CurriculumTopic (nested inline)
  Instructor
  PricingPlan → PlanFeature (inline)
  Testimonial
  ExamFAQ
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Exam, ExamStat,
    Instructor, Course, CourseInstructor,
    CurriculumModule, CurriculumTopic,
    PricingPlan, PlanFeature,
    Testimonial, ExamFAQ,
)


# ── INLINES ───────────────────────────────────────────────────────────────────

class ExamStatInline(admin.TabularInline):
    model = ExamStat
    extra = 3
    fields = ['value', 'label', 'sort_order']


class ExamFAQInline(admin.StackedInline):
    model = ExamFAQ
    extra = 2
    fields = ['question', 'answer', 'sort_order']
    ordering = ['sort_order']


class PlanFeatureInline(admin.TabularInline):
    model = PlanFeature
    extra = 4
    fields = ['text', 'is_included', 'sort_order']


class CurriculumTopicInline(admin.TabularInline):
    model = CurriculumTopic
    extra = 4
    fields = ['title', 'sort_order']


class CurriculumModuleInline(admin.StackedInline):
    model = CurriculumModule
    extra = 2
    fields = ['number', 'title', 'short_title', 'description', 'duration_note', 'sort_order']
    ordering = ['sort_order', 'number']


class CourseInstructorInline(admin.TabularInline):
    model = CourseInstructor
    extra = 2
    autocomplete_fields = ['instructor']


# ── EXAM ─────────────────────────────────────────────────────────────────────

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display  = ['name', 'short_name', 'category', 'is_active', 'is_featured',
                     'exam_date', 'sort_order']
    list_filter   = ['category', 'is_active', 'is_featured']
    search_fields = ['name', 'short_name', 'slug']
    prepopulated_fields = {'slug': ('short_name',)}
    ordering      = ['sort_order', 'name']
    inlines       = [ExamStatInline, ExamFAQInline]

    fieldsets = (
        ('Identity', {'fields': ('name', 'short_name', 'slug', 'category')}),
        ('Content',  {'fields': ('tagline', 'description', 'exam_date')}),
        ('Visibility', {'fields': ('is_active', 'is_featured', 'sort_order')}),
        ('SEO', {'fields': ('meta_title', 'meta_desc', 'canonical_url', 'og_image_url'),
                 'classes': ('collapse',)}),
    )


# ── COURSE ────────────────────────────────────────────────────────────────────

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display  = ['title', 'exam', 'cohort_label', 'status',
                     'seats_filled', 'batch_size', 'seats_available_display',
                     'start_date']
    list_filter   = ['status', 'exam']
    search_fields = ['title', 'exam__name']
    autocomplete_fields = ['exam']
    inlines       = [CourseInstructorInline, CurriculumModuleInline]

    def seats_available_display(self, obj):
        available = obj.seats_available
        color = 'green' if available > 5 else ('orange' if available > 0 else 'red')
        return format_html(
            '<span style="color:{}">{} left</span>', color, available
        )
    seats_available_display.short_description = 'Seats'


# ── CURRICULUM MODULE ─────────────────────────────────────────────────────────

@admin.register(CurriculumModule)
class CurriculumModuleAdmin(admin.ModelAdmin):
    list_display  = ['number', 'title', 'course', 'sort_order']
    list_filter   = ['course__exam']
    search_fields = ['title', 'course__title']
    inlines       = [CurriculumTopicInline]


# ── INSTRUCTOR ────────────────────────────────────────────────────────────────

@admin.register(Instructor)
class InstructorAdmin(admin.ModelAdmin):
    list_display  = ['name', 'title', 'is_lead', 'is_active', 'sort_order']
    list_filter   = ['is_lead', 'is_active']
    search_fields = ['name', 'title']
    prepopulated_fields = {'slug': ('name',)}


# ── PRICING PLAN ──────────────────────────────────────────────────────────────

@admin.register(PricingPlan)
class PricingPlanAdmin(admin.ModelAdmin):
    list_display  = ['name', 'exam', 'price_inr', 'is_featured', 'is_active',
                     'includes_live', 'includes_mocks', 'sort_order']
    list_filter   = ['exam', 'is_featured', 'is_active', 'includes_live', 'includes_mocks']
    search_fields = ['name', 'exam__name']
    autocomplete_fields = ['exam']
    inlines       = [PlanFeatureInline]

    fieldsets = (
        ('Identity',   {'fields': ('exam', 'name', 'slug', 'description')}),
        ('Pricing',    {'fields': ('price_inr', 'original_price', 'badge_text')}),
        ('Display',    {'fields': ('is_featured', 'is_active', 'sort_order')}),
        ('Access Flags', {'fields': (
            'includes_live', 'includes_mocks', 'includes_books',
            'includes_gdpi', 'includes_recordings', 'mock_exams_covered',
        )}),
        ('Razorpay',   {'fields': ('razorpay_sku',)}),
    )


# ── TESTIMONIAL ───────────────────────────────────────────────────────────────

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display  = ['student_name', 'detail', 'exam', 'rating', 'is_featured', 'is_active']
    list_filter   = ['exam', 'rating', 'is_featured', 'is_active']
    search_fields = ['student_name', 'detail', 'text']
