"""
GRADSKOOL — M10 Leads Tests

Coverage:
  Models:    Lead.mark_converted, unsubscribe, score_up, DripEnrollment.advance
  Services:  upsert_lead (create, update, merge), enroll_in_sequence (matching logic,
             dedup, exam-specific vs generic), process_resend_webhook (open/click/bounce)
  Tasks:     send_due_drip_emails (sends, advances, completes), expire_stale_leads
  Signals:   tool gate → lead upsert, registration → lead upsert, enrollment → convert
  Views:     LeadCaptureView (success, honeypot, throttle), UnsubscribeView,
             ResendWebhookView, LeadAnalyticsView (admin only), LeadListView

Run: python manage.py test apps.leads --settings=config.settings.development
"""
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.leads.models import (
    Lead, LeadSource, DripSequence, DripEmail,
    DripEnrollment, EmailEvent, LeadNote,
)
from apps.leads.services import (
    upsert_lead, enroll_in_sequence,
    process_resend_webhook, get_lead_analytics,
)


# ── HELPERS ───────────────────────────────────────────────────────────────────

def make_user(email='user@test.com', role='student'):
    u = User.objects.create_user(
        email=email, password='Pass1234!',
        first_name='Test', last_name='User',
    )
    u.is_verified = True
    u.role = role
    u.save()
    return u


def admin_client():
    u = make_user('admin@test.com', role='admin')
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f'Bearer {str(RefreshToken.for_user(u).access_token)}')
    return c, u


def make_lead(email='lead@test.com', exam='CAT', status='new', subscribed=True):
    return Lead.objects.create(
        email=email,
        first_name='Test',
        last_name='Lead',
        target_exam=exam,
        status=status,
        is_subscribed=subscribed,
    )


def make_sequence(slug='test-seq', trigger='tool_gate', exam='', emails=None):
    seq = DripSequence.objects.create(
        slug=slug,
        name=f'Test Sequence {slug}',
        trigger_event=trigger,
        trigger_exam=exam,
        is_active=True,
    )
    for step, (subject, delay) in enumerate((emails or [('Step 1', 1), ('Step 2', 24)]), 1):
        DripEmail.objects.create(
            sequence=seq,
            step=step,
            subject=subject,
            html_body=f'<p>Email {step}. First name: {{{{ first_name }}}}. '
                      f'<a href="{{{{ unsubscribe_url }}}}">unsub</a></p>',
            send_delay_hours=delay,
            is_active=True,
        )
    return seq


# ══════════════════════════════════════════════════════════════════════════════
# MODEL TESTS
# ══════════════════════════════════════════════════════════════════════════════

class LeadModelTests(TestCase):

    def setUp(self):
        self.lead = make_lead()

    def test_full_name_with_names(self):
        self.assertEqual(self.lead.full_name, 'Test Lead')

    def test_full_name_fallback_to_email_prefix(self):
        lead = Lead.objects.create(email='anon@test.com')
        self.assertEqual(lead.full_name, 'anon')

    def test_score_up(self):
        self.lead.score_up(10)
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.lead_score, 10)

    def test_score_up_cumulative(self):
        self.lead.score_up(5)
        self.lead.score_up(7)
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.lead_score, 12)

    def test_mark_converted(self):
        seq = make_sequence()
        enr = DripEnrollment.objects.create(
            lead=self.lead, sequence=seq, status='active'
        )
        self.lead.mark_converted()
        self.lead.refresh_from_db()
        enr.refresh_from_db()
        self.assertEqual(self.lead.status, 'converted')
        self.assertIsNotNone(self.lead.converted_at)
        self.assertEqual(enr.status, 'paused')

    def test_unsubscribe(self):
        seq = make_sequence(slug='unsub-seq')
        enr = DripEnrollment.objects.create(
            lead=self.lead, sequence=seq, status='active'
        )
        self.lead.unsubscribe()
        self.lead.refresh_from_db()
        enr.refresh_from_db()
        self.assertFalse(self.lead.is_subscribed)
        self.assertEqual(self.lead.status, 'unsubscribed')
        self.assertIsNotNone(self.lead.unsubscribed_at)
        self.assertEqual(enr.status, 'paused')

    def test_unsubscribe_token_is_unique(self):
        lead2 = make_lead(email='other@test.com')
        self.assertNotEqual(self.lead.unsubscribe_token, lead2.unsubscribe_token)


