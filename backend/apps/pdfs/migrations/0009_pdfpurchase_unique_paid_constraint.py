"""
GRADSKOOL — PDFs App Models

Pdf          → A PDF study resource, e.g. "CAT Formula Handbook". Either paid
               (Razorpay) or free — but free is NOT auto-access: it still
               requires login, and claiming it requires a phone number (see
               views.ClaimFreePdfView). Mirrors the standalone CAT_PDF app's
               Pdf/status-enum design, but keyed into the same accounts.User /
               courses.Exam the rest of the platform uses.
PdfPage      → One rendered page image, stored in a private Supabase Storage bucket
               (not public — the Django view is the only reader; see views.PdfPageView).
PdfPurchase  → Records access to a Pdf — paid (webhook-only activation, same
               model as apps.payments.Order) or free (claimed with a phone
               number). Either way, `status == 'paid'` is what grants access;
               nothing else does.
"""
import uuid
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Pdf(models.Model):
    STATUS = [
        ('draft', 'Draft'),            # created, no pages uploaded yet
        ('processing', 'Processing'),  # admin is mid-upload
        ('ready', 'Ready'),            # finalized, page_count set
        # A genuinely new, distinct status — NOT reusing 'ready' (which
        # means "finalized, page_count set," which an upcoming placeholder
        # isn't) and NOT 'draft' (which is correctly invisible in the
        # public list, defeating the whole point of selling it now).
        # Purchasable exactly like 'ready' PDFs; content just isn't
        # uploaded yet. See seed_upcoming_quant_pdfs and the is_upcoming
        # field below.
        ('upcoming', 'Upcoming — sellable, content not yet uploaded'),
        ('failed', 'Failed'),
    ]

    exam = models.ForeignKey(
        'courses.Exam', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='pdfs',
    )

    # Optional — lets a cheat sheet/question bank be attached to one specific
    # free class (shown alongside its YouTube video), instead of only being
    # reachable through the general PDF Library. A Pdf can exist with no
    # class link too — this is purely additive, doesn't change anything
    # about how the PDF system itself works (still the same free-claim/
    # paid-purchase flow either way).
    foundation_class = models.ForeignKey(
        'foundations.FoundationClass', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='pdfs',
    )

    # Same idea as foundation_class above — lets a PDF (the question's
    # written solution, or a related cheat sheet) be attached to one
    # specific FYQ item, shown alongside its video.
    fyq_question = models.ForeignKey(
        'fyq.FYQQuestion', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='pdfs',
    )

    # Independent of fyq_question above. Setting fyq_question attaches a PDF
    # to ONE specific question AND makes it show as a card on that question's
    # own page — those two things happen together, no way to separate them.
    # This flag exists for the opposite case: a PDF should count under the
    # "<EXAM> FYQs" library bucket WITHOUT being tied to (or surfaced on) any
    # individual question's page — e.g. a general compiled FYQ handbook. Uses
    # the `exam` field above (not fyq_question.exams) to decide which
    # "<EXAM> FYQs" bucket it belongs to.
    fyq_category = models.BooleanField(
        default=False,
        help_text='Counts toward the "<EXAM> FYQs" library card without attaching to any specific FYQ question. Requires Exam to be set above.',
    )

    title            = models.CharField(max_length=200)
    slug             = models.SlugField(max_length=220, unique=True, blank=True)
    description      = models.TextField(blank=True)
    cover_image_url  = models.URLField(blank=True)
    card_label       = models.CharField(max_length=30, blank=True,
                                        help_text='Overrides the default "PDF" badge shown on the card (e.g. class detail sidebar). Leave blank to show "PDF".')

    price_inr        = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_free          = models.BooleanField(default=False)
    # A real Pdf row that can be selected and paid for like any other —
    # just has no actual file/pages attached yet. Confirmed with GS as
    # the intended approach specifically so upcoming topics can be
    # included in a bundle purchase right away, not as a separate
    # "coming soon" list bolted onto the frontend. Access is granted the
    # same way a normal purchase is; fulfilment (actually uploading the
    # PDF pages) happens later, on GS's own timeline.
    is_upcoming      = models.BooleanField(default=False)

    page_count       = models.PositiveIntegerField(default=0)
    status           = models.CharField(max_length=20, choices=STATUS, default='draft')
    is_published     = models.BooleanField(default=False)
    sort_order       = models.PositiveIntegerField(default=0)

    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pdfs'
        ordering = ['sort_order', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or 'pdf'
            slug = base
            i = 1
            while Pdf.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                i += 1
                slug = f'{base}-{i}'
            self.slug = slug
        super().save(*args, **kwargs)


class PdfPage(models.Model):
    pdf          = models.ForeignKey(Pdf, on_delete=models.CASCADE, related_name='pages')
    page_number  = models.PositiveIntegerField()
    storage_path = models.CharField(max_length=500)  # path within the Supabase Storage bucket
    width        = models.PositiveIntegerField(default=0)
    height       = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'pdf_pages'
        ordering = ['page_number']
        unique_together = [('pdf', 'page_number')]

    def __str__(self):
        return f'{self.pdf.title} — page {self.page_number}'


class PdfPurchase(models.Model):
    STATUS = [
        ('created',  'Created'),   # Razorpay order created, not paid
        ('paid',     'Paid'),      # Webhook confirmed, or a free PDF claimed with phone captured
        ('failed',   'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='pdf_purchases',
    )
    pdf = models.ForeignKey(Pdf, on_delete=models.CASCADE, related_name='purchases')

    razorpay_order_id   = models.CharField(max_length=100, unique=True, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, db_index=True)
    razorpay_signature  = models.CharField(max_length=256, blank=True)

    amount_inr = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status     = models.CharField(max_length=20, choices=STATUS, default='created')

    # Captured at claim/purchase time — even a ₹0 claim requires this (lead-gen +
    # WhatsApp follow-up), so it's snapshotted here even though it also gets
    # saved onto the User record.
    phone_captured = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at    = models.DateTimeField(null=True, blank=True)

    # Idempotency — prevents duplicate orders on e.g. double-click
    idempotency_key = models.CharField(max_length=100, unique=True, blank=True)

    class Meta:
        db_table = 'pdf_purchases'
        constraints = [
            # Real bug this fixes: create_pdf_order only ever blocked a
            # SECOND *paid* row for the same user+PDF — nothing stopped a
            # second UNPAID row (e.g. someone starts checkout, abandons
            # it, starts again later on the same PDF). That's exactly
            # what happened for a real student — two Percentages rows,
            # one paid, one a week-old abandoned 'created' row — which
            # then crashed a later, unrelated bundle-purchase confirmation
            # because get_or_create() requires at most one match.
            # A plain unique_together on (user, pdf) would be WRONG here —
            # 'created'/'failed' rows for the same PDF are genuinely valid
            # (a retry after a card decline, an abandoned-then-resumed
            # checkout). The real invariant is narrower: at most one PAID
            # row per user+PDF, which is what actually matters for
            # ownership — so this is a partial constraint, only enforced
            # when status='paid'.
            models.UniqueConstraint(
                fields=['user', 'pdf'],
                condition=models.Q(status='paid'),
                name='unique_paid_pdf_purchase_per_user',
            ),
        ]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'pdf']),
            models.Index(fields=['razorpay_order_id']),
        ]

    def __str__(self):
        return f'{self.user.email} — {self.pdf.title} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.idempotency_key:
            self.idempotency_key = str(uuid.uuid4())
        super().save(*args, **kwargs)

    def mark_paid(self, payment_id: str, signature: str = ''):
        self.status = 'paid'
        self.razorpay_payment_id = payment_id
        self.razorpay_signature = signature
        self.paid_at = timezone.now()
        self.save(update_fields=['status', 'razorpay_payment_id', 'razorpay_signature', 'paid_at'])


