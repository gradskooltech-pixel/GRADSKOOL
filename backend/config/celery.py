"""
GRADSKOOL — Celery Application

Entry point for Celery workers and the Beat scheduler.

Workers:
  railway-worker-1: default queue (drip emails, transcription, AI notes)
  railway-worker-2: high priority queue (enrollment emails, webhooks)

Beat schedule:
  Every 15 min: send_due_drip_emails
  Every week:   expire_stale_leads
  Every day:    clean up expired tool tokens (future)

Usage (Railway Procfile):
  worker: celery -A config.celery worker --loglevel=info -Q default,high_priority
  beat:   celery -A config.celery beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

app = Celery('gradskool')

# Load config from Django settings (CELERY_ prefixed keys)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# ── BEAT SCHEDULE ─────────────────────────────────────────────────────────────

app.conf.beat_schedule = {
    # Drip email send loop — every 15 minutes
    'send-due-drip-emails': {
        'task':     'leads.send_due_drip_emails',
        'schedule': crontab(minute='*/15'),
        'options':  {'queue': 'default'},
    },

    # Stale lead cleanup — every Sunday at 3am IST (21:30 UTC Saturday)
    'expire-stale-leads': {
        'task':     'leads.expire_stale_leads',
        'schedule': crontab(hour=21, minute=30, day_of_week=6),
        'options':  {'queue': 'default'},
    },

    # Clean expired in-app notifications — daily at 2am IST (20:30 UTC)
    'cleanup-expired-notifications': {
        'task':     'notifications.cleanup_expired',
        'schedule': crontab(hour=20, minute=30),
        'options':  {'queue': 'default'},
    },

    # Session reminders — every 5 minutes
    'session-reminders': {
        'task':     'notifications.send_session_reminders',
        'schedule': crontab(minute='*/5'),
        'options':  {'queue': 'high_priority'},
    },
}

app.conf.timezone = 'Asia/Kolkata'

# ── QUEUE ROUTING ─────────────────────────────────────────────────────────────

app.conf.task_routes = {
    # High priority: enrollment-triggered emails
    'payments.send_enrollment_email':          {'queue': 'high_priority'},
    'leads.trigger_sequence_for_lead':         {'queue': 'high_priority'},
    'notifications.send_whatsapp_async':       {'queue': 'high_priority'},
    'notifications.send_session_reminders':    {'queue': 'high_priority'},
    # A live user is waiting on this one (PdfPageView blocks briefly for the
    # result) — belongs with the other real-time-sensitive tasks, not the
    # batch queue. Task name not in this dict falls back to Celery's own
    # default queue name ('celery'), which `worker` never listens to
    # (Procfile: `-Q default,high_priority`) — an unrouted task here would
    # sit forever and every page load would silently eat the full apply_async
    # timeout before falling back to inline rendering.
    'pdfs.render_watermarked_page':            {'queue': 'high_priority'},

    # Default: batch work
    'leads.send_due_drip_emails':         {'queue': 'default'},
    'leads.expire_stale_leads':           {'queue': 'default'},
    'content.generate_transcript':        {'queue': 'default'},
    'content.generate_ai_notes':          {'queue': 'default'},
}

app.conf.task_serializer      = 'json'
app.conf.result_serializer    = 'json'
app.conf.accept_content       = ['json']
app.conf.task_acks_late       = True   # Don't ack until task completes
app.conf.worker_prefetch_multiplier = 1  # One task at a time per worker slot