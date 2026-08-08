"""
GRADSKOOL — Accounts URLs

All endpoints under /api/v1/auth/
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    VerifyEmailView,
    ResendVerificationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PasswordChangeView,
    GoogleAuthView,
    MeView,
)

app_name = 'accounts'

urlpatterns = [
    # Registration & Login
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Email verification
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),

    # Password reset (unauthenticated)
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Password change (authenticated)
    path('password-change/', PasswordChangeView.as_view(), name='password-change'),

    # Google OAuth
    path('google/', GoogleAuthView.as_view(), name='google-auth'),

    # Profile
    path('me/', MeView.as_view(), name='me'),
]
