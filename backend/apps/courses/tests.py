"""
GRADSKOOL — Courses Tests

Coverage:
  - ExamListView (all, by category, featured)
  - ExamDetailView (full payload, curriculum, plans, instructors)
  - ExamPlansView
  - InstructorListView / DetailView
  - TestimonialListView (all, by exam, featured)
  - HomepageDataView
  - Model methods (seats_available, discount_pct, gst_amount)

Run: python manage.py test apps.courses --settings=config.settings.development
"""
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import (
    Exam, ExamStat, Instructor, Course, CourseInstructor,
    CurriculumModule, CurriculumTopic,
    PricingPlan, PlanFeature, Testimonial, ExamFAQ,
)


# ── FACTORIES ─────────────────────────────────────────────────────────────────

def make_exam(slug='cat', name='CAT 2026', category='mba_india', **kwargs):
    return Exam.objects.create(
        slug=slug, name=name, short_name=slug.upper(),
        category=category, is_active=True, **kwargs
    )


def make_instructor(**kwargs):
    defaults = dict(
        name='ALP Sir', slug='alp-sir',
        title='Founder', bio='Bio text',
        is_lead=True, is_active=True,
    )
    defaults.update(kwargs)
    return Instructor.objects.create(**defaults)


def make_course(exam, status='active', **kwargs):
    return Course.objects.create(
        exam=exam, title=f'{exam.name} Cohort',
        batch_size=27, seats_filled=10, status=status, **kwargs
    )


def make_plan(exam, name='Live + Mocks', price=15999, **kwargs):
    slug = kwargs.pop('slug', 'live-mocks')
    return PricingPlan.objects.create(
        exam=exam, name=name, slug=slug,
        price_inr=Decimal(str(price)),
        razorpay_sku=f'{exam.slug}-{slug}',
        is_active=True, **kwargs
    )


# ── EXAM LIST ─────────────────────────────────────────────────────────────────

class ExamListTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('courses:exam-list')
        self.cat = make_exam('cat', 'CAT 2026', 'mba_india', is_featured=True, sort_order=1)
        self.gmat = make_exam('gmat', 'GMAT Focus', 'mba_abroad', sort_order=2)
        self.inactive = make_exam('old', 'Old Exam', 'mba_india', is_active=False)

    def test_returns_only_active_exams(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        slugs = [e['slug'] for e in res.data['exams']]
        self.assertIn('cat', slugs)
        self.assertIn('gmat', slugs)
        self.assertNotIn('old', slugs)

    def test_filter_by_category(self):
        res = self.client.get(self.url, {'category': 'mba_india'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        for exam in res.data['exams']:
            self.assertEqual(exam['category'], 'mba_india')

    def test_filter_featured(self):
        res = self.client.get(self.url, {'featured': 'true'})
        for exam in res.data['exams']:
            self.assertTrue(exam['is_featured'])

    def test_response_has_grouped_key(self):
        res = self.client.get(self.url)
        self.assertIn('grouped', res.data)
        self.assertIn('mba_india', res.data['grouped'])
        self.assertIn('mba_abroad', res.data['grouped'])

    def test_no_auth_required(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)


# ── EXAM DETAIL ───────────────────────────────────────────────────────────────

class ExamDetailTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.exam = make_exam('cat', 'CAT 2026')
        ExamStat.objects.create(exam=self.exam, value='30', label='Full Mocks', sort_order=0)
        self.plan = make_plan(self.exam)
        PlanFeature.objects.create(plan=self.plan, text='Live sessions', is_included=True, sort_order=0)
        self.instructor = make_instructor()
        self.course = make_course(self.exam, status='active')
        CourseInstructor.objects.create(course=self.course, instructor=self.instructor)
        module = CurriculumModule.objects.create(
            course=self.course, number=1, title='VARC', sort_order=0
        )
        CurriculumTopic.objects.create(module=module, title='Reading Comprehension', sort_order=0)
        Testimonial.objects.create(
            exam=self.exam, student_name='Keshav', detail='IIM-A', text='Great!',
            is_active=True
        )
        ExamFAQ.objects.create(exam=self.exam, question='Q?', answer='A.', sort_order=0)
        self.url = reverse('courses:exam-detail', kwargs={'slug': 'cat'})

    def test_returns_200(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_returns_full_payload_keys(self):
        res = self.client.get(self.url)
        for key in ('slug', 'name', 'plans', 'curriculum', 'instructors',
                    'testimonials', 'faqs', 'stats', 'seats_available'):
            self.assertIn(key, res.data, f'Missing key: {key}')

    def test_plans_include_features(self):
        res = self.client.get(self.url)
        plans = res.data['plans']
        self.assertTrue(len(plans) > 0)
        self.assertIn('features', plans[0])
        self.assertTrue(len(plans[0]['features']) > 0)

    def test_curriculum_includes_topics(self):
        res = self.client.get(self.url)
        modules = res.data['curriculum']
        self.assertTrue(len(modules) > 0)
        self.assertIn('topics', modules[0])

    def test_seats_available_calculated(self):
        res = self.client.get(self.url)
        # batch_size=27, seats_filled=10 → 17
        self.assertEqual(res.data['seats_available'], 17)

    def test_404_for_unknown_slug(self):
        url = reverse('courses:exam-detail', kwargs={'slug': 'nonexistent'})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_404_for_inactive_exam(self):
        make_exam('inactive', 'Inactive', is_active=False)
        url = reverse('courses:exam-detail', kwargs={'slug': 'inactive'})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ── EXAM PLANS ────────────────────────────────────────────────────────────────

class ExamPlansTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.exam = make_exam()
        make_plan(self.exam, slug='live-mocks', price=15999)
        make_plan(self.exam, name='Mocks Only', slug='mocks-only', price=2999)

    def test_returns_plans(self):
        url = reverse('courses:exam-plans', kwargs={'slug': 'cat'})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_returns_gst_amounts(self):
        url = reverse('courses:exam-plans', kwargs={'slug': 'cat'})
        res = self.client.get(url)
        for plan in res.data:
            self.assertIn('gst_amount', plan)
            self.assertIn('total_with_gst', plan)


# ── INSTRUCTORS ───────────────────────────────────────────────────────────────

class InstructorTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.alp = make_instructor(name='ALP', slug='alp', is_lead=True)
        make_instructor(name='Other', slug='other', is_lead=False)

    def test_list_instructors(self):
        url = reverse('courses:instructor-list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_lead_instructor_first(self):
        url = reverse('courses:instructor-list')
        res = self.client.get(url)
        self.assertTrue(res.data[0]['is_lead'])

    def test_detail(self):
        url = reverse('courses:instructor-detail', kwargs={'slug': 'alp'})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['name'], 'ALP')


# ── TESTIMONIALS ──────────────────────────────────────────────────────────────

class TestimonialTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.cat = make_exam('cat')
        self.gre = make_exam('gre', 'GRE', 'mba_abroad')
        Testimonial.objects.create(
            exam=self.cat, student_name='A', detail='IIM', text='Great!',
            is_active=True, is_featured=True
        )
        Testimonial.objects.create(
            exam=self.gre, student_name='B', detail='MIT', text='Excellent!',
            is_active=True
        )
        Testimonial.objects.create(
            exam=self.cat, student_name='C', detail='FMS', text='Good',
            is_active=False   # Inactive — should not appear
        )

    def test_returns_only_active(self):
        url = reverse('courses:testimonial-list')
        res = self.client.get(url)
        names = [t['student_name'] for t in res.data]
        self.assertIn('A', names)
        self.assertIn('B', names)
        self.assertNotIn('C', names)

    def test_filter_by_exam(self):
        url = reverse('courses:testimonial-list')
        res = self.client.get(url, {'exam': 'cat'})
        for t in res.data:
            self.assertEqual(t['student_name'], 'A')

    def test_filter_featured(self):
        url = reverse('courses:testimonial-list')
        res = self.client.get(url, {'featured': 'true'})
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['student_name'], 'A')


# ── HOMEPAGE ──────────────────────────────────────────────────────────────────

class HomepageTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        make_exam('cat', is_featured=True)
        make_exam('gmat', 'GMAT', 'mba_abroad', is_featured=True)
        make_instructor()

    def test_homepage_data(self):
        url = reverse('courses:homepage')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('exams', res.data)
        self.assertIn('testimonials', res.data)
        self.assertIn('instructors', res.data)
        self.assertIn('platform_stats', res.data)

    def test_only_featured_exams_in_homepage(self):
        make_exam('xat', 'XAT', is_featured=False)
        url = reverse('courses:homepage')
        res = self.client.get(url)
        for exam in res.data['exams']:
            self.assertTrue(exam['is_featured'])


# ── MODEL UNIT TESTS ──────────────────────────────────────────────────────────

class PricingPlanModelTests(TestCase):

    def setUp(self):
        self.exam = make_exam()

    def test_gst_calculation(self):
        plan = make_plan(self.exam, price=15999)
        self.assertEqual(plan.gst_amount, Decimal('2879.82'))

    def test_total_with_gst(self):
        plan = make_plan(self.exam, price=15999)
        self.assertEqual(plan.total_with_gst, Decimal('18878.82'))

    def test_discount_pct_with_original_price(self):
        plan = make_plan(self.exam, price=15999)
        plan.original_price = Decimal('19999')
        plan.save()
        self.assertEqual(plan.discount_pct, 20)

    def test_discount_pct_without_original_price(self):
        plan = make_plan(self.exam, price=15999)
        self.assertIsNone(plan.discount_pct)


class CourseModelTests(TestCase):

    def test_seats_available(self):
        exam = make_exam()
        course = make_course(exam)
        course.seats_filled = 20
        self.assertEqual(course.seats_available, 7)

    def test_seats_available_never_negative(self):
        exam = make_exam()
        course = make_course(exam)
        course.seats_filled = 30   # Over batch_size
        self.assertEqual(course.seats_available, 0)

    def test_is_seats_limited(self):
        exam = make_exam()
        course = make_course(exam)
        course.seats_filled = 23   # 4 remaining
        self.assertTrue(course.is_seats_limited)


class ExamModelTests(TestCase):

    def test_slug_auto_from_short_name(self):
        exam = Exam.objects.create(
            name='Common Admission Test', short_name='CAT',
            category='mba_india'
        )
        self.assertEqual(exam.slug, 'cat')
