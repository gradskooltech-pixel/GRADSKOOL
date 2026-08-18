"""
GRADSKOOL — Tools + Question Bank Models

Every question in every free tool lives here.
Tags link questions back to exams, topics, difficulty, and tool type.

Models:
  Tool              → A named free practice tool (RC99, CAT Maths, GRE Vocab…)
  ToolLead          → Email captured at the tool gate
  Tag               → Flat tag system: exam / section / topic / difficulty / source
  Question          → Master question record (MCQ, TITA, passage-linked, vocab)
  QuestionOption    → Answer choices for MCQ questions
  Passage           → RC passage; questions reference it via FK
  VocabWord         → GRE vocab (759 words); treated as a special question type
  QATopic           → CAT Maths topic with concept notes + formulas
  ToolSession       → Tracks a user/lead's activity in a tool
  ToolAnswer        → Per-question answer in a session

Tag taxonomy (tag_type field):
  exam      → CAT, GMAT, GRE, IPMAT, XAT, SNAP, NMAT, CMAT, CLAT
  section   → VARC, DILR, QA, Verbal, Quant, DI, LegalReasoning, GK
  topic     → NumberTheory, Geometry, RC, Inference, CriticalReasoning…
  difficulty → Easy, Medium, Hard
  source    → RC99, RC111, GREVerbal, CATMaths, Grammar, GK450, Reasoning
"""
from django.db import models
from django.utils.text import slugify

from shared.utils import sanitize_html


# ── TAG SYSTEM ────────────────────────────────────────────────────────────────

class Tag(models.Model):
    TAG_TYPES = [
        ('exam',       'Exam'),
        ('section',    'Section'),
        ('topic',      'Topic'),
        ('difficulty', 'Difficulty'),
        ('source',     'Source'),
        ('type',       'Question Type'),
    ]
    name     = models.CharField(max_length=80, unique=True)
    slug     = models.SlugField(max_length=80, unique=True)
    tag_type = models.CharField(max_length=20, choices=TAG_TYPES)
    parent   = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='children'
    )

    class Meta:
        db_table = 'tags'
        ordering = ['tag_type', 'name']
        indexes  = [models.Index(fields=['tag_type'])]

    def __str__(self):
        return f'[{self.tag_type}] {self.name}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# ── TOOL ──────────────────────────────────────────────────────────────────────

class Tool(models.Model):
    TOOL_TYPES = [
        ('rc_passages',  'RC Passages'),
        ('qa_topics',    'QA Topics'),
        ('vocabulary',   'Vocabulary'),
        ('mcq_practice', 'MCQ Practice'),
        ('grammar',      'Grammar'),
        ('gk',           'General Knowledge'),
        ('reasoning',    'Reasoning'),
        ('legal',        'Legal Awareness'),
    ]
    slug        = models.SlugField(unique=True, max_length=80)
    name        = models.CharField(max_length=120)
    description = models.TextField()
    tool_type   = models.CharField(max_length=30, choices=TOOL_TYPES)
    tags        = models.ManyToManyField(Tag, blank=True, related_name='tools')
    is_active   = models.BooleanField(default=True)
    requires_lead_gate = models.BooleanField(default=True)
    sort_order  = models.IntegerField(default=0)
    question_count = models.IntegerField(default=0)  # Cached, updated by signal
    og_image_url   = models.URLField(blank=True)
    meta_title     = models.CharField(max_length=160, blank=True)
    meta_desc      = models.CharField(max_length=320, blank=True)

    # Monetisation fields (for future premium/subscription model)
    ACCESS_FREE       = 'free'
    ACCESS_PREMIUM    = 'premium'
    ACCESS_CHOICES    = [('free','Free'),('premium','Premium')]
    access_model      = models.CharField(max_length=20, choices=ACCESS_CHOICES, default='free')
    price_inr         = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True,
        help_text='Price if access_model is premium')
    razorpay_plan_id  = models.CharField(max_length=80, blank=True,
        help_text='Razorpay subscription plan ID for premium tools')
    preview_questions = models.IntegerField(default=5,
        help_text='How many questions are shown free before the paywall')
    badge_text        = models.CharField(max_length=40, blank=True,
        help_text='e.g. "New" or "Premium" — shown on tool card')

    class Meta:
        db_table = 'tools'
        ordering = ['sort_order']

    def __str__(self):
        return self.name


