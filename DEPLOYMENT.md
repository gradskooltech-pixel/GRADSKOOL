# GRADSKOOL — Subdomain Deployment Guide

## Architecture

One Next.js codebase. One Django backend. Multiple Vercel deployments.

```
gradskool.in          → NEXT_PUBLIC_EXAM=  (blank — main site)
cat.gradskool.in      → NEXT_PUBLIC_EXAM=cat
xat.gradskool.in      → NEXT_PUBLIC_EXAM=xat
snap.gradskool.in     → NEXT_PUBLIC_EXAM=snap
nmat.gradskool.in     → NEXT_PUBLIC_EXAM=nmat
gmat.gradskool.in     → NEXT_PUBLIC_EXAM=gmat
gre.gradskool.in      → NEXT_PUBLIC_EXAM=gre
ipmat.gradskool.in    → NEXT_PUBLIC_EXAM=ipmat
cmat.gradskool.in     → NEXT_PUBLIC_EXAM=cmat
mhcet.gradskool.in    → NEXT_PUBLIC_EXAM=mhcet
clat.gradskool.in     → NEXT_PUBLIC_EXAM=clat
cuet.gradskool.in     → NEXT_PUBLIC_EXAM=cuet
```

All share the same Django backend at `api.gradskool.in`.

---

## What each subdomain shows

| URL | Homepage | /courses | /mocks | /learn |
|-----|----------|----------|--------|--------|
| gradskool.in | All exams | All 10 exams grid | — | — |
| cat.gradskool.in | CAT course page | → /courses/cat | → /courses/cat/mocks | → /learn/cat |
| xat.gradskool.in | XAT course page | → /courses/xat | → /courses/xat/mocks | → /learn/xat |

Pages that are identical across all subdomains:
- `/auth/*` — login, register, forgot password
- `/dashboard` — student dashboard
- `/learn/*` — learn portal (URL-driven)
- `/admin-panel/*` — admin panel
- `/blog/*` — blog
- `/tools/*` — free tools
- `/p/*` — dynamic pages
- `/cohorts/*` — cohort launch pages

---

## Step 1 — Backend (Railway or any server)

Deploy Django once. This serves all subdomains.

```bash
# .env for production
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=api.gradskool.in,gradskool.in,*.gradskool.in
CORS_ALLOWED_ORIGINS=https://gradskool.in,https://cat.gradskool.in,https://xat.gradskool.in,https://snap.gradskool.in,https://nmat.gradskool.in,https://gmat.gradskool.in,https://gre.gradskool.in,https://ipmat.gradskool.in,https://cmat.gradskool.in,https://mhcet.gradskool.in,https://clat.gradskool.in,https://cuet.gradskool.in
DATABASE_URL=postgresql://...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RESEND_API_KEY=re_...
```

Add a custom domain `api.gradskool.in` pointing to your Railway deployment.

---

## Step 2 — Vercel Setup

### Create the main project

1. Go to vercel.com → New Project → Import your GitHub repo (frontend folder)
2. Name it: `gradskool-main`
3. Add environment variables:

```
NEXT_PUBLIC_API_URL=https://api.gradskool.in/api/v1
NEXT_PUBLIC_EXAM=
NEXT_PUBLIC_MAIN_DOMAIN=https://gradskool.in
```

4. Add custom domain: `gradskool.in`

### Create exam subdomain projects

For each exam, create a new Vercel project from the **same GitHub repo**:

```
Project name: gradskool-cat
Root directory: frontend (same as main)
Environment variables:
  NEXT_PUBLIC_API_URL=https://api.gradskool.in/api/v1
  NEXT_PUBLIC_EXAM=cat
  NEXT_PUBLIC_MAIN_DOMAIN=https://gradskool.in
Custom domain: cat.gradskool.in
```

Repeat for each exam slug.

**Vercel CLI (faster):**
```bash
cd frontend

# Main site
vercel --name gradskool-main
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_EXAM production  # leave blank
vercel domains add gradskool.in

# CAT subdomain
vercel --name gradskool-cat
vercel env add NEXT_PUBLIC_EXAM production cat
vercel domains add cat.gradskool.in

# XAT subdomain
vercel --name gradskool-xat
vercel env add NEXT_PUBLIC_EXAM production xat
vercel domains add xat.gradskool.in

# etc.
```

---

## Step 3 — DNS Setup (Cloudflare or your registrar)

```
Type    Name            Value
A       @               76.76.21.21   (Vercel IP)
CNAME   www             cname.vercel-dns.com
CNAME   cat             cname.vercel-dns.com
CNAME   xat             cname.vercel-dns.com
CNAME   snap            cname.vercel-dns.com
CNAME   nmat            cname.vercel-dns.com
CNAME   gmat            cname.vercel-dns.com
CNAME   gre             cname.vercel-dns.com
CNAME   ipmat           cname.vercel-dns.com
CNAME   cmat            cname.vercel-dns.com
CNAME   mhcet           cname.vercel-dns.com
CNAME   clat            cname.vercel-dns.com
CNAME   cuet            cname.vercel-dns.com
CNAME   api             your-railway-app.up.railway.app
```

---

## Step 4 — Auto-deploy on push

Once all projects are on Vercel from the same repo:
- Push to `main` branch → all 12 deployments rebuild automatically
- Bug fix once → deployed everywhere

---

## Testing locally

```bash
# Test main site
NEXT_PUBLIC_EXAM= npm run dev
# → localhost:3000 shows all exams

# Test CAT subdomain
NEXT_PUBLIC_EXAM=cat npm run dev
# → localhost:3000 shows CAT homepage, /courses redirects to /courses/cat

# Test XAT subdomain
NEXT_PUBLIC_EXAM=xat npm run dev
# → localhost:3000 shows XAT homepage
```

---

## Adding a new exam subdomain

1. Add exam data to `src/data/examData.js`
2. Create static page `src/pages/courses/[exam].jsx`
3. Create new Vercel project with `NEXT_PUBLIC_EXAM=[exam]`
4. Add CNAME DNS record
5. Done in ~10 minutes

---

## Adding a non-exam product (e.g. tools.gradskool.in)

The same pattern works:

```
NEXT_PUBLIC_EXAM=tools   (use a custom slug, not an exam)
```

Then handle it in `src/lib/subdomain.js` by adding to the product map.

---

## CORS update when adding subdomains

When adding a new subdomain, update Django `.env`:
```
CORS_ALLOWED_ORIGINS=...,https://newexam.gradskool.in
```

Or use wildcard (add to Django settings):
```python
CORS_ALLOWED_ORIGIN_REGEXES = [r"^https://.*\.gradskool\.in$"]
```
