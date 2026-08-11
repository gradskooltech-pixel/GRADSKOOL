"""
GRADSKOOL — Learning Portal Models

TopicVideo          Links a video to a CurriculumTopic with quiz/sort config.
StandaloneQuiz      A quiz with no video (e.g. "Mod-Hard 20q after Set 1+2").
LiveSession         Scheduled live class for a topic (Full Cohort only).
TopicVideoProgress  Per-student per-video state machine.
QuizAttempt         Every quiz attempt a student makes (scored, stored).

State machine per video:
  LOCKED → UNLOCKED → QUIZ_READY → QUIZ_PASSED → CHEATSHEET_REQUIRED → COMPLETED
                    ↘ (no quiz)  →              → CHEATSHEET_REQUIRED → COMPLETED
  YouTube:   LOCKED → UNLOCKED → COMPLETED (at 70% watch — no quiz, no cheatsheet)

Unlock rules:
  - First video in a topic: always UNLOCKED
  - Subsequent videos: previous video must be COMPLETED
  - COMPLETED = cheat sheet opened (Bunny) OR 70% watched (YouTube)
  - Quiz bypass: after 2 failed attempts, student can proceed anyway
"""
from django.db import models
from django.utils import timezone


# ── TOPIC VIDEO ───────────────────────────────────────────────────────────────

class TopicVideo(models.Model):
    """
    Ordered video within a CurriculumTopic.
    One TopicVideo per row in your spreadsheet.
    """
    DIFFICULTY = [
        ('beginner',     'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced',     'Advanced'),
    ]

    topic       = models.ForeignKey(
        'courses.CurriculumTopic', on_delete=models.CASCADE,
        related_name='topic_videos'
    )
    video       = models.ForeignKey(
        'content.VideoLibrary', on_delete=models.CASCADE,
        related_name='topic_videos',
        null=True, blank=True,  # null for StandaloneQuiz rows
    )
    sort_order  = models.PositiveIntegerField(default=0)
    # e.g. "What Is a Percentage? Concept from Scratch"
    title       = models.CharField(max_length=300, blank=True)
    difficulty  = models.CharField(max_length=20, choices=DIFFICULTY, default='beginner')
    duration_mins = models.PositiveIntegerField(default=10)
    sub_tag     = models.CharField(max_length=100, blank=True)
    # e.g. "% Change", "Fractions", "Reverse %"

    # Quiz config
    is_free_preview = models.BooleanField(default=False,
                                          help_text='First ~10%% of course — visible without enrollment. '
                                                    'Admin marks specific videos as free previews.')
    has_quiz    = models.BooleanField(default=False)
    # Which QATopic to draw questions from
    quiz_source = models.ForeignKey(
        'tools.QATopic', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='topic_videos'
    )
    quiz_question_count = models.PositiveIntegerField(default=10)
    quiz_duration_mins  = models.PositiveIntegerField(default=40,
                                                      help_text='Time limit for the quiz in minutes. Admin sets this per video.')

    # Cheat sheet (auto-generated from video transcript)
    # Bunny videos: generated via Whisper → GPT-4o-mini
    # YouTube videos: skipped entirely
    has_cheatsheet  = models.BooleanField(default=True)
    # Overridden to False for YouTube videos automatically in save()

    # Live class — admin decides if this video is followed by a live session
    # Flow: Watch → Cheat Sheet → Quiz → Live Class (if enabled)
    has_live        = models.BooleanField(default=False)
    live_session    = models.ForeignKey(
        'LiveSession', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='topic_video'
    )
    live_description = models.CharField(max_length=300, blank=True)
    # e.g. 'Live Q&A session after this video — join to ask doubts'

    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'topic_videos'
        ordering = ['topic', 'sort_order']
        unique_together = [['topic', 'sort_order']]

    def __str__(self):
        return f'{self.topic} [{self.sort_order}] {self.title}'

    def save(self, *args, **kwargs):
        # YouTube videos never have cheat sheets
        if self.video and self.video.video_source == 'youtube':
            self.has_cheatsheet = False
        # Use video title if no custom title
        if not self.title and self.video:
            self.title = self.video.title
        super().save(*args, **kwargs)

    @property
    def is_youtube(self):
        return self.video and self.video.video_source == 'youtube'

    @property
    def is_standalone_quiz(self):
        """True for rows that have a quiz but no video (like the 20q Mod-Hard set)."""
        return self.video is None and self.has_quiz