class ToolLead(models.Model):
    """Lead captured at the tool gate — name + email + target exam."""
    name        = models.CharField(max_length=120)
    email       = models.EmailField(db_index=True)
    target_exam = models.CharField(max_length=30, blank=True)
    tool        = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='leads')
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    user_agent  = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    access_token = models.CharField(max_length=256, blank=True)  # Signed JWT

    class Meta:
        db_table       = 'tool_leads'
        unique_together = ('email', 'tool')
        indexes = [models.Index(fields=['email', 'tool'])]

    def __str__(self):
        return f'{self.email} → {self.tool.slug}'


# ── PASSAGE ───────────────────────────────────────────────────────────────────

class Passage(models.Model):
    """
    RC passage. Shared by multiple Question records via FK.
    Indexed by tool (RC99, RC111) and category (Philosophy, Science…).
    """
    tool        = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='passages')
    number      = models.IntegerField()            # 1–111 for RC111, etc.
    category    = models.CharField(max_length=100) # 'Philosophy', 'Economics'
    title       = models.CharField(max_length=255, blank=True)
    text        = models.TextField()
    word_count  = models.IntegerField(null=True)
    difficulty  = models.IntegerField(default=3)   # 1=Easy, 5=Hard
    source_note = models.CharField(max_length=255, blank=True)
    tags        = models.ManyToManyField(Tag, blank=True, related_name='passages')

    class Meta:
        db_table       = 'passages'
        unique_together = ('tool', 'number')
        ordering       = ['tool', 'number']
        indexes        = [models.Index(fields=['tool', 'difficulty'])]

    def __str__(self):
        return f'{self.tool.slug} P{self.number}: {self.title or self.category}'

    def save(self, *args, **kwargs):
        if self.text and not self.word_count:
            self.word_count = len(self.text.split())
        super().save(*args, **kwargs)


# ── QUESTION ──────────────────────────────────────────────────────────────────

class Question(models.Model):
    """
    Master question record. All tools draw from this table.

    question_type:
      mcq      → 4 options, one correct
      mcq_multi→ multiple correct (DILR sets)
      tita     → Type In The Answer (numeric, no options)
      vocab    → GRE vocab; answer = definition match
      grammar  → Grammar correction MCQ
      gk       → General Knowledge MCQ

    Tags fully classify every question:
      exam + section + topic + difficulty + source
    """
    TYPES = [
        ('mcq',       'MCQ — Single Correct'),
        ('mcq_multi', 'MCQ — Multiple Correct'),
        ('tita',      'TITA — Numeric'),
        ('vocab',     'Vocabulary'),
        ('grammar',   'Grammar'),
        ('gk',        'General Knowledge'),
    ]

    # Source
    tool            = models.ForeignKey(
        Tool, on_delete=models.CASCADE, related_name='questions', null=True, blank=True
    )
    passage         = models.ForeignKey(
        Passage, on_delete=models.CASCADE,
        null=True, blank=True, related_name='questions'
    )
    # For passage-linked questions, passage_position helps preserve reading order
    passage_position = models.IntegerField(null=True, blank=True)

    # Content
    question_type   = models.CharField(max_length=20, choices=TYPES, default='mcq')
    question_text   = models.TextField()
    explanation     = models.TextField(blank=True)
    correct_answer  = models.CharField(max_length=20, blank=True)
    # For MCQ: 'a', 'b', 'c', 'd'
    # For TITA: the numeric answer as string
    # For MCQ_MULTI: comma-separated, e.g. 'a,c'

    # Scoring
    marks_correct   = models.DecimalField(max_digits=4, decimal_places=2, default=3)
    marks_wrong     = models.DecimalField(max_digits=4, decimal_places=2, default=-1)
    # TITA: marks_wrong = 0

    # Full tag classification
    tags            = models.ManyToManyField(Tag, blank=True, related_name='questions')

    # Metadata
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    # Denormalised for fast filtering (kept in sync via save())
    exam_tag        = models.CharField(max_length=30, blank=True, db_index=True)
    section_tag     = models.CharField(max_length=30, blank=True, db_index=True)
    topic_tag       = models.CharField(max_length=100, blank=True, db_index=True)
    difficulty_tag  = models.CharField(max_length=20, blank=True, db_index=True)
    source_tag      = models.CharField(max_length=80, blank=True, db_index=True)

    class Meta:
        db_table = 'questions'
        indexes  = [
            models.Index(fields=['exam_tag', 'section_tag']),
            models.Index(fields=['tool', 'is_active']),
            models.Index(fields=['difficulty_tag']),
        ]

    def __str__(self):
        return f'[{self.exam_tag}/{self.section_tag}] {self.question_text[:60]}…'

    def get_correct_answers(self):
        """Returns a set of correct answer keys."""
        return set(self.correct_answer.split(','))


