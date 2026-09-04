"""
GRADSKOOL — Native Mock Test Engine

Three tiers a student sees — three SEPARATE, independently authored
question pools, not one shared bank:

  Full Mock   — a MockPaper with test_type='mock', 3ish MockSections
                (e.g. SNAP: General English / Analytical & Logical
                Reasoning / Quantitative-DI-DS), attempted in one sitting.
                Its MockQuestions belong to a MockSection.
  Sectional   — a MockPaper with test_type='sectional', exactly ONE
                MockSection, attempted on its own. Its MockQuestions
                also belong to a MockSection.
  Topic-wise  — its OWN pool. A MockQuestion authored for topic-wise
                practice belongs directly to a MockTopic (MockQuestion.topic)
                and to no MockSection/MockPaper at all. Assembled at
                attempt-start time by pulling that topic's own questions
                (services.build_topic_wise_questions) — nothing shared
                with mocks/sectionals.

Authoring: admin creates a MockPaper + its MockSection(s) (for mock/
sectional) OR a MockTopic (for topic-wise), then bulk-adds questions to
whichever one via paste_and_split() (parser.py) — same text format
GRADSCALE uses for PYQs (PASSAGE N / [STANDALONE] / Q1. / A) / ANS: /
EXP: / TITA:). Topic-wise authoring only accepts [STANDALONE]/bare
questions — no PASSAGE blocks (RC/DILR sets belong to a section).

Access: gated by apps.enrollments.models.CourseAccess.can_take_mocks +
mock_exams_unlocked (see services.py for the actual unlock logic, which
also layers a "don't let them rush" progression on top: topic-wise is
open first, sectional unlocks after some topic-wise reps, full mock
unlocks after all sections have been sectional-attempted).
"""
from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.utils.text import slugify


# ── TOPIC ─────────────────────────────────────────────────────────────────────

class MockTopic(models.Model):
    """
    Exam + section scoped topic (e.g. SNAP / Quant-DI-DS / "Number
    Theory"). Optional parent for a two-level tree, same pattern as
    FYQTopic/PYQTopic elsewhere. This IS the topic-wise question bank —
    MockQuestion.topic points directly here; these questions are authored
    specifically for topic-wise practice, separate from any mock/sectional
    paper's questions.
    """
    exam         = models.ForeignKey('courses.Exam', on_delete=models.CASCADE, related_name='mock_topics')
    section_name = models.CharField(max_length=60, help_text="Which real exam section this topic belongs to, e.g. 'QA-DI-DS' — grouping only, doesn't link to a MockSection's own question pool.")
    parent       = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    name         = models.CharField(max_length=150)
    slug         = models.SlugField(max_length=180, blank=True)
    order        = models.IntegerField(default=0)

    class Meta:
        db_table = 'mock_topics'
        ordering = ['section_name', 'order', 'name']
        unique_together = ['exam', 'section_name', 'slug']

    def __str__(self):
        return f'{self.exam.short_name} → {self.section_name} → {self.name}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)[:180]
        super().save(*args, **kwargs)

    @property
    def is_leaf(self):
        return not self.children.exists()

    @property
    def question_count(self):
        return self.questions.filter(is_active=True).count()

    @property
    def total_question_count(self):
        count = self.question_count
        for child in self.children.all():
            count += child.total_question_count
        return count


# ── PAPER ─────────────────────────────────────────────────────────────────────

class MockPaper(models.Model):
    TEST_TYPES = [
        ('mock',      'Full Mock'),
        ('sectional', 'Sectional'),
    ]

    exam        = models.ForeignKey('courses.Exam', on_delete=models.CASCADE, related_name='mock_papers')
    test_type   = models.CharField(max_length=12, choices=TEST_TYPES)
    title       = models.CharField(max_length=200, help_text="e.g. 'SNAP Mock 1' or 'SNAP Sectional — Quant-DI-DS Set 3'")
    slug        = models.SlugField(max_length=220, blank=True)
    description = models.TextField(blank=True)

    is_free     = models.BooleanField(default=False, help_text='Bypasses the paid-access AND the unlock-progression gate — always attemptable.')
    is_active   = models.BooleanField(default=True)
    release_at  = models.DateTimeField(null=True, blank=True, help_text='Leave blank = available immediately once active.')
    sort_order  = models.IntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mock_papers'
        ordering = ['exam', 'test_type', 'sort_order', '-created_at']
        unique_together = ['exam', 'slug']

    def __str__(self):
        return f'{self.exam.short_name} — {self.title}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:220]
        super().save(*args, **kwargs)

    @property
    def is_live(self):
        if not self.is_active:
            return False
        if not self.release_at:
            return True
        return self.release_at <= timezone.now()

    @property
    def total_questions(self):
        return MockQuestion.objects.filter(section__paper=self, is_active=True).count()

    @property
    def total_duration_mins(self):
        return sum(self.sections.values_list('time_limit_mins', flat=True))