# ── LIVE SESSION ──────────────────────────────────────────────────────────────

class LiveSession(models.Model):
    """
    A scheduled live class for a topic.
    Visible to all enrolled students.
    Joinable only by Full Cohort (can_attend_live = True).
    """
    STATUS = [
        ('upcoming',   'Upcoming'),
        ('live',       'Live Now'),
        ('completed',  'Completed'),
        ('cancelled',  'Cancelled'),
    ]

    topic        = models.ForeignKey(
        'courses.CurriculumTopic', on_delete=models.CASCADE,
        related_name='live_sessions'
    )
    title        = models.CharField(max_length=300)
    # e.g. "Percentages Masterclass — Live Q&A"
    description  = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    duration_mins = models.PositiveIntegerField(default=90)
    meet_link    = models.URLField(blank=True)
    # Zoom / Google Meet link — shown only to Full Cohort

    status       = models.CharField(max_length=20, choices=STATUS, default='upcoming')

    # After the session ends, recording is uploaded
    recording_url           = models.URLField(blank=True)
    bunny_video_id          = models.CharField(max_length=200, blank=True,
                                               help_text='Bunny Stream video ID after recording is processed')
    recording_available     = models.BooleanField(default=False)
    recording_processing    = models.BooleanField(default=False,
                                                  help_text='True while Bunny is encoding the uploaded recording')

    # Zoom cloud recording details (set by webhook)
    zoom_meeting_id         = models.CharField(max_length=100, blank=True)
    zoom_recording_file_url = models.URLField(blank=True,
                                              help_text='Direct download URL from Zoom (expires in 24h)')
    zoom_recording_token    = models.CharField(max_length=500, blank=True,
                                               help_text='Access token for Zoom recording download')

    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'live_sessions'
        ordering = ['-scheduled_at']

    def __str__(self):
        return f'{self.topic} — {self.scheduled_at.strftime("%d %b %Y %H:%M")}'

    @property
    def is_live_now(self):
        now = timezone.now()
        end = self.scheduled_at + timezone.timedelta(minutes=self.duration_mins)
        return self.scheduled_at <= now <= end

    @property
    def is_upcoming(self):
        return timezone.now() < self.scheduled_at


# ── TOPIC VIDEO PROGRESS ──────────────────────────────────────────────────────

