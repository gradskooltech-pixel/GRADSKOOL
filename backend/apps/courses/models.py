"""
GRADSKOOL — Courses Models

Full data model for the course catalogue:

  Exam            → CAT, GMAT, GRE, IPMAT, XAT, SNAP, NMAT, CMAT,
                    MHCET, CUET, Law UG, PI-WAT-GD, Complete MBA
  Course          → A specific cohort offering of an Exam
  CurriculumModule → Module 01 — VARC, Module 02 — DILR, etc.
  CurriculumTopic → Topics within a module
  Instructor      → Faculty profiles
  CourseInstructor → M2M: instructors per course
  PricingPlan     → 3–6 tiers per exam (Live+Mocks, Mocks Only, etc.)
  PlanFeature     → Bullet-point features for each plan
  Testimonial     → Student reviews (per exam or global)
  ExamFAQ         → FAQ accordion per exam
  ExamStat        → Social proof numbers (30 Mocks, 400+ hrs, etc.)
"""
from django.db import models
from django.utils.text import slugify


# ── EXAM ──────────────────────────────────────────────────────────────────────

class Exam(models.Model):
    CATEGORIES = [
        ('mba_india',  'MBA India'),
        ('mba_abroad', 'MBA Abroad'),
        ('ug',         'Undergraduate'),
        ('bundle',     'Bundle'),
        ('interview',  'Interview Prep'),
    ]

    slug         = models.SlugField(unique=True, max_length=60)
    name         = models.CharField(max_length=100)           # 'CAT 2026'
    short_name   = models.CharField(max_length=30)            # 'CAT'
    tagline      = models.CharField(max_length=255, blank=True)
    description  = models.TextField(blank=True)
    category     = models.CharField(max_length=20, choices=CATEGORIES)
    exam_date    = models.DateField(null=True, blank=True)    # For countdown
    is_active     = models.BooleanField(default=True)
    cohort_size   = models.PositiveIntegerField(
        default=27,
        help_text='Maximum students per cohort. Used to calculate seats remaining.'
    )

    # Rich content fields (from static HTML)
    exam_overview = models.TextField(blank=True)  # "What is CAT?" paragraph
    eligibility   = models.TextField(blank=True)  # Eligibility criteria
    key_dates     = models.JSONField(default=list, blank=True)
    # [{month, year, event, desc}]
    exam_pattern  = models.JSONField(default=list, blank=True)
    # [{section, questions, duration, marks}]
    score_range   = models.CharField(max_length=100, blank=True)
    # e.g. "205 – 805" for GMAT
    conducting_body = models.CharField(max_length=100, blank=True)
    # e.g. "IIMs (rotating)"
    top_colleges  = models.JSONField(default=list, blank=True)
    # [{name, cutoff, avg_package, fees}]
    is_featured  = models.BooleanField(default=False)         # Show on homepage
    sort_order   = models.IntegerField(default=0)

    # SEO
    og_image_url = models.URLField(blank=True)
    meta_title   = models.CharField(max_length=160, blank=True)
    meta_desc    = models.CharField(max_length=320, blank=True)
    canonical_url = models.URLField(blank=True)

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exams'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.short_name or self.name)
        super().save(*args, **kwargs)


class ExamStat(models.Model):
    """
    Social proof numbers shown on each exam page.
    e.g. "30 Full-Length Mocks", "400+ Hours Live Teaching"
    """
    exam      = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='stats')
    value     = models.CharField(max_length=30)     # '30', '400+'
    label     = models.CharField(max_length=80)     # 'Full-Length Mocks'
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'exam_stats'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.exam.short_name}: {self.value} {self.label}'


# ── INSTRUCTOR ────────────────────────────────────────────────────────────────