# ── BUNDLE PRICING ──────────────────────────────────────────────────────────
# Fixed tiers only — no arbitrary quantity gets a discount, must match one of
# these counts exactly. Rule: -₹2/PDF for every 5 PDFs, 1/5/10/15/20/25/30
# steps normally — but the top tier is 34, not 35+, because the CAT Quant
# FYQ library has exactly 34 real topics total (see
# seed_upcoming_quant_pdfs's QUANT_TOPICS, sourced directly from GS's own
# confirmed real topic list). "Buy 34" IS "buy everything" — genuinely no
# reason for a 35+ tier to exist, since there's nothing beyond 34 to sell.
# The 34-tier's rate is the straight -₹2/5 continuation from 30 (₹17 → ₹15)
# — this DOES make its total identical to the 30-tier's total (both
# ₹510). Flagged explicitly to GS, who confirmed ₹15/PDF anyway rather
# than a deliberately-lower rate — the tie is a known, accepted
# consequence of applying the rule uniformly, not an oversight.
BUNDLE_TIERS = {
    1:  29,
    5:  27,
    10: 25,
    15: 23,
    20: 21,
    25: 19,
    30: 17,
    34: 15,
}


def bundle_price_per_pdf(count: int) -> int:
    """
    Returns the confirmed per-PDF rate for an exact tier count. Raises
    ValueError for anything that isn't one of the fixed tiers — there is
    deliberately no in-between pricing (e.g. 15 PDFs is not a valid bundle
    size at all, not "get the 10-tier rate for the first 10").
    """
    if count not in BUNDLE_TIERS:
        raise ValueError(f'{count} is not a valid bundle size. Valid sizes: {sorted(BUNDLE_TIERS)}')
    return BUNDLE_TIERS[count]