class TopicVideoProgress(models.Model):
    """
    Per-student per-TopicVideo state machine.
    One row per student per video in a topic.

    State transitions:
      LOCKED              → can't see/access
      UNLOCKED            → can watch, quiz/cheatsheet not available
      QUIZ_READY          → watched ≥70%, quiz available (if has_quiz)
      CHEATSHEET_REQUIRED → quiz passed (or N/A), cheat sheet must be opened
      COMPLETED           → cheat sheet opened (or YouTube 70% watched)

    For YouTube videos:
      LOCKED → UNLOCKED → COMPLETED (at 70% watch, skip quiz+cheatsheet)

    For no-quiz Bunny videos:
      LOCKED → UNLOCKED → CHEATSHEET_REQUIRED (at 70%) → COMPLETED

    For quiz Bunny videos:
      LOCKED → UNLOCKED → QUIZ_READY → CHEATSHEET_REQUIRED → COMPLETED
    """
    STATES = [
        ('locked',               'Locked'),
        ('unlocked',             'Unlocked'),
        ('quiz_ready',           'Quiz Ready'),
        ('cheatsheet_required',  'Cheat Sheet Required'),
        ('completed',            'Completed'),
    ]

    student     = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE,
        related_name='topic_video_progress'
    )
    topic_video = models.ForeignKey(
        TopicVideo, on_delete=models.CASCADE,
        related_name='student_progress'
    )
    state       = models.CharField(max_length=30, choices=STATES, default='locked')

    # Watch tracking
    watch_pct   = models.FloatField(default=0.0)  # 0–100
    watched_secs = models.IntegerField(default=0)
    last_position_secs = models.IntegerField(default=0)

    # Quiz tracking
    quiz_attempts    = models.PositiveIntegerField(default=0)
    best_score_pct   = models.FloatField(null=True, blank=True)
    quiz_passed      = models.BooleanField(default=False)
    quiz_bypassed    = models.BooleanField(default=False)
    # True if student proceeded after 2 failed attempts (Option B)

    # Cheat sheet tracking
    cheatsheet_opened = models.BooleanField(default=False)
    cheatsheet_opened_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    started_at   = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'topic_video_progress'
        unique_together = [['student', 'topic_video']]
        ordering = ['topic_video__sort_order']

    def __str__(self):
        return f'{self.student.email} | {self.topic_video} | {self.state}'

    # ── STATE TRANSITION METHODS ─────────────────────────────────────────────

    def update_watch_progress(self, watch_pct: float, watched_secs: int, position_secs: int):
        """
        Called every 15s from the video player.
        Triggers QUIZ_READY or CHEATSHEET_REQUIRED when 70% is reached.
        """
        if self.state == 'locked':
            return  # shouldn't happen but guard anyway

        self.watch_pct = max(self.watch_pct, watch_pct)
        self.watched_secs = max(self.watched_secs, watched_secs)
        self.last_position_secs = position_secs

        if not self.started_at:
            self.started_at = timezone.now()

        # 70% threshold reached
        if self.watch_pct >= 70 and self.state == 'unlocked':
            tv = self.topic_video

            if tv.is_youtube:
                # YouTube: complete immediately, no quiz or cheat sheet
                self._complete()
            elif tv.has_quiz:
                self.state = 'quiz_ready'
            else:
                # No quiz but Bunny: go straight to cheat sheet gate
                self.state = 'cheatsheet_required'

        self.save(update_fields=[
            'watch_pct', 'watched_secs', 'last_position_secs',
            'state', 'started_at',
        ])

    def record_quiz_attempt(self, score_pct: float) -> dict:
        """
        Record a quiz attempt. Returns the result and what action to take.
        Implements Option B: allow proceed after 2 failed attempts.

        Returns:
          { passed, score_pct, attempts, can_proceed, message }
        """
        self.quiz_attempts += 1
        if self.best_score_pct is None or score_pct > self.best_score_pct:
            self.best_score_pct = score_pct

        passed = score_pct >= 70.0

        if passed:
            self.quiz_passed = True
            self.state = 'cheatsheet_required'
            self.save(update_fields=['quiz_attempts', 'best_score_pct', 'quiz_passed', 'state'])
            return {
                'passed': True,
                'score_pct': score_pct,
                'attempts': self.quiz_attempts,
                'can_proceed': False,  # must open cheat sheet first
                'message': f'Great work! You scored {score_pct:.0f}%. Open your cheat sheet to continue.',
                'next_step': 'cheatsheet',
            }

        # Failed
        # Option B: after 2 attempts, allow bypass
        can_bypass = self.quiz_attempts >= 2

        if can_bypass:
            self.quiz_bypassed = True
            self.state = 'cheatsheet_required'
            self.save(update_fields=['quiz_attempts', 'best_score_pct', 'quiz_bypassed', 'state'])
            return {
                'passed': False,
                'score_pct': score_pct,
                'attempts': self.quiz_attempts,
                'can_proceed': False,
                'message': f'You scored {score_pct:.0f}%. Open your cheat sheet — it will help before the next video.',
                'next_step': 'cheatsheet',
            }

        self.save(update_fields=['quiz_attempts', 'best_score_pct'])
        return {
            'passed': False,
            'score_pct': score_pct,
            'attempts': self.quiz_attempts,
            'can_proceed': False,
            'message': f'You scored {score_pct:.0f}%. You need 70% to proceed. Try again!',
            'next_step': 'retake',
            'attempts_remaining': 2 - self.quiz_attempts,
        }

    def open_cheatsheet(self):
        """
        Student opens the cheat sheet. This is the final gate before next video unlocks.
        """
        if self.state != 'cheatsheet_required':
            return
        self.cheatsheet_opened = True
        self.cheatsheet_opened_at = timezone.now()
        self._complete()
        self.save(update_fields=[
            'cheatsheet_opened', 'cheatsheet_opened_at', 'state', 'completed_at'
        ])

    def _complete(self):
        self.state = 'completed'
        self.completed_at = timezone.now()


