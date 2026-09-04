"""
GRADSKOOL — Development Settings
"""
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'gradskool.local']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# In dev: print emails to console instead of sending
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Relaxed CORS in development
CORS_ALLOW_ALL_ORIGINS = True

# Disable rate limiting in dev
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_THROTTLE_CLASSES': [],
}

# ── CELERY (dev uses synchronous execution — no worker needed) ────────────────
CELERY_TASK_ALWAYS_EAGER = True        # Run tasks inline, synchronously
CELERY_TASK_EAGER_PROPAGATES = True    # Exceptions propagate in tests
CELERY_BROKER_URL    = 'memory://'    # In-memory broker — no Redis needed
CELERY_RESULT_BACKEND = 'cache+memory://'

# ── CACHES (local memory in dev) ──────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'gradskool-dev',
    }
}

# ── DEBUG TOOLBAR (optional — install django-debug-toolbar if needed) ─────────
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
# INTERNAL_IPS = ['127.0.0.1']

# ── LOGGING (verbose in dev) ──────────────────────────────────────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '[{levelname}] {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {'handlers': ['console'], 'level': 'DEBUG'},
    'loggers': {
        'django.db.backends': {'level': 'WARNING'},  # Suppress SQL noise
        'django.request':     {'level': 'WARNING'},
    },
}
