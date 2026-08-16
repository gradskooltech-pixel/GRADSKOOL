"""
GRADSKOOL — PDFs Celery Tasks

render_watermarked_page(pdf_id, page_number, user_id, user_email, storage_path)
  → Fetches the raw page image from Supabase Storage and renders the
    watermarked version for one specific user, entirely off the main `web`
    gunicorn service. Dispatched by PdfPageView (views.py) on a cache miss —
    the view waits briefly for the result via Celery's own result backend
    (already Redis-backed, see config/settings/production.py) rather than
    doing this work inline on a web worker.

    Why: this is the single most memory-heavy thing the backend does (open
    an image, composite a watermark, re-encode as JPEG), and doing it inline
    on `web` was the direct cause of a SIGKILL crash-loop that could take
    down login/payments along with it (2026-08-15 debugging session) — a
    spike here now only affects `worker`, a separate process with its own
    memory budget, never the service handling the rest of the site.

    Writes the result into the same Redis cache key PdfPageView checks
    first, so a concurrent duplicate request for the same (pdf, page, user)
    while this task is still running doesn't dispatch a second render.
"""
import logging
from celery import shared_task
from django.core.cache import cache

logger = logging.getLogger(__name__)

PAGE_CACHE_SECONDS = 15 * 60  # matches PdfPageView's own cache TTL


@shared_task(
    name='pdfs.render_watermarked_page',
    max_retries=2,
    default_retry_delay=3,
)
def render_watermarked_page(pdf_id, page_number, user_id, user_email, storage_path):
    from .supabase_storage import fetch_bytes
    from .watermark import apply_watermark

    raw = fetch_bytes(storage_path)
    if not raw:
        logger.error(f'render_watermarked_page: fetch_bytes failed for {storage_path} (pdf={pdf_id}, page={page_number})')
        return False

    watermarked = apply_watermark(raw, user_email)
    cache_key = f'pdfpage:{pdf_id}:{page_number}:{user_id}'
    cache.set(cache_key, watermarked, PAGE_CACHE_SECONDS)
    return True