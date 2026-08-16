"""
GRADSKOOL — PDF page watermarking

Burns the purchasing user's email into a page image, tiled and semi-transparent,
diagonally across the page. Be upfront internally about what this actually does:
it can't stop a screenshot or a phone camera pointed at a screen — nothing can.
What it does is make any leaked screenshot traceable back to the account that
downloaded it, which is the same "deterrent + traceability" model used for the
video watermark. Requires Pillow (`pip install Pillow --break-system-packages`).

REDESIGN (2026-08-15, second pass): the previous version already fixed the
worst memory issue (computing the exact tile size instead of an arbitrary 2x
guess — see git history), but every request still built a full-page-sized
tile and rotated it as one big operation. This version instead:

  1. Renders ONE small rotated "stamp" containing just the user's watermark
     text — small enough that rotating it costs almost nothing regardless of
     page size — and caches that stamp in Redis per-user (24h TTL), since
     the same user's stamp is identical across every page they view.
  2. Pastes that small stamp repeatedly at a plain grid of positions directly
     onto the page image. No full-page tile canvas, no full-page rotate, no
     crop step — just cheap small pastes.

A cache HIT on the stamp (the common case after a user's first page view)
skips rotation entirely for every page after that — only small paste
operations and one JPEG encode remain. Combined with moving the call site
itself into a Celery task (see tasks.py / views.py) so this work no longer
runs on a web-serving gunicorn worker at all.
"""
import io
import math
from django.core.cache import cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WATERMARK_COLOR = (217, 79, 80, 60)  # brand red, low alpha — brand's #d94f50
ROTATION_DEGREES = 28

# Pages are read in-browser, not printed — no need to watermark/composite at
# full scan resolution. Only kicks in for oversized source scans; a normal
# ~1240px-wide page image passes through untouched.
MAX_PAGE_WIDTH = 1600

STAMP_CACHE_SECONDS = 24 * 60 * 60  # 24h — same rotated stamp reused across every page a user views in that window
STEP_X_PAD = 90   # horizontal gap between repeated stamps, on top of the stamp's own width
STEP_Y = 130      # vertical gap between rows


def _build_stamp(label: str) -> Image.Image:
    """Renders a small rotated RGBA stamp containing `label`, sized to just fit it."""
    try:
        font = ImageFont.truetype('DejaVuSans.ttf', 20)
    except Exception:
        font = ImageFont.load_default()

    measure = ImageDraw.Draw(Image.new('RGBA', (1, 1)))
    text_w = measure.textlength(label, font=font)
    text_h = getattr(font, 'size', 20) + 8

    # Generous padding so rotation doesn't clip the text corners — still a
    # tiny canvas compared to a full page, so this costs almost nothing.
    pad = int(max(text_w, text_h) * 0.6) + 10
    canvas = Image.new('RGBA', (int(text_w) + pad * 2, int(text_h) + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).text((pad, pad), label, font=font, fill=WATERMARK_COLOR)
    return canvas.rotate(ROTATION_DEGREES, expand=True, resample=Image.BICUBIC)


def _get_or_build_stamp(label: str) -> Image.Image:
    cache_key = f'wmstamp:{label}'
    cached = cache.get(cache_key)
    if cached:
        return Image.open(io.BytesIO(cached)).convert('RGBA')

    stamp = _build_stamp(label)
    buf = io.BytesIO()
    stamp.save(buf, format='PNG')
    cache.set(cache_key, buf.getvalue(), STAMP_CACHE_SECONDS)
    return stamp


def apply_watermark(image_bytes: bytes, label: str) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert('RGBA')

    if img.width > MAX_PAGE_WIDTH:
        ratio = MAX_PAGE_WIDTH / img.width
        img = img.resize((MAX_PAGE_WIDTH, round(img.height * ratio)), Image.LANCZOS)

    W, H = img.width, img.height
    stamp = _get_or_build_stamp(label)
    sw, sh = stamp.size
    step_x = sw + STEP_X_PAD

    # Row-offset grid (brick-like) of the small pre-rotated stamp — reads as
    # a continuous diagonal pattern without ever building a page-sized
    # intermediate canvas. paste(..., stamp) uses the stamp's own alpha
    # channel as the blend mask, so the semi-transparent color composites
    # correctly against whatever's underneath.
    for row, y in enumerate(range(-sh, H + sh, STEP_Y)):
        offset = 0 if row % 2 == 0 else step_x // 2
        for x in range(-sw + offset, W, step_x):
            img.paste(stamp, (x, y), stamp)

    out = io.BytesIO()
    img.convert('RGB').save(out, format='JPEG', quality=85)
    return out.getvalue()


def blur_preview(image_bytes: bytes, radius: int = 18) -> bytes:
    """
    Used by PdfPreviewView — page 1 only, no login, no watermark by design
    (it's a teaser). Left running inline (not moved to Celery) since it's
    long-cached (6h, shared across all visitors — see views.py) and much
    lighter than the per-user watermark path; it wasn't the source of the
    memory crash-loop this redesign addresses.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    if img.width > MAX_PAGE_WIDTH:
        ratio = MAX_PAGE_WIDTH / img.width
        img = img.resize((MAX_PAGE_WIDTH, round(img.height * ratio)), Image.LANCZOS)
    blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
    out = io.BytesIO()
    blurred.save(out, format='JPEG', quality=70)
    return out.getvalue()