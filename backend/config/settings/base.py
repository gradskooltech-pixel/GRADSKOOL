"""
GRADSKOOL — Base Settings
Shared across development and production.
"""
import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')

DEBUG = False

ALLOWED_HOSTS = []

# ── APPLICATIONS ──────────────────────────────────────────────────────────────

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'social_django',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.courses',
    'apps.enrollments',
    'apps.payments',
    'apps.content',
    'apps.tools',
    'apps.blog',
    'apps.foundations',
    'apps.fyq',
    'apps.dashboard',
    'apps.leads',
    'apps.notifications',
    'apps.learn',
    'apps.pdfs',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ── MIDDLEWARE ────────────────────────────────────────────────────────────────

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',      # Serves static files (incl. Django admin CSS/JS) in production
    'corsheaders.middleware.CorsMiddleware',          # Must be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'social_django.middleware.SocialAuthExceptionMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── CUSTOM USER MODEL ─────────────────────────────────────────────────────────

AUTH_USER_MODEL = 'accounts.User'

# ── PASSWORD VALIDATION ───────────────────────────────────────────────────────

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ── INTERNATIONALIZATION ──────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# ── STATIC / MEDIA ────────────────────────────────────────────────────────────

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── REST FRAMEWORK ────────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon':           '60/hour',
        'user':           '600/hour',
        'auth_login':     '5/minute',
        'auth_register':  '10/hour',
        'order_create':   '10/hour',
        'video_progress': '200/hour',
        'tool_gate':      '5/minute',
        'lead_capture':   '10/hour',
    },
    'EXCEPTION_HANDLER': 'shared.exceptions.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'shared.pagination.StandardPagination',
    'PAGE_SIZE': 20,
}

# ── SIMPLEJWT ─────────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('JWT_SIGNING_KEY', default=SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_OBTAIN_SERIALIZER': 'apps.accounts.serializers.CustomTokenObtainPairSerializer',
}

# ── SOCIAL AUTH (Google OAuth) ────────────────────────────────────────────────

AUTHENTICATION_BACKENDS = (
    'social_core.backends.google.GoogleOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = config('GOOGLE_OAUTH2_CLIENT_ID', default='')
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = config('GOOGLE_OAUTH2_CLIENT_SECRET', default='')
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
]
SOCIAL_AUTH_GOOGLE_OAUTH2_EXTRA_DATA = ['first_name', 'last_name', 'picture']
SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.user.create_user',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
    'apps.accounts.pipeline.save_avatar',          # Custom: save Google avatar
)
SOCIAL_AUTH_URL_NAMESPACE = 'social'

# ── RESEND EMAIL ──────────────────────────────────────────────────────────────

RESEND_API_KEY = config('RESEND_API_KEY', default='')
DEFAULT_FROM_EMAIL = 'GRADSKOOL <gradskool@gradskool.in>'
EMAIL_VERIFICATION_URL = config('FRONTEND_URL', default='http://localhost:3000') + '/auth/verify-email'
PASSWORD_RESET_URL = config('FRONTEND_URL', default='http://localhost:3000') + '/auth/reset-password'

# ── FRONTEND ──────────────────────────────────────────────────────────────────

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# ── BUNNY STREAM / STORAGE ────────────────────────────────────────────────────
BUNNY_LIBRARY_ID      = config('BUNNY_LIBRARY_ID', default='')
BUNNY_TOKEN_KEY       = config('BUNNY_TOKEN_KEY', default='')
BUNNY_STREAM_API_KEY  = config('BUNNY_STREAM_API_KEY', default='')
BUNNY_PULL_ZONE_URL   = config('BUNNY_PULL_ZONE_URL', default='')
BUNNY_STORAGE_ZONE    = config('BUNNY_STORAGE_ZONE', default='')
BUNNY_STORAGE_API_KEY = config('BUNNY_STORAGE_API_KEY', default='')

# ── SUPABASE STORAGE (PDF page images — same Supabase project as your Postgres) ─
SUPABASE_URL               = config('SUPABASE_URL', default='')
SUPABASE_SERVICE_ROLE_KEY  = config('SUPABASE_SERVICE_ROLE_KEY', default='')
SUPABASE_STORAGE_BUCKET    = config('SUPABASE_STORAGE_BUCKET', default='pdf-pages')

# ── RAZORPAY ──────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID         = config('RAZORPAY_KEY_ID', default='')
RAZORPAY_KEY_SECRET     = config('RAZORPAY_KEY_SECRET', default='')
RAZORPAY_WEBHOOK_SECRET = config('RAZORPAY_WEBHOOK_SECRET', default='')

# ── OPENAI (Whisper + GPT-4o-mini) ────────────────────────────────────────────
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')

# ── WHATSAPP (Interakt) ───────────────────────────────────────────────────────
INTERAKT_API_KEY = config('INTERAKT_API_KEY', default='')

# ── GOOGLE RECAPTCHA (bot protection on register/login/password-reset) ────────
RECAPTCHA_SECRET_KEY = config('RECAPTCHA_SECRET_KEY', default='')


# ── ZOOM ────────────────────────────────────────────────────────────────────
ZOOM_SDK_KEY      = config('ZOOM_SDK_KEY', default='')
ZOOM_SDK_SECRET   = config('ZOOM_SDK_SECRET', default='')
# For Zoom REST API (cloud recording, meeting management)
# Create a Server-to-Server OAuth app at marketplace.zoom.us
ZOOM_ACCOUNT_ID   = config('ZOOM_ACCOUNT_ID', default='')
ZOOM_CLIENT_ID    = config('ZOOM_CLIENT_ID', default='')
ZOOM_CLIENT_SECRET= config('ZOOM_CLIENT_SECRET', default='')