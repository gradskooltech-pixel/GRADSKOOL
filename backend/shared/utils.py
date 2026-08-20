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
  sanitize_html(html)             → Strip anything outside the Quill-content allowlist
"""
import re
import random
import string
import nh3
import logging
import requests
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


# ── HTML SANITIZATION ─────────────────────────────────────────────────────────

def sanitize_html(html: str) -> str:
    """
    Strips anything outside an explicit allowlist before admin-authored
    content (blog posts, FYQ notes, tool pages, foundation class notes —
    all written via Quill.js) gets saved. Previously this content was
    stored and rendered completely raw via dangerouslySetInnerHTML on the
    frontend, with no sanitization anywhere (2026-08-19) — if an admin
    account were ever compromised, or someone pasted content from an
    untrusted source into Quill without noticing a stray <script> tag or
    an onerror= handler, it would execute for every visitor to that page.

    Sanitizing on SAVE (here) rather than only on render means the stored
    value itself is safe — protects every current and future place that
    reads this content, not just the one page you thought to sanitize.

    Allowlist matches what Quill.js actually produces — headings, basic
    formatting, lists, links, images, code blocks. Quill uses classes
    (ql-align-center etc.) for alignment/indent rather than inline styles,
    so `class` is allowed globally; `style` is deliberately NOT allowed —
    arbitrary inline CSS can't run script, but could still be used for UI
    redressing (e.g. positioning fake elements over real ones).
    """
    if not html:
        return html
    return nh3.clean(
        html,
        tags={
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
            'a', 'img', 'span', 'div',
            # Missing until now — this function was originally built and
            # tested against the five dangerouslySetInnerHTML spots that
            # existed at the time (Foundations, FYQ, Tools, blog posts),
            # none of which ever produced a table. The markdown-import
            # feature genuinely does convert a markdown table into real
            # <table> HTML (confirmed separately) — but every table tag
            # was then being silently stripped right back out here,
            # leaving only the loose cell text stacked as plain
            # paragraphs. Confirmed and reproduced directly before this
            # fix, not assumed.
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
        },
        attributes={
            'a': {'href', 'target'},
            'img': {'src', 'alt', 'width', 'height'},
            '*': {'class'},
        },
        url_schemes={'http', 'https', 'mailto'},
        link_rel='noopener noreferrer nofollow',
    )


# ── BOT PROTECTION (Google reCAPTCHA) ─────────────────────────────────────────

_utils_logger = logging.getLogger(__name__)


def verify_recaptcha(token: str, remote_ip: str = None) -> bool:
    """
    Verifies a Google reCAPTCHA v2 token against Google's own siteverify
    endpoint. Used on Register/Login/Password-reset-request to distinguish
    real people from scripted/automated attempts — the existing per-IP rate
    limits (see apps/accounts/views.py) only slow down one machine; they do
    nothing against a real botnet spreading requests across many IPs, none
    of which individually cross the per-IP threshold.

    (Originally built against Cloudflare Turnstile — swapped to reCAPTCHA
    2026-08-19 at the site owner's request, to avoid a Cloudflare account
    dependency and reuse the Google Cloud project already in use for Google
    OAuth login. Same verify-token-before-any-other-processing pattern.)

    Gracefully returns True (skips the check) if RECAPTCHA_SECRET_KEY isn't
    set — so this doesn't lock out local dev or a deploy that hasn't had the
    Google keys configured yet. Once the key IS set in production, an
    empty/missing token is always rejected.
    """
    if not settings.RECAPTCHA_SECRET_KEY:
        return True

    if not token:
        return False

    try:
        resp = requests.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data={
                'secret': settings.RECAPTCHA_SECRET_KEY,
                'response': token,
                **({'remoteip': remote_ip} if remote_ip else {}),
            },
            timeout=5,
        )
        return bool(resp.json().get('success'))
    except Exception:
        _utils_logger.warning('reCAPTCHA verification request failed', exc_info=True)
        # Fail CLOSED (reject) on a network/timeout error, not open — a
        # transient outage should degrade to "can't log in right now", not
        # "bot protection silently disabled".
        return False


# ── INDEXNOW (instant crawl notification — Bing, Yandex, and other      ──
# ── participating engines; Google does not participate in this protocol) ─

INDEXNOW_KEY = '6e31fbb2a277a24ce4578a3afc65ff7a'


def submit_urls_to_indexnow(urls: list) -> bool:
    """
    Pushes a list of URLs to IndexNow (api.indexnow.org), which shares the
    submission with every participating search engine — Bing, Yandex, and
    a few smaller ones. NOT Google — Google tested IndexNow in 2022 and
    never adopted it (see apps/dashboard/views.py's SitemapView docstring
    for the parallel Google-side story: they deprecated their own sitemap
    ping endpoint in 2023 and now rely on lastmod in the sitemap instead).

    The key file at /public/{INDEXNOW_KEY}.txt on the frontend proves
    ownership — search engines fetch it to confirm the submission is
    legitimate before acting on it. If that key ever needs rotating,
    update it in both places together.

    Silently returns False on any failure — this is a nice-to-have signal,
    not something that should ever be allowed to break whatever call site
    triggers it (e.g. a post-publish admin action).
    """
    if not urls:
        return False
    try:
        resp = requests.post(
            'https://api.indexnow.org/indexnow',
            json={
                'host': 'gradskool.in',
                'key': INDEXNOW_KEY,
                'keyLocation': f'https://gradskool.in/{INDEXNOW_KEY}.txt',
                'urlList': urls[:10000],  # protocol's own stated max per submission
            },
            headers={'Content-Type': 'application/json; charset=utf-8'},
            timeout=10,
        )
        return resp.status_code == 200
    except Exception:
        _utils_logger.warning('IndexNow submission failed', exc_info=True)
        return False