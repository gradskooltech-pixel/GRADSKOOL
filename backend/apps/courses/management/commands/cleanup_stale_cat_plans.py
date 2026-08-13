"""
GRADSKOOL — Clean up stale CAT pricing plans

Removes any 'cat' exam PricingPlan rows whose slug isn't in the final,
verified list. These plans are already invisible on the checkout page
(the CAT grouping there only renders specific slugs), so this is purely
database housekeeping — not fixing anything broken.

Safe by design: dry-run by default, only actually deletes with --confirm.

Usage:
    python manage.py cleanup_stale_cat_plans            # dry run — shows what would be deleted
    python manage.py cleanup_stale_cat_plans --confirm   # actually deletes
"""
from django.core.management.base import BaseCommand

VERIFIED_CAT_SLUGS = [
    'live-mocks', 'live-all-mba-mocks', 'live-cat-mocks-books',
    'base', 'with-mocks', 'alpgebra', 'cat-mocks', 'cat-books',
]


class Command(BaseCommand):
    help = 'Remove CAT pricing plans not in the final, verified slug list (dry-run unless --confirm)'

    def add_arguments(self, parser):
        parser.add_argument('--confirm', action='store_true', help='Actually delete — without this, only prints what would be removed')

    def handle(self, *args, **options):
        from apps.courses.models import PricingPlan, Exam

        try:
            cat = Exam.objects.get(slug='cat')
        except Exam.DoesNotExist:
            self.stdout.write(self.style.ERROR("No 'cat' exam found — nothing to do."))
            return

        stale = PricingPlan.objects.filter(exam=cat).exclude(slug__in=VERIFIED_CAT_SLUGS)

        if not stale.exists():
            self.stdout.write(self.style.SUCCESS('No stale CAT plans found. Nothing to clean up.'))
            return

        self.stdout.write(f'Found {stale.count()} stale CAT plan(s):')
        for p in stale:
            self.stdout.write(f'  - {p.slug} ("{p.name}", ₹{p.price_inr})')

        if options['confirm']:
            count = stale.count()
            stale.delete()
            self.stdout.write(self.style.SUCCESS(f'\nDeleted {count} stale plan(s).'))
        else:
            self.stdout.write(self.style.WARNING('\nDry run only — nothing deleted. Re-run with --confirm to actually delete these.'))