class Instructor(models.Model):
    name         = models.CharField(max_length=100)
    slug         = models.SlugField(unique=True, max_length=80)
    title        = models.CharField(max_length=200)       # 'Founder & Lead Mentor'
    bio          = models.TextField()
    credentials  = models.CharField(max_length=300, blank=True)
    # e.g. 'IIM Ahmedabad Alumna · Psychologist · Dentist'
    percentile   = models.CharField(max_length=80, blank=True)
    # '99.98%ile QA · IMO National Rank Holder'
    photo_url    = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    youtube_url  = models.URLField(blank=True)
    is_lead      = models.BooleanField(default=False)     # ALP is lead
    is_active     = models.BooleanField(default=True)
    cohort_size   = models.PositiveIntegerField(
        default=27,
        help_text='Maximum students per cohort. Used to calculate seats remaining.'
    )

    # Rich content fields (from static HTML)
    exam_overview = models.TextField(blank=True)  # "What is CAT?" paragraph
    eligibility   = models.TextField(blank=True)  # Eligibility criteria
    key_dates     = models.JSONField(default=list, blank=True)
    # [{month, year, event, desc}]
    exam_pattern  = models.JSONField(default=list, blank=True)
    # [{section, questions, duration, marks}]
    score_range   = models.CharField(max_length=100, blank=True)
    # e.g. "205 – 805" for GMAT
    conducting_body = models.CharField(max_length=100, blank=True)
    # e.g. "IIMs (rotating)"
    top_colleges  = models.JSONField(default=list, blank=True)
    # [{name, cutoff, avg_package, fees}]
    sort_order   = models.IntegerField(default=0)

    class Meta:
        db_table = 'instructors'
        ordering = ['-is_lead', 'sort_order']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# ── COURSE & COHORT ───────────────────────────────────────────────────────────

class Course(models.Model):
    """
    A specific time-bound cohort offering for an exam.
    One exam can have multiple courses over the years.
    The active one is the one shown on the exam page.
    """
    STATUS = [
        ('upcoming', 'Upcoming'),
        ('active',   'Active'),
        ('closed',   'Closed'),
    ]

    exam         = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='courses')
    slug         = models.SlugField(max_length=120, unique=True, blank=True)
    # e.g. cat-2026-c1
    title        = models.CharField(max_length=200)       # 'CAT 2026 Live Cohort'
    cohort_label = models.CharField(max_length=50, blank=True)  # 'Cohort 1'
    batch_size   = models.IntegerField(default=27)
    seats_filled = models.IntegerField(default=0)
    start_date   = models.DateField(null=True, blank=True)
    end_date     = models.DateField(null=True, blank=True)
    status       = models.CharField(max_length=20, choices=STATUS, default='upcoming')
    is_open      = models.BooleanField(default=False,
                                       help_text='Only one cohort per exam should be open at a time. New enrolments auto-assign here.')
    description  = models.TextField(blank=True,
                                    help_text='Short description shown on the cohort public page.')

    # Course syllabus & learning outcomes (shown on course page)
    learning_outcomes = models.JSONField(default=list, blank=True,
                                         help_text='["Master RC in 4 weeks", "Solve 90%+ QA section"]')
    who_is_this_for   = models.TextField(blank=True)
    syllabus_summary  = models.TextField(blank=True)

    # Prerequisites
    prerequisites     = models.ManyToManyField('self', blank=True, symmetrical=False,
                                               related_name='unlocks',
                                               help_text='Complete these courses before enrolling here')
    prerequisite_note = models.CharField(max_length=300, blank=True,
                                         help_text='e.g. "Complete Foundation before joining Live Cohort"')
    custom_page_slug = models.SlugField(max_length=120, blank=True,
                                        help_text='Slug of a DynamicPage to use as the cohort landing page. Leave blank to use default.')
    enrolled_students = models.ManyToManyField(
        'accounts.User',
        blank=True,
        related_name='cohorts',
        help_text='Students assigned to this cohort.',
    )
    instructors  = models.ManyToManyField(
        Instructor, through='CourseInstructor', related_name='courses'
    )

    class Meta:
        db_table = 'courses'
        ordering = ['-start_date']

    def __str__(self):
        return f'{self.exam.short_name} — {self.title}'

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base = slugify(f'{self.exam.slug}-{self.cohort_label or self.title}')
            slug = base
            n = 1
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base}-{n}'
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def seats_available(self):
        return max(0, self.batch_size - self.seats_filled)

    @property
    def is_seats_limited(self):
        return self.seats_available <= 5