class QuestionOption(models.Model):
    """Answer choices for MCQ questions. Always 4 per question."""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    key      = models.CharField(max_length=1)   # 'a', 'b', 'c', 'd'
    text     = models.TextField()
    is_correct = models.BooleanField(default=False)

    class Meta:
        db_table       = 'question_options'
        unique_together = ('question', 'key')
        ordering       = ['key']

    def __str__(self):
        return f'({self.key}) {self.text[:60]}'


# ── VOCAB ─────────────────────────────────────────────────────────────────────

class VocabWord(models.Model):
    """
    GRE vocabulary word. 759 words from gre-vocab-forge.html.
    Each word also has a Question record for quiz mode.
    """
    DIFFICULTY = [
        ('high',   'High Frequency'),
        ('medium', 'Medium Frequency'),
        ('low',    'Low Frequency'),
    ]
    tool        = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='vocab_words')
    question    = models.OneToOneField(
        Question, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='vocab_word'
    )
    word        = models.CharField(max_length=100, unique=True, db_index=True)
    definition  = models.TextField()
    etymology   = models.TextField(blank=True)
    example     = models.TextField(blank=True)
    synonyms    = models.CharField(max_length=255, blank=True)
    difficulty  = models.CharField(max_length=10, choices=DIFFICULTY, default='medium')
    tags        = models.ManyToManyField(Tag, blank=True)
    sort_order  = models.IntegerField(default=0)

    class Meta:
        db_table = 'vocab_words'
        ordering = ['sort_order', 'word']
        indexes  = [models.Index(fields=['difficulty'])]

    def __str__(self):
        return f'{self.word} ({self.difficulty})'


# ── QA TOPIC ──────────────────────────────────────────────────────────────────

class QATopic(models.Model):
    """
    CAT Maths topic with concept notes + formulas.
    34 topics from gradskool-cat-maths.html.
    Questions are tagged with this topic via the Tag system.
    """
    CATEGORIES = [
        ('arithmetic',  'Arithmetic'),
        ('algebra',     'Algebra'),
        ('geometry',    'Geometry & Mensuration'),
        ('number',      'Number Theory'),
        ('modern',      'Modern Math'),
        ('logic',       'Logical Reasoning'),
    ]
    tool          = models.ForeignKey(Tool, on_delete=models.CASCADE, related_name='qa_topics')
    number        = models.IntegerField()
    name          = models.CharField(max_length=120)  # 'Number Theory'
    category      = models.CharField(max_length=20, choices=CATEGORIES)
    concept_notes = models.TextField(blank=True)
    formulas      = models.TextField(blank=True)
    tag           = models.ForeignKey(
        Tag, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='qa_topics',
        help_text='Topic tag — links questions to this topic'
    )
    sort_order    = models.IntegerField(default=0)

    class Meta:
        db_table       = 'qa_topics'
        ordering       = ['sort_order', 'number']
        unique_together = ('tool', 'number')

    def __str__(self):
        return f'{self.number:02d}. {self.name}'

    def save(self, *args, **kwargs):
        # Rich HTML from the admin editor, rendered raw via
        # dangerouslySetInnerHTML on the tool page's "Rules" tab.
        self.concept_notes = sanitize_html(self.concept_notes)
        super().save(*args, **kwargs)

    def question_count(self):
        if self.tag:
            return Question.objects.filter(tags=self.tag, is_active=True).count()
        return 0


# ── TOOL SESSION ──────────────────────────────────────────────────────────────

class ToolSession(models.Model):
    """
    Records a lead/user's activity within a tool.
    Used for analytics and for restoring state.
    """
    lead       = models.ForeignKey(ToolLead, on_delete=models.CASCADE, related_name='sessions')
    tool       = models.ForeignKey(Tool, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at   = models.DateTimeField(null=True, blank=True)
    questions_seen    = models.IntegerField(default=0)
    questions_correct = models.IntegerField(default=0)
    score_pct  = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'tool_sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.lead.email} / {self.tool.slug} @ {self.started_at:%Y-%m-%d}'


class ToolAnswer(models.Model):
    """Per-question answer within a ToolSession."""
    session    = models.ForeignKey(ToolSession, on_delete=models.CASCADE, related_name='answers')
    question   = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected   = models.CharField(max_length=20, blank=True)
    is_correct = models.BooleanField(null=True)
    time_spent_secs = models.IntegerField(default=0)
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tool_answers'
