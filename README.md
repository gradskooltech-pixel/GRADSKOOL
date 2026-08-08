# GRADSKOOL — Platform README

Full-stack edtech platform for MBA entrance exam preparation.
CAT · GMAT · GRE · IPMAT · XAT · SNAP · NMAT · CMAT and more.

**Stack:**
- Backend: Django 5.x + Django REST Framework (Railway)
- Frontend: Next.js 14 (Vercel)
- Database: PostgreSQL via Supabase
- Cache / Queue: Redis via Upstash
- Video: Bunny Stream
- Payments: Razorpay
- Email: Resend
- WhatsApp: Interakt
- Error tracking: Sentry
- AI/Transcription: OpenAI (Whisper + GPT-4o-mini)

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY

# Run migrations
python manage.py migrate

# Seed initial data (in this order)
python manage.py seed_courses    # 13 exams, pricing plans, lead instructor
python manage.py seed_tools      # 8 tools, tag taxonomy, 34 QA topics
python manage.py seed_leads      # 7 drip sequences with email copy

# Create admin user
python manage.py createsuperuser

# Start dev server
python manage.py runserver
# → API available at http://localhost:8000
# → Admin panel at http://localhost:8000/django-admin/
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Start dev server
npm run dev
# → App available at http://localhost:3000
```

---

## Project Structure

```
gradskool/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile                    ← Railway process definitions
│   ├── railway.toml                ← Railway deployment config
│   ├── .env.example                ← All environment variables documented
│   ├── MIGRATIONS.md               ← Migration guide
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py             ← Shared settings
│   │   │   ├── development.py      ← SQLite, CELERY_ALWAYS_EAGER, verbose logs
│   │   │   └── production.py       ← Supabase, Redis, Sentry, HTTPS
│   │   ├── urls.py                 ← Root URL config (all 11 apps wired)
│   │   ├── celery.py               ← Celery app + Beat schedule
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── shared/
│   │   ├── permissions.py          ← IsAdmin, IsInstructor, IsVerified
│   │   ├── exceptions.py           ← Custom DRF exception handler
│   │   ├── pagination.py           ← Standard pagination config
│   │   └── utils.py                ← Cross-cutting utilities
│   └── apps/
│       ├── accounts/               ← M1: Auth, JWT, Google OAuth, email verify
│       ├── courses/                ← M2: Exams, curriculum, pricing, instructors
│       ├── enrollments/            ← M3: Enrollment, CourseAccess, access control
│       ├── payments/               ← M4: Razorpay, GST invoicing, refunds
│       ├── content/                ← M6: Bunny video, Whisper, AI notes
│       ├── tools/                  ← M7: Free tools, question bank, lead gate
│       ├── blog/                   ← M8: Blog CMS
│       ├── dashboard/              ← M9: Student analytics + M12: Admin analytics
│       ├── leads/                  ← M10: Lead capture, drip sequences, Resend
│       └── notifications/          ← M11: In-app bell, WhatsApp (Interakt)
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── vercel.json                 ← Vercel deployment config
    ├── .env.local.example
    └── src/
        ├── pages/
        │   ├── index.jsx           ← Homepage (SSG + ISR 15min)
        │   ├── _app.jsx            ← App root (Navbar/Footer, Sentry, Analytics)
        │   ├── _document.jsx       ← HTML shell, keyframes, preconnects
        │   ├── courses/
        │   │   ├── index.jsx       ← All courses listing
        │   │   └── [slug].jsx      ← Exam detail page (SSG + ISR)
        │   ├── checkout/
        │   │   └── [examSlug].jsx  ← Checkout with Razorpay
        │   ├── watch/
        │   │   └── [examSlug]/
        │   │       └── [bunnyVideoId].jsx ← Video player
        │   ├── dashboard/
        │   │   └── index.jsx       ← Student dashboard + performance chart
        │   ├── tools/
        │   │   ├── index.jsx       ← Tools grid
        │   │   └── [slug].jsx      ← Dynamic tool page (RC/Vocab/QA/MCQ)
        │   ├── blog/
        │   │   ├── index.jsx       ← Blog with tag sidebar
        │   │   └── [slug].jsx      ← Article (SSG + ISR)
        │   ├── auth/               ← Login, register, verify-email, reset-password
        │   └── admin-panel/        ← Overview, Revenue, Cohorts, Leads, Tools, Notifications
        ├── components/
        │   ├── layout/             ← Navbar, Footer
        │   ├── home/               ← HomeHero, HomeSections
        │   ├── auth/               ← AuthLayout, ProtectedRoute, GoogleOAuthButton
        │   ├── courses/            ← PricingGrid, CurriculumAccordion, Testimonials...
        │   ├── payments/           ← EnrolButton
        │   ├── tools/              ← LeadGateModal, MCQQuestion, VocabFlashcard
        │   ├── notifications/      ← NotificationBell
        │   └── admin/              ← AdminLayout, AdminPrimitives
        ├── hooks/                  ← All data-fetching hooks
        ├── store/                  ← Zustand auth store
        ├── lib/
        │   ├── api.js              ← Axios + silent token refresh
        │   ├── sentry.js           ← Frontend error tracking
        │   └── analytics.js        ← GA4 event tracking
        └── styles/
            ├── tokens.css          ← CSS custom properties (colors, typography, shadows)
            └── globals.css         ← Resets, animations, utility classes
