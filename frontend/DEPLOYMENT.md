# GRADSKOOL — Deployment Guide

## Domain setup
Domain: gradskool.in (registered separately, point nameservers to Netlify)

## What you will deploy

| Site | Domain | Netlify config |
|------|--------|----------------|
| Main | gradskool.in | netlify.toml |
| CAT | cat.gradskool.in | netlify-subdomains/netlify.cat.toml |
| XAT | xat.gradskool.in | netlify-subdomains/netlify.xat.toml |
| NMAT | nmat.gradskool.in | netlify-subdomains/netlify.nmat.toml |
| SNAP | snap.gradskool.in | netlify-subdomains/netlify.snap.toml |
| GMAT | gmat.gradskool.in | netlify-subdomains/netlify.gmat.toml |
| MAHCET | mhcet.gradskool.in | netlify-subdomains/netlify.mhcet.toml |
| CMAT | cmat.gradskool.in | netlify-subdomains/netlify.cmat.toml |

## Step-by-step

### 1. Deploy main site (gradskool.in)

1. Push code to GitHub
2. Netlify → Add new site → Import from GitHub → select repo
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add plugin: `@netlify/plugin-nextjs` (Netlify will prompt)
6. Environment variables:
   - NEXT_PUBLIC_API_URL = https://api.gradskool.in
   - NEXT_PUBLIC_MAIN_URL = https://gradskool.in
7. Deploy
8. Netlify → Domain management → Add custom domain → gradskool.in
9. Follow Netlify's DNS instructions (point your domain registrar's nameservers to Netlify)

### 2. Deploy each subdomain (e.g. cat.gradskool.in)

Each subdomain is a **separate Netlify site** using the same GitHub repo
but with a different NEXT_PUBLIC_EXAM environment variable.

1. Netlify → Add new site → Import from GitHub → same repo
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Environment variables:
   - NEXT_PUBLIC_EXAM = cat  ← this is what changes per subdomain
   - NEXT_PUBLIC_API_URL = https://api.gradskool.in
   - NEXT_PUBLIC_MAIN_URL = https://gradskool.in
5. Deploy
6. Netlify → Domain management → Add custom domain → cat.gradskool.in
7. Because gradskool.in is already on Netlify DNS, adding cat.gradskool.in
   is instant — Netlify handles the SSL certificate automatically.
8. Repeat for each exam.

### 3. How subdomains work

When NEXT_PUBLIC_EXAM=cat is set:
- cat.gradskool.in/ → redirects to /courses/cat
- cat.gradskool.in/learn → redirects to /learn/cat
- cat.gradskool.in/checkout → redirects to /checkout/cat

The user always sees cat.gradskool.in in their browser,
but the content is the CAT-specific course page.

### 4. Backend (Railway)

Your Django backend is already on Railway.
Add a custom domain: api.gradskool.in → your Railway URL
Set it in Railway → Settings → Domains.

### Environment variables needed across all Netlify sites

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_API_URL | https://api.gradskool.in |
| NEXT_PUBLIC_MAIN_URL | https://gradskool.in |
| NEXT_PUBLIC_EXAM | (only on subdomain sites: cat / xat / etc.) |

### Cost

All 8 Netlify sites (1 main + 7 subdomains) are FREE.
Netlify free tier allows commercial use and each site gets 100 GB bandwidth.
You'd need to breach 800 GB total/month before any site needs upgrading.
