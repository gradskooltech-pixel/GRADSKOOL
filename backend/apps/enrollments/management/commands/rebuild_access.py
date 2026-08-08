"""
GRADSKOOL — rebuild_access management command

Rebuilds CourseAccess records for all active enrollments.
Run this once after manually creating enrollments via Django admin,
or any time you suspect access records are out of sync.

Usage:
    python manage.py rebuild_access
    python manage.py rebuild_access --email student@example.com
    python manage.py rebuild_access --exam cat
"""
from django.core.management.base import BaseCommand
from apps.enrollments.models import Enrollment
from apps.enrollments.services import rebuild_access


class Command(BaseCommand):
    help = 'Rebuild CourseAccess records from active enrollments'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Rebuild only for this user email')
        parser.add_argument('--exam',  type=str, help='Rebuild only for this exam slug')

    def handle(self, *args, **options):
        qs = Enrollment.objects.filter(status='active').select_related(
            'user', 'plan__exam'
        )

        if options['email']:
            qs = qs.filter(user__email=options['email'])
        if options['exam']:
            qs = qs.filter(plan__exam__slug=options['exam'])

        # Group by (user, exam) to avoid rebuilding the same pair multiple times
        seen = set()
        rebuilt = 0
        errors  = 0

        for enrollment in qs:
            key = (enrollment.user_id, enrollment.plan.exam_id)
            if key in seen:
                continue
            seen.add(key)

            try:
                access = rebuild_access(enrollment.user, enrollment.plan.exam)
                self.stdout.write(
                    f'  ✓ {enrollment.user.email} / {enrollment.plan.exam.slug}'
                    + (f' → {access}' if access else ' → (no access)')
                )
                rebuilt += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'  ✗ {enrollment.user.email} / {enrollment.plan.exam.slug}: {e}'
                    )
                )
                errors += 1

        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(f'Done: {rebuilt} rebuilt, {errors} errors')
        )
        if rebuilt > 0:
            self.stdout.write(
                'Students should now be able to access their courses.'
            )