```

---

## API Endpoints Summary

| Prefix | Module | Key endpoints |
|--------|--------|---------------|
| `/api/v1/auth/` | M1 | register, login, verify-email, refresh, google-oauth |
| `/api/v1/courses/` | M2 | homepage, exams/, exams/{slug}/, plans/ |
| `/api/v1/enrollments/` | M3 | list, access/, access/{slug}/ |
| `/api/v1/payments/` | M4 | create-order, verify, webhook, orders/ |
| `/api/v1/content/` | M6 | {slug}/videos/, videos/{id}/stream/, progress/, notes/ |
| `/api/v1/tools/` | M7 | list, {slug}/gate/, passages/, vocab/, qa-topics/, session/ |
| `/api/v1/blog/` | M8 | posts/, posts/{slug}/, tags/, featured/ |
| `/api/v1/dashboard/` | M9 | summary, performance, video-progress, activity |
| `/api/v1/leads/` | M10 | capture, unsubscribe, resend-webhook, analytics (admin) |
| `/api/v1/notifications/` | M11 | list, unread-count, mark-read, whatsapp-webhook |
| `/api/v1/admin/` | M12 | overview, revenue, cohorts, tools-analytics, notifications-analytics |
| `/sitemap.xml` | SEO | Dynamic XML sitemap |
| `/robots.txt` | SEO | robots.txt |

---

## Deployment

### Backend → Railway

1. Create a Railway project at [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Set **Root Directory** to `backend/`
4. Railway auto-detects `railway.toml` and runs:
   ```
   pip install -r requirements.txt
   python manage.py collectstatic --noinput
   python manage.py migrate --noinput
   ```
5. Add all environment variables from `.env.example` in the Railway dashboard
6. Create **two additional services** from the same repo:
   - **Worker**: Start command → `celery -A config.celery worker --loglevel=info -Q default,high_priority --concurrency 2`
   - **Beat**: Start command → `celery -A config.celery beat --loglevel=info`
7. After first deploy, seed data:
   ```bash
   railway run python manage.py seed_courses
   railway run python manage.py seed_tools
   railway run python manage.py seed_leads
   ```

### Frontend → Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** to `frontend/`
3. Vercel auto-detects Next.js — no build config needed (`vercel.json` handles it)
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.gradskool.in/api/v1
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   NEXT_PUBLIC_SENTRY_DSN=https://...
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
   ```
5. Deploy

### Database → Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the **PostgreSQL connection string** (Settings → Database → Connection string → URI)
3. Set `DATABASE_URL` in Railway environment variables
4. Migrations run automatically on Railway deploy

### Redis → Upstash

1. Create a database at [console.upstash.com](https://console.upstash.com)
2. Copy the **REST URL** (rediss://...)
3. Set `UPSTASH_REDIS_URL` in Railway environment variables

---

## Seed Commands

Run these once after first deploy, in order:

```bash
# Creates all 13 exams, 30+ pricing plans, lead instructor ALP
python manage.py seed_courses

# Creates 8 tools, 50+ tags, 34 QA topics, GRE vocab sample, grammar questions
python manage.py seed_tools

# Creates 7 drip sequences with full email copy
python manage.py seed_leads
```

After seeding, register a video via:
```bash
python manage.py register_video \
  --bunny-id <guid> \
  --course-id 1 \
  --title "CAT VARC Session 01" \
  --publish \
  --transcribe
```

---

## Celery Beat Schedule

| Task | Schedule | Queue |
|------|----------|-------|
| Drip email send loop | Every 15 minutes | default |
| Session reminders | Every 5 minutes | high_priority |
| Expire stale leads | Weekly (Sunday 3am IST) | default |
| Cleanup expired notifications | Daily (2am IST) | default |

---

## Environment Variables Quick Reference

See `backend/.env.example` and `frontend/.env.local.example` for full documentation.

**Minimum required for development:**
```
SECRET_KEY=any-50-char-string
DJANGO_SETTINGS_MODULE=config.settings.development
```

**Minimum required for production:**
```
SECRET_KEY, DATABASE_URL, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS,
RESEND_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
RAZORPAY_WEBHOOK_SECRET, BUNNY_LIBRARY_ID, BUNNY_TOKEN_KEY,
UPSTASH_REDIS_URL, SENTRY_DSN, OPENAI_API_KEY, INTERAKT_API_KEY
```

---

## Testing

```bash
# Run all tests
python manage.py test apps --settings=config.settings.development

# Run specific module
python manage.py test apps.leads --settings=config.settings.development
python manage.py test apps.accounts --settings=config.settings.development

# Run with coverage
pip install coverage
coverage run manage.py test apps --settings=config.settings.development
coverage report --omit="*/migrations/*,*/tests/*"
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Enrollments only activate via Razorpay webhook | Prevents double-enrolment; client `verify` is advisory only |
| `rebuild_access()` is the single source of truth | Merging multiple plans with OR logic; called after every enrollment state change |
| Bunny URLs are user-tied (HMAC) | Prevents URL sharing; different users get different tokens for the same video |
| Lead gate uses signed JWT (not session) | Stateless; works across tabs and devices; 24-hour expiry |
| Drip send loop via Celery Beat, not cron | Idempotent, retryable, observable; never double-sends |
| All emails through Resend | Single provider; delivery tracking; webhook feeds back into lead scoring |
| WhatsApp via Interakt | Meta-approved partner; template pre-approval workflow; delivery webhooks |
| `CELERY_TASK_ALWAYS_EAGER=True` in dev | No Redis needed locally; tasks run synchronously; same code path as prod |

---

*GRADSKOOL Platform — v1.0*
*Stack: Next.js 14 + Django 5.x + DRF + PostgreSQL (Supabase) + Bunny Stream + Razorpay + Resend + Interakt + Redis (Upstash) + Sentry*
