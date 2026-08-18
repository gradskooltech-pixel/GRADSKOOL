"""
GRADSKOOL — Accounts Views

Full auth lifecycle:
  POST  /auth/register/              Register new user, send verification email
  POST  /auth/login/                 Login → JWT access + refresh
  POST  /auth/token/refresh/         Rotate refresh token
  POST  /auth/logout/                Blacklist refresh token
  POST  /auth/verify-email/          Consume verification token
  POST  /auth/resend-verification/   Resend verification email
  POST  /auth/password-reset/        Request password reset email
  POST  /auth/password-reset/confirm/ Apply new password
  POST  /auth/password-change/       Change password (authenticated)
  POST  /auth/google/                Exchange Google ID token → JWT
  GET   /auth/me/                    Current user profile
  PATCH /auth/me/                    Update profile
"""
import logging
import google.auth.transport.requests
import google.oauth2.id_token
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .emails import send_verification_email, send_welcome_email, send_password_reset_email
from .models import User, EmailVerificationToken, PasswordResetToken, LoginAuditLog, PasswordResetRequestLog
from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    EmailVerificationSerializer,
    ResendVerificationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordChangeSerializer,
    GoogleAuthSerializer,
)

logger = logging.getLogger(__name__)


# ── THROTTLES ─────────────────────────────────────────────────────────────────

class LoginRateThrottle(AnonRateThrottle):
    scope = 'auth_login'


class RegisterRateThrottle(AnonRateThrottle):
    scope = 'auth_register'


# ── HELPERS ───────────────────────────────────────────────────────────────────

def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _build_jwt_response(user):
    """Build the standard auth response: access token, refresh token, user profile."""
    refresh = RefreshToken.for_user(user)
    # Embed role + metadata in the access token payload
    refresh.access_token['role'] = user.role
    refresh.access_token['full_name'] = user.full_name
    refresh.access_token['is_verified'] = user.is_verified
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserProfileSerializer(user).data,
    }