# ── QUIZ ATTEMPT ──────────────────────────────────────────────────────────────

class QuizAttempt(models.Model):
    """
    Every quiz attempt a student makes — full detail stored.
    Used for analytics, review, and score history.
    """
    progress    = models.ForeignKey(
        TopicVideoProgress, on_delete=models.CASCADE,
        related_name='quiz_attempts_detail'
    )
    attempt_number = models.PositiveIntegerField()
    score_pct   = models.FloatField()
    correct     = models.IntegerField()
    total       = models.IntegerField()
    # JSON: [{question_id, selected_option_id, is_correct}, ...]
    answers     = models.JSONField(default=list)
    submitted_at = models.DateTimeField(auto_now_add=True)
    time_taken_secs = models.IntegerField(default=0)

    class Meta:
        db_table = 'quiz_attempts'
        ordering = ['attempt_number']

    def __str__(self):
        return (
            f'{self.progress.student.email} | '
            f'{self.progress.topic_video} | '
            f'Attempt {self.attempt_number} | {self.score_pct:.0f}%'
        )


# ═══════════════════════════════════════════════════════════════════════════════
# GAMIFICATION — Badges, Goals, Streaks
# ═══════════════════════════════════════════════════════════════════════════════

class Badge(models.Model):
    BADGE_TYPES = [
        ('streak',      'Streak Badge'),
        ('completion',  'Completion Badge'),
        ('score',       'Score Badge'),
        ('speed',       'Speed Badge'),
        ('milestone',   'Milestone Badge'),
    ]
    slug        = models.SlugField(unique=True)
    name        = models.CharField(max_length=100)
    description = models.CharField(max_length=300)
    icon        = models.CharField(max_length=10, default='🏅')
    badge_type  = models.CharField(max_length=20, choices=BADGE_TYPES)
    threshold   = models.IntegerField(default=1,
                                      help_text='Value needed to earn this badge (days for streak, % for score, count for completion)')
    xp_reward   = models.IntegerField(default=50)
    is_active   = models.BooleanField(default=True)

    class Meta:
        db_table = 'badges'
        ordering = ['badge_type', 'threshold']

    def __str__(self):
        return self.name


class StudentBadge(models.Model):
    user        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='earned_badges')
    badge       = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at   = models.DateTimeField(auto_now_add=True)
    exam_slug   = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'student_badges'
        unique_together = [['user', 'badge', 'exam_slug']]


class StudentGoal(models.Model):
    PERIOD = [('daily', 'Daily'), ('weekly', 'Weekly')]
    METRIC = [
        ('videos',    'Videos to watch'),
        ('quiz_score','Min quiz score %'),
        ('study_mins','Study minutes'),
        ('topics',    'Topics to complete'),
    ]
    user        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='goals')
    exam_slug   = models.CharField(max_length=20)
    period      = models.CharField(max_length=10, choices=PERIOD, default='daily')
    metric      = models.CharField(max_length=20, choices=METRIC)
    target      = models.IntegerField()
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_goals'


