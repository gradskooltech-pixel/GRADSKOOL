"""
GRADSKOOL — Enrollment Signals

Automatically rebuilds CourseAccess whenever an Enrollment is
created or updated. This ensures the frontend always sees the
correct access flags without needing to manually call rebuild_access().

Covers:
  - Admin-created enrollments (manual testing)
  - Payment webhook enrollments (production)
  - Status changes (suspend, refund)
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Enrollment, CourseAccess

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Enrollment)
def on_enrollment_saved(sender, instance, created, **kwargs):
    """
    Every time an Enrollment is saved (created or updated),
    rebuild the CourseAccess record for that user+exam pair.
    """
    try:
        from .services import rebuild_access
        from apps.courses.models import Exam

        exam = instance.plan.exam
        rebuild_access(instance.user, exam)

        # Auto-assign to open cohort on new active enrollment
        if created and instance.status == 'active':
            try:
                from .services import assign_to_open_cohort
                assign_to_open_cohort(instance.user, exam)
            except Exception as e:
                logger.warning(f'Cohort assignment failed: {e}')

        if created:
            logger.info(
                f'Enrollment created → access rebuilt: '
                f'{instance.user.email} / {exam.slug}'
            )
        else:
            logger.info(
                f'Enrollment updated → access rebuilt: '
                f'{instance.user.email} / {exam.slug} (status={instance.status})'
            )

    except Exception as e:
        logger.error(f'Failed to rebuild access after enrollment save: {e}')


@receiver(post_delete, sender=Enrollment)
def on_enrollment_deleted(sender, instance, **kwargs):
    """
    When an enrollment is deleted, rebuild access
    (may remove CourseAccess if no other active enrollments exist).
    """
    try:
        from .services import rebuild_access
        exam = instance.plan.exam
        rebuild_access(instance.user, exam)
        logger.info(
            f'Enrollment deleted → access rebuilt: '
            f'{instance.user.email} / {exam.slug}'
        )
    except Exception as e:
        logger.error(f'Failed to rebuild access after enrollment delete: {e}')