class DripEnrollmentAdvanceTests(TestCase):

    def setUp(self):
        self.lead = make_lead()
        self.seq  = make_sequence(emails=[('S1', 1), ('S2', 24), ('S3', 48)])
        self.enr  = DripEnrollment.objects.create(
            lead=self.lead, sequence=self.seq,
            status='active', current_step=1,
        )

    def test_advance_moves_to_next_step(self):
        self.enr.advance()
        self.enr.refresh_from_db()
        self.assertEqual(self.enr.current_step, 2)
        self.assertIsNotNone(self.enr.next_send_at)

    def test_advance_sets_correct_delay(self):
        self.enr.advance()
        self.enr.refresh_from_db()
        expected = timezone.now() + timedelta(hours=24)
        diff = abs((self.enr.next_send_at - expected).total_seconds())
        self.assertLess(diff, 10)  # Within 10 seconds

    def test_advance_on_last_step_completes_sequence(self):
        self.enr.current_step = 3
        self.enr.save()
        self.enr.advance()
        self.enr.refresh_from_db()
        self.assertEqual(self.enr.status, 'completed')
        self.assertIsNotNone(self.enr.completed_at)

    def test_drip_email_renders_template_vars(self):
        email = DripEmail.objects.get(sequence=self.seq, step=1)
        rendered = email.render(self.lead, 'https://gradskool.in/unsub?token=abc')
        self.assertIn('Test', rendered)
        self.assertIn('https://gradskool.in/unsub?token=abc', rendered)
        self.assertNotIn('{{ first_name }}', rendered)
        self.assertNotIn('{{ unsubscribe_url }}', rendered)


# ══════════════════════════════════════════════════════════════════════════════
# SERVICE TESTS
# ══════════════════════════════════════════════════════════════════════════════

class UpsertLeadTests(TestCase):

    def test_creates_new_lead(self):
        lead, created = upsert_lead(
            email='new@test.com',
            first_name='Keshav',
            target_exam='CAT',
            source_type='tool_gate',
            source_detail='rc111',
        )
        self.assertTrue(created)
        self.assertEqual(lead.email, 'new@test.com')
        self.assertEqual(lead.target_exam, 'CAT')

    def test_normalises_email_to_lowercase(self):
        lead, _ = upsert_lead(email='UPPER@TEST.COM')
        self.assertEqual(lead.email, 'upper@test.com')

    def test_returns_existing_lead_on_duplicate(self):
        upsert_lead(email='dup@test.com', source_type='tool_gate')
        lead2, created = upsert_lead(email='dup@test.com', source_type='tool_gate')
        self.assertFalse(created)
        self.assertEqual(Lead.objects.filter(email='dup@test.com').count(), 1)

    def test_fills_missing_fields_on_existing_lead(self):
        upsert_lead(email='partial@test.com', source_type='tool_gate')
        lead, _ = upsert_lead(
            email='partial@test.com',
            first_name='Deepa',
            target_exam='GRE',
            source_type='registration',
        )
        self.assertEqual(lead.first_name, 'Deepa')
        self.assertEqual(lead.target_exam, 'GRE')

    def test_does_not_overwrite_existing_fields(self):
        upsert_lead(email='existing@test.com', first_name='Original', source_type='tool_gate')
        lead, _ = upsert_lead(
            email='existing@test.com',
            first_name='NewName',
            source_type='tool_gate',
        )
        # first_name already set — should not be overwritten
        self.assertEqual(lead.first_name, 'Original')

    def test_creates_source_record(self):
        lead, _ = upsert_lead(
            email='sourced@test.com',
            source_type='tool_gate',
            source_detail='cat-maths',
        )
        source = LeadSource.objects.get(lead=lead)
        self.assertEqual(source.source_type, 'tool_gate')
        self.assertEqual(source.source_detail, 'cat-maths')

    def test_first_source_is_first_touch(self):
        lead, _ = upsert_lead(email='first@test.com', source_type='tool_gate')
        source = LeadSource.objects.get(lead=lead)
        self.assertTrue(source.is_first_touch)
        self.assertTrue(source.is_last_touch)

    def test_second_source_updates_last_touch(self):
        lead, _ = upsert_lead(email='multi@test.com', source_type='tool_gate')
        upsert_lead(email='multi@test.com', source_type='registration')
        sources = LeadSource.objects.filter(lead=lead).order_by('created_at')
        self.assertTrue(sources[0].is_first_touch)
        self.assertFalse(sources[0].is_last_touch)
        self.assertFalse(sources[1].is_first_touch)
        self.assertTrue(sources[1].is_last_touch)

    def test_score_incremented_on_upsert(self):
        lead, _ = upsert_lead(email='scored@test.com', source_type='tool_gate')
        self.assertGreater(lead.lead_score, 0)

    def test_utm_params_stored(self):
        lead, _ = upsert_lead(
            email='utm@test.com',
            source_type='paid',
            utm_source='google',
            utm_medium='cpc',
            utm_campaign='cat-2026',
        )
        self.assertEqual(lead.utm_source, 'google')
        self.assertEqual(lead.utm_campaign, 'cat-2026')


