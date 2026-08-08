"""
GRADSKOOL — FYQ (Future Year Questions) Models

Deliberately NOT built on the Foundations models — Foundation classes are
scheduled LIVE sessions (has scheduled_at, is_upcoming, duration_mins);
FYQ items are evergreen reference questions with no live component at all.

Hierarchy (variable depth, by design):
  FYQSection  — Quants, LRDI, VARC
  FYQCategory — optional middle level, e.g. Arithmetic, Algebra, Geometry
                (only Quants uses this; LRDI/VARC skip straight to Topic)
  FYQTopic    — e.g. "Averages & Mixtures" — belongs to EITHER a section
                directly (LRDI/VARC) OR a category (Quants), never both
  FYQQuestion — attaches to a Topic

This is CAT-only (no per-question exam tagging) — see the FYQAdmin frontend
for that decision; kept out of the model too, so there's nothing to
accidentally mis-set here.
"""
from django.db import models
from django.utils.text import slugify


class FYQSection(models.Model):
    """Level 1 — Quants, LRDI, VARC."""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    # Whether this section uses an intermediate Category level. True for
    # Quants (Arithmetic/Algebra/...), False for LRDI/VARC, where topics
    # attach directly to the section. Drives admin UI behavior — whether
    # "+ Add Category" even shows up for this section.
    has_categories = models.BooleanField(default=False)

    class Meta:
        db_table = 'fyq_sections'
        ordering = ['order', 'name']
        verbose_name_plural = 'FYQ Sections'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class FYQCategory(models.Model):
    """Level 2 (optional) — Arithmetic, Algebra, Geometry, Number System,
    Modern Maths. Only meaningful within a section that has
    has_categories=True, but not hard-enforced at the DB level — the admin
    UI is what actually gates when this gets offered."""
    section = models.ForeignKey(FYQSection, on_delete=models.CASCADE, related_name='categories')
    name    = models.CharField(max_length=100)
    slug    = models.SlugField(max_length=120, blank=True)
    order   = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'fyq_categories'
        ordering = ['order', 'name']
        unique_together = [['section', 'name']]
        verbose_name_plural = 'FYQ Categories'

    def __str__(self):
        return f'{self.section.name} — {self.name}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f'{self.section.slug}-{self.name}')
        super().save(*args, **kwargs)


class FYQTopic(models.Model):
    """Level 3 — e.g. "Averages & Mixtures". Belongs to a category
    (Quants-style) OR directly to a section (LRDI/VARC-style) — exactly
    one of the two should be set, enforced in the admin view logic rather
    than a DB constraint, to keep this simple."""
    section  = models.ForeignKey(FYQSection, on_delete=models.CASCADE, related_name='topics')
    category = models.ForeignKey(FYQCategory, on_delete=models.CASCADE, related_name='topics', null=True, blank=True)
    name     = models.CharField(max_length=100)
    slug     = models.SlugField(max_length=140, blank=True)
    order    = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'fyq_topics'
        ordering = ['order', 'name']
        verbose_name_plural = 'FYQ Topics'

    def __str__(self):
        parent = self.category.name if self.category else self.section.name
        return f'{parent} — {self.name}'

    def save(self, *args, **kwargs):
        if not self.slug:
            parent_slug = self.category.slug if self.category else self.section.slug
            self.slug = slugify(f'{parent_slug}-{self.name}')
        super().save(*args, **kwargs)

    @property
    def question_count(self):
        return self.questions.filter(is_published=True).count()


class FYQQuestion(models.Model):
    question_number = models.PositiveIntegerField(
        unique=True,
        help_text='e.g. 70 — the FYQ number, shown as "Future Year Question 070"'
    )
    topic = models.ForeignKey(
        FYQTopic, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='questions',
        help_text='Where this question lives in the Section → Category → Topic browse tree'
    )
    title = models.CharField(
        max_length=200,
        help_text='e.g. "Averages & Mixtures — Future Year Question 070"'
    )
    slug = models.SlugField(max_length=220, unique=True, blank=True)

    meta_description = models.CharField(
        max_length=300, blank=True,
        help_text='SEO meta description shown in Google search results. Falls back to a snippet of the long description if left blank. Keep it under ~155 characters for best display.'
    )

    youtube_url = models.URLField(blank=True, help_text='Solution walkthrough video')

    # Blog-like content — the actual question text/explanation, same
    # SEO/AEO-oriented rich text pattern as Foundations' long_description.
    long_description = models.TextField(
        blank=True,
        help_text='The question and full explanation, written up like a blog post — real content for search engines and AI answer engines to read and cite.'
    )
    notes = models.TextField(blank=True, help_text='Additional rich HTML notes/resources, optional')

    is_published = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'fyq_questions'
        ordering = ['-question_number']
        verbose_name = 'FYQ Question'
        verbose_name_plural = 'FYQ Questions'

    def __str__(self):
        return f'FYQ {self.question_number} — {self.title}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f'fyq-{self.question_number}-{self.title}')
        super().save(*args, **kwargs)

    @property
    def has_video(self):
        return bool(self.youtube_url)