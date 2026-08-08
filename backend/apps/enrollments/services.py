"""
GRADSKOOL — Enrollment Access Service

Single module that owns all access-control logic.

rebuild_access(user, exam)
  → Called after any enrollment change (create, suspend, refund).
  → Re-derives CourseAccess from all active enrollments for that
    (user, exam) pair.
  → Merges flags using OR — if any active plan grants a flag, it's on.

check_access(user, exam_slug, flag)
  → Fast single-query check used in API views.
  → Returns bool.

has_any_access(user, exam_slug)
  → True if user has at least one active enrollment for the exam.
"""
import logging
from django.db import transaction

from apps.courses.models import Exam
from .models import Enrollment, CourseAccess

logger = logging.getLogger(__name__)


@transaction.atomic
def rebuild_access(user, exam: Exam):
    """
    Rebuild CourseAccess for (user, exam) from all active enrollments.
    Called after: enrollment created, enrollment suspended/refunded.
    """
    active_plans = (
        Enrollment.objects
        .filter(user=user, status='active', plan__exam=exam)
        .select_related('plan')
        .values_list('plan', flat=False)
    )

    # Collect active plan objects
    plans = [e.plan for e in
             Enrollment.objects.filter(
                 user=user, status='active', plan__exam=exam
             ).select_related('plan')]

    if not plans:
        # No active enrollments → delete access record if it exists
        CourseAccess.objects.filter(user=user, exam=exam).delete()
        logger.info(f'Access revoked: {user.email} / {exam.slug}')
        return None

    # Merge flags across all active plans (OR semantics)
    flags = {
        'can_attend_live':      any(p.includes_live        for p in plans),
        'can_watch_recordings': any(p.includes_live or p.includes_recordings for p in plans),
        'can_take_mocks':       any(p.includes_mocks       for p in plans),
        'can_download_books':   any(p.includes_books       for p in plans),
        'can_access_gdpi':      any(p.includes_gdpi        for p in plans),
    }

    # Union of all unlocked mock exam sets
    unlocked = set()
    for p in plans:
        if p.includes_mocks:
            unlocked.update(p.mock_exams_covered or [])
    flags['mock_exams_unlocked'] = sorted(list(unlocked))

    access, created = CourseAccess.objects.update_or_create(
        user=user, exam=exam, defaults=flags
    )
    logger.info(
        f'Access {"created" if created else "updated"}: '
        f'{user.email} / {exam.slug} → {flags}'
    )
    return access


def check_access(user, exam_slug: str, flag: str) -> bool:
    """
    Check a single access flag for a user+exam combo.

    flag: 'can_attend_live' | 'can_watch_recordings' |
          'can_take_mocks'  | 'can_download_books'   |
          'can_access_gdpi'
    """
    if not user.is_authenticated:
        return False
    try:
        access = CourseAccess.objects.get(user=user, exam__slug=exam_slug)
        return getattr(access, flag, False)
    except CourseAccess.DoesNotExist:
        return False


def has_any_access(user, exam_slug: str) -> bool:
    """True if user has any active enrollment for this exam."""
    if not user.is_authenticated:
        return False
    return CourseAccess.objects.filter(user=user, exam__slug=exam_slug).exists()


def get_user_access_summary(user) -> list:
    """
    Returns all CourseAccess records for a user.
    Used by the dashboard to show enrolled courses.
    """
    return (
        CourseAccess.objects
        .filter(user=user)
        .select_related('exam')
        .order_by('exam__sort_order')
    )


def assign_to_open_cohort(user, exam):
    """
    Assign a user to the currently open cohort for an exam.
    Called after a successful enrollment.
    Only assigns if they are not already in an active cohort for this exam.
    """
    from apps.courses.models import Course

    # Find the open cohort for this exam
    cohort = Course.objects.filter(
        exam=exam, is_open=True
    ).first()

    if not cohort:
        logger.warning(f'No open cohort for {exam.slug} — skipping cohort assignment for {user.email}')
        return None

    # Check not already assigned
    if cohort.enrolled_students.filter(id=user.id).exists():
        return cohort

    # Assign
    cohort.enrolled_students.add(user)
    logger.info(f'Assigned {user.email} to cohort: {cohort.slug}')
    return cohort

