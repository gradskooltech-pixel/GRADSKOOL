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
own machine — the output file(s) land wherever you run it):

    cd backend
    railway run python manage.py export_pdf <slug>
    railway run python manage.py export_pdf <slug> --out ~/Desktop/recovered.pdf

    # Don't know the slug? List candidates first:
    railway run python manage.py export_pdf --list

    # Only the ones that are actually FYQ-linked — a PDF counts as FYQ
    # either way described in models.py's Pdf docstring: attached to one
    # specific FYQ question (fyq_question set), OR counted under the
    # "<EXAM> FYQs" library bucket without being tied to any single
    # question (fyq_category=True):
    railway run python manage.py export_pdf --list --fyq

    # Bulk mode — export EVERY FYQ-linked PDf that actually has pages in
    # one shot, instead of running the single-slug command 20+ times by
    # hand. Writes one <slug>.pdf per PDF into --out-dir (default: current
    # directory). PDFs with 0 stored pages are skipped (nothing uploaded
    # for them yet — not a recovery gap, see --list's output).
    railway run python manage.py export_pdf --fyq
    railway run python manage.py export_pdf --fyq --out-dir ~/Desktop/fyq_recovered
"""
import os
from io import BytesIO

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from PIL import Image


def _fyq_queryset(Pdf):
    return Pdf.objects.filter(Q(fyq_question__isnull=False) | Q(fyq_category=True))


class Command(BaseCommand):
    help = "Reconstructs a single PDF (or every FYQ-linked PDF at once) from stored per-page images — recovery when the original source file was lost."

    def add_arguments(self, parser):
        parser.add_argument('slug', nargs='?', help='Slug of the Pdf to export (see --list). Omit when using --fyq for bulk mode.')
        parser.add_argument('--out', help='Single-export only: output file path. Defaults to <slug>.pdf in the current directory.')
        parser.add_argument('--out-dir', default='.', help='Bulk mode only: directory to write <slug>.pdf files into. Defaults to the current directory.')
        parser.add_argument('--list', action='store_true', help='List every Pdf slug + title + page count, then exit.')
        parser.add_argument('--fyq', action='store_true', help='With --list: show only FYQ-linked PDFs. Without a slug: bulk-export every FYQ-linked PDF that has pages.')

    def handle(self, *args, **options):
        from apps.pdfs.models import Pdf
        from apps.pdfs.supabase_storage import fetch_bytes

        if options['list']:
            qs = Pdf.objects.all().select_related('exam', 'fyq_question')
            if options['fyq']:
                qs = _fyq_queryset(Pdf).select_related('exam', 'fyq_question')
            for pdf in qs.order_by('title'):
                exam_slug = pdf.exam.slug if pdf.exam_id else '-'
                tag = 'question' if pdf.fyq_question_id else ('category' if pdf.fyq_category else '')
                suffix = f'  [fyq:{tag}]' if tag else ''
                self.stdout.write(f'{pdf.slug:40s} {pdf.page_count:4d} pages  ({exam_slug})  — {pdf.title}{suffix}')
            return

        slug = options['slug']

        # ── BULK MODE: --fyq with no slug ───────────────────────────────
        if not slug and options['fyq']:
            out_dir = options['out_dir']
            os.makedirs(out_dir, exist_ok=True)

            candidates = list(_fyq_queryset(Pdf).order_by('title'))
            targets = [pdf for pdf in candidates if pdf.pages.exists()]
            empty = [pdf for pdf in candidates if pdf not in targets]

            if not targets:
                raise CommandError('No FYQ-linked PDF has any stored pages — nothing to export.')

            self.stdout.write(f'Exporting {len(targets)} FYQ PDF(s) to {out_dir}/ ({len(empty)} skipped — no pages uploaded)...')

            ok, failed = [], []
            for pdf in targets:
                out_path = os.path.join(out_dir, f'{pdf.slug}.pdf')
                try:
                    count = self._export_one(pdf, out_path, fetch_bytes)
                    self.stdout.write(self.style.SUCCESS(f'  {pdf.slug}: wrote {count} page(s)'))
                    ok.append(pdf.slug)
                except CommandError as e:
                    self.stdout.write(self.style.ERROR(f'  {pdf.slug}: {e}'))
                    failed.append(pdf.slug)

            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS(f'Done — {len(ok)} exported, {len(failed)} failed, {len(empty)} skipped (no pages).'))
            if failed:
                self.stdout.write(self.style.WARNING(f'Failed: {", ".join(failed)}'))
            return

        # ── SINGLE EXPORT ────────────────────────────────────────────────
        if not slug:
            raise CommandError('Provide a slug, pass --list to see available ones, or --fyq (with no slug) to bulk-export every FYQ PDF.')

        try:
            pdf = Pdf.objects.get(slug=slug)
        except Pdf.DoesNotExist:
            raise CommandError(f'No Pdf with slug "{slug}". Run with --list to see valid slugs.')

        out_path = options['out'] or f'{slug}.pdf'
        count = self._export_one(pdf, out_path, fetch_bytes, verbose=True)
        self.stdout.write(self.style.SUCCESS(f'Wrote {count} page(s) to {out_path}'))

    def _export_one(self, pdf, out_path, fetch_bytes, verbose=False):
        """Fetches every stored page for `pdf` and writes them to `out_path` as one PDF. Returns the page count written. Raises CommandError if nothing could be written."""
        pages = list(pdf.pages.order_by('page_number'))
        if not pages:
            raise CommandError(f'"{pdf.title}" ({pdf.slug}) has no stored pages — nothing to export.')

        if verbose:
            self.stdout.write(f'Exporting "{pdf.title}" — {len(pages)} page(s)...')

        images = []
        missing = []
        for page in pages:
            raw = fetch_bytes(page.storage_path)
            if not raw:
                missing.append(page.page_number)
                if verbose:
                    self.stdout.write(self.style.WARNING(f'  page {page.page_number}: fetch failed, skipping'))
                continue
            try:
                img = Image.open(BytesIO(raw)).convert('RGB')
                images.append(img)
            except Exception as e:
                missing.append(page.page_number)
                if verbose:
                    self.stdout.write(self.style.WARNING(f'  page {page.page_number}: not a valid image ({e}), skipping'))

        if not images:
            raise CommandError('No pages could be fetched — nothing to write.')

        first, rest = images[0], images[1:]
        first.save(out_path, save_all=True, append_images=rest)

        if missing:
            self.stdout.write(self.style.WARNING(
                f'  {pdf.slug}: {len(missing)} page(s) could not be recovered and are MISSING from the output: {sorted(missing)}'
            ))

        return len(images)