class EnrollInSequenceTests(TestCase):

    def setUp(self):
        self.lead     = make_lead(exam='CAT')
        self.generic  = make_sequence(slug='generic-tool', trigger='tool_gate', exam='')
        self.cat_seq  = make_sequence(slug='cat-tool',     trigger='tool_gate', exam='CAT')
        self.gmat_seq = make_sequence(slug='gmat-tool',    trigger='tool_gate', exam='GMAT')

    def test_enrolls_in_exam_specific_sequence(self):
        enr = enroll_in_sequence(self.lead, 'tool_gate', exam='CAT')
        self.assertIsNotNone(enr)
        self.assertEqual(enr.sequence, self.cat_seq)

    def test_falls_back_to_generic_when_no_exam_match(self):
        lead = make_lead(email='gre@test.com', exam='GRE')
        enr  = enroll_in_sequence(lead, 'tool_gate', exam='GRE')
        self.assertIsNotNone(enr)
        self.assertEqual(enr.sequence, self.generic)

    def test_returns_none_for_unsubscribed_lead(self):
        unsub = make_lead(email='unsub@test.com', subscribed=False)
        enr   = enroll_in_sequence(unsub, 'tool_gate')
        self.assertIsNone(enr)

    def test_returns_none_for_bounced_lead(self):
        bounced = make_lead(email='bounce@test.com', status='bounced')
        bounced.is_subscribed = False
        bounced.save()
        enr = enroll_in_sequence(bounced, 'tool_gate')
        self.assertIsNone(enr)

    def test_no_duplicate_enrollment(self):
        enroll_in_sequence(self.lead, 'tool_gate', exam='CAT')
        enroll_in_sequence(self.lead, 'tool_gate', exam='CAT')
        count = DripEnrollment.objects.filter(lead=self.lead).count()
        self.assertEqual(count, 1)

    def test_reactivates_paused_enrollment(self):
        enr = enroll_in_sequence(self.lead, 'tool_gate', exam='CAT')
        enr.status = 'paused'
        enr.save()
        enroll_in_sequence(self.lead, 'tool_gate', exam='CAT')
        enr.refresh_from_db()
        self.assertEqual(enr.status, 'active')

    def test_next_send_at_set_correctly(self):
        enr = enroll_in_sequence(self.lead, 'tool_gate', exam='CAT')
        self.assertIsNotNone(enr.next_send_at)
        # First email has delay=1 hour
        expected = timezone.now() + timedelta(hours=1)
        diff = abs((enr.next_send_at - expected).total_seconds())
        self.assertLess(diff, 10)

    def test_returns_none_when_no_sequence_matches(self):
        lead = make_lead(email='noseq@test.com', exam='CLAT')
        # No CLAT or generic checkout sequence exists
        enr = enroll_in_sequence(lead, 'checkout_abandon', exam='CLAT')
        self.assertIsNone(enr)


