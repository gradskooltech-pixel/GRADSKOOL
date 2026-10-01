"""
GRADSKOOL — Export a Pdf's stored pages back into a single PDF file

Recovery tool. The admin upload flow (see admin_views.py's docstring) never
stores the ORIGINAL uploaded PDF anywhere — the admin's browser renders it
to page images client-side (pdf.js canvas) and only those per-page .webp
images ever reach Supabase Storage (one object per page, see PdfPage.
storage_path). So if you lose your local source file, there is no single
"original" to pull back down — but every page image is still sitting in
storage, and this stitches them back into one PDF, in order.

Note: the output is an IMAGE-ONLY PDF (same as what students already see
page-by-page in the reader) — visually identical to your source, but if
your original PDF had selectable/searchable text, this reconstructed copy
won't; it's pages-as-images, same as everything else in this app.

Usage (run via `railway run` so it has prod Supabase env vars, from your
own machine — the output file lands wherever you run it):

    cd backend
    railway run python manage.py export_pdf <slug>
    railway run python manage.py export_pdf <slug> --out ~/Desktop/recovered.pdf

    # Don't know the slug? List candidates first:
    railway run python manage.py export_pdf --list
"""
from io import BytesIO

from django.core.management.base import BaseCommand, CommandError
from PIL import Image


class Command(BaseCommand):
    help = "Reconstructs a single PDF from a Pdf's stored per-page images (recovery when the original source file was lost)."

    def add_arguments(self, parser):
        parser.add_argument('slug', nargs='?', help='Slug of the Pdf to export (see --list).')
        parser.add_argument('--out', help='Output file path. Defaults to <slug>.pdf in the current directory.')
        parser.add_argument('--list', action='store_true', help='List every Pdf slug + title + page count, then exit.')

    def handle(self, *args, **options):
        from apps.pdfs.models import Pdf
        from apps.pdfs.supabase_storage import fetch_bytes

        if options['list']:
            for pdf in Pdf.objects.all().order_by('title'):
                self.stdout.write(f'{pdf.slug:40s} {pdf.page_count:4d} pages  — {pdf.title}')
            return

        slug = options['slug']
        if not slug:
            raise CommandError('Provide a slug, or pass --list to see available ones.')

        try:
            pdf = Pdf.objects.get(slug=slug)
        except Pdf.DoesNotExist:
            raise CommandError(f'No Pdf with slug "{slug}". Run with --list to see valid slugs.')

        pages = list(pdf.pages.order_by('page_number'))
        if not pages:
            raise CommandError(f'"{pdf.title}" ({slug}) has no stored pages — nothing to export.')

        out_path = options['out'] or f'{slug}.pdf'

        self.stdout.write(f'Exporting "{pdf.title}" — {len(pages)} page(s)...')

        images = []
        missing = []
        for page in pages:
            raw = fetch_bytes(page.storage_path)
            if not raw:
                missing.append(page.page_number)
                self.stdout.write(self.style.WARNING(f'  page {page.page_number}: fetch failed, skipping'))
                continue
            try:
                img = Image.open(BytesIO(raw)).convert('RGB')
                images.append(img)
            except Exception as e:
                missing.append(page.page_number)
                self.stdout.write(self.style.WARNING(f'  page {page.page_number}: not a valid image ({e}), skipping'))

        if not images:
            raise CommandError('No pages could be fetched — nothing to write.')

        first, rest = images[0], images[1:]
        first.save(out_path, save_all=True, append_images=rest)

        self.stdout.write(self.style.SUCCESS(f'Wrote {len(images)} page(s) to {out_path}'))
        if missing:
            self.stdout.write(self.style.WARNING(
                f'{len(missing)} page(s) could not be recovered and are MISSING from the output: {sorted(missing)}'
            ))