class SpacedRepetition(models.Model):
    """Tracks when a topic should be revisited based on quiz performance."""
    user        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='spaced_reps')
    topic       = models.ForeignKey('courses.CurriculumTopic', on_delete=models.CASCADE)
    last_score  = models.FloatField(default=0)
    review_due  = models.DateField()
    interval_days = models.IntegerField(default=1)
    ease_factor = models.FloatField(default=2.5)  # SM-2 algorithm
    reps        = models.IntegerField(default=0)

    class Meta:
        db_table = 'spaced_repetition'
        unique_together = [['user', 'topic']]

    def next_interval(self, score_pct):
        """SM-2 spaced repetition algorithm."""
        import math, datetime
        q = score_pct / 100 * 5  # convert % to 0-5 scale
        if q < 3:
            self.reps = 0
            self.interval_days = 1
        else:
            if self.reps == 0:   self.interval_days = 1
            elif self.reps == 1: self.interval_days = 6
            else: self.interval_days = round(self.interval_days * self.ease_factor)
            self.reps += 1
        self.ease_factor = max(1.3, self.ease_factor + 0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        self.last_score  = score_pct
        self.review_due  = datetime.date.today() + datetime.timedelta(days=self.interval_days)
        self.save()


# ═══════════════════════════════════════════════════════════════════════════════
# COHORT BATCHES — morning/evening, weekday/weekend
# ═══════════════════════════════════════════════════════════════════════════════

class CourseBatch(models.Model):
    DAYS = [
        ('mwf',  'Mon/Wed/Fri'),
        ('tts',  'Tue/Thu/Sat'),
        ('daily','Daily'),
        ('wknd', 'Weekends only'),
        ('wkday','Weekdays only'),
    ]
    course      = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='batches')
    name        = models.CharField(max_length=100,
                                   help_text='e.g. "Morning Batch", "Evening Batch", "Weekend Batch"')
    timing      = models.CharField(max_length=100, blank=True,
                                   help_text='e.g. "7:00 AM – 9:00 AM IST"')
    days        = models.CharField(max_length=10, choices=DAYS, default='mwf')
    max_seats   = models.IntegerField(default=30)
    seats_filled= models.IntegerField(default=0)
    is_active   = models.BooleanField(default=True)
    start_date  = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'course_batches'
        ordering = ['name']

    def __str__(self):
        return f'{self.course} — {self.name}'

    @property
    def seats_left(self):
        return max(0, self.max_seats - self.seats_filled)


# ═══════════════════════════════════════════════════════════════════════════════
# VIDEO FEATURES — Bookmarks, Chapters, Student Notes, Transcripts
# ═══════════════════════════════════════════════════════════════════════════════

class VideoBookmark(models.Model):
    user        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='bookmarks')
    topic_video = models.ForeignKey(TopicVideo, on_delete=models.CASCADE, related_name='bookmarks')
    timestamp_secs = models.IntegerField()
    note        = models.CharField(max_length=500, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'video_bookmarks'
        ordering = ['timestamp_secs']

    def __str__(self):
        return f'{self.user} — {self.topic_video} @ {self.timestamp_secs}s'

    @property
    def timestamp_display(self):
        m, s = divmod(self.timestamp_secs, 60)
        return f'{m}:{s:02d}'


class VideoChapter(models.Model):
    topic_video    = models.ForeignKey(TopicVideo, on_delete=models.CASCADE, related_name='chapters')
    title          = models.CharField(max_length=200)
    timestamp_secs = models.IntegerField()
    sort_order     = models.IntegerField(default=0)

    class Meta:
        db_table = 'video_chapters'
        ordering = ['timestamp_secs']


class StudentNote(models.Model):
    user        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='student_notes')
    topic_video = models.ForeignKey(TopicVideo, on_delete=models.CASCADE, related_name='student_notes', null=True, blank=True)
    topic       = models.ForeignKey('courses.CurriculumTopic', on_delete=models.CASCADE, related_name='student_notes', null=True, blank=True)
    content     = models.TextField(blank=True)
    updated_at  = models.DateTimeField(auto_now=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_notes'
        unique_together = [['user', 'topic_video'], ['user', 'topic']]


class VideoTranscript(models.Model):
    topic_video  = models.ForeignKey(TopicVideo, on_delete=models.CASCADE, related_name='transcripts')
    language     = models.CharField(max_length=10, default='en')
    # JSON list of {start_secs, end_secs, text} segments
    segments     = models.JSONField(default=list)
    full_text    = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'video_transcripts'
        unique_together = [['topic_video', 'language']]


# ═══════════════════════════════════════════════════════════════════════════════
# ENGAGEMENT TRACKING — Watch time, drop-off, milestones
# ═══════════════════════════════════════════════════════════════════════════════

class WatchSession(models.Model):
    """Records each watch session for drop-off analysis."""
    user           = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='watch_sessions')
    topic_video    = models.ForeignKey(TopicVideo, on_delete=models.CASCADE, related_name='watch_sessions')
    started_at     = models.DateTimeField(auto_now_add=True)
    ended_at       = models.DateTimeField(null=True, blank=True)
    max_reached_secs = models.IntegerField(default=0)
    total_watch_secs = models.IntegerField(default=0)
    speed          = models.FloatField(default=1.0)
    # Heatmap: list of {secs: N, watched: bool} sampled every 10s
    heatmap        = models.JSONField(default=list)

    class Meta:
        db_table = 'watch_sessions'
        ordering = ['-started_at']