class CourseInstructor(models.Model):
    course     = models.ForeignKey(Course, on_delete=models.CASCADE)
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE)
    role       = models.CharField(max_length=100, blank=True)  # 'Lead Instructor'
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'course_instructors'
        ordering = ['sort_order']
        unique_together = ('course', 'instructor')


# ── CURRICULUM ────────────────────────────────────────────────────────────────

class CurriculumModule(models.Model):
    course       = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    number       = models.IntegerField()              # 1, 2, 3…
    title        = models.CharField(max_length=200)   # 'Verbal Ability & Reading Comprehension'
    short_title  = models.CharField(max_length=60, blank=True)   # 'VARC'
    slug         = models.SlugField(max_length=100, blank=True, db_index=True)
    # e.g. 'varc', 'dilr', 'qa' — used in URL /learn/cat/qa/percentages
    description  = models.TextField(blank=True)
    duration_note = models.CharField(max_length=100, blank=True) # '~80 hours'
    sort_order   = models.IntegerField(default=0)

    class Meta:
        db_table = 'curriculum_modules'
        ordering = ['sort_order', 'number']
        unique_together = ('course', 'number')

    def __str__(self):
        return f'Module {self.number:02d}: {self.title}'

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.short_title or self.title)
        super().save(*args, **kwargs)


class CurriculumTopic(models.Model):
    module       = models.ForeignKey(
        CurriculumModule, on_delete=models.CASCADE, related_name='topics'
    )
    title        = models.CharField(max_length=200)
    slug         = models.SlugField(max_length=200, blank=True, db_index=True)
    sort_order   = models.IntegerField(default=0)

    # Links this topic to a QATopic question bank for the CAT-style quiz tab
    quiz_source  = models.ForeignKey(
        'tools.QATopic', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='curriculum_topics'
    )
    quiz_question_count = models.PositiveIntegerField(default=10)

    class Meta:
        db_table = 'curriculum_topics'
        ordering = ['sort_order']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)



# ── COURSE COMPONENTS ─────────────────────────────────────────────────────────
class CourseComponent(models.Model):
    COMPONENT_TYPES = [
        ('pre_test',    'Pre-Test (Diagnostic)'),
        ('video',       'Video Lectures'),
        ('quiz',        'Quiz'),
        ('cheatsheet',  'Cheat Sheet'),
        ('live',        'Live Class'),
        ('assignment',  'Assignment'),
        ('mock_test',   'Mock Test'),
        ('post_test',   'Post-Test (Final Assessment)'),
        ('resources',   'Resources / Downloads'),
        ('notes',       'Notes / Reading Material'),
    ]

    course         = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='components')
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    title          = models.CharField(max_length=200, blank=True)
    description    = models.CharField(max_length=500, blank=True)
    sort_order     = models.IntegerField(default=0)
    is_enabled     = models.BooleanField(default=True)
    is_mandatory   = models.BooleanField(default=False)
    config         = models.JSONField(default=dict, blank=True,
                                      help_text='''Component-specific config JSON. Examples:
          video:       {"show_cheatsheet": true, "show_quiz": true}
          mock_test:   {"provider": "testfunda", "redirect_url": "https://..."}
                       {"provider": "own", "exam_slug": "cat"}
          pre_test:    {"question_count": 20, "duration_mins": 30}
          live:        {"platform": "zoom", "weekly": true}
          resources:   {"items": [{"title": "PDF", "url": "..."}]}
        ''')

    class Meta:
        db_table = 'course_components'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.course} — {self.get_component_type_display()}'

    @property
    def display_title(self):
        return self.title or self.get_component_type_display()

# ── PRICING PLANS ─────────────────────────────────────────────────────────────

