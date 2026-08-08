"""
GRADSKOOL — Accounts Serializers

Covers: registration, login (JWT), profile read/update,
email verification, password reset, Google OAuth token exchange.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, EmailVerificationToken, PasswordResetToken


# ── JWT ───────────────────────────────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extend the default JWT payload to include user metadata.
    This means the frontend never needs a separate /me call
    after login to render the navbar.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['avatar_url'] = user.avatar_url
        token['is_verified'] = user.is_verified
        return token

    def validate(self, attrs):
        # Django's default uses USERNAME_FIELD — we've set that to email
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user).data
        return data


# ── REGISTRATION ──────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    """
    Used for POST /auth/register/

    Validates:
    - Password strength (Django validators)
    - Password confirmation match
    - Email uniqueness (model level, surfaced here with a clean message)
    """
    password = serializers.CharField(
        write_only=True, min_length=8,
        style={'input_type': 'password'},
        help_text='Minimum 8 characters.'
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email',
            'phone', 'target_exam',
            'password', 'password_confirm',
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone': {'required': False},
            'target_exam': {'required': False},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'An account with this email already exists.'
            )
        return value.lower()

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            target_exam=validated_data.get('target_exam', ''),
            is_verified=False,
        )
        return user


# ── PROFILE ───────────────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only profile — returned in login response and /me endpoint."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'avatar_url', 'city', 'target_exam',
            'is_verified', 'is_google_auth', 'created_at',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.full_name


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Used for PATCH /auth/me/
    Email and role cannot be changed via this endpoint.
    """

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'city', 'target_exam', 'avatar_url']

    def validate_phone(self, value):
        if value and len(value) < 10:
            raise serializers.ValidationError('Enter a valid phone number.')
        return value


# ── EMAIL VERIFICATION ────────────────────────────────────────────────────────

class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(token=value)
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError('Verification link is invalid.')

        if token_obj.used:
            raise serializers.ValidationError('This link has already been used.')

        if token_obj.is_expired:
            raise serializers.ValidationError(
                'This link has expired. Request a new verification email.'
            )

        self.context['token_obj'] = token_obj
        return value


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email__iexact=value)
        except User.DoesNotExist:
            # Security: do not reveal whether email exists
            return value
        if user.is_verified:
            raise serializers.ValidationError('This account is already verified.')
        self.context['user'] = user
        return value


# ── PASSWORD RESET ────────────────────────────────────────────────────────────

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # Always return 200 — do not reveal whether email exists
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(
        write_only=True, min_length=8,
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate_token(self, value):
        try:
            token_obj = PasswordResetToken.objects.select_related('user').get(token=value)
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError('Reset link is invalid.')

        if not token_obj.is_valid:
            raise serializers.ValidationError(
                'This link has expired or already been used. Request a new one.'
            )

        self.context['token_obj'] = token_obj
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs.pop('new_password_confirm'):
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        return attrs


# ── PASSWORD CHANGE (authenticated) ──────────────────────────────────────────

class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        write_only=True, min_length=8,
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context['request'].user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs.pop('new_password_confirm'):
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        return attrs


# ── GOOGLE OAUTH ──────────────────────────────────────────────────────────────

class GoogleAuthSerializer(serializers.Serializer):
    """
    Receives the Google ID token from the frontend (after Google Sign-In button).
    Backend verifies it with Google and exchanges for our JWT.
    """
    credential = serializers.CharField(
        help_text='Google ID token from google.accounts.id.initialize callback'
    )
