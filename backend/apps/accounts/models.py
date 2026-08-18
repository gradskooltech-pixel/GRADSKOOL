"""
GRADSKOOL — Accounts Models

Custom User model + Email Verification + Password Reset tokens.
All tokens are UUID-based, single-use, expiry-enforced.
"""
import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):
    """
    Custom manager that uses email as the unique identifier,
    not username.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required.')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Extended user model.

    Key differences from Django default:
    - Email is the login identifier (not username)
    - username is auto-generated and not exposed
    - role-based access: student / instructor / admin
    - is_verified gate before login is allowed
    - target_exam captured from lead gate or registration
    """

    ROLES = [
        ('student', 'Student'),
        ('instructor', 'Instructor'),
        ('admin', 'Admin'),
    ]

    EXAM_CHOICES = [
        ('cat',       'CAT'),
        ('xat',       'XAT'),
        ('snap',      'SNAP'),
        ('nmat',      'NMAT'),
        ('gmat',      'GMAT'),
        ('gre',       'GRE'),
        ('ipmat',     'IPMAT'),
        ('cmat',      'CMAT'),
        ('mhcet',     'MH CET'),
        ('clat',      'CLAT / AILET'),
        ('cuet',      'CUET'),
        ('pi-wat-gd', 'PI WAT GD'),
        ('other',     'Other'),
    ]

    # Override username — we use email as the login field
    username = models.CharField(
        max_length=150,
        unique=True,
        blank=True,
        help_text='Auto-generated. Not used for login.',
    )
    email = models.EmailField(unique=True)

    # Profile
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=20, choices=ROLES, default='student')
    avatar_url = models.URLField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    target_exam = models.CharField(
        max_length=20, choices=EXAM_CHOICES, blank=True,
        help_text='Primary exam the student is preparing for.'
    )

    # Verification gate
    is_verified = models.BooleanField(
        default=False,
        help_text='Email must be verified before login is allowed.'
    )

    # OAuth source
    is_google_auth = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['target_exam']),
        ]

    def __str__(self):
        return f'{self.get_full_name()} <{self.email}>'

    @property
    def full_name(self):
        return self.get_full_name() or self.email.split('@')[0]

    def save(self, *args, **kwargs):
        # Auto-generate username from email if not set
        if not self.username:
            base = self.email.split('@')[0].lower()
            self.username = f"{base}_{uuid.uuid4().hex[:6]}"
        super().save(*args, **kwargs)


# ── TOKENS ───────────────────────────────────────────────────────────────────

class EmailVerificationToken(models.Model):
    """
    Single-use token sent to user's email to verify their address.
    Expires after 24 hours.
    """
    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='verification_tokens'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'email_verification_tokens'

    def save(self, *args, **kwargs):
        if not self.pk:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.used and not self.is_expired

    def consume(self):
        """Mark token as used and verify the associated user."""
        self.used = True
        self.used_at = timezone.now()
        self.save(update_fields=['used', 'used_at'])
        self.user.is_verified = True
        self.user.save(update_fields=['is_verified'])

    def __str__(self):
        return f'VerifyToken({self.user.email}, used={self.used})'


class PasswordResetToken(models.Model):
    """
    Single-use token for password reset.
    Expires after 1 hour.
    """
    user = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = 'password_reset_tokens'

    def save(self, *args, **kwargs):
        if not self.pk:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        return not self.used and timezone.now() <= self.expires_at

    def consume(self):
        self.used = True
        self.save(update_fields=['used'])

    def __str__(self):
        return f'ResetToken({self.user.email}, used={self.used})'


class LoginAuditLog(models.Model):
    """
    Track login attempts for security monitoring.
    Surfaces in Django admin for admins.
    """
    OUTCOMES = [('success', 'Success'), ('failed', 'Failed'), ('blocked', 'Blocked')]

    # Was previously invisible in this table — every failure just said
    # "Failed", and you had to know that a blank `user` column meant "no
    # such account" vs a populated one meaning "wrong password" to tell
    # them apart. Explicit now.
    FAILURE_REASONS = [
        ('no_account', 'No account with this email'),
        ('wrong_password', 'Wrong password'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='login_logs'
    )
    email_attempted = models.EmailField()
    outcome = models.CharField(max_length=20, choices=OUTCOMES)
    failure_reason = models.CharField(max_length=20, choices=FAILURE_REASONS, blank=True)
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'login_audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email_attempted', '-created_at']),
            models.Index(fields=['ip_address', '-created_at']),
        ]