class PricingPlan(models.Model):
    """
    Each exam has 3–6 pricing tiers decoded from checkout.html.

    CAT example:
      Live + CAT Mocks          ₹15,999
      Live + All MBA Mocks      ₹17,999
      Live + CAT Mocks + Books  ₹20,999
      CAT Mocks Only            ₹2,999
      All MBA Mocks + Books     ₹7,999
      Books Only                ₹7,999
    """
    exam            = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='plans')
    name            = models.CharField(max_length=120)        # 'Live + CAT Mocks'
    slug            = models.SlugField(max_length=100)
    description     = models.TextField(blank=True)
    price_inr       = models.DecimalField(max_digits=8, decimal_places=2)
    original_price  = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    badge_text      = models.CharField(max_length=50, blank=True)  # 'Most Popular'
    is_featured     = models.BooleanField(default=False)       # Dark card styling
    is_active       = models.BooleanField(default=True)
    sort_order      = models.IntegerField(default=0)

    # Access flags — used by M3 enrollment to build CourseAccess
    includes_live    = models.BooleanField(default=False)
    includes_mocks   = models.BooleanField(default=False)
    includes_books   = models.BooleanField(default=False)
    includes_gdpi    = models.BooleanField(default=False)
    includes_recordings = models.BooleanField(default=False)
    mock_exams_covered  = models.JSONField(default=list)
    # e.g. ['CAT'] or ['CAT','XAT','SNAP','NMAT','CMAT']

    # Razorpay
    razorpay_sku    = models.CharField(max_length=120, unique=True)

    class Meta:
        db_table = 'pricing_plans'
        ordering = ['sort_order']
        unique_together = ('exam', 'slug')

    def __str__(self):
        return f'{self.exam.short_name} — {self.name} (₹{self.price_inr})'

    @property
    def discount_pct(self):
        if self.original_price and self.original_price > self.price_inr:
            return int((1 - self.price_inr / self.original_price) * 100)
        return None

    @property
    def gst_amount(self):
        # price_inr is already GST-inclusive (confirmed pricing policy) —
        # this reverse-calculates the GST portion OUT of that total using
        # the standard backward-GST formula, rather than adding 18% on top
        # of what's meant to be the final price.
        return round(self.price_inr * 18 / 118, 2)

    @property
    def base_price_excl_gst(self):
        return round(self.price_inr - self.gst_amount, 2)

    @property
    def total_with_gst(self):
        # price_inr already includes GST, so the "total" a customer pays is
        # just price_inr itself — kept as its own property since the
        # checkout page displays it explicitly as the breakdown's "Total" line.
        return self.price_inr


class PlanFeature(models.Model):
    plan        = models.ForeignKey(PricingPlan, on_delete=models.CASCADE, related_name='features')
    text        = models.CharField(max_length=255)
    is_included = models.BooleanField(default=True)   # False → strikethrough / ✗
    sort_order  = models.IntegerField(default=0)

    class Meta:
        db_table = 'plan_features'
        ordering = ['sort_order']

    def __str__(self):
        prefix = '✓' if self.is_included else '✗'
        return f'{prefix} {self.text}'


# ── TESTIMONIALS ──────────────────────────────────────────────────────────────

class Testimonial(models.Model):
    exam         = models.ForeignKey(
        Exam, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='testimonials'
    )
    student_name = models.CharField(max_length=100)
    detail       = models.CharField(max_length=200, blank=True)
    # e.g. 'CAT 99.3%ile → IIM Ahmedabad'
    text         = models.TextField()
    rating       = models.IntegerField(default=5)
    photo_url    = models.URLField(blank=True)
    is_active     = models.BooleanField(default=True)
    cohort_size   = models.PositiveIntegerField(
        default=27,
        help_text='Maximum students per cohort. Used to calculate seats remaining.'
    )

    # Rich content fields (from static HTML)
    exam_overview = models.TextField(blank=True)  # "What is CAT?" paragraph
    eligibility   = models.TextField(blank=True)  # Eligibility criteria
    key_dates     = models.JSONField(default=list, blank=True)
    # [{month, year, event, desc}]
    exam_pattern  = models.JSONField(default=list, blank=True)
    # [{section, questions, duration, marks}]
    score_range   = models.CharField(max_length=100, blank=True)
    # e.g. "205 – 805" for GMAT
    conducting_body = models.CharField(max_length=100, blank=True)
    # e.g. "IIMs (rotating)"
    top_colleges  = models.JSONField(default=list, blank=True)
    # [{name, cutoff, avg_package, fees}]
    is_featured  = models.BooleanField(default=False)
    sort_order   = models.IntegerField(default=0)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'testimonials'
        ordering = ['-is_featured', 'sort_order']

    def __str__(self):
        return f'{self.student_name} — {self.detail}'