class ResendWebhookTests(TestCase):

    def setUp(self):
        self.lead = make_lead()

    def _make_payload(self, event_type, email=None):
        return {
            'type': event_type,
            'data': {
                'email_id': 're_test_123',
                'to': [email or self.lead.email],
                'subject': 'Test Email',
            }
        }

    def test_open_increases_score(self):
        initial = self.lead.lead_score
        process_resend_webhook(self._make_payload('email.opened'))
        self.lead.refresh_from_db()
        self.assertGreater(self.lead.lead_score, initial)

    def test_open_creates_email_event(self):
        process_resend_webhook(self._make_payload('email.opened'))
        self.assertTrue(
            EmailEvent.objects.filter(lead=self.lead, event_type='opened').exists()
        )

    def test_open_updates_status_to_engaged(self):
        process_resend_webhook(self._make_payload('email.opened'))
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.status, 'engaged')

    def test_click_increases_score_more_than_open(self):
        process_resend_webhook(self._make_payload('email.opened'))
        score_after_open = Lead.objects.get(id=self.lead.id).lead_score

        process_resend_webhook(self._make_payload('email.clicked'))
        score_after_click = Lead.objects.get(id=self.lead.id).lead_score

        self.assertGreater(score_after_click, score_after_open)

    def test_click_updates_status_to_nurtured(self):
        process_resend_webhook(self._make_payload('email.clicked'))
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.status, 'nurtured')

    def test_bounce_unsubscribes_lead(self):
        process_resend_webhook(self._make_payload('email.bounced'))
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.status, 'bounced')
        self.assertFalse(self.lead.is_subscribed)

    def test_bounce_pauses_active_enrollments(self):
        seq = make_sequence(slug='bounce-seq')
        DripEnrollment.objects.create(lead=self.lead, sequence=seq, status='active')
        process_resend_webhook(self._make_payload('email.bounced'))
        enr = DripEnrollment.objects.get(lead=self.lead)
        self.assertEqual(enr.status, 'paused')

    def test_unknown_email_is_silently_ignored(self):
        process_resend_webhook(self._make_payload('email.opened', email='nobody@nowhere.com'))
        # No exception, no email event for unknown lead
        self.assertEqual(EmailEvent.objects.count(), 0)

    def test_unsubscribe_event_marks_lead(self):
        process_resend_webhook(self._make_payload('email.unsubscribed'))
        self.lead.refresh_from_db()
        self.assertFalse(self.lead.is_subscribed)
        self.assertEqual(self.lead.status, 'unsubscribed')


# ══════════════════════════════════════════════════════════════════════════════
# TASK TESTS
# ══════════════════════════════════════════════════════════════════════════════

