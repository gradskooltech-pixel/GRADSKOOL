"""
GRADSKOOL — Set FYQ PDF prices to ₹29

A one-off data fix, not something the bundle-pricing feature does on its
own: the bundle checkout (see apps.pdfs.services.create_pdf_bundle_order)
only ever calculates and charges the ₹29/₹25/₹21/₹17/₹13/₹9 tier prices at
checkout time — it never touches Pdf.price_inr itself. But GS also wants
the single-PDF price shown on the PDF Library page (and charged if someone
buys just one PDF the old way, via CreatePdfOrderView) to actually BE ₹29
for FYQ PDFs specifically — not ₹49 as it is currently. That's a real
change to existing data, done once here, not something derived at
request-time.

Scope: only PDFs that are genuinely "FYQ" in the sense of the FYQ Library
page — fyq_category=True (counts toward the "<EXAM> FYQs" bucket) OR
fyq_question is set (attached to one specific FYQ question's page). Every
other PDF (foundation-class materials, general library PDFs) is
completely untouched — confirmed with GS that non-FYQ pricing stays
exactly as it was.

Usage:
    python manage.py set_fyq_pdf_prices           # dry run — shows what WOULD change
    python manage.py set_fyq_pdf_prices --apply    # actually writes the change
"""
from django.core.management.base import BaseCommand
from django.db.models import Q


class Command(BaseCommand):
    help = 'Sets price_inr=29 on every FYQ-scoped PDF (fyq_category=True or fyq_question set). Dry-run by default.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply', action='store_true',
            help='Actually write the price change. Without this flag, only prints what would change.',
        )

    def handle(self, *args, **options):
        from apps.pdfs.models import Pdf

        NEW_PRICE = 29

        fyq_pdfs = Pdf.objects.filter(
            Q(fyq_category=True) | Q(fyq_question__isnull=False),
            is_free=False,
        ).distinct().order_by('title')

        to_change = fyq_pdfs.exclude(price_inr=NEW_PRICE)
        already_correct = fyq_pdfs.filter(price_inr=NEW_PRICE).count()

        self.stdout.write(f'Found {fyq_pdfs.count()} FYQ PDF(s) total.')
        self.stdout.write(f'{already_correct} already priced at ₹{NEW_PRICE} — no change needed.')
        self.stdout.write(f'{to_change.count()} need updating:\n')

        for pdf in to_change:
            self.stdout.write(f'  {pdf.title!r}: ₹{pdf.price_inr} → ₹{NEW_PRICE}')

        if not options['apply']:
            self.stdout.write(self.style.WARNING(
                '\nDry run only — no changes made. Re-run with --apply to actually update these prices.'
            ))
            return

        updated = to_change.update(price_inr=NEW_PRICE)
        self.stdout.write(self.style.SUCCESS(f'\nUpdated {updated} PDF(s) to ₹{NEW_PRICE}.'))