# ── REGISTER ──────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    """
    POST /auth/register/

    Creates a new student account and sends a verification email.
    Does NOT return JWT tokens — user must verify email first.

    Rate limited to 10 registrations / hour per IP.
    """
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # In development: auto-verify the account so login works without email setup
        from django.conf import settings as django_settings
        if django_settings.DEBUG:
            user.is_verified = True
            user.save(update_fields=['is_verified'])
            logger.info(f'[DEV] Auto-verified {user.email} — email verification skipped in DEBUG mode')
            return Response({
                'success': True,
                'detail': 'Account created successfully.',
                'email': user.email,
            }, status=status.HTTP_201_CREATED)
        else:
            # Production: send verification email via Resend
            redirect_path = request.data.get('redirect', '')
            email_sent = False
            try:
                token = EmailVerificationToken.objects.create(user=user)
                email_sent = send_verification_email(user, str(token.token), redirect_path)
                if not email_sent:
                    logger.error(f'Verification email failed for {user.email}')
            except Exception as e:
                logger.error(f'Email verification error for {user.email}: {e}')

            logger.info(f'New registration: {user.email} (email_sent={email_sent})')

            return Response({
                'detail': (
                    f'Account created. A verification link has been sent to {user.email}. '
                    'Please verify your email to log in.'
                ),
                'email': user.email,
            }, status=status.HTTP_201_CREATED)


# ── LOGIN ─────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /auth/login/

    Returns JWT access + refresh tokens on success.
    Guards:
    - Unverified accounts → 403 with clear message
    - Invalid credentials → 401
    - Rate limited: 5/minute per IP

    Always logs the attempt to LoginAuditLog.
    """
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def throttled(self, request, wait):
        # DRF's throttle check runs in initial(), before post() ever
        # executes — so a rate-limited request never reached the logging
        # code below at all. The model already had 'blocked' as an outcome
        # choice; it was just never actually set anywhere. This is the one
        # place that can catch it, since it's the actual point DRF raises
        # the Throttled exception.
        try:
            email = request.data.get('email', '').lower().strip()
            LoginAuditLog.objects.create(
                email_attempted=email, outcome='blocked',
                ip_address=_get_client_ip(request), user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        super().throttled(request, wait)

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')
        ip = _get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '')

        # Attempt lookup
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            try:
                LoginAuditLog.objects.create(
                    email_attempted=email, outcome='failed', failure_reason='no_account',
                    ip_address=ip, user_agent=ua
                )
            except Exception:
                pass
            # SECURITY TRADE-OFF (2026-08-19): this used to be a generic
            # "Invalid email or password" for both "no such account" and
            # "wrong password", specifically to prevent email enumeration —
            # a distinct message here lets anyone probe whether a given
            # email is registered on GRADSKOOL. Changed deliberately, at the
            # site owner's request, because the actual login-audit data
            # showed most "failed" logins were confused users who'd never
            # registered, retrying the same login form instead of signing
            # up — a real, larger UX cost than the enumeration risk here.
            # If this becomes a problem (credential-stuffing, targeted
            # harassment via email-existence probing), revert to the
            # generic message below.
            return Response(
                {'detail': 'No account found with this email. Did you mean to sign up instead?',
                 'code': 'no_account'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            try:
                LoginAuditLog.objects.create(
                    user=user, email_attempted=email, outcome='failed', failure_reason='wrong_password',
                    ip_address=ip, user_agent=ua
                )
            except Exception:
                pass
            return Response(
                {'detail': 'Incorrect password.', 'code': 'wrong_password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_verified:
            return Response(
                {
                    'detail': 'Please verify your email address before logging in.',
                    'code': 'email_not_verified',
                    'email': user.email,
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {'detail': 'This account has been deactivated. Contact support.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            LoginAuditLog.objects.create(
                user=user, email_attempted=email, outcome='success',
                ip_address=ip, user_agent=ua
            )
        except Exception:
            pass

        logger.info(f'Login success: {user.email}')
        token_data = _build_jwt_response(user)
        resp = Response(token_data, status=status.HTTP_200_OK)

        # Set HttpOnly cookies as defence-in-depth
        # Frontend still reads body tokens; cookies add a second layer
        from django.conf import settings
        is_secure = not getattr(settings, 'DEBUG', True)
        resp.set_cookie('gs_access',  token_data['access'],  max_age=3600,      httponly=True, secure=is_secure, samesite='Lax')
        resp.set_cookie('gs_refresh', token_data['refresh'], max_age=3600*24*7, httponly=True, secure=is_secure, samesite='Lax', path='/api/v1/auth/token/refresh/')
        return resp


# ── TOKEN REFRESH ─────────────────────────────────────────────────────────────

class TokenRefreshView(TokenRefreshView):
    """
    POST /auth/token/refresh/

    Standard simplejwt refresh — returns new access token.
    ROTATE_REFRESH_TOKENS=True means the refresh token is also rotated,
    and the old one is blacklisted.
    """
    pass


# ── LOGOUT ────────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """
    POST /auth/logout/
    Body: { "refresh": "<refresh_token>" }

    Blacklists the refresh token so it cannot be reused.
    Access tokens expire naturally (15 min).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Token already invalid — still return 200, logout is successful from UX perspective
            pass

        return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_200_OK)


# ── EMAIL VERIFICATION ────────────────────────────────────────────────────────

class VerifyEmailView(APIView):
    """
    POST /auth/verify-email/
    Body: { "token": "<uuid>" }

    Marks user as verified and sends welcome email.
    Returns JWT tokens so user is logged in immediately after verification.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        token_obj = serializer.context['token_obj']

        # Consume the token (marks user as verified)
        token_obj.consume()
        user = token_obj.user

        # Send welcome email (fire and forget)
        send_welcome_email(user)

        logger.info(f'Email verified: {user.email}')
        return Response({
            'detail': 'Email verified successfully. You are now logged in.',
            **_build_jwt_response(user),
        }, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    """
    POST /auth/resend-verification/
    Body: { "email": "..." }

    Invalidates old tokens (by ignoring them — they expire naturally)
    and creates a fresh one.
    """
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = ResendVerificationSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.context.get('user')

        if user:
            token = EmailVerificationToken.objects.create(user=user)
            send_verification_email(user, str(token.token))

        # Always return same response — no email enumeration
        return Response({
            'detail': 'If this email is registered and unverified, a new link has been sent.'
        })


# ── PASSWORD RESET ────────────────────────────────────────────────────────────

class PasswordResetRequestView(APIView):
    """
    POST /auth/password-reset/
    Body: { "email": "..." }

    Sends a reset link. Always returns 200 — no email enumeration.
    """
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        ip = _get_client_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '')
        try:
            user = User.objects.get(email=email, is_active=True)
            token = PasswordResetToken.objects.create(user=user)
            send_password_reset_email(user, str(token.token))
            try:
                PasswordResetRequestLog.objects.create(
                    user=user, email_attempted=email, account_found=True,
                    ip_address=ip, user_agent=ua
                )
            except Exception:
                pass
        except User.DoesNotExist:
            try:
                PasswordResetRequestLog.objects.create(
                    email_attempted=email, account_found=False,
                    ip_address=ip, user_agent=ua
                )
            except Exception:
                pass
            pass  # Silent — no enumeration in the HTTP response either way

        return Response({
            'detail': 'If an account with this email exists, a reset link has been sent.'
        })


class PasswordResetConfirmView(APIView):
    """
    POST /auth/password-reset/confirm/
    Body: { "token": "...", "new_password": "...", "new_password_confirm": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        token_obj = serializer.context['token_obj']

        user = token_obj.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        token_obj.consume()

        logger.info(f'Password reset completed: {user.email}')
        return Response({'detail': 'Password has been reset. You can now log in.'})


# ── PASSWORD CHANGE (authenticated) ──────────────────────────────────────────

class PasswordChangeView(APIView):
    """
    POST /auth/password-change/
    Requires: Authorization: Bearer <access_token>
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'})


# ── GOOGLE OAUTH ──────────────────────────────────────────────────────────────

class GoogleAuthView(APIView):
    """
    POST /auth/google/
    Body: { "credential": "<Google ID token>" }

    Flow:
    1. Verify ID token with Google
    2. Find or create user
    3. Auto-verify (Google has already verified the email)
    4. Return JWT tokens
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data['credential']

        try:
            # Verify with Google
            google_request = google.auth.transport.requests.Request()
            id_info = google.oauth2.id_token.verify_oauth2_token(
                credential,
                google_request,
                settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
            )
        except ValueError as e:
            logger.warning(f'Google token verification failed: {e}')
            return Response(
                {'detail': 'Invalid Google credential. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = id_info.get('email', '').lower()
        if not email:
            return Response(
                {'detail': 'Could not retrieve email from Google account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': id_info.get('given_name', ''),
                'last_name': id_info.get('family_name', ''),
                'avatar_url': id_info.get('picture', ''),
                'is_verified': True,       # Google-verified email
                'is_google_auth': True,
            }
        )

        if not created:
            # Existing user — update avatar if not set
            if not user.avatar_url and id_info.get('picture'):
                user.avatar_url = id_info['picture']
            if not user.is_verified:
                user.is_verified = True
            user.save(update_fields=['avatar_url', 'is_verified'])

        if not user.is_active:
            return Response(
                {'detail': 'This account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN
            )

        logger.info(f'Google auth: {user.email} (new={created})')
        return Response({
            **_build_jwt_response(user),
            'is_new_user': created,
        }, status=status.HTTP_200_OK)


# ── PROFILE ───────────────────────────────────────────────────────────────────

class MeView(generics.RetrieveUpdateAPIView):
    """
    GET  /auth/me/ → Returns current user profile
    PATCH /auth/me/ → Updates allowed fields (name, phone, city, target_exam, avatar)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            return UserProfileUpdateSerializer
        return UserProfileSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True   # Always partial — never require all fields
        return super().update(request, *args, **kwargs)