# ── FAQ ───────────────────────────────────────────────────────────────────────

class ExamFAQ(models.Model):
    exam       = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='exam_faqs')
    question   = models.CharField(max_length=300)
    answer     = models.TextField()
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'exam_faqs'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.exam.short_name}: {self.question[:60]}…'


class ProgrammeSettings(models.Model):
    """
    Admin-controlled tab visibility per pricing plan.
    Controls what ALL students enrolled in that plan see
    in their dashboard and learning portal.
    """
    plan = models.OneToOneField(
        PricingPlan,
        on_delete=models.CASCADE,
        related_name='settings',
    )

    # Dashboard tabs
    show_videos        = models.BooleanField(default=True,  help_text='Videos tab in learning portal')
    show_practice_quiz = models.BooleanField(default=True,  help_text='Practice Quiz tab')
    show_cheat_sheets  = models.BooleanField(default=True,  help_text='Cheat Sheets tab')
    show_live          = models.BooleanField(default=False, help_text='Live Sessions tab')
    show_mocks         = models.BooleanField(default=False, help_text='Show mocks redirect (opens /mocks/[exam])')
    show_books         = models.BooleanField(default=False, help_text='Books / Downloads tab')
    show_gdpi          = models.BooleanField(default=False, help_text='GDPI Preparation tab')

    # Mocks redirect
    mocks_redirect_url = models.URLField(
        blank=True,
        help_text='Override testfunda URL for this plan. Leave blank to use exam default.',
    )

    # Custom "Continue Learning" destination
    continue_learning_url = models.URLField(
        blank=True,
        help_text=(
            'Override where "Continue Learning" goes on dashboard. '
            'Leave blank = auto (mocks-only → /mocks, otherwise → /learn/[exam]). '
            'Examples: https://notion.so/... | /p/xat-resources | /courses/xat/mocks'
        ),
    )

    # What label to show on the CTA button
    cta_label = models.CharField(
        max_length=60, blank=True,
        help_text='Custom label for the dashboard CTA button. Default: "Continue Learning"',
    )

    # Short description shown on the dashboard card
    card_note = models.CharField(
        max_length=200, blank=True,
        help_text='Short note shown under plan name on dashboard card. e.g. "Includes 6 XAT mocks + DM module"',
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Programme Settings'
        verbose_name_plural = 'Programme Settings'

    def __str__(self):
        return f'{self.plan} — settings'



# ── SITE SETTINGS ─────────────────────────────────────────────────────────────

class SiteSettings(models.Model):
    """
    Global site settings — singleton (only one row).
    Editable via admin panel.
    """
    # Contact
    whatsapp_number   = models.CharField(max_length=20, default='916360597966')
    contact_email     = models.EmailField(default='hello@gradskool.in', blank=True)
    support_email     = models.EmailField(default='support@gradskool.in', blank=True)

    # Payment
    razorpay_key_id   = models.CharField(max_length=80, blank=True)
    razorpay_secret   = models.CharField(max_length=80, blank=True,
                                         help_text='Store in env var, not here. This is a reminder field only.')

    # CDN / Media
    bunny_cdn_url     = models.URLField(default='https://gradskool.b-cdn.net', blank=True)
    bunny_storage_zone= models.CharField(max_length=80, blank=True, default='gradskool')

    # Testfunda URLs
    testfunda_cat_url = models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/full-length--tests/cat',
        blank=True)
    testfunda_xat_url = models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/mba/xat', blank=True)
    testfunda_snap_url= models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/mba/snap', blank=True)
    testfunda_nmat_url= models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/mba/nmat', blank=True)
    testfunda_cmat_url= models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/mba/cmat', blank=True)
    testfunda_mhcet_url=models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/mba/mhcet', blank=True)
    testfunda_ipmat_url=models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/ug/ipmat', blank=True)
    testfunda_clat_url= models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/law/clat', blank=True)
    testfunda_cuet_url= models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/cuet-aptitude/cuet-(general-test)',
        blank=True)
    testfunda_cat_sectional_url = models.URLField(
        default='https://gradskool.testfunda.com/TestCentre/sectional-tests/cat', blank=True)

    # Social
    twitter_url    = models.URLField(default='https://x.com/i_m_alp', blank=True)
    youtube_url    = models.URLField(blank=True)
    instagram_url  = models.URLField(blank=True)
    linkedin_url   = models.URLField(blank=True)
    gradflix_url   = models.URLField(default='https://gradflix.in', blank=True)

    # Coupon codes (stored as JSON)
    coupons_json   = models.TextField(default='[]', blank=True,
                                      help_text='JSON array of coupon objects. Managed via admin panel.')

    # Announcement banner
    announcement_text   = models.CharField(max_length=300, blank=True)
    announcement_active = models.BooleanField(default=False)
    announcement_link   = models.URLField(blank=True)
    announcement_color  = models.CharField(max_length=20, default='#0f0f0f', blank=True)

    # Meta
    site_name      = models.CharField(max_length=60, default='GRADSKOOL')
    site_tagline   = models.CharField(max_length=200,
                                      default="India's Most Structured MBA Entrance Preparation")
    maintenance_mode = models.BooleanField(default=False)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'site_settings'
        verbose_name = 'Site Settings'
        verbose_name_plural = 'Site Settings'

    def __str__(self):
        return 'Site Settings'

    def save(self, *args, **kwargs):
        self.pk = 1  # Singleton
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