class StudySession(models.Model):
    """Daily study time tracking — for the GitHub-style heatmap."""
    user       = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='study_sessions')
    date       = models.DateField()
    exam_slug  = models.CharField(max_length=20, blank=True)
    minutes    = models.IntegerField(default=0)
    videos     = models.IntegerField(default=0)
    quizzes    = models.IntegerField(default=0)

    class Meta:
        db_table = 'study_sessions'
        unique_together = [['user', 'date', 'exam_slug']]


class StudentMilestone(models.Model):
    """Tracks celebrated milestones so we only celebrate once."""
    MILESTONES = [
        ('first_video',    'Watched First Video'),
        ('first_quiz',     'Completed First Quiz'),
        ('streak_3',       '3-Day Streak'),
        ('streak_7',       '7-Day Streak'),
        ('streak_30',      '30-Day Streak'),
        ('videos_10',      '10 Videos Watched'),
        ('videos_50',      '50 Videos Watched'),
        ('level_5',        'Reached Level 5'),
        ('perfect_score',  'First Perfect Quiz Score'),
    ]
    user          = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='milestones')
    milestone     = models.CharField(max_length=30, choices=MILESTONES)
    achieved_at   = models.DateTimeField(auto_now_add=True)
    exam_slug     = models.CharField(max_length=20, blank=True)
    celebrated    = models.BooleanField(default=False)

    class Meta:
        db_table = 'student_milestones'
        unique_together = [['user', 'milestone', 'exam_slug']]


# ═══════════════════════════════════════════════════════════════════════════════
# RESULTS WALL
# ═══════════════════════════════════════════════════════════════════════════════

class StudentResult(models.Model):
    """Verified student results shown on the public results wall.
    Each result can optionally have a full detail page (like a blog post)
    with an interview video (YouTube or Bunny) and write-up text."""
    VIDEO_TYPE_CHOICES = [('', 'None'), ('youtube', 'YouTube'), ('bunny', 'Bunny')]

    user        = models.ForeignKey('accounts.User', on_delete=models.CASCADE,
                                    related_name='results', null=True, blank=True)
    name        = models.CharField(max_length=100)
    exam        = models.CharField(max_length=20)
    year        = models.IntegerField()
    percentile  = models.FloatField()
    score       = models.CharField(max_length=50, blank=True)
    college_calls = models.CharField(max_length=300, blank=True,
                                     help_text='e.g. "IIM A, IIM B, XLRI"')
    photo_url   = models.URLField(blank=True)
    testimonial = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    # ── Detail page (optional, blog-style) ──────────────────────────
    slug        = models.SlugField(max_length=140, unique=True, blank=True, null=True,
                                   help_text='Leave blank to auto-generate from name. Used for the public /results/<slug> page.')
    video_type  = models.CharField(max_length=10, choices=VIDEO_TYPE_CHOICES, blank=True, default='')
    video_url   = models.URLField(blank=True,
                                  help_text='YouTube: any normal watch/share link. Bunny: the direct iframe embed URL.')
    body        = models.TextField(blank=True,
                                   help_text='Full write-up / interview content for the detail page.')
    meta_title  = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=300, blank=True)

    class Meta:
        db_table = 'student_results'
        ordering = ['-percentile', '-year']


