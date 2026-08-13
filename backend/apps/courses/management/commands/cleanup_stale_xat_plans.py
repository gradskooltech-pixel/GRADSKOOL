"""
GRADSKOOL — Clean up stale XAT pricing plans

Diagnostic + cleanup for the duplicate "XAT Mocks" issue (₹499 old price
showing alongside the correct ₹1,499 one on checkout). Neither
seed_courses.py nor seed_verified_plans.py defines a second, differently
-slugged XAT mocks plan — both only use slug='mocks' — so this stale row
was created some other way (a manual admin panel entry, or an earlier
version of a seed script before the slug was standardized).

Safe by design: always lists what it finds. Only deletes with --confirm.

Usage:
    python manage.py cleanup_stale_xat_plans            # dry run — shows what would be deleted
    python manage.py cleanup_stale_xat_plans --confirm   # actually deletes
"""
from django.core.management.base import BaseCommand

VERIFIED_XAT_SLUGS = ['xat-full-course', 'mocks']


class Command(BaseCommand):
    help = 'Show all XAT pricing plans and remove any not in the final, verified slug list (dry-run unless --confirm)'

    def add_arguments(self, parser):
        parser.add_argument('--confirm', action='store_true', help='Actually delete — without this, only prints what would be removed')

    def handle(self, *args, **options):
        from apps.courses.models import PricingPlan, Exam

        try:
            xat = Exam.objects.get(slug='xat')
        except Exam.DoesNotExist:
            self.stdout.write(self.style.ERROR("No 'xat' exam found — nothing to do."))
            return

        all_plans = PricingPlan.objects.filter(exam=xat)
        self.stdout.write(f'All {all_plans.count()} XAT plan(s) currently in the database:')
        for p in all_plans:
            flag = '' if p.slug in VERIFIED_XAT_SLUGS else '  <-- NOT in verified list'
            self.stdout.write(f'  - id={p.id}  slug={p.slug!r}  name="{p.name}"  price=₹{p.price_inr}{flag}')

        stale = all_plans.exclude(slug__in=VERIFIED_XAT_SLUGS)

        if not stale.exists():
            self.stdout.write(self.style.SUCCESS('\nNo stale XAT plans found — nothing to clean up.'))
            return

        self.stdout.write(f'\nFound {stale.count()} stale plan(s) to remove.')

        if options['confirm']:
            count = stale.count()
            stale.delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {count} stale plan(s).'))
        else:
            self.stdout.write(self.style.WARNING('Dry run only — nothing deleted. Re-run with --confirm to actually delete these.'))