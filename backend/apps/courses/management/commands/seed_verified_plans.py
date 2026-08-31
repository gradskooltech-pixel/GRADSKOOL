"""
GRADSKOOL — Seed ONLY the verified exams/plans we actually reviewed
and priced together tonight (CAT, CAThlete, ALPgebra, CAT Books, XAT,
SNAP, NMAT, SNAP+NMAT bundle).

Deliberately separate from seed_courses.py, which also creates a bunch
of other exams (CMAT, GRE, IPMAT, CUET, Law UG, Complete MBA, MHCET,
GMAT) that were never reviewed and had confirmed slug/price errors.

Safe to run multiple times — uses update_or_create everywhere, never
deletes anything, and only touches the exams/plans listed below.

Usage: python manage.py seed_verified_plans
"""
from decimal import Decimal
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Seed only the verified, reviewed exams and pricing plans'

    def handle(self, *args, **options):
        from apps.courses.models import Exam, PricingPlan

        # ── Exams ────────────────────────────────────────────────────
        exams = {}
        exam_defs = [
            dict(slug='cat',       name='CAT 2026',              short_name='CAT',       category='mba_india', sort_order=1),
            dict(slug='xat',       name='XAT 2027',               short_name='XAT',       category='mba_india', sort_order=2),
            dict(slug='snap',      name='SNAP 2026',              short_name='SNAP',      category='mba_india', sort_order=3),
            dict(slug='nmat',      name='NMAT 2026',              short_name='NMAT',      category='mba_india', sort_order=4),
            dict(slug='nmat-snap', name='SNAP + NMAT Bundle',     short_name='SNAP+NMAT', category='bundle',    sort_order=5),
        ]
        for d in exam_defs:
            exam, created = Exam.objects.update_or_create(
                slug=d['slug'],
                defaults={k: v for k, v in d.items() if k != 'slug'},
            )
            exams[d['slug']] = exam
            self.stdout.write(f"{'Created' if created else 'Updated'} exam: {exam.short_name}")

        # ── Plans ────────────────────────────────────────────────────
        # (exam_slug, plan dict) — prices/slugs match what's live in the
        # frontend right now, confirmed during tonight's pricing review.
        plans = [
            ('cat', dict(name='Live + CAT Mocks', slug='live-mocks', price_inr=Decimal('27999'),
                         is_featured=True, badge_text='Most Popular', sort_order=1,
                         includes_live=True, includes_mocks=True, mock_exams_covered=['CAT'],
                         razorpay_sku='cat-live-mocks')),
            ('cat', dict(name='Live + All MBA Mocks', slug='live-all-mba-mocks', price_inr=Decimal('29999'),
                         badge_text='Best Value', sort_order=2,
                         includes_live=True, includes_mocks=True,
                         mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
                         razorpay_sku='cat-live-all-mba-mocks')),
            ('cat', dict(name='Live + CAT Mocks + Books', slug='live-cat-mocks-books', price_inr=Decimal('31999'),
                         sort_order=3,
                         includes_live=True, includes_mocks=True, includes_books=True,
                         mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
                         razorpay_sku='cat-live-all-mocks-books')),
            ('cat', dict(name='Live + All MBA Mocks + Books', slug='live-all-mba-mocks-books', price_inr=Decimal('34999'),
                         sort_order=4,
                         includes_live=True, includes_mocks=True, includes_books=True, includes_gdpi=True,
                         mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
                         razorpay_sku='cat-live-all-mocks-books-gdpi')),
            ('cat', dict(name='CAThlete — Without Mocks', slug='base', price_inr=Decimal('6999'),
                         sort_order=9, includes_live=True, mock_exams_covered=['CAT'],
                         razorpay_sku='cathlete-base')),
            ('cat', dict(name='CAThlete + Mocks', slug='with-mocks', price_inr=Decimal('9999'),
                         is_featured=True, badge_text='Recommended', sort_order=10,
                         includes_live=True, includes_mocks=True, mock_exams_covered=['CAT'],
                         razorpay_sku='cathlete-with-mocks')),
            # Sectional CAThlete courses — VARC, LRDI, and QA taught as
            # genuinely separate courses, each on its own Learnyst link
            # (same real pattern as snap-emv above: real courses hosted
            # entirely outside GRADSKOOL's own dashboard/checkout flow —
            # matched by slug in apps/payments/services.py._send_
            # enrollment_email(), keep the two in sync if these ever
            # change). VARC/LRDI priced at ₹1 — confirmed accepted on the
            # real, live Razorpay account despite general docs suggesting
            # a stricter minimum; QA priced separately and higher,
            # reflecting its real, different value/scope per GS.
            ('cat', dict(name='CAThlete — VARC', slug='cathlete-varc', price_inr=Decimal('1'),
                         sort_order=11, razorpay_sku='cathlete-varc')),
            ('cat', dict(name='CAThlete — LRDI', slug='cathlete-lrdi', price_inr=Decimal('1'),
                         sort_order=12, razorpay_sku='cathlete-lrdi')),
            ('cat', dict(name='CAThlete — QA', slug='cathlete-qa', price_inr=Decimal('4499'),
                         sort_order=13, razorpay_sku='cathlete-qa')),
            ('cat', dict(name='ALPgebra — 99 Theorems', slug='alpgebra', price_inr=Decimal('999'),
                         badge_text='Early Bird', sort_order=11, mock_exams_covered=['CAT'],
                         razorpay_sku='cat-alpgebra')),
            ('cat', dict(name='CAT Mocks', slug='cat-mocks', price_inr=Decimal('2999'),
                         sort_order=12, includes_mocks=True, mock_exams_covered=['CAT'],
                         razorpay_sku='cat-mocks')),
            # Same real exam coverage as 'All MBA Mocks + Books' below
            # (CAT, XAT, SNAP, NMAT, CMAT), confirmed with GS — just the
            # standalone mocks-only version, without the printed books.
            ('cat', dict(name='All MBA Mocks', slug='all-mba-mocks', price_inr=Decimal('4999'),
                         sort_order=13, includes_mocks=True,
                         mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
                         razorpay_sku='all-mba-mocks')),
            ('cat', dict(name='CAT Books', slug='cat-books', price_inr=Decimal('3999'),
                         sort_order=8, includes_books=True, mock_exams_covered=['CAT'],
                         razorpay_sku='cat-books')),
            ('cat', dict(name='All MBA Mocks + Books', slug='all-mba-mocks-books', price_inr=Decimal('7999'),
                         sort_order=6, includes_mocks=True, includes_books=True,
                         mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
                         razorpay_sku='cat-all-mba-mocks-books')),

            ('xat', dict(name='XAT Full Course', slug='xat-full-course', price_inr=Decimal('5999'),
                         is_featured=True, sort_order=1, includes_live=True, includes_mocks=True,
                         mock_exams_covered=['XAT'], razorpay_sku='xat-full-course')),
            ('xat', dict(name='XAT Mocks Only', slug='mocks', price_inr=Decimal('1499'),
                         sort_order=2, includes_mocks=True, mock_exams_covered=['XAT'],
                         razorpay_sku='xat-mocks')),

            ('snap', dict(name='SNAP Mocks', slug='snap-mocks', price_inr=Decimal('1499'),
                          is_featured=True, sort_order=1, includes_mocks=True,
                          mock_exams_covered=['SNAP'], razorpay_sku='snap-mocks')),

            # EMV is fulfilled entirely on Learnyst (courses.gradskool.in),
            # not through GRADSKOOL's own platform — deliberately every
            # includes_* flag stays at its default False. Setting any of
            # them True would incorrectly unlock GRADSKOOL's own live
            # sessions/mocks/books as a side effect of rebuild_access()'s
            # OR-merge across a student's active plans (see
            # apps/enrollments/services.py), which this purchase doesn't
            # actually grant. Access instead goes out via the branch in
            # apps/payments/services.py._send_enrollment_email(), matched
            # on this exact slug — keep the two in sync if this ever
            # changes.
            ('snap', dict(name='SNAP EMV — Ethics, Morality & Values', slug='snap-emv',
                          price_inr=Decimal('499'), sort_order=2,
                          razorpay_sku='snap-emv')),

            ('nmat', dict(name='NMAT Mocks', slug='nmat-mocks', price_inr=Decimal('1499'),
                          is_featured=True, sort_order=1, includes_mocks=True,
                          mock_exams_covered=['NMAT'], razorpay_sku='nmat-mocks')),

            ('nmat-snap', dict(name='SNAP + NMAT Mocks Bundle', slug='nmat-snap-bundle',
                               price_inr=Decimal('2499'), original_price=Decimal('2999'),
                               is_featured=True, sort_order=1, includes_mocks=True,
                               mock_exams_covered=['SNAP', 'NMAT'], razorpay_sku='nmat-snap-bundle')),
        ]

        count = 0
        for exam_slug, plan_data in plans:
            slug = plan_data.pop('slug')
            plan, created = PricingPlan.objects.update_or_create(
                exam=exams[exam_slug], slug=slug, defaults=plan_data,
            )
            count += 1
            self.stdout.write(f"  {'Created' if created else 'Updated'} plan: {exam_slug}/{slug} — ₹{plan.price_inr}")

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {len(exams)} exams, {count} verified pricing plans.'
        ))