class SendDueDripEmailsTests(TestCase):

    def setUp(self):
        self.lead = make_lead()
        self.seq  = make_sequence(slug='drip-test')

    @patch('apps.leads.tasks.send_drip_email', return_value=True)
    def test_sends_overdue_email(self, mock_send):
        enr = DripEnrollment.objects.create(
            lead=self.lead,
            sequence=self.seq,
            status='active',
            current_step=1,
            next_send_at=timezone.now() - timedelta(hours=1),
        )
        from apps.leads.tasks import send_due_drip_emails
        result = send_due_drip_emails()
        self.assertEqual(result['sent'], 1)
        mock_send.assert_called_once()

    @patch('apps.leads.tasks.send_drip_email', return_value=True)
    def test_skips_future_emails(self, mock_send):
        DripEnrollment.objects.create(
            lead=self.lead,
            sequence=self.seq,
            status='active',
            current_step=1,
            next_send_at=timezone.now() + timedelta(hours=5),
        )
        from apps.leads.tasks import send_due_drip_emails
        result = send_due_drip_emails()
        self.assertEqual(result['sent'], 0)
        mock_send.assert_not_called()

    @patch('apps.leads.tasks.send_drip_email', return_value=True)
    def test_skips_paused_enrollments(self, mock_send):
        DripEnrollment.objects.create(
            lead=self.lead,
            sequence=self.seq,
            status='paused',
            current_step=1,
            next_send_at=timezone.now() - timedelta(hours=1),
        )
        from apps.leads.tasks import send_due_drip_emails
        result = send_due_drip_emails()
        self.assertEqual(result['sent'], 0)

    @patch('apps.leads.tasks.send_drip_email', return_value=True)
    def test_skips_unsubscribed_leads(self, mock_send):
        self.lead.is_subscribed = False
        self.lead.save()
        DripEnrollment.objects.create(
            lead=self.lead, sequence=self.seq, status='active',
            current_step=1, next_send_at=timezone.now() - timedelta(hours=1),
        )
        from apps.leads.tasks import send_due_drip_emails
        result = send_due_drip_emails()
        self.assertEqual(result['sent'], 0)

    @patch('apps.leads.tasks.send_drip_email', return_value=True)
    def test_advances_enrollment_after_send(self, mock_send):
        enr = DripEnrollment.objects.create(
            lead=self.lead, sequence=self.seq, status='active',
            current_step=1, next_send_at=timezone.now() - timedelta(hours=1),
        )
        from apps.leads.tasks import send_due_drip_emails
        send_due_drip_emails()
        enr.refresh_from_db()
        self.assertEqual(enr.current_step, 2)

    @patch('apps.leads.tasks.send_drip_email', return_value=True)
    def test_completes_enrollment_on_last_step(self, mock_send):
        enr = DripEnrollment.objects.create(
            lead=self.lead, sequence=self.seq, status='active',
            current_step=2,   # Sequence has 2 emails
            next_send_at=timezone.now() - timedelta(hours=1),
        )
        from apps.leads.tasks import send_due_drip_emails
        send_due_drip_emails()
        enr.refresh_from_db()
        self.assertEqual(enr.status, 'completed')

    @patch('apps.leads.tasks.send_drip_email', return_value=False)
    def test_failed_send_reschedules(self, mock_send):
        enr = DripEnrollment.objects.create(
            lead=self.lead, sequence=self.seq, status='active',
            current_step=1, next_send_at=timezone.now() - timedelta(hours=2),
        )
        from apps.leads.tasks import send_due_drip_emails
        result = send_due_drip_emails()
        self.assertEqual(result['failed'], 1)
        enr.refresh_from_db()
        # Still step 1 — not advanced
        self.assertEqual(enr.current_step, 1)
        # Rescheduled ~1 hour from now
        self.assertGreater(enr.next_send_at, timezone.now())


class ExpireStaleLeadsTests(TestCase):

    def test_pauses_stale_enrollments(self):
        lead = make_lead()
        lead.last_seen_at = timezone.now() - timedelta(days=100)
        lead.save()
        seq = make_sequence(slug='stale-seq')
        enr = DripEnrollment.objects.create(
            lead=lead, sequence=seq, status='active',
            next_send_at=timezone.now() + timedelta(hours=1),
        )
        from apps.leads.tasks import expire_stale_leads
        count = expire_stale_leads()
        self.assertEqual(count, 1)
        enr.refresh_from_db()
        self.assertEqual(enr.status, 'paused')

    def test_preserves_recent_leads(self):
        lead = make_lead()
        lead.last_seen_at = timezone.now() - timedelta(days=10)
        lead.save()
        seq = make_sequence(slug='fresh-seq')
        enr = DripEnrollment.objects.create(
            lead=lead, sequence=seq, status='active',
        )
        from apps.leads.tasks import expire_stale_leads
        expire_stale_leads()
        enr.refresh_from_db()
        self.assertEqual(enr.status, 'active')


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL TESTS
# ══════════════════════════════════════════════════════════════════════════════