class CheatSheet(models.Model):
    """Persists cheat sheet content per topic video."""
    topic_video  = models.OneToOneField(TopicVideo, on_delete=models.CASCADE, related_name='cheatsheet_content')
    summary      = models.TextField(blank=True)
    key_points   = models.JSONField(default=list, blank=True)
    formulas     = models.JSONField(default=list, blank=True)
    raw_markdown = models.TextField(blank=True)
    updated_at   = models.DateTimeField(auto_now=True)
    updated_by   = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='cheatsheets_updated')

    class Meta:
        db_table = 'cheatsheets'


# ═══════════════════════════════════════════════════════════════════════════════
# STUDY PLAN — AI-generated personalised day-by-day plan
# ═══════════════════════════════════════════════════════════════════════════════

class StudyPlan(models.Model):
    """AI-generated personalised study plan for a student."""
    user          = models.ForeignKey('accounts.User', on_delete=models.CASCADE,
                                      related_name='study_plans')
    exam_slug     = models.CharField(max_length=20)
    exam_date     = models.DateField(help_text='Target exam date')
    daily_hours   = models.FloatField(default=2.0,
                                      help_text='Study hours available per day')
    generated_at  = models.DateTimeField(auto_now_add=True)
    is_active     = models.BooleanField(default=True)

    # The plan — JSON list of week objects
    # [{week:1, theme:"VARC Foundation", days:[
    #   {day:1, date:"2026-06-01", tasks:[
    #     {type:"video", topic:"RC Strategy", duration_mins:20, topic_slug:"rc-strategy", section_slug:"cat-varc"},
    #     {type:"quiz",  topic:"RC Strategy Quiz", duration_mins:15},
    #     {type:"review",topic:"Para Jumbles (weak)", duration_mins:10, reason:"quiz score 32%"},
    #   ]}
    # ]}]
    plan_data     = models.JSONField(default=list)

    # Input context used to generate (for regeneration)
    context_used  = models.JSONField(default=dict,
                                     help_text='Snapshot of weak topics, goals etc used to generate')

    class Meta:
        db_table  = 'study_plans'
        ordering  = ['-generated_at']

    def __str__(self):
        return f'{self.user} — {self.exam_slug} plan ({self.exam_date})'

    @property
    def days_to_exam(self):
        import datetime
        return max(0, (self.exam_date - datetime.date.today()).days)

    @property
    def total_weeks(self):
        return max(1, (self.days_to_exam + 6) // 7)


# ═══════════════════════════════════════════════════════════════════════════════
# QUIZ QUESTIONS — proper M2M link between TopicVideo and Question
# ═══════════════════════════════════════════════════════════════════════════════

class TopicVideoQuestion(models.Model):
    """
    Links a specific Question from the master question bank
    to a TopicVideo quiz.

    This is the authoritative table for "which questions appear
    in this video's quiz". Admin adds/removes/reorders questions here.

    Usage:
      - When has_quiz=True, the quiz portal fetches questions via this table
      - Falls back to quiz_source (QATopic) if no rows exist here
      - sort_order controls question sequence in the quiz
    """
    topic_video  = models.ForeignKey(
        TopicVideo, on_delete=models.CASCADE,
        related_name='quiz_questions'
    )
    question     = models.ForeignKey(
        'tools.Question', on_delete=models.CASCADE,
        related_name='topic_video_quizzes'
    )
    sort_order   = models.IntegerField(default=0)
    is_active    = models.BooleanField(default=True)
    added_at     = models.DateTimeField(auto_now_add=True)
    added_by     = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='questions_added'
    )

    class Meta:
        db_table        = 'topic_video_questions'
        ordering        = ['sort_order', 'added_at']
        unique_together = [['topic_video', 'question']]

    def __str__(self):
        return f'{self.topic_video} → Q{self.sort_order}: {self.question}'


# ═══════════════════════════════════════════════════════════════════════════════
# CHEAT SHEET FILE — PDF stored in Bunny, linked to a TopicVideo
# ═══════════════════════════════════════════════════════════════════════════════

