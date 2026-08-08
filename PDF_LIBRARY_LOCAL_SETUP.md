# PDF Library — Local Setup Addendum

**This is the COMPLETE site** — your full `gradskool_step4` project
(marketing site, admin panel, blog, foundations, dashboard, everything),
with the PDF Library merged in. `README.md` in this same folder has the
full local dev instructions; this file only covers the extra bit specific
to the PDF Library, layered on top of that same flow.

Already done for you in this zip (no manual editing needed):
- `apps.pdfs` added to `LOCAL_APPS` in `backend/config/settings/base.py`
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET`
  settings added right after the existing Bunny settings
- `path('api/v1/pdfs/', ...)` added to `backend/config/urls.py`
- `Pillow`, `requests`, `razorpay` — already in `requirements.txt`, nothing
  new to install
- Template lines added to `backend/.env.example` (your real `.env` is
  untouched — you still need to add the actual values, see below)
- `Navbar.jsx` now has a "Digital PDFs — Notes & Formula Sheets" link

## Steps — run these on top of README.md's normal Quick Start

### 1. Supabase Storage bucket (one-time, 5 min)
Same Supabase project as your `DATABASE_URL` — Storage → New bucket →
name it `pdf-pages` → **Private**. Project Settings → API → copy the
Project URL and the **service_role** key (not `anon`).

### 2. Add to your real `backend/.env`
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_STORAGE_BUCKET=pdf-pages
```

### 3. Follow README.md's backend Quick Start as normal
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```
This picks up the new `pdfs` app automatically — you should see
`Applying pdfs.0001_initial... OK` (or similar) in the migrate output,
alongside your usual apps.

### 4. Frontend — same as README.md
```bash
cd frontend
npm install
npm run dev          # or npm run dev:main if that's your usual habit
```

### 5. Razorpay — second webhook (only needed to test PAID PDFs)
In the Razorpay dashboard, add a second webhook URL alongside your existing
one, same events (`payment.captured`, `payment.failed`):
```
http://localhost:8000/api/v1/pdfs/webhook/    (local)
https://api.gradskool.in/api/v1/pdfs/webhook/ (production, when you deploy)
```
Free PDFs (the claim-free flow) don't touch Razorpay at all, so you can
skip this if you're only testing that path for now.

### 6. Smoke test
1. Log in as an admin (your normal login flow) → go to
   `/admin-panel/pdfs/new` → upload a small test PDF, set a price →
   confirm it renders pages client-side and uploads them.
2. `/pdfs` → the PDF should appear. Check the nav shows "Digital PDFs."
3. Buy it in Razorpay **test mode** → check `PdfPurchase.status` flips to
   `paid` in Django admin once the webhook fires.
4. `/pdfs/<slug>/read` → pages should load with your email watermarked in.
5. Upload a second PDF with `is_free=True`, price 0 → on its detail page,
   confirm you're prompted for a phone number before it unlocks.
6. Django admin → **Leads → Leads** → confirm a lead was created from that claim.
7. Check the preview image on a paid PDF's detail page — should look
   visibly blurred, not the raw page.

## What's NOT included here
- Nothing about `courses/cat.jsx` was touched — the `<PdfLibraryPromo
  examSlug="cat" />` component (in `frontend/src/components/pdfs/`) is
  still a manual drop-in wherever you want it on that page.
- Your real `.env` files aren't in this zip (they never should be, they're
  gitignored) — you'll add the Supabase values to your own.
