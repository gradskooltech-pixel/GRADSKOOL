#!/bin/bash
# GRADSKOOL — Multi-process startup dispatcher for Railway
#
# Real reason this exists: railway.toml's [deploy].startCommand applies to
# EVERY service created from this repo, and Railway's dashboard genuinely
# locks the Start Command field when a value comes from a committed TOML
# file. The originally-planned fix — a second railway.worker.toml, pointed
# to via Config as Code — turned out to be blocked too: Railway confirmed
# "New services cannot opt into Config as Code" as of 2026-08-28, and this
# worker service was created after that cutoff. No dashboard-level escape
# hatch exists either (no Detach/Ignore-config-file toggle, no service
# Duplicate option on this plan).
#
# The real, working fix: make railway.toml's ONE startCommand run THIS
# script instead of gunicorn directly, and have this script decide which
# real process to run.
#
# REAL BUG FOUND AND FIXED (2026-08-28): originally read RAILWAY_SERVICE_NAME
# for this. That variable turned out to be Railway's own AUTO-GENERATED
# internal service name (a random two-word slug like "genuine-vision"), NOT
# the human-readable name shown on the dashboard — confirmed live: a real
# worker service logged RAILWAY_SERVICE_NAME=genuine-vision, matched none of
# the case branches below, and silently started as web (gunicorn) instead of
# the Celery worker it was meant to be. Switched to GRADSKOOL_ROLE, a
# variable we fully control ourselves — guaranteed not to collide with
# anything Railway auto-populates, so there's zero ambiguity about which
# value is actually being read.
#
# Each service needs GRADSKOOL_ROLE set explicitly in its own Variables tab:
#   web service    → GRADSKOOL_ROLE=web    (or leave unset — web is the default)
#   worker service → GRADSKOOL_ROLE=worker
#   beat service   → GRADSKOOL_ROLE=beat

set -e

SERVICE_ROLE="${GRADSKOOL_ROLE:-web}"

echo "GRADSKOOL startup dispatcher: GRADSKOOL_ROLE=${SERVICE_ROLE} (RAILWAY_SERVICE_NAME=${RAILWAY_SERVICE_NAME:-unset}, for reference only — not used to decide behavior)"

case "$SERVICE_ROLE" in
  worker)
    echo "Starting as: Celery worker"
    exec celery -A config.celery worker --loglevel=info -Q default,high_priority --concurrency 2
    ;;
  beat)
    echo "Starting as: Celery beat"
    exec celery -A config.celery beat --loglevel=info
    ;;
  *)
    echo "Starting as: web (default — gunicorn)"
    # Migrations run here (once, on web only) instead of in railway.toml's
    # buildCommand — that command used to run in all three services' builds
    # and could race against itself on the shared Supabase DB when a new
    # migration created a table for the first time (pg_type unique-violation
    # crash). Only web runs this, and only one web replica exists, so it's
    # safe without a migration lock for now.
    python manage.py migrate --noinput
    exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --threads 3 --timeout 120 --access-logfile - --error-logfile -
    ;;
esac