# ── SECTION ───────────────────────────────────────────────────────────────────

class MockSection(models.Model):
    """
    One section within a paper. A 'sectional' paper always has exactly
    one of these (enforced by admin UI, not a DB constraint — same
    looseness GRADSKOOL already uses elsewhere for similar cases). A
    'mock' paper has one per real exam section.
    """
    paper           = models.ForeignKey(MockPaper, on_delete=models.CASCADE, related_name='sections')
    name            = models.CharField(max_length=60, help_text="e.g. 'General English', 'Quant-DI-DS' — free text, not a fixed exam-wide list")
    time_limit_mins = models.IntegerField(default=40)
    order           = models.IntegerField(default=1)

    class Meta:
        db_table = 'mock_sections'
        ordering = ['order']
        unique_together = ['paper', 'name']

    def __str__(self):
        return f'{self.paper} — {self.name}'

    @property
    def question_count(self):
        return self.questions.filter(is_active=True).count()


# ── PASSAGE ───────────────────────────────────────────────────────────────────

class MockPassage(models.Model):
    """Groups RC passages / DILR sets — questions attach via FK, same as PYQPassage."""
    section      = models.ForeignKey(MockSection, on_delete=models.CASCADE, related_name='passages')
    passage_text = models.TextField(help_text='RC passage or DILR set prompt. HTML allowed.')
    order        = models.IntegerField(default=1)

    class Meta:
        db_table = 'mock_passages'
        ordering = ['order']

    def __str__(self):
        return f'{self.section} — Passage {self.order}'

    @property
    def question_count(self):
        return self.questions.count()


# ── QUESTION ──────────────────────────────────────────────────────────────────

class MockQuestion(models.Model):
    QUESTION_TYPES = [
        ('MCQ',  'Multiple Choice'),
        ('TITA', 'Type In The Answer'),
    ]
    DIFFICULTY_CHOICES = [
        ('easy',     'Easy'),
        ('moderate', 'Moderate'),
        ('hard',     'Hard'),
    ]

    # Exactly one of (section) or (topic) is set, never both — enforced in
    # the admin views, not a DB constraint (same looseness this codebase
    # uses elsewhere). section = authored under a Full Mock/Sectional
    # paper. topic = authored directly as topic-wise practice content.
    section         = models.ForeignKey(MockSection, on_delete=models.CASCADE, null=True, blank=True, related_name='questions')
    passage         = models.ForeignKey(MockPassage, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    topic           = models.ForeignKey(MockTopic, on_delete=models.CASCADE, null=True, blank=True, related_name='questions',
                                         help_text='Set only for topic-wise practice questions — its own separate pool, not shared with mocks/sectionals.')

    question_type   = models.CharField(max_length=10, choices=QUESTION_TYPES, default='MCQ')
    question_text   = models.TextField()
    option_a        = models.TextField(blank=True)
    option_b        = models.TextField(blank=True)
    option_c        = models.TextField(blank=True)
    option_d        = models.TextField(blank=True)
    option_e        = models.TextField(blank=True, help_text='Optional 5th option (XAT-style). Leave blank for 4-option questions.')
    correct_option  = models.CharField(max_length=1, choices=[('A','A'),('B','B'),('C','C'),('D','D'),('E','E')], blank=True)
    tita_answer     = models.TextField(blank=True)

    difficulty      = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='moderate')
    explanation     = models.TextField(blank=True)

    correct_marks   = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('3'))
    negative_marks  = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('1'), help_text='Deducted on a wrong MCQ answer. TITA wrong answers score 0 by convention — leave negative_marks unused for TITA.')

    order           = models.IntegerField(default=1)
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mock_questions'
        ordering = ['order']
        indexes = [
            models.Index(fields=['section', 'difficulty']),
            models.Index(fields=['section', 'question_type']),
            models.Index(fields=['passage']),
            models.Index(fields=['topic', 'difficulty']),
        ]

    def __str__(self):
        owner = self.section or self.topic or '(unowned)'
        return f'{owner} — Q{self.order}'

    def score_response(self, selected_option: str):
        """Returns (is_correct, marks_awarded) for a given raw answer string."""
        selected_option = (selected_option or '').strip()
        if not selected_option:
            return None, Decimal('0')  # unattempted
        if self.question_type == 'TITA':
            is_correct = selected_option.strip().lower() == (self.tita_answer or '').strip().lower()
            return is_correct, (self.correct_marks if is_correct else Decimal('0'))
        is_correct = selected_option.strip().upper() == (self.correct_option or '').strip().upper()
        return is_correct, (self.correct_marks if is_correct else -self.negative_marks)


