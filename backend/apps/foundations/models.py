"""
GRADSKOOL — Foundations Models

FoundationSeries  — a named series of free classes (e.g. "XAT Decision Making Series")
FoundationClass   — a single class in a series with date, time, topic, YouTube link, notes
"""
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


EXAM_CHOICES = [
    ('xat',  'XAT'),
    ('nmat', 'NMAT'),
    ('snap', 'SNAP'),
    ('cat',  'CAT'),
    ('gmat', 'GMAT'),
]


CONTENT_TYPE_CHOICES = [
    ('foundations',      'Foundations — starter content'),
    ('complete_course',  'Complete Course, Free'),
]


class FoundationSeries(models.Model):
    """
    A grouped series of foundation classes — can apply to MULTIPLE exams at
    once (e.g. a "Quant Basics" series relevant to XAT, SNAP, and NMAT
    simultaneously, since these exams share significant syllabus overlap).
    Publish once, appears on every relevant exam's listing page — no need
    to duplicate the same series three times.

    Uses JSONField (not Postgres ArrayField) specifically because it needs
    to work on SQLite in local dev as well as Postgres in production.
    """
    exams = models.JSONField(
        default=list,
        help_text='List of exam codes this series applies to, e.g. ["xat","snap"]. Set via the admin checkboxes, not typed directly.'
    )
    title       = models.CharField(max_length=200)
    slug        = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)

    # Multi-select, not single choice — the SAME series can genuinely be
    # "Foundations" for one exam and "Complete Course" for another once it's
    # tagged to multiple exams (e.g. one video that's a starter for XAT but
    # is literally part of the complete NMAT/SNAP course). This is informational
    # for your own reference in admin — the actual public-facing framing on
    # each exam's page is already determined independently by which page
    # that exam's content lives on (/foundations/xat vs /courses/nmat/live),
    # not by this field. Use it to help you remember what's what, not as
    # something the public site reads.
    content_types = models.JSONField(
        default=list,
        help_text='Which of these applies — pick one or both. Purely for your own reference; the actual public page framing per exam is fixed by URL, not by this field.'
    )

    # One comprehensive doc for the whole series — write once in admin, shows
    # at the top of the series' public listing page regardless of which
    # individual class someone lands on. This is separate from
    # FoundationClass.notes (per-class notes for that specific session).
    notes = models.TextField(
        blank=True,
        help_text='Rich HTML content covering the whole series — formulas, images, links. Added via admin editor. Shown on the public listing page above the class list.'
    )

    is_active   = models.BooleanField(default=True)
    order       = models.PositiveIntegerField(default=0, help_text='Display order on the page')
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = 'foundation_series'
        ordering  = ['order', 'created_at']  # can't order by a list field meaningfully
        verbose_name_plural = 'Foundation Series'

    def __str__(self):
        exams_label = '+'.join(e.upper() for e in (self.exams or [])) or 'No exams'
        return f'{exams_label} — {self.title}'

    def save(self, *args, **kwargs):
        if not self.slug:
            first_exam = (self.exams or ['series'])[0]
            self.slug = slugify(f'{first_exam}-{self.title}')
        super().save(*args, **kwargs)


