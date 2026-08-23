"""
GRADSKOOL — Seed upcoming CAT Quant FYQ topics

Creates real Pdf rows for every CAT Quant topic that doesn't have a real
FYQ PDF yet — genuinely purchasable through the normal bundle checkout
(fyq_category=True, is_published=True, is_free=False all set correctly),
just with is_upcoming=True, status='upcoming' (a real, distinct status —
NOT 'ready', which means "finalized, page_count set," and NOT the default
'draft', which is correctly invisible in the public list — see Pdf.STATUS
and PdfListView.get_queryset for the two places this status value is
actually respected). Fulfilment (uploading the real PDF content) happens
later, on GS's own timeline — this command only creates the sellable
placeholder row and flips status to 'ready' is a manual step once content
actually exists.

The 34-topic list below is the REAL, confirmed CAT Quant taxonomy — GS
sent five screenshots of the actual live topic tool (Number System,
Algebra, Arithmetic, Geometry, PnC & Probability categories) and this
list is transcribed directly from those, not from apps.tools.models.
QATopic's own 34-topic list (which was checked first and used in an
earlier version of this command, then superseded once GS's real
screenshots came in — the two lists mostly overlap but aren't identical,
e.g. "Surds and Indices" vs "Surds & Indices", "HCF and LCM" existing
here but not in QATopic). One known source-data typo corrected here:
GS's own topic tool has "Proability" (missing an 'b') — used the correct
spelling "Probability" for the actual PDF title rather than propagate it.

Percentages already has a real, published FYQ PDF (confirmed against the
live site) — skipped here so this command never creates a duplicate or
overwrites it. The other 33 topics are created as upcoming.

Usage:
    python manage.py seed_upcoming_quant_pdfs           # dry run
    python manage.py seed_upcoming_quant_pdfs --apply    # actually creates rows
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify


# Real, confirmed CAT Quant topics, grouped exactly as GS's own topic
# tool groups them. Percentages intentionally omitted from the Arithmetic
# list — already has a real PDF, must never be recreated as upcoming.
QUANT_TOPICS = [
    # Number System (6)
    'Base System', 'Classification of Numbers', 'Divisibility Rules',
    'Factors and Multiples', 'HCF and LCM', 'Remainders',
    # Algebra (11)
    'Diophantine Equations', 'Functions', 'Inequalities', 'Linear Equations',
    'Logarithms', 'Maxima and Minima', 'Modulus', 'Polynomials',
    'Quadratic Equations', 'Sequences and Series', 'Surds & Indices',
    # Arithmetic (7 — Percentages excluded, already has a real PDF)
    'Averages', 'Mixture & Alligations', 'Profit, Loss & Discount',
    'Ratio & Proportion', 'Simple & Compound Interest', 'Time & Work',
    'Time, Speed & Distance',
    # Geometry (7)
    'Circles', 'Coordinate Geometry', 'Lines and Angles', 'Mensuration',
    'Polygons', 'Quadrilaterals', 'Triangles',
    # PnC & Probability (2)
    'Permutation and Combination', 'Probability',
]


class Command(BaseCommand):
    help = 'Creates real, purchasable "upcoming" Pdf rows for every CAT Quant FYQ topic that doesn\'t have a PDF yet.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply', action='store_true',
            help='Actually create the rows. Without this flag, only prints what would be created.',
        )

    def handle(self, *args, **options):
        from apps.pdfs.models import Pdf
        from apps.courses.models import Exam

        try:
            cat_exam = Exam.objects.get(slug='cat')
        except Exam.DoesNotExist:
            self.stderr.write(self.style.ERROR('No Exam with slug="cat" found — cannot proceed.'))
            return

        to_create = []
        already_exists = []

        for topic in QUANT_TOPICS:
            title = f'{topic} — CAT FYQs'
            slug = slugify(title)
            if Pdf.objects.filter(slug=slug).exists():
                already_exists.append(title)
            else:
                to_create.append((title, slug))

        self.stdout.write(f'{len(QUANT_TOPICS)} topics checked.')
        self.stdout.write(f'{len(already_exists)} already exist — skipped.')
        self.stdout.write(f'{len(to_create)} will be created as upcoming:\n')
        for title, slug in to_create:
            self.stdout.write(f'  {title!r} (slug: {slug})')

        if not options['apply']:
            self.stdout.write(self.style.WARNING(
                '\nDry run only — no rows created. Re-run with --apply to actually create them.'
            ))
            return

        created = 0
        for title, slug in to_create:
            Pdf.objects.create(
                title=title,
                slug=slug,
                description=f'Topic-wise CAT Future Year Questions on {title.replace(" — CAT FYQs", "")} — coming soon.',
                exam=cat_exam,
                fyq_category=True,
                price_inr=29,        # matches the real single-PDF FYQ price (see set_fyq_pdf_prices)
                is_free=False,
                is_published=True,
                is_upcoming=True,
                status='upcoming',   # NOT 'ready' — no real content yet; NOT 'draft' — would be invisible
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(f'\nCreated {created} upcoming PDF row(s).'))