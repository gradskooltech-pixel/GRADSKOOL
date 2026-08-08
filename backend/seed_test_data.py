"""
GRADSKOOL — Complete Test Seed
Run: python seed_test_data.py

Creates everything needed to test the dashboard and learn portal.
"""
import os, sys, django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.development'
django.setup()

from apps.accounts.models import User
from apps.courses.models import Exam, PricingPlan, Course, CurriculumModule, CurriculumTopic
from apps.enrollments.models import Enrollment, CourseAccess

print("\n" + "="*50)
print("  GRADSKOOL — Test Seed")
print("="*50)

# ── 1. Check exams exist ──────────────────────────────
exams = Exam.objects.filter(is_active=True)
print(f"\n[1] Exams in DB: {exams.count()}")
if exams.count() == 0:
    print("    ✗ No exams! Run: python manage.py seed_courses")
    sys.exit(1)
for e in exams[:5]:
    print(f"    ✓ {e.name} ({e.slug})")

# ── 2. Check plans exist ──────────────────────────────
plans = PricingPlan.objects.all()
print(f"\n[2] Pricing plans: {plans.count()}")
if plans.count() == 0:
    print("    ✗ No plans! Run: python manage.py seed_courses")
    sys.exit(1)

# ── 3. Check curriculum ───────────────────────────────
modules = CurriculumModule.objects.all()
topics  = CurriculumTopic.objects.all()
print(f"\n[3] Curriculum: {modules.count()} modules, {topics.count()} topics")
if modules.count() == 0:
    print("    → Running seed_curriculum now...")
    from django.core.management import call_command
    call_command('seed_curriculum')
    modules = CurriculumModule.objects.all()
    print(f"    ✓ Seeded: {modules.count()} modules, {CurriculumTopic.objects.count()} topics")

# ── 4. Create test student ────────────────────────────
print("\n[4] Test student...")
user, created = User.objects.get_or_create(
    email='test@gradskool.com',
    defaults={
        'first_name': 'Test',
        'last_name':  'Student',
        'phone':      '9999999999',
        'target_exam':'cat',
        'is_verified': True,
    }
)
user.set_password('Test@1234')
user.is_verified = True
user.save()
print(f"    {'✓ Created' if created else '✓ Updated'}: test@gradskool.com / Test@1234")

# ── 5. Enroll in CAT ─────────────────────────────────
print("\n[5] Enrolling in CAT...")
cat_exam = Exam.objects.get(slug='cat')
cat_plan = PricingPlan.objects.filter(exam=cat_exam).first()
print(f"    Plan: {cat_plan.name} (₹{cat_plan.price_inr})")

enrollment, _ = Enrollment.objects.get_or_create(
    user=user, plan=cat_plan,
    defaults={'status': 'active'}
)
enrollment.status = 'active'
enrollment.save()
print(f"    ✓ Enrolled in {cat_plan.name}")

# ── 6. Grant full course access ───────────────────────
access, _ = CourseAccess.objects.get_or_create(
    user=user, exam=cat_exam,
    defaults={
        'can_watch_recordings': True,
        'can_attempt_quizzes':  True,
        'can_view_cheat_sheets':True,
        'can_access_live':      True,
        'can_access_mocks':     True,
    }
)
access.can_watch_recordings = True
access.can_attempt_quizzes  = True
access.can_view_cheat_sheets= True
access.can_access_live      = True
access.can_access_mocks     = True
access.save()
print(f"    ✓ Full course access granted")

# ── 7. Also enroll in XAT (mocks only) ───────────────
print("\n[6] Enrolling in XAT (mocks only)...")
try:
    xat_exam = Exam.objects.get(slug='xat')
    xat_plan = PricingPlan.objects.filter(exam=xat_exam).first()
    if xat_plan:
        e2, _ = Enrollment.objects.get_or_create(
            user=user, plan=xat_plan,
            defaults={'status': 'active'}
        )
        e2.status = 'active'; e2.save()
        a2, _ = CourseAccess.objects.get_or_create(
            user=user, exam=xat_exam,
            defaults={'can_access_mocks': True}
        )
        a2.can_access_mocks = True; a2.save()
        print(f"    ✓ XAT mocks access granted")
except Exception as e:
    print(f"    ⚠ Skipped: {e}")

# ── Summary ───────────────────────────────────────────
print("\n" + "="*50)
print("  DONE — Test Credentials")
print("="*50)
print(f"""
  Email:    test@gradskool.com
  Password: Test@1234
  Exams:    CAT (full) + XAT (mocks)

  URLs to test:
  ┌─────────────────────────────────────────────────┐
  │ Dashboard   http://127.0.0.1:3000/dashboard     │
  │ Learn CAT   http://127.0.0.1:3000/learn/cat     │
  │ CAT Course  http://127.0.0.1:3000/courses/cat   │
  │ CAT Mocks   http://127.0.0.1:3000/courses/cat/mocks │
  │ Admin       http://127.0.0.1:3000/admin-panel   │
  └─────────────────────────────────────────────────┘

  Admin login: use your superuser credentials
""")
