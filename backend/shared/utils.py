"""
GRADSKOOL — Shared Utilities

General-purpose helpers used across multiple apps.
Nothing app-specific lives here — this is purely cross-cutting.

Functions:
  get_client_ip(request)          → Extracts real IP (handles proxies)
  slugify_unique(model, text)     → Generates a unique slug for a model
  format_inr(amount)              → '₹1,23,456'
  truncate(text, length)          → Smart-truncate with ellipsis
  generate_otp(length)            → Numeric OTP string
  safe_int(value, default)        → int() that never raises
  paginate_queryset(qs, request)  → Standard pagination helper
  mask_email(email)               → 'k***v@example.com' for display
  send_admin_alert(subject, body) → Quick email to ADMINS list
"""
import re
import random
import string
import logging
from django.conf import settings
from django.utils.text import slugify

logger = logging.getLogger(__name__)


# ── IP EXTRACTION ─────────────────────────────────────────────────────────────

def get_client_ip(request) -> str:
    """
    Extract the real client IP from a request object.
    Handles X-Forwarded-For from Railway / Cloudflare proxies.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if x_forwarded_for:
        # X-Forwarded-For: client, proxy1, proxy2
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


# ── SLUG GENERATION ───────────────────────────────────────────────────────────

def slugify_unique(model_class, text: str, slug_field: str = 'slug') -> str:
    """
    Generate a URL-safe slug that is unique within the given model.
    Appends a numeric suffix if the base slug already exists.

    Usage:
        slug = slugify_unique(BlogPost, 'CAT 2026 Strategy Guide')
        # → 'cat-2026-strategy-guide' or 'cat-2026-strategy-guide-2'
    """
    base = slugify(text)[:80]
    slug = base
    counter = 2
    while model_class.objects.filter(**{slug_field: slug}).exists():
        slug = f'{base}-{counter}'
        counter += 1
    return slug


# ── FORMATTING ────────────────────────────────────────────────────────────────

def format_inr(amount) -> str:
    """
    Format a number as Indian Rupees with commas.
    format_inr(123456) → '₹1,23,456'
    format_inr(1500.50) → '₹1,500'
    """
    try:
        amount = int(amount)
        s = str(amount)
        if len(s) <= 3:
            return f'₹{s}'
        # Indian number system: last 3 digits, then groups of 2
        last3 = s[-3:]
        rest  = s[:-3]
        groups = []
        while rest:
            groups.append(rest[-2:])
            rest = rest[:-2]
        formatted = ','.join(reversed(groups)) + ',' + last3
        return f'₹{formatted.lstrip(",")}'
    except (TypeError, ValueError):
        return f'₹{amount}'


def truncate(text: str, length: int = 160, suffix: str = '…') -> str:
    """
    Smart-truncate text at a word boundary.
    truncate('The quick brown fox jumped', 20) → 'The quick brown…'
    """
    if not text or len(text) <= length:
        return text or ''
    truncated = text[:length].rsplit(' ', 1)[0]
    return truncated + suffix


# ── OTP / TOKEN GENERATION ────────────────────────────────────────────────────

def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP string of given length."""
    return ''.join(random.choices(string.digits, k=length))


def generate_token(length: int = 32) -> str:
    """Generate a URL-safe random token."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


# ── TYPE COERCION ─────────────────────────────────────────────────────────────

def safe_int(value, default: int = 0) -> int:
    """int() that never raises — returns default on failure."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value, default: float = 0.0) -> float:
    """float() that never raises — returns default on failure."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


# ── EMAIL MASKING ─────────────────────────────────────────────────────────────

def mask_email(email: str) -> str:
    """
    Mask an email address for display in UIs.
    'keshav@example.com' → 'k****v@example.com'
    """
    if not email or '@' not in email:
        return email
    local, domain = email.split('@', 1)
    if len(local) <= 2:
        masked = local[0] + '*' * (len(local) - 1)
    else:
        masked = local[0] + '*' * (len(local) - 2) + local[-1]
    return f'{masked}@{domain}'


# ── PHONE VALIDATION ──────────────────────────────────────────────────────────

def is_valid_indian_phone(phone: str) -> bool:
    """Basic validation for Indian mobile numbers (10 digits starting with 6–9)."""
    cleaned = re.sub(r'[\s\-\+]', '', phone)
    if cleaned.startswith('91') and len(cleaned) == 12:
        cleaned = cleaned[2:]
    return bool(re.match(r'^[6-9]\d{9}$', cleaned))


def normalize_phone(phone: str) -> str:
    """Normalize to E.164 format with India country code."""
    cleaned = re.sub(r'[\s\-]', '', phone).strip()
    if cleaned.startswith('+'):
        return cleaned
    if cleaned.startswith('0'):
        cleaned = cleaned[1:]
    if len(cleaned) == 10:
        return f'+91{cleaned}'
    return f'+{cleaned}'


# ── ADMIN ALERT ───────────────────────────────────────────────────────────────

def send_admin_alert(subject: str, body: str):
    """
    Send a plain-text alert to all ADMINS defined in settings.
    Used for critical errors that need immediate attention.
    Silent on failure — never blocks the calling code.
    """
    try:
        admins = getattr(settings, 'ADMINS', [])
        if not admins:
            return
        import resend
        resend.api_key = getattr(settings, 'RESEND_API_KEY', '')
        if not resend.api_key:
            logger.warning(f'[ADMIN ALERT] {subject}: {body[:200]}')
            return
        for name, email in admins:
            resend.Emails.send({
                'from':    f'GRADSKOOL Alerts <alerts@gradskool.in>',
                'to':      email,
                'subject': f'[GRADSKOOL ALERT] {subject}',
                'html':    f'<pre style="font-family:monospace">{body}</pre>',
            })
    except Exception as exc:
        logger.exception(f'send_admin_alert failed: {exc}')


# ── READ TIME CALCULATION ─────────────────────────────────────────────────────

def calculate_read_time(text: str, wpm: int = 200) -> int:
    """
    Estimate reading time in minutes for a given text.
    Assumes average reading speed of 200 wpm.
    Minimum 1 minute.
    """
    word_count = len(text.split())
    import math
    return max(1, math.ceil(word_count / wpm))


# ── PAGINATION HELPER ─────────────────────────────────────────────────────────

def get_pagination_meta(paginator_page) -> dict:
    """
    Build a standard pagination metadata dict from a Django paginator page.
    Used in list views that don't use DRF's pagination class directly.
    """
    return {
        'total':       paginator_page.paginator.count,
        'total_pages': paginator_page.paginator.num_pages,
        'current':     paginator_page.number,
        'has_next':    paginator_page.has_next(),
        'has_prev':    paginator_page.has_previous(),
    }
