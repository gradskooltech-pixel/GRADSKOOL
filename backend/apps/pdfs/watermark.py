"""
GRADSKOOL — PDF page watermarking

Burns the purchasing user's email into a page image, tiled and semi-transparent,
diagonally across the page. Be upfront internally about what this actually does:
it can't stop a screenshot or a phone camera pointed at a screen — nothing can.
What it does is make any leaked screenshot traceable back to the account that
downloaded it, which is the same "deterrent + traceability" model used for the
video watermark. Requires Pillow (`pip install Pillow --break-system-packages`).
"""
import io
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WATERMARK_COLOR = (217, 79, 80, 55)  # brand red, low alpha — brand's #d94f50


def apply_watermark(image_bytes: bytes, label: str) -> bytes:
    img = Image.open(io.BytesIO(image_bytes)).convert('RGBA')

    tile = Image.new('RGBA', (img.width * 2, img.height * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tile)

    try:
        font = ImageFont.truetype('DejaVuSans.ttf', max(14, img.width // 40))
    except Exception:
        font = ImageFont.load_default()

    text_w = draw.textlength(label, font=font)
    step_x = int(text_w) + 90
    step_y = 130

    for row, y in enumerate(range(0, tile.height, step_y)):
        offset = 0 if row % 2 == 0 else step_x // 2
        for x in range(-step_x, tile.width, step_x):
            draw.text((x + offset, y), label, font=font, fill=WATERMARK_COLOR)

    rotated = tile.rotate(-28, expand=True)
    # Crop the rotated tile back down to the page size, centered
    left = (rotated.width - img.width) // 2
    top = (rotated.height - img.height) // 2
    cropped = rotated.crop((left, top, left + img.width, top + img.height))

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
    blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
    out = io.BytesIO()
    blurred.save(out, format='JPEG', quality=70)
    return out.getvalue()
