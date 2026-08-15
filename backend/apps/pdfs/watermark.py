"""
GRADSKOOL — PDF page watermarking

Burns the purchasing user's email into a page image, tiled and semi-transparent,
diagonally across the page. Be upfront internally about what this actually does:
it can't stop a screenshot or a phone camera pointed at a screen — nothing can.
What it does is make any leaked screenshot traceable back to the account that
downloaded it, which is the same "deterrent + traceability" model used for the
video watermark. Requires Pillow (`pip install Pillow --break-system-packages`).

MEMORY NOTE (2026-08-15): the original version built the watermark tile at an
arbitrary 2x-oversized canvas and then rotated it with expand=True (which grows
the canvas again, based on the already-2x size). For a typical page image that
peaked around 100-150MB per request — with gunicorn running --workers 2
--threads 4, up to 8 of these could overlap in the same process, which is what
was crashing the web service with repeated OOM SIGKILLs. The version below
computes the exact minimum tile size needed to fully cover the page after
rotation (via the standard inverse-rotation bounding-box formula) instead of
guessing a multiplier, and rotates exactly once. Peak memory per request drops
roughly 4x. It also caps the working resolution, since these pages are read on
a screen, not printed — no need to carry full scan resolution through the
whole pipeline.
"""
import io
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WATERMARK_COLOR = (217, 79, 80, 55)  # brand red, low alpha — brand's #d94f50
ROTATION_DEGREES = 28

# Pages are read in-browser, not printed — no need to watermark/composite at
# full scan resolution. Only kicks in for oversized source scans; a normal
# ~1240px-wide page image passes through untouched.
MAX_PAGE_WIDTH = 1600


def apply_watermark(image_bytes: bytes, label: str) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert('RGBA')

    if img.width > MAX_PAGE_WIDTH:
        ratio = MAX_PAGE_WIDTH / img.width
        img = img.resize((MAX_PAGE_WIDTH, round(img.height * ratio)), Image.LANCZOS)

    W, H = img.width, img.height

    # Minimum pre-rotation tile size such that rotating it by ROTATION_DEGREES
    # (with expand=True) and then center-cropping back to W×H is guaranteed to
    # be fully covered by tile content, with no transparent corners. This is
    # the axis-aligned bounding box of a W×H rectangle rotated by -θ — NOT an
    # arbitrary multiplier.
    theta = math.radians(ROTATION_DEGREES)
    cos_t, sin_t = abs(math.cos(theta)), abs(math.sin(theta))
    tile_w = int(W * cos_t + H * sin_t) + 2
    tile_h = int(W * sin_t + H * cos_t) + 2

    tile = Image.new('RGBA', (tile_w, tile_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tile)

    try:
        font = ImageFont.truetype('DejaVuSans.ttf', max(14, W // 40))
    except Exception:
        font = ImageFont.load_default()

    text_w = draw.textlength(label, font=font)
    step_x = int(text_w) + 90
    step_y = 130

    for row, y in enumerate(range(0, tile_h, step_y)):
        offset = 0 if row % 2 == 0 else step_x // 2
        for x in range(-step_x, tile_w, step_x):
            draw.text((x + offset, y), label, font=font, fill=WATERMARK_COLOR)

    rotated = tile.rotate(ROTATION_DEGREES, expand=True)
    left = (rotated.width - W) // 2
    top = (rotated.height - H) // 2
    cropped = rotated.crop((left, top, left + W, top + H))
    del tile, rotated  # drop the larger intermediates before compositing

    watermarked = Image.alpha_composite(img, cropped)
    out = io.BytesIO()
    watermarked.convert('RGB').save(out, format='JPEG', quality=85)
    return out.getvalue()


def blur_preview(image_bytes: bytes, radius: int = 18) -> bytes:
    """
    Used by PdfPreviewView — page 1 only, no login, no watermark by design
    (it's a teaser). This was previously a no-op bug: the view served the
    raw page. Now it's actually blurred enough to show layout/length but not
    be readable — same idea as a blurred product screenshot.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    if img.width > MAX_PAGE_WIDTH:
        ratio = MAX_PAGE_WIDTH / img.width
        img = img.resize((MAX_PAGE_WIDTH, round(img.height * ratio)), Image.LANCZOS)
    blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
    out = io.BytesIO()
    blurred.save(out, format='JPEG', quality=70)
    return out.getvalue()