# ── ATTEMPT ───────────────────────────────────────────────────────────────────

class MockAttempt(models.Model):
    MODES = [
        ('full',      'Full Mock'),
        ('sectional', 'Sectional'),
        ('topic',     'Topic-wise'),
    ]

    user        = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='mock_attempts')
    exam        = models.ForeignKey('courses.Exam', on_delete=models.CASCADE, related_name='mock_attempts')
    mode        = models.CharField(max_length=10, choices=MODES)

    paper       = models.ForeignKey(MockPaper, on_delete=models.CASCADE, null=True, blank=True, related_name='attempts', help_text='Set for full/sectional')
    section     = models.ForeignKey(MockSection, on_delete=models.CASCADE, null=True, blank=True, related_name='attempts', help_text='Set for sectional (== paper.sections.first())')
    topic       = models.ForeignKey(MockTopic, on_delete=models.SET_NULL, null=True, blank=True, related_name='attempts', help_text='Set for topic-wise')

    # Topic-wise attempt config snapshot (paper/section attempts don't need these — content is fixed by authoring)
    difficulty_filter = models.CharField(max_length=10, blank=True, help_text="easy/moderate/hard/'' for topic-wise")
    question_count_requested = models.IntegerField(default=0)

    started_at      = models.DateTimeField(auto_now_add=True)
    expires_at      = models.DateTimeField(help_text='started_at + duration; used for resume + auto-submit')
    completed       = models.BooleanField(default=False)
    completed_at    = models.DateTimeField(null=True, blank=True)
    is_auto_submitted = models.BooleanField(default=False)

    score           = models.DecimalField(max_digits=7, decimal_places=2, default=Decimal('0'))
    total_questions = models.IntegerField(default=0)
    correct         = models.IntegerField(default=0)
    incorrect       = models.IntegerField(default=0)
    unattempted     = models.IntegerField(default=0)

    # {section_name: {correct, incorrect, unattempted, score, total, time_taken_secs}}
    section_breakdown = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'mock_attempts'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'exam', 'completed']),
            models.Index(fields=['user', 'paper', 'completed']),
            models.Index(fields=['user', 'topic', 'completed']),
        ]

    def __str__(self):
        return f'{self.user.email} — {self.mode} — {self.started_at:%Y-%m-%d %H:%M}'

    @property
    def is_expired(self):
        return not self.completed and timezone.now() > self.expires_at

    @property
    def time_remaining_secs(self):
        if self.completed:
            return 0
        return max(0, int((self.expires_at - timezone.now()).total_seconds()))


class MockResponse(models.Model):
    """One row per question per attempt — answer + palette state + scoring."""
    attempt         = models.ForeignKey(MockAttempt, on_delete=models.CASCADE, related_name='responses')
    question        = models.ForeignKey(MockQuestion, on_delete=models.CASCADE, related_name='responses')

    selected_option = models.TextField(blank=True, default='', help_text='A-E for MCQ, typed answer for TITA')
    is_visited      = models.BooleanField(default=False)
    is_marked_for_review = models.BooleanField(default=False)

    is_correct      = models.BooleanField(null=True)
    marks_awarded   = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0'))
    time_taken_secs = models.IntegerField(default=0)
    answered_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'mock_responses'
        unique_together = ['attempt', 'question']

    def __str__(self):
        return f'{self.attempt} — Q{self.question.order}'
