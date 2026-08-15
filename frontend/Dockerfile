# GRADSKOOL frontend — explicit Dockerfile
#
# Added 2026-08-15. Previously this service used Railway's Nixpacks
# auto-detection, which generated a build PLAN (setup/install/build/start
# phases) that got stuck serving stale, wrong values — specifically the
# BACKEND's Django build command (`pip install ... collectstatic ... migrate`)
# and gunicorn start command — even after Root Directory and the dashboard's
# Custom Build Command were both verified correct. That meant frontend builds
# were silently failing (`pip: command not found`) and Railway kept serving
# whatever old build last succeeded, so code fixes appeared to have no effect.
#
# An explicit Dockerfile removes that whole failure class: there's no
# separate "plan" Railway generates and can cache independently of what's
# actually committed here. Docker's own layer caching is deterministic,
# keyed off file content (COPY steps), not a platform-side auto-detected plan.
#
# Pairs with frontend/railway.toml, which sets builder = "DOCKERFILE" so
# Railway uses this file directly instead of attempting Nixpacks detection.

FROM node:18-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:18-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_ vars are baked into the JS bundle at BUILD time, not runtime.
# Railway forwards service Variables as Docker build args automatically for
# Dockerfile-based builds, but ONLY for names declared as ARG here.
#
# Trimmed to what's actually in use (2026-08-15) — Bunny/Zoom/Sentry/Subdomain
# vars exist in the codebase for features not currently active. If any of
# those get turned on later, add its ARG/ENV pair back here first, or it'll
# silently be blank in the build no matter what's set in Railway's dashboard.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MAIN_DOMAIN
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MAIN_DOMAIN=$NEXT_PUBLIC_MAIN_DOMAIN
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NODE_ENV=production

RUN npm run build

FROM node:18-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000
# railway.toml's [deploy] startCommand takes priority over this when set —
# this CMD is just a correct, self-contained fallback if that field is ever
# cleared. Shell form (not exec/array form) so $PORT actually expands.
CMD npm run start -- -p $PORT