class PdfBundlePurchase(models.Model):
    """
    One multi-PDF purchase sharing a single Razorpay order — genuinely
    separate from PdfPurchase (which is strictly one-PDF-per-row, enforced
    by razorpay_order_id being unique=True there) rather than trying to
    force N PdfPurchase rows to somehow share one order id. The actual
    per-PDF access grants live on PdfBundleItem below; this row just tracks
    the order/payment itself — tier size, total price, and status.
    """
    STATUS = [
        ('created',  'Created'),
        ('paid',     'Paid'),
        ('failed',   'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='pdf_bundle_purchases',
    )

    tier_count   = models.PositiveIntegerField()   # 1, 10, 20, 30, 40, or 50
    price_per_pdf = models.DecimalField(max_digits=8, decimal_places=2)
    amount_inr    = models.DecimalField(max_digits=10, decimal_places=2)  # tier_count * price_per_pdf

    razorpay_order_id   = models.CharField(max_length=100, unique=True, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, db_index=True)
    razorpay_signature  = models.CharField(max_length=256, blank=True)

    status = models.CharField(max_length=20, choices=STATUS, default='created')

    phone_captured = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    paid_at    = models.DateTimeField(null=True, blank=True)

    idempotency_key = models.CharField(max_length=100, unique=True, blank=True)

    class Meta:
        db_table = 'pdf_bundle_purchases'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['razorpay_order_id']),
        ]

    def __str__(self):
        return f'{self.user.email} — {self.tier_count}-PDF bundle ({self.status})'

    def save(self, *args, **kwargs):
        if not self.idempotency_key:
            self.idempotency_key = str(uuid.uuid4())
        super().save(*args, **kwargs)

    def mark_paid(self, payment_id: str, signature: str = ''):
        """
        Marks the bundle order paid AND activates every PDF in it —
        deliberately atomic (see the @transaction.atomic wrapper on the
        webhook handler that calls this) so a bundle can never end up
        half-granted if something fails partway through.
        """
        self.status = 'paid'
        self.razorpay_payment_id = payment_id
        self.razorpay_signature = signature
        self.paid_at = timezone.now()
        self.save(update_fields=['status', 'razorpay_payment_id', 'razorpay_signature', 'paid_at'])

        for item in self.items.select_related('pdf'):
            purchase, _created = PdfPurchase.objects.get_or_create(
                user=self.user, pdf=item.pdf,
                defaults={
                    'amount_inr': self.price_per_pdf,
                    'status': 'paid',
                    'paid_at': self.paid_at,
                    'phone_captured': self.phone_captured,
                },
            )
            if purchase.status != 'paid':
                purchase.status = 'paid'
                purchase.paid_at = self.paid_at
                purchase.phone_captured = self.phone_captured
                purchase.save(update_fields=['status', 'paid_at', 'phone_captured'])


class PdfBundleItem(models.Model):
    """
    One PDF selected as part of a bundle purchase. A plain join row — the
    actual per-user access grant is a real PdfPurchase row, created by
    PdfBundlePurchase.mark_paid() above, so every other part of the
    codebase that already checks "does this user own this PDF?" (see
    views.py's has_pdf_access, PdfPurchase.objects.filter(...status='paid'))
    keeps working unchanged — a bundle just becomes N individual grants
    once paid, rather than every access check needing to also know about
    bundles.
    """
    bundle = models.ForeignKey(PdfBundlePurchase, on_delete=models.CASCADE, related_name='items')
    pdf    = models.ForeignKey(Pdf, on_delete=models.CASCADE, related_name='bundle_items')

    class Meta:
        db_table = 'pdf_bundle_items'
        constraints = [
            models.UniqueConstraint(fields=['bundle', 'pdf'], name='unique_pdf_per_bundle'),
        ]

    def __str__(self):
        return f'{self.pdf.title} in bundle #{self.bundle_id}'