# ── GLOBAL FAQs ───────────────────────────────────────────────────────────────

class FAQ(models.Model):
    CATEGORIES = [
        ('general',   'General'),
        ('alp',       'About ALP Sir'),
        ('cohort',    'Cohort & Structure'),
        ('cat',       'CAT'),
        ('gmat_gre',  'GMAT & GRE'),
        ('platform',  'Platform'),
        ('enrolment', 'Enrolment'),
    ]
    exam     = models.ForeignKey(
        Exam, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='global_faqs',
        help_text='Leave blank for site-wide FAQs (/faqs page). Set exam for course-page FAQs.'
    )
    category = models.CharField(max_length=30, choices=CATEGORIES, default='general')
    question = models.CharField(max_length=300)
    answer   = models.TextField()
    sort_order = models.IntegerField(default=0)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table  = 'faqs'
        ordering  = ['exam', 'category', 'sort_order']

    def __str__(self):
        prefix = f'[{self.exam.short_name}] ' if self.exam else '[Site] '
        return f'{prefix}{self.question[:80]}'


# ── MOCK SCHEDULE ─────────────────────────────────────────────────────────────

class MockScheduleEntry(models.Model):
    TYPE_CHOICES = [
        ('full_length', 'Full-Length Mock'),
        ('sectional',   'Sectional Set'),
        ('area_wise',   'Area-Wise Test'),
    ]
    exam        = models.ForeignKey(
        Exam, on_delete=models.CASCADE, related_name='mock_schedule'
    )
    entry_type  = models.CharField(max_length=20, choices=TYPE_CHOICES, default='full_length')
    name        = models.CharField(max_length=100)  # 'iCAT 30', 'Set 10'
    release_date= models.DateTimeField(null=True, blank=True,
                                       help_text='Leave blank = available immediately (free/always-on)')
    is_free     = models.BooleanField(default=False)
    duration_mins = models.IntegerField(default=120,
                                        help_text='120 for full-length, 40 for sectional')
    sort_order  = models.IntegerField(default=0)
    is_active   = models.BooleanField(default=True)
    testfunda_url = models.URLField(blank=True,
                                    help_text='Override testfunda URL for this specific test')

    class Meta:
        db_table = 'mock_schedule'
        ordering = ['exam', 'entry_type', '-sort_order']

    def __str__(self):
        return f'{self.exam.short_name} — {self.name}'

    @property
    def is_live(self):
        if not self.release_date:
            return True
        from django.utils import timezone
        return self.release_date <= timezone.now()


# ── HOMEPAGE CONTENT ──────────────────────────────────────────────────────────

