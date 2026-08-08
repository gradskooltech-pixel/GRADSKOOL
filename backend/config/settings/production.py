"""
GRADSKOOL — Production Settings (Railway)
"""
import sentry_sdk
import dj_database_url
from sentry_sdk.integrations.django import DjangoIntegration
from .base import *

DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

# ── DATABASE (Supabase PostgreSQL) ────────────────────────────────────────────

DATABASES = {
    'default': dj_database_url.parse(
        config('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# ── SECURITY ──────────────────────────────────────────────────────────────────

SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Railway (like Heroku, Render, etc.) terminates TLS at its edge proxy —
# the connection reaching this container itself is always plain HTTP,
# even for requests that were genuinely HTTPS from the visitor's side.
# Without this, Django can't tell the difference and re-redirects every
# single request, including Railway's own internal healthcheck (which
# doesn't follow redirects and would otherwise mark the service unhealthy).
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Railway's own edge already enforces HTTP→HTTPS for public traffic before
# it reaches this container — Django doing it again is redundant, and
# specifically breaks Railway's internal healthcheck (which hits the
# container directly, bypassing the edge, so it never sees this redirect
# as anything but a failure).
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# ── CORS (Vercel frontend only) ───────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# ── CACHE (Upstash Redis) ─────────────────────────────────────────────────────

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('UPSTASH_REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
        },
        'KEY_PREFIX': 'gradskool',
    }
}

# ── SENTRY ────────────────────────────────────────────────────────────────────

sentry_sdk.init(
    dsn=config('SENTRY_DSN', default=''),
    integrations=[DjangoIntegration(transaction_style='url')],
    traces_sample_rate=0.2,
    send_default_pii=False,
    environment='production',
)

# Wildcard CORS for all gradskool.in subdomains
CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.gradskool\.in$"]

# ── CELERY ────────────────────────────────────────────────────────────────────

CELERY_BROKER_URL = config('UPSTASH_REDIS_URL')
CELERY_RESULT_BACKEND = config('UPSTASH_REDIS_URL')
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_ALWAYS_EAGER = False

# ── LOGGING ───────────────────────────────────────────────────────────────────

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {'handlers': ['console'], 'level': 'INFO'},
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'apps.accounts': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
    },
}