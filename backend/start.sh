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
# real process to run based on RAILWAY_SERVICE_NAME — a Railway-provided
# env var, already anticipated in railway.toml's own original comment
# ("Set RAILWAY_SERVICE_NAME to distinguish them in logs"), just not
# previously used to actually SELECT behavior. Each service still needs
# RAILWAY_SERVICE_NAME set correctly in its own Variables tab (Railway may
# set this automatically to the service's dashboard name — verify it
# actually matches one of the cases below, since a mismatch silently falls
# through to the default web case).

set -e

SERVICE_NAME="${RAILWAY_SERVICE_NAME:-web}"

echo "GRADSKOOL startup dispatcher: RAILWAY_SERVICE_NAME=${SERVICE_NAME}"

case "$SERVICE_NAME" in
  worker|gradskool-worker)
    echo "Starting as: Celery worker"
    exec celery -A config.celery worker --loglevel=info -Q default,high_priority --concurrency 2
    ;;
  beat|gradskool-beat)
    echo "Starting as: Celery beat"
    exec celery -A config.celery beat --loglevel=info
    ;;
  *)
    echo "Starting as: web (default — gunicorn)"
    exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --threads 3 --timeout 120 --access-logfile - --error-logfile -
    ;;
esac