class HomepageContent(models.Model):
    """
    Editable content blocks for the homepage.
    Singleton — one row per block key.
    """
    BLOCK_KEYS = [
        ('hero_title',         'Hero — Main Title'),
        ('hero_subtitle',      'Hero — Subtitle'),
        ('stats_bar',          'Stats Bar — 4 numbers'),
        ('why_title',          'Why Section — Title'),
        ('why_subtitle',       'Why Section — Subtitle'),
        ('cta_title',          'CTA Banner — Title'),
        ('cta_subtitle',       'CTA Banner — Subtitle'),
        ('founder_title',      'Founder Section — Title'),
        ('founder_body',       'Founder Section — Body'),
        ('recognition_items',  'Recognition — Items (JSON)'),
        ('platform_stats',     'Platform Stats — Numbers (JSON)'),
    ]
    key        = models.CharField(max_length=60, unique=True, choices=BLOCK_KEYS)
    value      = models.TextField(help_text='Plain text or JSON depending on block type')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'homepage_content'
        verbose_name = 'Homepage Content'

    def __str__(self):
        return self.key


# ── DYNAMIC PAGE ──────────────────────────────────────────────────────────────

class DynamicPage(models.Model):
    """
    A fully editable landing/marketing page.
    Accessible at /p/[slug] on the frontend.
    Admin can create/edit/delete pages via /admin-panel/pages.

    Usage examples:
      - /p/sale         → Flash sale landing page
      - /p/webinar      → Upcoming webinar registration
      - /p/cat-results  → CAT results analysis page
      - /p/scholarship  → Scholarship programme page
      - /p/workshop     → Workshop registration
      - /p/free-trial   → Free trial offer page

    Each page is a JSON array of blocks. Block types:
      hero        → Big headline + subtext + CTA button
      text        → Markdown/rich body text
      features    → 2-3 column feature cards
      cta         → Call to action banner
      countdown   → Countdown timer to a deadline
      faq         → Accordion FAQ items
      testimonial → Student testimonial cards
      image       → Full-width or contained image
      video       → Embedded YouTube/Vimeo
      table       → Simple data table
      divider     → Visual separator
    """
    slug        = models.SlugField(max_length=80, unique=True,
                                   help_text='URL path: /p/[slug]. Use lowercase, hyphens only.')
    title       = models.CharField(max_length=200,
                                   help_text='Internal title shown in admin panel (not on page unless hero block uses it)')
    is_active   = models.BooleanField(default=True,
                                      help_text='Inactive pages show 404 to visitors')
    blocks      = models.JSONField(default=list,
                                   help_text='Array of block objects. Each block has type + content fields.')

    # SEO
    meta_title  = models.CharField(max_length=60, blank=True)
    meta_desc   = models.CharField(max_length=160, blank=True)

    # Tracking
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    created_by  = models.CharField(max_length=100, blank=True,
                                   help_text='Admin username who created this page')

    class Meta:
        db_table = 'dynamic_pages'
        ordering = ['-updated_at']

    def __str__(self):
        return f'/p/{self.slug} — {self.title}'

# ── MOCK CREDENTIALS ──────────────────────────────────────────────────────────

class MockCredential(models.Model):
    """
    Testfunda login credentials sent to a student after mock purchase.
    Admin creates these manually via /admin-panel/mock-credentials.
    Student sees them in their dashboard under the mocks card.
    """
    user        = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE,
        related_name='mock_credentials'
    )
    exam        = models.ForeignKey(
        Exam, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='mock_credentials',
        help_text='Which exam these credentials are for (CAT, XAT, SNAP etc)'
    )
    username    = models.CharField(max_length=100,
                                   help_text='Testfunda username / email for the student')
    password    = models.CharField(max_length=100,
                                   help_text='Testfunda password — stored in plain text for display to student')
    platform_url= models.URLField(blank=True,
                                  help_text='Direct URL to the testfunda mock portal for this exam')
    note        = models.TextField(blank=True,
                                   help_text='Any note to show the student — e.g. "Access all 30 CAT mocks here"')
    sent_at     = models.DateTimeField(auto_now_add=True)
    sent_by     = models.CharField(max_length=100, blank=True,
                                   help_text='Admin username who sent these credentials')

    class Meta:
        db_table = 'mock_credentials'
        ordering = ['-sent_at']

    def __str__(self):
        exam_name = self.exam.short_name if self.exam else 'General'
        return f'{self.user.email} — {exam_name} credentials'