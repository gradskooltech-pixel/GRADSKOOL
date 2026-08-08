"""
GRADSKOOL — Supabase Storage helper for PDF page images

Uses the SAME Supabase project you already pay for (Postgres), just its
bundled Storage product too — no new service to provision or pay for.

Page images live in a PRIVATE bucket (never a public one) — the Django view
is the only thing that ever reads a page, burns the requesting user's email
into it, and streams the result. We talk to Storage's plain REST API with
the service_role key (server-side only, bypasses RLS) rather than pulling
in the supabase-py SDK — keeps this to one dependency-free file, same as
the rest of this app.

Required env vars (see INTEGRATION_NOTES_PDFS.md):
  SUPABASE_URL               e.g. https://xxxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY  Project Settings → API → service_role (NOT anon)
  SUPABASE_STORAGE_BUCKET    a PRIVATE bucket you create, e.g. "pdf-pages"
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def _base_url() -> str:
    return settings.SUPABASE_URL.rstrip('/')


def _bucket() -> str:
    return settings.SUPABASE_STORAGE_BUCKET


def _headers(content_type: str = None) -> dict:
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    headers = {'apikey': key, 'Authorization': f'Bearer {key}'}
    if content_type:
        headers['Content-Type'] = content_type
    return headers


def upload_bytes(path: str, data: bytes, content_type: str = 'image/webp') -> bool:
    """Upload one rendered PDF page image. Upserts if it already exists."""
    url = f'{_base_url()}/storage/v1/object/{_bucket()}/{path.lstrip("/")}'
    try:
        res = requests.post(
            url,
            data=data,
            headers={**_headers(content_type), 'x-upsert': 'true'},
            timeout=30,
        )
        return res.status_code in (200, 201)
    except Exception as e:
        logger.error(f'Supabase storage upload failed for {path}: {e}')
        return False


def fetch_bytes(path: str) -> bytes | None:
    """Fetch a stored page's raw bytes so the view can apply a watermark server-side."""
    url = f'{_base_url()}/storage/v1/object/{_bucket()}/{path.lstrip("/")}'
    try:
        res = requests.get(url, headers=_headers(), timeout=30)
        if res.status_code == 200:
            return res.content
    except Exception as e:
        logger.error(f'Supabase storage fetch failed for {path}: {e}')
    return None


def delete_file(path: str) -> bool:
    url = f'{_base_url()}/storage/v1/object/remove/{_bucket()}'
    try:
        res = requests.post(
            url,
            json={'prefixes': [path.lstrip('/')]},
            headers=_headers('application/json'),
            timeout=15,
        )
        return res.status_code == 200
    except Exception as e:
        logger.error(f'Supabase storage delete failed for {path}: {e}')
        return False


def delete_files(paths: list) -> bool:
    """Bulk delete — used when an admin deletes a whole Pdf."""
    if not paths:
        return True
    url = f'{_base_url()}/storage/v1/object/remove/{_bucket()}'
    try:
        res = requests.post(
            url,
            json={'prefixes': [p.lstrip('/') for p in paths]},
            headers=_headers('application/json'),
            timeout=30,
        )
        return res.status_code == 200
    except Exception as e:
        logger.error(f'Supabase storage bulk delete failed: {e}')
        return False