class FoundationSection(models.Model):
    """
    A topic-based tag classes can be filed under (e.g. "Decision Making",
    "Quant Basics", "Reading Comprehension") — separate from FoundationSeries,
    which groups classes into a taught sequence/playlist. A section lets
    someone browse "every class about X" across series and dates, the way
    FYQTopic works for the FYQ question bank.

    Same multi-exam pattern as FoundationSeries: a section can apply to
    several exams at once (e.g. "Quant Basics" is relevant to XAT, SNAP,
    and NMAT simultaneously) rather than needing to be duplicated per exam.
    """
    exams = models.JSONField(
        default=list,
        help_text='List of exam codes this section applies to, e.g. ["xat","snap"]. Set via the admin checkboxes.'
    )
    name        = models.CharField(max_length=100)
    slug        = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    order       = models.PositiveIntegerField(default=0, help_text='Display order when browsing sections')
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'foundation_sections'
        ordering = ['order', 'name']

    def __str__(self):
        exams_label = '+'.join(e.upper() for e in (self.exams or [])) or 'No exams'
        return f'{exams_label} — {self.name}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class FoundationClass(models.Model):
    """
    A single class in a Foundation series.

    Before the class:  scheduled_at is set, youtube_url is blank → shows as upcoming
    After the class:   youtube_url is filled in → shows recording
    """
    series          = models.ForeignKey(
        FoundationSeries, on_delete=models.CASCADE, related_name='classes'
    )
    section         = models.ForeignKey(
        FoundationSection, on_delete=models.SET_NULL, related_name='classes',
        null=True, blank=True,
        help_text='Optional topic tag (e.g. "Decision Making") — lets this class be found by browsing that topic, separate from which series it belongs to.'
    )

    # Optional override — a series can be tagged to multiple exams (e.g.
    # XAT+SNAP+NMAT), but not every video in it is necessarily relevant to
    # all of them. Empty list = inherit the series' exams (the old,
    # backward-compatible behavior). Non-empty = this class only shows
    # under these specific exams, regardless of what the series is tagged
    # with more broadly.
    exams = models.JSONField(
        default=list, blank=True,
        help_text='Leave empty to inherit every exam the series is tagged with. Set specific exams here only if this particular video isn\'t relevant to all of them.'
    )

    lesson_number   = models.PositiveIntegerField(help_text='e.g. 1, 2, 3 — order within the series')
    title           = models.CharField(max_length=200, help_text='e.g. "Decision Making — Analytical Reasoning"')
    slug            = models.SlugField(max_length=220, blank=True)
    description     = models.TextField(blank=True, help_text='What this class covers — shown on the listing page')

    meta_description = models.CharField(
        max_length=300, blank=True,
        help_text='SEO meta description shown in Google search results. Falls back to the short description above if left blank. Keep it under ~155 characters for best display.'
    )

    # Distinct from the short description above — this is substantial,
    # crawlable prose about what the video actually covers: the real content
    # search engines and AI answer engines (SEO/AEO/GEO) need to understand
    # and cite this page. A video embed alone gives crawlers almost nothing
    # to index; this field is what actually makes the page findable.
    long_description = models.TextField(
        blank=True,
        help_text='A few real paragraphs about what this video covers — this is the main text search engines and AI answer engines will read and cite. Shown prominently on the class page, above the video.'
    )
    scheduled_at    = models.DateTimeField(help_text='Date and time of the live class (IST)')
    duration_mins   = models.PositiveIntegerField(default=60, help_text='Expected duration in minutes')

    # After class happens
    youtube_url     = models.URLField(
        blank=True,
        help_text='Paste YouTube URL after the class is recorded — activates the recording on the page'
    )

    # Rich content (notes, images, formulas added by ALP Sir)
    notes           = models.TextField(
        blank=True,
        help_text='Rich HTML content — notes, images, formulas for this class. Added via admin editor.'
    )

    is_published    = models.BooleanField(default=True, help_text='Uncheck to hide this class')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = 'foundation_classes'
        ordering  = ['series', 'lesson_number']
        unique_together = [['series', 'lesson_number']]

    def __str__(self):
        exams_label = '+'.join(e.upper() for e in (self.series.exams or [])) or 'No exams'
        return f'{exams_label} L{self.lesson_number} — {self.title}'

    def save(self, *args, **kwargs):
        if not self.slug:
            first_exam = (self.series.exams or ['class'])[0]
            self.slug = slugify(f'{first_exam}-{self.lesson_number}-{self.title}')
        super().save(*args, **kwargs)

    @property
    def is_upcoming(self):
        return self.scheduled_at > timezone.now()

    @property
    def has_recording(self):
        return bool(self.youtube_url)