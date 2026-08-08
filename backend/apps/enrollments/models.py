"""
GRADSKOOL — Enrollments Models

Enrollment   → Created when a payment is confirmed.
CourseAccess → Derived access record specifying exactly what the
               student can do (live, recordings, mocks, books, GDPI).

Design decisions:
  - CourseAccess is rebuilt from scratch whenever an enrollment
    changes — it's a derived projection, not a source of truth.
  - Expiry is plan-independent for now (no hard expiry) but the
    field exists for future use (e.g. 1-year rolling access).
  - Multiple enrollments per user are allowed (different plans /
    different exams). Access is the union of all active enrollments.
"""
from django.db import models
from django.utils import timezone


class Enrollment(models.Model):
    STATUS = [
        ('active',     'Active'),
        ('expired',    'Expired'),
        ('suspended',  'Suspended'),
        ('refunded',   'Refunded'),
    ]

    user        = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='enrollments'
    )
    plan        = models.ForeignKey(
        'courses.PricingPlan', on_delete=models.CASCADE, related_name='enrollments'
    )
    order       = models.OneToOneField(
        'payments.Order', on_delete=models.SET_NULL,
        related_name='enrollment', null=True, blank=True
    )
    status      = models.CharField(max_length=20, choices=STATUS, default='active')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    expires_at  = models.DateTimeField(null=True, blank=True)
    # null = never expires (default for live cohort plans)

    class Meta:
        db_table = 'enrollments'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['plan', 'status']),
        ]

    def __str__(self):
        return f'{self.user.email} → {self.plan.name} ({self.status})'

    @property
    def is_active(self):
        if self.status != 'active':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    def suspend(self):
        self.status = 'suspended'
        self.save(update_fields=['status'])

    def refund(self):
        self.status = 'refunded'
        self.save(update_fields=['status'])
        # CourseAccess deleted via signal


class CourseAccess(models.Model):
    """
    Flat access record per user per exam.
    One row per (user, exam) pair — merged across all active enrollments.

    Rebuilt by rebuild_access(user, exam) whenever enrollments change.
    Queried heavily — all access checks read from this table.
    """
    user                = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE, related_name='course_accesses'
    )
    exam                = models.ForeignKey(
        'courses.Exam', on_delete=models.CASCADE, related_name='accesses'
    )
    # Access flags
    can_attend_live     = models.BooleanField(default=False)
    can_watch_recordings = models.BooleanField(default=False)
    can_take_mocks      = models.BooleanField(default=False)
    can_download_books  = models.BooleanField(default=False)
    can_access_gdpi     = models.BooleanField(default=False)
    # Which mock exams are unlocked (e.g. ['CAT'] or ['CAT','XAT','SNAP'])
    mock_exams_unlocked = models.JSONField(default=list)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'course_accesses'
        unique_together = ('user', 'exam')
        indexes = [models.Index(fields=['user', 'exam'])]

    def __str__(self):
        flags = []
        if self.can_attend_live:      flags.append('live')
        if self.can_watch_recordings: flags.append('recordings')
        if self.can_take_mocks:       flags.append('mocks')
        if self.can_download_books:   flags.append('books')
        return f'{self.user.email} / {self.exam.slug}: {", ".join(flags) or "no access"}'