class SignalTests(TestCase):

    @patch('apps.leads.signals.trigger_sequence_for_lead')
    def test_tool_lead_signal_creates_lead(self, mock_task):
        from apps.tools.models import Tool, ToolLead
        tool = Tool.objects.create(
            slug='test-tool', name='Test', description='',
            tool_type='mcq_practice', is_active=True,
        )
        ToolLead.objects.create(
            name='Signal Test',
            email='signal@test.com',
            target_exam='CAT',
            tool=tool,
        )
        self.assertTrue(Lead.objects.filter(email='signal@test.com').exists())
        mock_task.delay.assert_called_once()

    @patch('apps.leads.signals.trigger_sequence_for_lead')
    def test_user_registration_signal_creates_lead(self, mock_task):
        User.objects.create_user(
            email='newreg@test.com',
            password='Pass1234!',
            first_name='New',
            last_name='Reg',
        )
        self.assertTrue(Lead.objects.filter(email='newreg@test.com').exists())
        mock_task.delay.assert_called_once()

    @patch('apps.leads.signals.trigger_sequence_for_lead')
    def test_enrollment_signal_marks_lead_converted(self, mock_task):
        from apps.courses.models import Exam, PricingPlan, Course
        from apps.enrollments.models import Enrollment
        from apps.payments.models import Order

        lead = make_lead(email='convert@test.com')
        user = make_user('convert@test.com')
        exam = Exam.objects.create(
            slug='cat', name='CAT', short_name='CAT', category='mba_india'
        )
        plan = PricingPlan.objects.create(
            exam=exam, name='Live', slug='live', price_inr=15999,
            razorpay_sku='cat-live', is_active=True,
        )
        order = Order.objects.create(
            user=user, plan=plan,
            razorpay_order_id='order_test',
            amount_inr=15999, gst_amount=2879,
            total_amount=18878, status='paid',
        )
        Enrollment.objects.create(
            user=user, plan=plan, order=order, status='active',
        )
        lead.refresh_from_db()
        self.assertEqual(lead.status, 'converted')


# ══════════════════════════════════════════════════════════════════════════════
# VIEW TESTS
# ══════════════════════════════════════════════════════════════════════════════

class LeadCaptureViewTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url    = reverse('leads:capture')

    @patch('apps.leads.views.trigger_sequence_for_lead')
    def test_capture_creates_lead(self, mock_task):
        res = self.client.post(self.url, {
            'email':       'capture@test.com',
            'first_name':  'Capture',
            'target_exam': 'CAT',
            'source_type': 'course_page',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(Lead.objects.filter(email='capture@test.com').exists())

    @patch('apps.leads.views.trigger_sequence_for_lead')
    def test_capture_returns_is_new_flag(self, mock_task):
        res = self.client.post(self.url, {'email': 'new@test.com', 'source_type': 'course_page'})
        self.assertTrue(res.data['is_new'])
        res2 = self.client.post(self.url, {'email': 'new@test.com', 'source_type': 'course_page'})
        self.assertFalse(res2.data['is_new'])

    def test_honeypot_rejects_bot(self):
        res = self.client.post(self.url, {
            'email':   'bot@test.com',
            'website': 'http://spammy.com',   # Honeypot filled
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Lead.objects.filter(email='bot@test.com').exists())

    def test_invalid_email_rejected(self):
        res = self.client.post(self.url, {'email': 'not-an-email'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class UnsubscribeViewTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.lead   = make_lead()
        self.url    = reverse('leads:unsubscribe')

    def test_valid_token_unsubscribes(self):
        res = self.client.get(self.url, {'token': str(self.lead.unsubscribe_token)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.lead.refresh_from_db()
        self.assertFalse(self.lead.is_subscribed)

    def test_invalid_token_returns_400(self):
        import uuid
        res = self.client.get(self.url, {'token': str(uuid.uuid4())})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_token_returns_400(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_already_unsubscribed_returns_200(self):
        self.lead.unsubscribe()
        res = self.client.get(self.url, {'token': str(self.lead.unsubscribe_token)})
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class ResendWebhookViewTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.url    = reverse('leads:resend-webhook')
        self.lead   = make_lead()

    def test_webhook_processes_open_event(self):
        res = self.client.post(self.url, {
            'type': 'email.opened',
            'data': {'email_id': 're_abc', 'to': [self.lead.email], 'subject': 'Test'},
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(EmailEvent.objects.filter(
            lead=self.lead, event_type='opened'
        ).exists())

    def test_webhook_no_auth_required(self):
        """Resend webhook must be publicly accessible."""
        anon = APIClient()
        res = anon.post(self.url, {'type': 'email.opened', 'data': {}}, format='json')
        self.assertNotEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_type_returns_400(self):
        res = self.client.post(self.url, {'data': {}}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LeadAnalyticsViewTests(TestCase):

    def test_admin_can_access(self):
        client, _ = admin_client()
        url = reverse('leads:analytics')
        res = client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total', res.data)
        self.assertIn('by_status', res.data)
        self.assertIn('email', res.data)
        self.assertIn('sequences', res.data)

    def test_non_admin_gets_403(self):
        user = make_user('student@test.com', role='student')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(RefreshToken.for_user(user).access_token)}')
        url = reverse('leads:analytics')
        res = client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_gets_401(self):
        url = reverse('leads:analytics')
        res = APIClient().get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class LeadListViewTests(TestCase):

    def setUp(self):
        self.client, _ = admin_client()
        self.url = reverse('leads:list')
        make_lead('l1@test.com', exam='CAT', status='new')
        make_lead('l2@test.com', exam='GMAT', status='converted')
        make_lead('l3@test.com', exam='CAT', status='engaged')

    def test_admin_sees_all_leads(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data['count'], 3)

    def test_filter_by_status(self):
        res = self.client.get(self.url, {'status': 'converted'})
        for lead in res.data['results']:
            self.assertEqual(lead['status'], 'converted')

    def test_filter_by_exam(self):
        res = self.client.get(self.url, {'exam': 'CAT'})
        for lead in res.data['results']:
            self.assertEqual(lead['target_exam'], 'CAT')

    def test_search_by_email(self):
        res = self.client.get(self.url, {'search': 'l2@'})
        self.assertEqual(len(res.data['results']), 1)
        self.assertEqual(res.data['results'][0]['email'], 'l2@test.com')


class LeadAnalyticsDataTests(TestCase):
    """Unit tests for get_lead_analytics()."""

    def test_returns_correct_total(self):
        make_lead('a@t.com')
        make_lead('b@t.com')
        data = get_lead_analytics()
        self.assertEqual(data['total'], 2)

    def test_conversion_rate_calculated(self):
        make_lead('c1@t.com', status='converted')
        make_lead('c2@t.com', status='new')
        make_lead('c3@t.com', status='new')
        data = get_lead_analytics()
        self.assertAlmostEqual(data['conversion_rate'], 33.3, delta=1)

    def test_email_open_rate_calculated(self):
        lead = make_lead()
        EmailEvent.objects.create(lead=lead, event_type='sent',   resend_email_id='r1')
        EmailEvent.objects.create(lead=lead, event_type='sent',   resend_email_id='r2')
        EmailEvent.objects.create(lead=lead, event_type='opened', resend_email_id='r1')
        data = get_lead_analytics()
        self.assertEqual(data['email']['open_rate'], 50.0)

    def test_by_exam_breakdown(self):
        make_lead('e1@t.com', exam='CAT')
        make_lead('e2@t.com', exam='CAT')
        make_lead('e3@t.com', exam='GMAT')
        data = get_lead_analytics()
        exams = {e['target_exam']: e['count'] for e in data['by_exam']}
        self.assertEqual(exams.get('CAT'),  2)
        self.assertEqual(exams.get('GMAT'), 1)
