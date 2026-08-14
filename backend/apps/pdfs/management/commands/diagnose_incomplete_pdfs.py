"""
GRADSKOOL — Diagnose incomplete PDF page uploads

PDF pages are rendered client-side (in the admin's browser, via pdf.js) and
uploaded one at a time in a sequential loop — see
frontend/src/pages/admin-panel/pdfs/new.jsx. If that browser tab is closed,
the network drops, or any single page upload fails mid-loop, the process
stops there — leaving the Pdf record with fewer actual PdfPage rows than
its page_count says it should have. Readers hit "Page not found" on any
page beyond where the upload actually stopped.

This command finds every such mismatch without changing anything.

Usage:
    python manage.py diagnose_incomplete_pdfs
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'List every PDF where actual uploaded pages do not match the expected page_count'

    def handle(self, *args, **options):
        from apps.pdfs.models import Pdf

        pdfs = Pdf.objects.all().order_by('title')
        incomplete = []

        for pdf in pdfs:
            actual_pages = pdf.pages.count()
            expected = pdf.page_count

            if pdf.status != 'ready':
                incomplete.append((pdf, actual_pages, expected, f"status is '{pdf.status}', not 'ready' — finalize/ was likely never called"))
            elif actual_pages < expected:
                missing = expected - actual_pages
                incomplete.append((pdf, actual_pages, expected, f"missing {missing} of {expected} pages"))
            elif actual_pages == 0 and expected == 0:
                incomplete.append((pdf, actual_pages, expected, "zero pages uploaded at all — upload never really started"))

        if not incomplete:
            self.stdout.write(self.style.SUCCESS('All PDFs have complete pages. Nothing broken here.'))
            return

        self.stdout.write(f'Found {len(incomplete)} PDF(s) with incomplete pages:\n')
        for pdf, actual, expected, reason in incomplete:
            published_flag = 'PUBLISHED' if pdf.is_published else 'unpublished'
            self.stdout.write(
                f"  - [{published_flag}] \"{pdf.title}\" (slug={pdf.slug}, id={pdf.id})\n"
                f"      {actual}/{expected} pages present — {reason}"
            )

        published_broken = [p for p, a, e, r in incomplete if p.is_published]
        if published_broken:
            self.stdout.write(self.style.WARNING(
                f"\n{len(published_broken)} of these are PUBLISHED and live on the site right now — "
                f"readers will hit 'Page not found' on them. These need to be re-uploaded via "
                f"/admin-panel/pdfs/new (same title works fine — page uploads use update_or_create, "
                f"so re-uploading just fills in what's missing)."
            ))
