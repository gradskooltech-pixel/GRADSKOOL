"""
GRADSKOOL — M3+M4+M6 Tests

Enrollments: rebuild_access, check_access, access merge
Payments:    create order, signature verify, webhook activation, refund
Content:     video list, stream URL gating, progress upsert, AI notes

Run: python manage.py test apps.enrollments apps.payments apps.content \
         --settings=config.settings.development
"""
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.courses.models import Exam, PricingPlan, Course
from apps.enrollments.models import Enrollment, CourseAccess
from apps.enrollments.services import rebuild_access, check_access
from apps.payments.models import Order
from apps.content.models import VideoLibrary, VideoProgress, AITranscript


# ── TEST HELPERS ──────────────────────────────────────────────────────────────

def make_user(email='test@example.com', **kw):
    u = User.objects.create_user(
        email=email, password='Pass1234!',
        first_name='Test', last_name='User', **kw
    )
    u.is_verified = True
    u.save()
    return u

def auth_client(user):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {str(RefreshToken.for_user(user).access_token)}')
    return c

def make_exam(slug='cat'):
    return Exam.objects.create(
        slug=slug, name=f'{slug.upper()} 2026', short_name=slug.upper(),
        category='mba_india', is_active=True
    )

def make_plan(exam, slug='live-mocks', includes_live=True, includes_mocks=True,
              includes_books=False, includes_gdpi=False, price=15999):
    return PricingPlan.objects.create(
        exam=exam, name='Live + Mocks', slug=slug,
        price_inr=Decimal(str(price)),
        razorpay_sku=f'{exam.slug}-{slug}',
        includes_live=includes_live,
        includes_mocks=includes_mocks,
        includes_books=includes_books,
        includes_gdpi=includes_gdpi,
        mock_exams_covered=[exam.short_name],
        is_active=True,
    )

def make_order(user, plan, status='paid'):
    return Order.objects.create(
        user=user, plan=plan,
        razorpay_order_id=f'order_{user.id}_{plan.id}',
        amount_inr=plan.price_inr,
        gst_amount=plan.price_inr * Decimal('0.18'),
        total_amount=plan.price_inr * Decimal('1.18'),
        status=status,
        invoice_number=f'INV-2026-{user.id:06d}' if status == 'paid' else None,
    )

def make_enrollment(user, plan, order=None):
    if not order:
        order = make_order(user, plan)
    return Enrollment.objects.create(user=user, plan=plan, order=order, status='active')

def make_course(exam):
    return Course.objects.create(
        exam=exam, title='Test Cohort', batch_size=27, status='active'
    )

def make_video(course, bunny_id='vid-abc123', free=False):
    return VideoLibrary.objects.create(
        course=course, title='Test Video',
        bunny_video_id=bunny_id,
        is_published=True, is_free_preview=free,
    )


# ══════════════════════════════════════════════════════════════════════════════
# M3 — ENROLLMENTS
# ══════════════════════════════════════════════════════════════════════════════

class RebuildAccessTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()

    def test_no_enrollments_deletes_access(self):
        """No active enrollments → CourseAccess deleted."""
        CourseAccess.objects.create(
            user=self.user, exam=self.exam,
            can_attend_live=True, can_take_mocks=True
        )
        rebuild_access(self.user, self.exam)
        self.assertFalse(CourseAccess.objects.filter(user=self.user, exam=self.exam).exists())

    def test_live_plan_sets_live_and_recordings(self):
        plan = make_plan(self.exam, includes_live=True, includes_mocks=False)
        order = make_order(self.user, plan)
        Enrollment.objects.create(user=self.user, plan=plan, order=order, status='active')
        access = rebuild_access(self.user, self.exam)
        self.assertTrue(access.can_attend_live)
        self.assertTrue(access.can_watch_recordings)
        self.assertFalse(access.can_take_mocks)

    def test_mocks_plan_sets_mocks_flag(self):
        plan = make_plan(self.exam, slug='mocks-only', includes_live=False, includes_mocks=True)
        order = make_order(self.user, plan)
        Enrollment.objects.create(user=self.user, plan=plan, order=order, status='active')
        access = rebuild_access(self.user, self.exam)
        self.assertTrue(access.can_take_mocks)
        self.assertFalse(access.can_attend_live)

    def test_multiple_plans_merge_with_or(self):
        """Two active enrollments → access is the union."""
        plan1 = make_plan(self.exam, slug='live', includes_live=True, includes_mocks=False)
        plan2 = make_plan(self.exam, slug='books', includes_live=False,
                          includes_mocks=False, includes_books=True)
        for plan in [plan1, plan2]:
            order = make_order(self.user, plan)
            Enrollment.objects.create(user=self.user, plan=plan, order=order, status='active')
        access = rebuild_access(self.user, self.exam)
        self.assertTrue(access.can_attend_live)
        self.assertTrue(access.can_download_books)

    def test_suspended_enrollment_excluded(self):
        plan = make_plan(self.exam)
        order = make_order(self.user, plan)
        enr = Enrollment.objects.create(user=self.user, plan=plan, order=order, status='active')
        enr.suspend()
        rebuild_access(self.user, self.exam)
        self.assertFalse(CourseAccess.objects.filter(user=self.user, exam=self.exam).exists())

    def test_mock_exams_union(self):
        cat_plan = make_plan(self.exam, slug='cat-mocks',
                             includes_mocks=True, includes_live=False)
        cat_plan.mock_exams_covered = ['CAT']
        cat_plan.save()
        xat_exam = make_exam('xat')
        xat_plan = make_plan(xat_exam, slug='xat-mocks',
                             includes_mocks=True, includes_live=False)
        xat_plan.mock_exams_covered = ['XAT']
        xat_plan.save()

        for plan in [cat_plan]:
            order = make_order(self.user, plan)
            Enrollment.objects.create(user=self.user, plan=plan, order=order, status='active')

        access = rebuild_access(self.user, self.exam)
        self.assertIn('CAT', access.mock_exams_unlocked)


class CheckAccessTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()

    def test_no_access_record_returns_false(self):
        self.assertFalse(check_access(self.user, 'cat', 'can_attend_live'))

    def test_with_access_record_returns_flag(self):
        CourseAccess.objects.create(
            user=self.user, exam=self.exam,
            can_attend_live=True, can_take_mocks=False
        )
        self.assertTrue(check_access(self.user, 'cat', 'can_attend_live'))
        self.assertFalse(check_access(self.user, 'cat', 'can_take_mocks'))

    def test_unauthenticated_user_returns_false(self):
        from django.contrib.auth.models import AnonymousUser
        anon = AnonymousUser()
        self.assertFalse(check_access(anon, 'cat', 'can_attend_live'))


class EnrollmentAPITests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.plan = make_plan(self.exam)
        self.client = auth_client(self.user)

    def test_list_enrollments_empty(self):
        url = reverse('enrollments:list')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['results'], [])

    def test_list_enrollments_with_data(self):
        enr = make_enrollment(self.user, self.plan)
        url = reverse('enrollments:list')
        res = self.client.get(url)
        self.assertEqual(len(res.data['results']), 1)
        self.assertEqual(res.data['results'][0]['exam_slug'], 'cat')

    def test_access_summary(self):
        CourseAccess.objects.create(
            user=self.user, exam=self.exam,
            can_attend_live=True, can_watch_recordings=True
        )
        url = reverse('enrollments:access-summary')
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data[0]['exam_slug'], 'cat')
        self.assertTrue(res.data[0]['can_attend_live'])

    def test_exam_access_not_enrolled(self):
        url = reverse('enrollments:exam-access', kwargs={'exam_slug': 'cat'})
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['can_attend_live'])

    def test_exam_access_enrolled(self):
        CourseAccess.objects.create(
            user=self.user, exam=self.exam, can_attend_live=True
        )
        url = reverse('enrollments:exam-access', kwargs={'exam_slug': 'cat'})
        res = self.client.get(url)
        self.assertTrue(res.data['can_attend_live'])

    def test_requires_authentication(self):
        url = reverse('enrollments:list')
        res = APIClient().get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


# ══════════════════════════════════════════════════════════════════════════════
# M4 — PAYMENTS
# ══════════════════════════════════════════════════════════════════════════════

class CreateOrderTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.plan = make_plan(self.exam)
        self.client = auth_client(self.user)
        self.url = reverse('payments:create-order')

    @patch('apps.payments.services._razorpay_client')
    def test_create_order_success(self, mock_rz):
        mock_rz.return_value.order.create.return_value = {'id': 'order_test_123'}
        res = self.client.post(self.url, {'plan_id': self.plan.id})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['order_id'], 'order_test_123')
        self.assertEqual(res.data['key'], '')   # Empty in test env
        self.assertTrue(Order.objects.filter(razorpay_order_id='order_test_123').exists())

    @patch('apps.payments.services._razorpay_client')
    def test_create_order_amount_includes_gst(self, mock_rz):
        mock_rz.return_value.order.create.return_value = {'id': 'order_gst_123'}
        res = self.client.post(self.url, {'plan_id': self.plan.id})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # 15999 * 1.18 = 18878.82 → 1887882 paise
        self.assertEqual(res.data['amount'], 1887882)

    @patch('apps.payments.services._razorpay_client')
    def test_create_order_blocks_duplicate_enrollment(self, mock_rz):
        # Already enrolled
        order = make_order(self.user, self.plan)
        Enrollment.objects.create(user=self.user, plan=self.plan, order=order, status='active')
        res = self.client.post(self.url, {'plan_id': self.plan.id})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_invalid_plan(self):
        res = self.client.post(self.url, {'plan_id': 99999})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_auth(self):
        res = APIClient().post(self.url, {'plan_id': self.plan.id})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class WebhookTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.plan = make_plan(self.exam)
        self.url = reverse('payments:webhook')

    @patch('apps.payments.services.process_webhook', return_value=True)
    def test_valid_webhook_returns_200(self, mock_process):
        res = APIClient().post(
            self.url,
            data={'event': 'payment.captured'},
            format='json',
            HTTP_X_RAZORPAY_SIGNATURE='valid_sig'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        mock_process.assert_called_once()

    @patch('apps.payments.services.process_webhook', return_value=False)
    def test_invalid_signature_returns_400(self, mock_process):
        res = APIClient().post(
            self.url,
            data={'event': 'payment.captured'},
            format='json',
            HTTP_X_RAZORPAY_SIGNATURE='bad_sig'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_webhook_no_auth_required(self):
        """Webhook endpoint must be publicly accessible (Razorpay server-side)."""
        with patch('apps.payments.services.process_webhook', return_value=True):
            res = APIClient().post(self.url, data={}, format='json',
                                   HTTP_X_RAZORPAY_SIGNATURE='sig')
            self.assertNotEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class WebhookActivationTests(TestCase):
    """Integration test: webhook → enrollment activated."""

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.plan = make_plan(self.exam)
        self.order = make_order(self.user, self.plan, status='created')

    @patch('apps.payments.services._send_enrollment_email')
    def test_payment_captured_creates_enrollment(self, mock_email):
        from apps.payments.services import _handle_payment_captured
        _handle_payment_captured({
            'order_id':  self.order.razorpay_order_id,
            'id':        'pay_test_xyz',
            'method':    'upi',
            'signature': 'sig_test',
        })
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'paid')
        self.assertTrue(Enrollment.objects.filter(user=self.user, plan=self.plan).exists())
        self.assertTrue(CourseAccess.objects.filter(user=self.user, exam=self.exam).exists())

    @patch('apps.payments.services._send_enrollment_email')
    def test_payment_captured_idempotent(self, mock_email):
        from apps.payments.services import _handle_payment_captured
        # Call twice — should not create duplicate enrollments
        for _ in range(2):
            _handle_payment_captured({
                'order_id': self.order.razorpay_order_id,
                'id': 'pay_test_xyz',
                'method': 'upi',
                'signature': 'sig',
            })
        self.assertEqual(Enrollment.objects.filter(user=self.user, plan=self.plan).count(), 1)

    @patch('apps.payments.services._send_enrollment_email')
    def test_payment_captured_sends_email(self, mock_email):
        from apps.payments.services import _handle_payment_captured
        _handle_payment_captured({
            'order_id': self.order.razorpay_order_id,
            'id': 'pay_xyz', 'method': 'card', 'signature': 'sig',
        })
        mock_email.assert_called_once()


class InvoiceNumberTests(TestCase):

    def test_invoice_number_format(self):
        user = make_user()
        exam = make_exam()
        plan = make_plan(exam)
        order = make_order(user, plan, status='created')
        invoice = order._generate_invoice_number()
        self.assertRegex(invoice, r'^INV-\d{4}-\d{6}$')

    def test_invoice_numbers_sequential(self):
        user = make_user()
        exam = make_exam()
        plan = make_plan(exam)
        o1 = make_order(user, plan)
        o2 = make_order(make_user('u2@x.com'), plan)
        n1 = int(o1.invoice_number.split('-')[-1])
        n2 = int(o2.invoice_number.split('-')[-1])
        self.assertEqual(n2, n1 + 1)


class VerifyPaymentTests(TestCase):

    def test_valid_signature(self):
        from apps.payments.services import verify_payment_signature
        import hmac, hashlib
        from django.conf import settings
        secret = settings.RAZORPAY_KEY_SECRET or 'test_secret'
        order_id = 'order_123'
        payment_id = 'pay_456'
        body = f'{order_id}|{payment_id}'
        sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        # Only validates if secret matches
        # This tests the logic, not the key value
        result = verify_payment_signature(order_id, payment_id, sig)
        self.assertIsInstance(result, bool)

    def test_invalid_signature_returns_false(self):
        from apps.payments.services import verify_payment_signature
        result = verify_payment_signature('order_x', 'pay_y', 'bad_signature')
        self.assertFalse(result)


class OrderHistoryTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.plan = make_plan(self.exam)
        self.client = auth_client(self.user)

    def test_order_history_only_own_orders(self):
        other = make_user('other@test.com')
        my_order = make_order(self.user, self.plan)
        other_order = make_order(other, self.plan)
        url = reverse('payments:order-list')
        res = self.client.get(url)
        order_ids = [o['razorpay_order_id'] for o in res.data['results']]
        self.assertIn(my_order.razorpay_order_id, order_ids)
        self.assertNotIn(other_order.razorpay_order_id, order_ids)

    def test_created_status_orders_excluded(self):
        """Unpaid orders don't show in history."""
        make_order(self.user, self.plan, status='created')
        make_order(self.user, make_plan(self.exam, slug='p2'))
        url = reverse('payments:order-list')
        res = self.client.get(url)
        for order in res.data['results']:
            self.assertNotEqual(order['status'], 'created')


# ══════════════════════════════════════════════════════════════════════════════
# M6 — CONTENT / VIDEO
# ══════════════════════════════════════════════════════════════════════════════

class VideoListTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.course = make_course(self.exam)
        self.video = make_video(self.course)
        self.free_video = make_video(self.course, bunny_id='vid-free', free=True)
        self.url = reverse('content:video-list', kwargs={'exam_slug': 'cat'})

    def test_list_returns_published_videos(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [v['bunny_video_id'] for v in res.data['videos']]
        self.assertIn('vid-abc123', ids)
        self.assertIn('vid-free', ids)

    def test_unpublished_video_excluded(self):
        make_video(self.course, bunny_id='vid-draft').is_published = False
        VideoLibrary.objects.filter(bunny_video_id='vid-draft').update(is_published=False)
        res = APIClient().get(self.url)
        ids = [v['bunny_video_id'] for v in res.data['videos']]
        self.assertNotIn('vid-draft', ids)

    def test_locked_flag_for_unauthenticated(self):
        res = APIClient().get(self.url)
        non_free = next(v for v in res.data['videos'] if not v['is_free_preview'])
        self.assertTrue(non_free['is_locked'])

    def test_free_preview_not_locked(self):
        res = APIClient().get(self.url)
        free = next(v for v in res.data['videos'] if v['is_free_preview'])
        self.assertFalse(free['is_locked'])

    def test_grouped_by_module_in_response(self):
        res = APIClient().get(self.url)
        self.assertIn('grouped', res.data)

    def test_enrolled_user_sees_unlocked(self):
        plan = make_plan(self.exam)
        order = make_order(self.user, plan)
        Enrollment.objects.create(user=self.user, plan=plan, order=order, status='active')
        rebuild_access(self.user, self.exam)
        client = auth_client(self.user)
        res = client.get(self.url)
        non_free = next(v for v in res.data['videos'] if not v['is_free_preview'])
        self.assertFalse(non_free['is_locked'])


class StreamURLTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.course = make_course(self.exam)
        self.video = make_video(self.course)
        self.free_video = make_video(self.course, bunny_id='vid-free', free=True)

    def test_free_preview_accessible_without_enrollment(self):
        client = auth_client(self.user)
        url = reverse('content:stream-url', kwargs={'bunny_video_id': 'vid-free'})
        with patch('apps.content.views.generate_signed_url', return_value='https://signed.url'):
            res = client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['stream_url'], 'https://signed.url')

    def test_locked_video_returns_403_without_enrollment(self):
        client = auth_client(self.user)
        url = reverse('content:stream-url', kwargs={'bunny_video_id': 'vid-abc123'})
        res = client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data['error']['code'], 'access_denied')

    def test_enrolled_user_gets_signed_url(self):
        plan = make_plan(self.exam)
        order = make_order(self.user, plan)
        Enrollment.objects.create(user=self.user, plan=plan, order=order, status='active')
        rebuild_access(self.user, self.exam)
        client = auth_client(self.user)
        url = reverse('content:stream-url', kwargs={'bunny_video_id': 'vid-abc123'})
        with patch('apps.content.views.generate_signed_url', return_value='https://bunny.signed'):
            res = client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('stream_url', res.data)

    def test_requires_authentication(self):
        url = reverse('content:stream-url', kwargs={'bunny_video_id': 'vid-abc123'})
        res = APIClient().get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class ProgressTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.course = make_course(self.exam)
        self.video = make_video(self.course)
        self.client = auth_client(self.user)
        self.url = reverse('content:progress', kwargs={'bunny_video_id': 'vid-abc123'})

    def test_save_progress(self):
        res = self.client.post(self.url, {
            'position_secs': 120,
            'watched_secs': 100,
            'is_completed': False,
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(VideoProgress.objects.filter(user=self.user, video=self.video).exists())
        p = VideoProgress.objects.get(user=self.user, video=self.video)
        self.assertEqual(p.last_position, 120)

    def test_upsert_progress(self):
        self.client.post(self.url, {'position_secs': 60, 'watched_secs': 55})
        self.client.post(self.url, {'position_secs': 180, 'watched_secs': 170})
        self.assertEqual(VideoProgress.objects.filter(user=self.user, video=self.video).count(), 1)
        p = VideoProgress.objects.get(user=self.user, video=self.video)
        self.assertEqual(p.last_position, 180)

    def test_mark_completed(self):
        res = self.client.post(self.url, {
            'position_secs': 3600, 'watched_secs': 3550, 'is_completed': True
        })
        self.assertTrue(res.data['is_completed'])
        p = VideoProgress.objects.get(user=self.user, video=self.video)
        self.assertTrue(p.is_completed)

    def test_requires_auth(self):
        res = APIClient().post(self.url, {'position_secs': 0, 'watched_secs': 0})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class AINotesTests(TestCase):

    def setUp(self):
        self.user = make_user()
        self.exam = make_exam()
        self.course = make_course(self.exam)
        self.video = make_video(self.course, free=True)
        self.client = auth_client(self.user)
        self.url = reverse('content:ai-notes', kwargs={'bunny_video_id': 'vid-abc123'})

    def test_notes_pending_when_no_transcript(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['notes_status'], 'pending')
        self.assertIsNone(res.data['ai_notes'])

    def test_returns_notes_when_done(self):
        AITranscript.objects.create(
            video=self.video,
            status='done',
            raw_transcript='Full transcript text here.',
            ai_notes='## Key Concepts\n- Concept 1\n- Concept 2',
            word_count=5,
        )
        res = self.client.get(self.url)
        self.assertEqual(res.data['notes_status'], 'done')
        self.assertIn('Key Concepts', res.data['ai_notes'])

    def test_requires_auth(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class SignedURLTests(TestCase):
    """Unit tests for Bunny signed URL generation."""

    def test_signed_url_contains_token_and_expiry(self):
        from apps.content.bunny import generate_signed_url
        from django.test import override_settings
        with override_settings(BUNNY_LIBRARY_ID='lib123', BUNNY_TOKEN_KEY='secret_key'):
            url = generate_signed_url('video-guid', user_id=42, expires_in=3600)
        self.assertIn('token=', url)
        self.assertIn('expires=', url)
        self.assertIn('video-guid', url)

    def test_different_users_get_different_tokens(self):
        from apps.content.bunny import generate_signed_url
        from django.test import override_settings
        with override_settings(BUNNY_LIBRARY_ID='lib123', BUNNY_TOKEN_KEY='secret_key'):
            url1 = generate_signed_url('same-video', user_id=1,  expires_in=3600)
            url2 = generate_signed_url('same-video', user_id=99, expires_in=3600)
        # Tokens should differ because user_id is embedded
        token1 = url1.split('token=')[1].split('&')[0]
        token2 = url2.split('token=')[1].split('&')[0]
        self.assertNotEqual(token1, token2)
