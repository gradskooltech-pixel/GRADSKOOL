"""
GRADSKOOL — Content Models

VideoLibrary   → A recorded lecture stored on Bunny Stream.
VideoProgress  → Per-user watch position and completion state.
AITranscript   → Whisper-generated transcript + AI study notes.

Design:
  - Videos belong to a Course (and optionally a CurriculumModule).
  - Access is gated by CourseAccess.can_watch_recordings.
  - Free-preview videos bypass the gate.
  - Bunny Stream URLs are signed per-user with a 1-hour expiry.
  - Transcripts are generated async via a Celery task after upload.
  - AI notes are derived from transcripts via a second Celery task.
"""
from django.db import models


class VideoLibrary(models.Model):

    VIDEO_SOURCES = [
        ('bunny',   'Bunny Stream'),   # paid enrolled content
        ('youtube', 'YouTube'),        # free previews, public content
    ]

    # A video is NOT tied to a single course — it can be reused across many.
    # The link to a course/topic goes through TopicVideo FK.
    # Keep a primary_exam hint for search/filtering only.
    primary_exam    = models.ForeignKey(
        'courses.Exam', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='library_videos',
        help_text='Exam this video was originally created for. Used for filtering.'
    )
    tags            = models.CharField(max_length=300, blank=True,
        help_text='Comma-separated tags for search: e.g. "varc,rc,strategy"')
    title           = models.CharField(max_length=255)
    description     = models.TextField(blank=True)

    # ── VIDEO SOURCE ──────────────────────────────────────────────────────────
    video_source    = models.CharField(
        max_length=10, choices=VIDEO_SOURCES, default='bunny'
    )
    # Bunny Stream (used when video_source == 'bunny')
    bunny_video_id   = models.CharField(max_length=100, blank=True, db_index=True)
    bunny_library_id = models.CharField(max_length=20, blank=True)
    # YouTube (used when video_source == 'youtube')
    # Store the 11-char ID from https://youtube.com/watch?v=VIDEO_ID
    youtube_video_id = models.CharField(max_length=20, blank=True, db_index=True)

    # Shared
    duration_secs   = models.IntegerField(null=True, blank=True)
    thumbnail_url   = models.URLField(blank=True)

    # Flags
    is_free_preview = models.BooleanField(default=False)
    is_published    = models.BooleanField(default=False)
    sort_order      = models.IntegerField(default=0)
    published_at    = models.DateTimeField(null=True, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'video_library'
        ordering = ['sort_order', 'created_at']
        indexes  = [
            models.Index(fields=['primary_exam', 'is_published']),
            models.Index(fields=['bunny_video_id']),
        ]

    def __str__(self):
        source = '▶ YT' if self.video_source == 'youtube' else '🎬'
        exam_label = self.primary_exam.short_name if self.primary_exam else 'General'
        return f'{source} {exam_label} — {self.title}'

    def save(self, *args, **kwargs):
        # YouTube videos are always free previews
        if self.video_source == 'youtube':
            self.is_free_preview = True
        # Auto-set thumbnail from YouTube if not manually provided
        if self.video_source == 'youtube' and self.youtube_video_id and not self.thumbnail_url:
            self.thumbnail_url = (
                f'https://img.youtube.com/vi/{self.youtube_video_id}/maxresdefault.jpg'
            )
        super().save(*args, **kwargs)

    @property
    def embed_url(self):
        """Returns the embed URL for the video player frontend."""
        if self.video_source == 'youtube':
            return f'https://www.youtube.com/embed/{self.youtube_video_id}?rel=0&modestbranding=1'
        return ''  # Bunny URLs are generated per-user with HMAC tokens in the API

    @property
    def duration_display(self):
        if not self.duration_secs:
            return ''
        m, s = divmod(self.duration_secs, 60)
        h, m = divmod(m, 60)
        return f'{h}:{m:02d}:{s:02d}' if h else f'{m}:{s:02d}'


class VideoProgress(models.Model):
    """Per-user watch position. Upserted on every progress event."""
    user          = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='video_progress'
    )
    video         = models.ForeignKey(
        VideoLibrary, on_delete=models.CASCADE, related_name='progress_records'
    )
    watched_secs  = models.IntegerField(default=0)
    last_position = models.IntegerField(default=0)   # Resume from here
    is_completed  = models.BooleanField(default=False)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = 'video_progress'
        unique_together = ('user', 'video')
        indexes         = [models.Index(fields=['user', 'video'])]

    def __str__(self):
        return f'{self.user.email} / {self.video.title} — {self.last_position}s'

    def mark_complete(self):
        if not self.is_completed:
            self.is_completed = True
            self.save(update_fields=['is_completed', 'updated_at'])


class AITranscript(models.Model):
    """
    Whisper-generated transcript and AI study notes for a video.
    One-to-one with VideoLibrary (created async after upload).
    """
    STATUS = [
        ('pending',     'Pending'),
        ('processing',  'Processing'),
        ('done',        'Done'),
        ('failed',      'Failed'),
    ]

    video           = models.OneToOneField(
        VideoLibrary, on_delete=models.CASCADE, related_name='transcript'
    )
    status          = models.CharField(max_length=20, choices=STATUS, default='pending')
    raw_transcript  = models.TextField(blank=True)   # Whisper verbatim output
    ai_notes        = models.TextField(blank=True)   # Structured study notes
    word_count      = models.IntegerField(null=True)
    processing_secs = models.FloatField(null=True)   # How long Whisper took
    error_message   = models.TextField(blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_transcripts'

    def __str__(self):
        return f'Transcript: {self.video.title} ({self.status})'