class CheatSheetFile(models.Model):
    """
    A PDF cheat sheet file for a topic video.
    Uploaded to Bunny Storage, URL stored here.

    Can coexist with CheatSheet (structured text) — both can be present.
    Students see both: the structured HTML view AND a PDF download link.
    """
    topic_video  = models.ForeignKey(
        TopicVideo, on_delete=models.CASCADE,
        related_name='cheatsheet_files'
    )
    title        = models.CharField(max_length=200,
                                    help_text='e.g. "RC Strategy — Formula Sheet"')
    bunny_file_url = models.URLField(
        help_text='Full Bunny CDN URL to the PDF file')
    bunny_storage_path = models.CharField(max_length=500, blank=True,
                                          help_text='Path in Bunny Storage for deletion')
    file_size_kb = models.IntegerField(default=0)
    uploaded_by  = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='uploaded_cheatsheets'
    )
    uploaded_at  = models.DateTimeField(auto_now_add=True)
    is_active    = models.BooleanField(default=True)

    class Meta:
        db_table = 'cheatsheet_files'
        ordering = ['uploaded_at']

    def __str__(self):
        return f'{self.topic_video} — {self.title}'


# ═══════════════════════════════════════════════════════════════════════════════
# EXAM ENROLLMENT — which course/exam a student is actively studying
# (separate from payment Enrollment — this is the "active course" selection)
# ═══════════════════════════════════════════════════════════════════════════════

class ActiveCourse(models.Model):
    """
    Tracks which course a student has selected as their current active course.
    Students can be enrolled in multiple exams but focus on one at a time.
    """
    user        = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE,
        related_name='active_courses'
    )
    exam_slug   = models.CharField(max_length=20)
    course      = models.ForeignKey(
        'courses.Course', on_delete=models.CASCADE,
        related_name='active_students', null=True, blank=True
    )
    selected_at = models.DateTimeField(auto_now=True)
    is_primary  = models.BooleanField(default=False,
                                      help_text='Primary course shown first on dashboard')

    class Meta:
        db_table        = 'active_courses'
        unique_together = [['user', 'exam_slug']]

    def __str__(self):
        return f'{self.user} → {self.exam_slug}'


# ═══════════════════════════════════════════════════════════════════════════════
# MOCK SCORE TRACKER
# ═══════════════════════════════════════════════════════════════════════════════

class MockScore(models.Model):
    """Student logs each mock test attempt — overall + section scores."""
    PROVIDERS = [
        ('testfunda', 'Testfunda'),
        ('gradskool', 'GRADSKOOL'),
        ('ims',       'IMS'),
        ('time',      'TIME'),
        ('cl',        'Career Launcher'),
        ('cracku',    'Cracku'),
        ('other',     'Other'),
    ]

    user         = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='mock_scores'
    )
    exam_slug    = models.CharField(max_length=20, db_index=True)
    mock_name    = models.CharField(max_length=200, blank=True,
                                    help_text='e.g. "Testfunda CAT Mock 3" or "GRADSKOOL Full Mock 1"')
    provider     = models.CharField(max_length=20, choices=PROVIDERS, default='testfunda')
    taken_on     = models.DateField()
    mock_number  = models.IntegerField(default=0,
                                       help_text='Sequential mock number — used to order on trend chart')

    # Overall
    overall_score      = models.FloatField(default=0,
                                           help_text='Raw score (CAT: typically -72 to 198)')
    overall_percentile = models.FloatField(null=True, blank=True,
                                           help_text='Percentile if known (0-100)')

    # Section scores — stored as JSON so it works for all exams
    # CAT:  {"varc": {"score": 48, "correct": 19, "wrong": 4, "time_mins": 40},
    #        "dilr": {...}, "qa": {...}}
    # XAT:  {"verbal": {...}, "decision": {...}, "qa": {...}, "gk": {...}}
    sections     = models.JSONField(default=dict, blank=True)

    # Optional analysis notes
    notes        = models.TextField(blank=True,
                                    help_text="Student own analysis -- what went wrong, what to improve")

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mock_scores'
        ordering = ['taken_on', 'mock_number']
        indexes  = [
            models.Index(fields=['user', 'exam_slug']),
            models.Index(fields=['user', 'taken_on']),
        ]

    def __str__(self):
        return f'{self.user} — {self.exam_slug} Mock {self.mock_number} ({self.taken_on})'