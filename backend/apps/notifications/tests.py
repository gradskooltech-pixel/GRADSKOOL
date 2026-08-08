"""
GRADSKOOL — Notifications Tests
"""
from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.notifications.models import InAppNotification, WhatsAppLog
from apps.notifications.services import (
    create_notification, get_unread_count, mark_all_read,
)
from apps.notifications.whatsapp import _normalize_phone, process_interakt_webhook


def make_user(email='n@test.com'):
    u = User.objects.create_user(email=email, password='Pass1234!',
                                  first_name='Test', last_name='User')
    u.is_verified = True
    u.phone = '9876543210'
    u.save()
    return u

def auth_client(user):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {str(RefreshToken.for_user(user).access_token)}')
    return c


class InAppNotificationTests(TestCase):

    def setUp(self):
        self.user = make_user()

    def test_create_notification(self):
        notif = create_notification(
            user=self.user, category='enrollment',
            title='Test', body='Body', icon='🎓',
        )
        self.assertIsNotNone(notif)
        self.assertEqual(notif.user, self.user)
        self.assertFalse(notif.is_read)

    def test_unread_count(self):
        create_notification(self.user, 'system', 'A', 'b')
        create_notification(self.user, 'system', 'C', 'd')
        self.assertEqual(get_unread_count(self.user), 2)

    def test_mark_read(self):
        notif = create_notification(self.user, 'system', 'A', 'b')
        notif.mark_read()
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)
        self.assertIsNotNone(notif.read_at)
        self.assertEqual(get_unread_count(self.user), 0)

    def test_mark_all_read(self):
        create_notification(self.user, 'system', 'A', 'b')
        create_notification(self.user, 'system', 'C', 'd')
        mark_all_read(self.user)
        self.assertEqual(get_unread_count(self.user), 0)

    def test_expires_at_auto_set(self):
        notif = create_notification(self.user, 'system', 'X', 'y')
        self.assertIsNotNone(notif.expires_at)


class PhoneNormalizationTests(TestCase):

    def test_10_digit_adds_india_code(self):
        self.assertEqual(_normalize_phone('9876543210'), '+919876543210')

    def test_already_e164(self):
        self.assertEqual(_normalize_phone('+919876543210'), '+919876543210')

    def test_leading_zero_stripped(self):
        self.assertEqual(_normalize_phone('09876543210'), '+919876543210')


class WhatsAppServiceTests(TestCase):

    def setUp(self):
        self.user = make_user()

    def test_dev_mode_creates_log(self):
        from apps.notifications.whatsapp import send_whatsapp
        log = send_whatsapp(self.user, 'welcome', {'first_name': 'Test'})
        self.assertIsNotNone(log)
        self.assertEqual(log.status, 'sent')  # Dev mode auto-marks sent

    def test_no_phone_returns_none(self):
        from apps.notifications.whatsapp import send_whatsapp
        self.user.phone = ''
        self.user.save()
        result = send_whatsapp(self.user, 'welcome', {})
        self.assertIsNone(result)

    def test_idempotency_prevents_duplicate(self):
        from apps.notifications.whatsapp import send_whatsapp
        key = 'test-idem-key-123'
        send_whatsapp(self.user, 'welcome', {}, idempotency_key=key)
        send_whatsapp(self.user, 'welcome', {}, idempotency_key=key)
        self.assertEqual(WhatsAppLog.objects.filter(
            idempotency_key=key
        ).count(), 1)

    def test_webhook_updates_status(self):
        log = WhatsAppLog.objects.create(
            user=self.user, phone='+919876543210',
            template='welcome', status='sent',
            provider_msg_id='interakt_msg_001',
        )
        process_interakt_webhook({
            'type': 'message_delivered',
            'messageId': 'interakt_msg_001',
        })
        log.refresh_from_db()
        self.assertEqual(log.status, 'delivered')


class NotificationAPITests(TestCase):

    def setUp(self):
        self.user   = make_user()
        self.client = auth_client(self.user)

    def test_list_notifications(self):
        create_notification(self.user, 'system', 'Hello', 'World')
        url = reverse('notifications:list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['notifications']), 1)
        self.assertEqual(res.data['unread_count'], 1)

    def test_unread_count_endpoint(self):
        create_notification(self.user, 'system', 'A', 'b')
        create_notification(self.user, 'system', 'C', 'd')
        url = reverse('notifications:unread-count')
        res = self.client.get(url)
        self.assertEqual(res.data['unread_count'], 2)

    def test_mark_read(self):
        n = create_notification(self.user, 'system', 'A', 'b')
        url = reverse('notifications:mark-read')
        res = self.client.post(url, {'ids': [n.id]}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        n.refresh_from_db()
        self.assertTrue(n.is_read)

    def test_mark_all_read(self):
        create_notification(self.user, 'system', 'A', 'b')
        create_notification(self.user, 'system', 'C', 'd')
        url = reverse('notifications:mark-all-read')
        self.client.post(url)
        self.assertEqual(get_unread_count(self.user), 0)

    def test_requires_auth(self):
        url = reverse('notifications:list')
        res = APIClient().get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_whatsapp_webhook_no_auth(self):
        url = reverse('notifications:whatsapp-webhook')
        res = APIClient().post(url, {'type': 'message_delivered'}, format='json')
        self.assertNotEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
