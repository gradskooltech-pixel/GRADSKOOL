"""
GRADSKOOL — Accounts Tests

Full coverage for M1 Auth:
  - Registration (success, duplicate email, weak password, missing fields)
  - Login (success, wrong password, unverified account, inactive account)
  - Email verification (success, expired, used, invalid)
  - Resend verification
  - Password reset (request + confirm)
  - Password change (authenticated)
  - Token refresh + logout (blacklist)
  - Google OAuth (success, invalid token)
  - Profile get + update

Run: python manage.py test apps.accounts --settings=config.settings.development
"""
import uuid
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, EmailVerificationToken, PasswordResetToken, LoginAuditLog


# ── HELPERS ───────────────────────────────────────────────────────────────────

def make_user(email='test@example.com', password='TestPass123!', verified=True, **kwargs):
    user = User.objects.create_user(
        email=email, password=password,
        first_name='Test', last_name='User',
        **kwargs
    )
    user.is_verified = verified
    user.save()
    return user


def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client


# ── REGISTRATION ──────────────────────────────────────────────────────────────

class RegisterTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('accounts:register')
        self.valid_data = {
            'first_name': 'Keshav',
            'last_name': 'Mundra',
            'email': 'keshav@example.com',
            'password': 'SecurePass99!',
            'password_confirm': 'SecurePass99!',
            'target_exam': 'CAT',
        }

    @patch('apps.accounts.views.send_verification_email', return_value=True)
    def test_register_success(self, mock_email):
        res = self.client.post(self.url, self.valid_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('email', res.data)
        self.assertTrue(User.objects.filter(email='keshav@example.com').exists())
        mock_email.assert_called_once()

    @patch('apps.accounts.views.send_verification_email', return_value=True)
    def test_register_creates_unverified_user(self, _):
        self.client.post(self.url, self.valid_data)
        user = User.objects.get(email='keshav@example.com')
        self.assertFalse(user.is_verified)

    @patch('apps.accounts.views.send_verification_email', return_value=True)
    def test_register_duplicate_email(self, _):
        make_user(email='keshav@example.com')
        res = self.client.post(self.url, self.valid_data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        data = {**self.valid_data, 'password_confirm': 'WrongPass!'}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_weak_password(self):
        data = {**self.valid_data, 'password': '123', 'password_confirm': '123'}
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_email(self):
        data = {**self.valid_data}
        del data['email']
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_name(self):
        data = {**self.valid_data}
        del data['first_name']
        res = self.client.post(self.url, data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('apps.accounts.views.send_verification_email', return_value=True)
    def test_register_creates_verification_token(self, _):
        self.client.post(self.url, self.valid_data)
        user = User.objects.get(email='keshav@example.com')
        self.assertTrue(EmailVerificationToken.objects.filter(user=user).exists())


# ── LOGIN ─────────────────────────────────────────────────────────────────────

class LoginTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('accounts:login')
        self.user = make_user(email='student@example.com', password='TestPass123!', verified=True)

    def test_login_success(self):
        res = self.client.post(self.url, {
            'email': 'student@example.com',
            'password': 'TestPass123!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertIn('user', res.data)
        self.assertEqual(res.data['user']['email'], 'student@example.com')

    def test_login_wrong_password(self):
        res = self.client.post(self.url, {
            'email': 'student@example.com',
            'password': 'WrongPassword!'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_nonexistent_email(self):
        res = self.client.post(self.url, {
            'email': 'nobody@example.com',
            'password': 'TestPass123!'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        # Same message — no enumeration
        self.assertEqual(res.data['detail'], 'Invalid email or password.')

    def test_login_unverified_account(self):
        unverified = make_user(email='unverified@example.com', verified=False)
        res = self.client.post(self.url, {
            'email': 'unverified@example.com',
            'password': 'TestPass123!'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data['code'], 'email_not_verified')

    def test_login_inactive_account(self):
        self.user.is_active = False
        self.user.save()
        res = self.client.post(self.url, {
            'email': 'student@example.com',
            'password': 'TestPass123!'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_creates_audit_log(self):
        self.client.post(self.url, {
            'email': 'student@example.com',
            'password': 'TestPass123!'
        })
        log = LoginAuditLog.objects.filter(email_attempted='student@example.com').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.outcome, 'success')

    def test_failed_login_creates_audit_log(self):
        self.client.post(self.url, {
            'email': 'student@example.com',
            'password': 'WrongPassword'
        })
        log = LoginAuditLog.objects.filter(
            email_attempted='student@example.com', outcome='failed'
        ).first()
        self.assertIsNotNone(log)


# ── EMAIL VERIFICATION ────────────────────────────────────────────────────────

class EmailVerificationTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('accounts:verify-email')
        self.user = make_user(email='verify@example.com', verified=False)

    @patch('apps.accounts.views.send_welcome_email', return_value=True)
    def test_verify_success(self, mock_welcome):
        token = EmailVerificationToken.objects.create(user=self.user)
        res = self.client.post(self.url, {'token': str(token.token)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)   # Auto-logged in after verify
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_verified)
        mock_welcome.assert_called_once()

    def test_verify_invalid_token(self):
        res = self.client.post(self.url, {'token': str(uuid.uuid4())})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_already_used_token(self):
        token = EmailVerificationToken.objects.create(user=self.user)
        token.used = True
        token.save()
        res = self.client.post(self.url, {'token': str(token.token)})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_expired_token(self):
        token = EmailVerificationToken.objects.create(user=self.user)
        token.expires_at = timezone.now() - timedelta(hours=1)
        token.save()
        res = self.client.post(self.url, {'token': str(token.token)})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ── PASSWORD RESET ────────────────────────────────────────────────────────────

class PasswordResetTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.request_url = reverse('accounts:password-reset')
        self.confirm_url = reverse('accounts:password-reset-confirm')
        self.user = make_user(email='reset@example.com', password='OldPass123!')

    @patch('apps.accounts.views.send_password_reset_email', return_value=True)
    def test_reset_request_always_200(self, mock_email):
        # Known email
        res = self.client.post(self.request_url, {'email': 'reset@example.com'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        mock_email.assert_called_once()

    @patch('apps.accounts.views.send_password_reset_email', return_value=True)
    def test_reset_request_unknown_email_still_200(self, mock_email):
        res = self.client.post(self.request_url, {'email': 'nobody@example.com'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        mock_email.assert_not_called()

    def test_reset_confirm_success(self):
        token = PasswordResetToken.objects.create(user=self.user)
        res = self.client.post(self.confirm_url, {
            'token': str(token.token),
            'new_password': 'NewSecurePass99!',
            'new_password_confirm': 'NewSecurePass99!',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecurePass99!'))

    def test_reset_confirm_expired_token(self):
        token = PasswordResetToken.objects.create(user=self.user)
        token.expires_at = timezone.now() - timedelta(hours=2)
        token.save()
        res = self.client.post(self.confirm_url, {
            'token': str(token.token),
            'new_password': 'NewSecurePass99!',
            'new_password_confirm': 'NewSecurePass99!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_confirm_used_token(self):
        token = PasswordResetToken.objects.create(user=self.user)
        token.used = True
        token.save()
        res = self.client.post(self.confirm_url, {
            'token': str(token.token),
            'new_password': 'NewSecurePass99!',
            'new_password_confirm': 'NewSecurePass99!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_confirm_password_mismatch(self):
        token = PasswordResetToken.objects.create(user=self.user)
        res = self.client.post(self.confirm_url, {
            'token': str(token.token),
            'new_password': 'NewSecurePass99!',
            'new_password_confirm': 'DifferentPass99!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ── PASSWORD CHANGE ───────────────────────────────────────────────────────────

class PasswordChangeTests(TestCase):

    def setUp(self):
        self.user = make_user(email='change@example.com', password='CurrentPass99!')
        self.client = auth_client(self.user)
        self.url = reverse('accounts:password-change')

    def test_change_success(self):
        res = self.client.post(self.url, {
            'current_password': 'CurrentPass99!',
            'new_password': 'NewSecurePass99!',
            'new_password_confirm': 'NewSecurePass99!',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecurePass99!'))

    def test_change_wrong_current_password(self):
        res = self.client.post(self.url, {
            'current_password': 'WrongCurrentPass!',
            'new_password': 'NewSecurePass99!',
            'new_password_confirm': 'NewSecurePass99!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_requires_auth(self):
        unauthed = APIClient()
        res = unauthed.post(self.url, {
            'current_password': 'CurrentPass99!',
            'new_password': 'NewSecurePass99!',
            'new_password_confirm': 'NewSecurePass99!',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── LOGOUT ────────────────────────────────────────────────────────────────────

class LogoutTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.url = reverse('accounts:logout')

    def test_logout_blacklists_token(self):
        refresh = RefreshToken.for_user(self.user)
        client = auth_client(self.user)
        res = client.post(self.url, {'refresh': str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_logout_requires_auth(self):
        client = APIClient()
        res = client.post(self.url, {'refresh': 'some_token'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_without_refresh_token(self):
        client = auth_client(self.user)
        res = client.post(self.url, {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ── PROFILE ───────────────────────────────────────────────────────────────────

class ProfileTests(TestCase):

    def setUp(self):
        self.user = make_user(
            email='profile@example.com',
            first_name='Vanshaj', last_name='Jaiman'
        )
        self.client = auth_client(self.user)
        self.url = reverse('accounts:me')

    def test_get_profile(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], 'profile@example.com')
        self.assertEqual(res.data['first_name'], 'Vanshaj')

    def test_update_profile(self):
        res = self.client.patch(self.url, {
            'city': 'Bhopal',
            'target_exam': 'CAT',
            'phone': '9876543210',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.city, 'Bhopal')
        self.assertEqual(self.user.target_exam, 'CAT')

    def test_cannot_update_email_via_profile(self):
        res = self.client.patch(self.url, {'email': 'hacked@example.com'})
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'profile@example.com')

    def test_profile_requires_auth(self):
        client = APIClient()
        res = client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── TOKEN REFRESH ─────────────────────────────────────────────────────────────

class TokenRefreshTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.url = reverse('accounts:token-refresh')

    def test_refresh_returns_new_access(self):
        refresh = RefreshToken.for_user(self.user)
        res = APIClient().post(self.url, {'refresh': str(refresh)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)

    def test_refresh_invalid_token(self):
        res = APIClient().post(self.url, {'refresh': 'invalid.token.here'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ── GOOGLE AUTH ───────────────────────────────────────────────────────────────

class GoogleAuthTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('accounts:google-auth')

    @patch('apps.accounts.views.google.oauth2.id_token.verify_oauth2_token')
    def test_google_auth_creates_new_user(self, mock_verify):
        mock_verify.return_value = {
            'email': 'google_user@gmail.com',
            'given_name': 'Google',
            'family_name': 'User',
            'picture': 'https://example.com/photo.jpg',
        }
        res = self.client.post(self.url, {'credential': 'fake_google_token'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertTrue(res.data['is_new_user'])
        user = User.objects.get(email='google_user@gmail.com')
        self.assertTrue(user.is_verified)
        self.assertTrue(user.is_google_auth)

    @patch('apps.accounts.views.google.oauth2.id_token.verify_oauth2_token')
    def test_google_auth_existing_user(self, mock_verify):
        existing = make_user(email='existing@gmail.com')
        mock_verify.return_value = {
            'email': 'existing@gmail.com',
            'given_name': 'Existing',
            'family_name': 'User',
        }
        res = self.client.post(self.url, {'credential': 'fake_token'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['is_new_user'])

    @patch('apps.accounts.views.google.oauth2.id_token.verify_oauth2_token',
           side_effect=ValueError('Invalid token'))
    def test_google_auth_invalid_credential(self, _):
        res = self.client.post(self.url, {'credential': 'bad_token'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ── MODEL TESTS ───────────────────────────────────────────────────────────────

class UserModelTests(TestCase):

    def test_email_is_login_field(self):
        self.assertEqual(User.USERNAME_FIELD, 'email')

    def test_username_auto_generated(self):
        user = make_user(email='auto@example.com')
        self.assertTrue(user.username.startswith('auto'))
        self.assertTrue(len(user.username) > 4)

    def test_superuser_creation(self):
        admin = User.objects.create_superuser(
            email='admin@example.com', password='AdminPass99!'
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_verified)
        self.assertEqual(admin.role, 'admin')

    def test_verification_token_is_expired(self):
        user = make_user()
        token = EmailVerificationToken.objects.create(user=user)
        token.expires_at = timezone.now() - timedelta(seconds=1)
        token.save()
        self.assertTrue(token.is_expired)
        self.assertFalse(token.is_valid)

    def test_verification_token_consume(self):
        user = make_user(verified=False)
        token = EmailVerificationToken.objects.create(user=user)
        token.consume()
        token.refresh_from_db()
        user.refresh_from_db()
        self.assertTrue(token.used)
        self.assertTrue(user.is_verified)

    def test_password_reset_token_is_valid(self):
        user = make_user()
        token = PasswordResetToken.objects.create(user=user)
        self.assertTrue(token.is_valid)

    def test_password_reset_token_consume(self):
        user = make_user()
        token = PasswordResetToken.objects.create(user=user)
        token.consume()
        token.refresh_from_db()
        self.assertTrue(token.used)
        self.assertFalse(token.is_valid)
