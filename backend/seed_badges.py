#!/usr/bin/env python3
"""
Run this after migrations to seed default badges.
  python3 seed_badges.py
"""
import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.development'
django.setup()

from apps.learn.models import Badge

BADGES = [
    dict(slug='first-video',   name='First Video',    description='Watch your first video',          icon='🎬', badge_type='completion', threshold=1,   xp_reward=50),
    dict(slug='video-10',      name='Eager Learner',  description='Watch 10 videos to completion',   icon='📹', badge_type='completion', threshold=10,  xp_reward=100),
    dict(slug='video-50',      name='Dedicated',      description='Watch 50 videos',                 icon='🎓', badge_type='completion', threshold=50,  xp_reward=200),
    dict(slug='video-100',     name='Expert',         description='Watch 100 videos',                icon='🏆', badge_type='completion', threshold=100, xp_reward=500),
    dict(slug='streak-3',      name='3-Day Streak',   description='Watch videos 3 days in a row',    icon='🔥', badge_type='streak',     threshold=3,   xp_reward=50),
    dict(slug='streak-7',      name='Week Warrior',   description='7-day learning streak',           icon='🔥', badge_type='streak',     threshold=7,   xp_reward=100),
    dict(slug='streak-30',     name='Month Master',   description='30-day streak — incredible',      icon='⚡', badge_type='streak',     threshold=30,  xp_reward=500),
    dict(slug='quiz-ace',      name='Quiz Ace',       description='Score 90%+ on any quiz',          icon='📝', badge_type='score',      threshold=90,  xp_reward=100),
    dict(slug='perfect-score', name='Perfect Score',  description='Score 100% on a quiz',            icon='💯', badge_type='score',      threshold=100, xp_reward=200),
]

for b in BADGES:
    obj, created = Badge.objects.get_or_create(slug=b['slug'], defaults=b)
    print(f"{'Created' if created else 'Exists '}: {obj.icon} {obj.name}")

print(f"\n✓ {Badge.objects.count()} badges total")
