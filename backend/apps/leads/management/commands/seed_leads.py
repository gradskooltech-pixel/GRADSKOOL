"""
GRADSKOOL — Management Command: seed_leads

Seeds all DripSequences with their emails.

Sequences created:
  1. tool-welcome-generic      → 3 emails / 5 days (all exams)
  2. tool-welcome-cat          → 3 emails / 5 days (CAT-specific)
  3. tool-welcome-gmat         → 3 emails / 5 days (GMAT-specific)
  4. tool-welcome-gre          → 3 emails / 5 days (GRE-specific)
  5. post-registration         → 2 emails / 2 days
  6. abandoned-checkout        → 2 emails / 2 days
  7. post-purchase-onboarding  → 3 emails / 7 days

Usage:
  python manage.py seed_leads
  python manage.py seed_leads --wipe
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.leads.models import DripSequence, DripEmail

# ── SEQUENCE DEFINITIONS ──────────────────────────────────────────────────────
# Each entry: (slug, name, trigger_event, trigger_exam, emails[])
# Each email:  (step, subject, preview_text, delay_hours, html_template_key)
#
# html_template_key is a string we resolve to the actual builder function below.

SEQUENCES = [
    # ── TOOL WELCOME: GENERIC ─────────────────────────────────────────────────
    {
        'slug':          'tool-welcome-generic',
        'name':          'Tool Welcome — Generic',
        'trigger_event': 'tool_gate',
        'trigger_exam':  '',
        'description':   'Triggered when any lead submits the tool gate. '
                         'Exam-specific sequences take precedence when available.',
        'emails': [
            {
                'step':    1,
                'subject': 'Your free access is ready — GRADSKOOL',
                'preview': 'Click to start practising right now.',
                'delay':   1,   # 1 hour after enrollment
                'body': (
                    '{{ first_name }}, your access to the GRADSKOOL free tools is now active. '
                    'Click below to start practising. No password required.<br><br>'
                    '<a href="https://gradskool.in/tools" style="color:#ff5e5f;">'
                    '→ Open tools</a><br><br>'
                    'Questions? WhatsApp us at +91 6360597966.'
                ),
            },
            {
                'step':    2,
                'subject': 'What structured {{ exam }} preparation looks like',
                'preview': '27 students. Live teaching. A completely different approach.',
                'delay':   48,  # 48 hours after step 1
                'body': (
                    '{{ first_name }},<br><br>'
                    'Most preparation feels like passive watching. GRADSKOOL is different.<br><br>'
                    'Here\'s what our students get:<br>'
                    '• 27 students per cohort — every doubt answered<br>'
                    '• Live sessions, not recordings<br>'
                    '• Instructors who know every student by name<br>'
                    '• 30+ full-length mocks with detailed analysis<br><br>'
                    '<a href="https://gradskool.in/courses" style="color:#ff5e5f;">'
                    '→ Browse all programmes</a><br><br>'
                    '<a href="{{ unsubscribe_url }}" style="color:#999;font-size:12px;">'
                    'Unsubscribe</a>'
                ),
            },
            {
                'step':    3,
                'subject': 'What 5,000+ IIM calls look like — the GRADSKOOL story',
                'preview': '"The structure and execution are unlike anything I\'ve experienced."',
                'delay':   72,  # 3 days after step 2
                'body': (
                    '{{ first_name }},<br><br>'
                    '"I went from 87 percentile to 99.3 in one attempt. '
                    'The cohort size made all the difference."<br>'
                    '— Vanshaj Jaiman, CAT 99.3%ile → IIM-A<br><br>'
                    'We\'ve helped 5,000+ students get calls from IIMs, FMS, SPJIMR, '
                    'MDI, and other top colleges since 2019.<br><br>'
                    '<a href="https://gradskool.in/courses" style="color:#ff5e5f;">'
                    '→ See all programmes</a><br><br>'
                    '<a href="{{ unsubscribe_url }}" style="color:#999;font-size:12px;">'
                    'Unsubscribe</a>'
                ),
            },
        ],
    },

    # ── TOOL WELCOME: CAT ─────────────────────────────────────────────────────
    {
        'slug':          'tool-welcome-cat',
        'name':          'Tool Welcome — CAT',
        'trigger_event': 'tool_gate',
        'trigger_exam':  'CAT',
        'description':   'CAT-specific tool welcome sequence.',
        'emails': [
            {
                'step':    1,
                'subject': 'Your CAT practice tool is ready',
                'preview': 'RC passages, QA topics, and more — start now.',
                'delay':   1,
                'body': (
                    '{{ first_name }}, your access to the GRADSKOOL CAT tools is active.<br><br>'
                    'Start with:<br>'
                    '• <a href="https://gradskool.in/tools/rc111">RC 111 Passages</a>'
                    ' — 111 reading comprehension passages<br>'
                    '• <a href="https://gradskool.in/tools/cat-maths">CAT Maths Tool</a>'
                    ' — 34 topics with concept notes and practice<br>'
                    '• <a href="https://gradskool.in/tools/cat-grammar">Grammar Tool</a>'
                    ' — common CAT VARC grammar questions<br><br>'
                    '<a href="https://gradskool.in/tools" style="color:#ff5e5f;">'
                    '→ Open all tools</a>'
                ),
            },
            {
                'step':    2,
                'subject': 'CAT 2026 — what a 99%ile preparation looks like',
                'preview': '30 mocks. 400+ hours live. 27 students per cohort.',
                'delay':   48,
                'body': (
                    '{{ first_name }},<br><br>'
                    'The CAT 2026 exam is on November 29. That\'s '
                    'roughly 8 months from now.<br><br>'
                    'Here\'s what our CAT students get:<br>'
                    '• 400+ hours live teaching (not recordings)<br>'
                    '• 30 full-length CAT mocks + 30 sectional tests<br>'
                    '• Coverage of all OMET exams (XAT, SNAP, NMAT, CMAT)<br>'
                    '• 27 students per cohort — every doubt answered<br><br>'
                    '<a href="https://gradskool.in/courses/cat" style="color:#ff5e5f;">'
                    '→ View CAT 2026 Programme</a>'
                ),
            },
            {
                'step':    3,
                'subject': 'Seats are limited — CAT 2026 cohort',
                'preview': '27 students per batch. First-come, first-served.',
                'delay':   72,
                'body': (
                    '{{ first_name }},<br><br>'
                    'We keep every cohort to 27 students. It\'s not a marketing tactic — '
                    'it\'s how we ensure every student gets real attention.<br><br>'
                    'The next CAT 2026 cohort is enrolling now.<br><br>'
                    '<a href="https://gradskool.in/checkout/cat" style="color:#ff5e5f;">'
                    '→ Reserve your seat</a><br><br>'
                    'Or WhatsApp us first: +91 6360597966<br><br>'
                    '<a href="{{ unsubscribe_url }}" style="color:#999;font-size:12px;">'
                    'Unsubscribe</a>'
                ),
            },
        ],
    },

    # ── TOOL WELCOME: GMAT ────────────────────────────────────────────────────
    {
        'slug':          'tool-welcome-gmat',
        'name':          'Tool Welcome — GMAT',
        'trigger_event': 'tool_gate',
        'trigger_exam':  'GMAT',
        'description':   'GMAT Focus Edition specific welcome sequence.',
        'emails': [
            {
                'step':    1,
                'subject': 'Your GMAT practice is ready — GRADSKOOL',
                'preview': 'Verbal, Quant, Data Insights. Start now.',
                'delay':   1,
                'body': (
                    '{{ first_name }},<br><br>'
                    'Your GRADSKOOL GMAT tools are now unlocked.<br><br>'
                    'The GMAT Focus Edition has three sections: '
                    'Verbal, Quantitative, and Data Insights.<br><br>'
                    '<a href="https://gradskool.in/tools" style="color:#ff5e5f;">'
                    '→ Start practising</a>'
                ),
            },
            {
                'step':    2,
                'subject': 'GMAT Focus Edition — what changed and what it means for you',
                'preview': 'Shorter. Harder. Different structure. Here\'s the strategy.',
                'delay':   48,
                'body': (
                    '{{ first_name }},<br><br>'
                    'The GMAT Focus Edition is shorter (64 questions, 135 minutes) '
                    'but harder per question. AWA is removed. '
                    'Data Insights replaces Integrated Reasoning.<br><br>'
                    'Our GMAT programme covers the new format completely:<br>'
                    '• 6 full-length GMAT Focus mocks<br>'
                    '• 700+ practice questions calibrated to the new format<br>'
                    '• Live sessions with our GMAT specialist<br><br>'
                    '<a href="https://gradskool.in/courses/gmat" style="color:#ff5e5f;">'
                    '→ View GMAT Programme</a>'
                ),
            },
        ],
    },

    # ── TOOL WELCOME: GRE ─────────────────────────────────────────────────────
    {
        'slug':          'tool-welcome-gre',
        'name':          'Tool Welcome — GRE',
        'trigger_event': 'tool_gate',
        'trigger_exam':  'GRE',
        'description':   'GRE-specific welcome. Focuses on vocabulary and verbal strategy.',
        'emails': [
            {
                'step':    1,
                'subject': 'Your GRE Vocab Forge access is ready',
                'preview': '759 high-frequency GRE words with etymology.',
                'delay':   1,
                'body': (
                    '{{ first_name }},<br><br>'
                    'Your GRE Vocab Forge is unlocked — 759 high-frequency GRE words, '
                    'each with definition, etymology, example, and synonyms.<br><br>'
                    '<a href="https://gradskool.in/tools/gre-vocab" style="color:#ff5e5f;">'
                    '→ Open Vocab Forge</a>'
                ),
            },
            {
                'step':    2,
                'subject': 'GRE Verbal — the strategy that actually works',
                'preview': 'Text completion, sentence equivalence, RC. Here\'s the system.',
                'delay':   48,
                'body': (
                    '{{ first_name }},<br><br>'
                    'GRE Verbal is not a vocabulary test — it\'s a reasoning test '
                    'that uses vocabulary. The strategy is different from what most guides teach.<br><br>'
                    'Our GRE programme covers the full approach:<br>'
                    '• Text Completion and Sentence Equivalence strategy<br>'
                    '• RC for GRE (shorter passages, different question types)<br>'
                    '• Vocabulary in context — how to answer without knowing the word<br><br>'
                    '<a href="https://gradskool.in/courses/gre" style="color:#ff5e5f;">'
                    '→ View GRE Programme</a>'
                ),
            },
        ],
    },

    # ── POST REGISTRATION ─────────────────────────────────────────────────────
    {
        'slug':          'post-registration',
        'name':          'Post Registration Onboarding',
        'trigger_event': 'registration',
        'trigger_exam':  '',
        'description':   'Sent after email verification. Introduces platform features.',
        'emails': [
            {
                'step':    1,
                'subject': 'Your GRADSKOOL account is active',
                'preview': 'Free tools, courses, and a community waiting for you.',
                'delay':   1,
                'body': (
                    '{{ first_name }},<br><br>'
                    'Your account is verified and active.<br><br>'
                    'You now have access to all free tools — no additional signup needed:<br>'
                    '• RC 111 Passages<br>'
                    '• CAT Maths Tool (34 topics)<br>'
                    '• GRE Vocab Forge (759 words)<br>'
                    '• MBA GK (450 questions)<br>'
                    '• And 4 more<br><br>'
                    '<a href="https://gradskool.in/tools" style="color:#ff5e5f;">'
                    '→ Explore free tools</a>'
                ),
            },
            {
                'step':    2,
                'subject': 'When you\'re ready to go beyond free tools',
                'preview': 'Live cohorts. 27 students. The structured approach.',
                'delay':   48,
                'body': (
                    '{{ first_name }},<br><br>'
                    'The free tools are a good start. When you\'re ready to prepare seriously, '
                    'here\'s what a live GRADSKOOL programme looks like:<br><br>'
                    '• Live sessions 4-5 days per week<br>'
                    '• 30+ full-length mocks<br>'
                    '• Printed books and study material<br>'
                    '• Dedicated support via WhatsApp<br><br>'
                    '<a href="https://gradskool.in/courses" style="color:#ff5e5f;">'
                    '→ Browse all programmes</a><br><br>'
                    '<a href="{{ unsubscribe_url }}" style="color:#999;font-size:12px;">'
                    'Unsubscribe</a>'
                ),
            },
        ],
    },

    # ── ABANDONED CHECKOUT ────────────────────────────────────────────────────
    {
        'slug':          'abandoned-checkout',
        'name':          'Abandoned Checkout Recovery',
        'trigger_event': 'checkout_abandon',
        'trigger_exam':  '',
        'description':   '2 emails over 48 hours for leads who started checkout but did not complete.',
        'emails': [
            {
                'step':    1,
                'subject': 'You left your enrolment incomplete',
                'preview': 'Still have questions? WhatsApp us.',
                'delay':   2,  # 2 hours after abandonment
                'body': (
                    '{{ first_name }},<br><br>'
                    'You started enrolling in a GRADSKOOL programme but didn\'t complete it.<br><br>'
                    'If you had any questions — about the programme, schedule, or payment — '
                    'WhatsApp us and we\'ll answer within a few hours:<br><br>'
                    '<a href="https://wa.me/916360597966" style="color:#ff5e5f;">'
                    '→ WhatsApp +91 6360597966</a><br><br>'
                    'Or go back to complete your enrolment:<br>'
                    '<a href="https://gradskool.in/courses" style="color:#ff5e5f;">'
                    '→ Back to courses</a>'
                ),
            },
            {
                'step':    2,
                'subject': 'Last reminder — cohort seats are limited',
                'preview': '27 students per batch. Once full, that\'s it.',
                'delay':   24,  # 24 hours after step 1
                'body': (
                    '{{ first_name }},<br><br>'
                    'We keep every cohort to 27 students. '
                    'This isn\'t about exclusivity — it\'s about quality.<br><br>'
                    'If you\'re waiting for the right time, this is probably it.<br><br>'
                    '<a href="https://gradskool.in/courses" style="color:#ff5e5f;">'
                    '→ Complete your enrolment</a><br><br>'
                    '<a href="{{ unsubscribe_url }}" style="color:#999;font-size:12px;">'
                    'Unsubscribe from these emails</a>'
                ),
            },
        ],
    },

    # ── POST PURCHASE ─────────────────────────────────────────────────────────
    {
        'slug':          'post-purchase-onboarding',
        'name':          'Post Purchase Onboarding',
        'trigger_event': 'post_purchase',
        'trigger_exam':  '',
        'description':   'Onboarding sequence after a successful purchase.',
        'emails': [
            {
                'step':    1,
                'subject': 'You\'re enrolled — here\'s what happens next',
                'preview': 'Dashboard, schedule, WhatsApp group — everything you need.',
                'delay':   2,
                'body': (
                    '{{ first_name }},<br><br>'
                    'You\'re enrolled. Welcome to GRADSKOOL.<br><br>'
                    'Here\'s your onboarding checklist:<br>'
                    '1. <a href="https://gradskool.in/dashboard">Log in to your dashboard</a>'
                    ' — your course access is active<br>'
                    '2. Save our WhatsApp number: +91 6360597966<br>'
                    '3. Download your session schedule from the course page<br>'
                    '4. Introduce yourself to your instructor via WhatsApp<br><br>'
                    'Your first session starts soon. Prepare well.'
                ),
            },
            {
                'step':    2,
                'subject': 'How to get the most from your first week',
                'preview': 'The habits that separate 99%ile students from the rest.',
                'delay':   48,
                'body': (
                    '{{ first_name }},<br><br>'
                    'The students who consistently hit 99+ percentile share three habits:<br><br>'
                    '1. <strong>They attempt every mock under exam conditions</strong> — '
                    'no pausing, no peeking.<br>'
                    '2. <strong>They review every question they got wrong</strong> — '
                    'understanding the error pattern matters more than re-reading concepts.<br>'
                    '3. <strong>They ask questions in every session</strong> — '
                    'silence in a 27-student cohort is a wasted opportunity.<br><br>'
                    'Start this week with these three.<br><br>'
                    '<a href="https://gradskool.in/dashboard" style="color:#ff5e5f;">'
                    '→ Go to Dashboard</a>'
                ),
            },
            {
                'step':    3,
                'subject': 'Week 2 — a quick check-in',
                'preview': 'How\'s the preparation going? We\'re here.',
                'delay':   120,
                'body': (
                    '{{ first_name }},<br><br>'
                    'You\'re now in your second week. A quick check-in:<br><br>'
                    '• Have you attended all sessions?<br>'
                    '• Have you taken your first mock?<br>'
                    '• Have you reviewed your weak areas?<br><br>'
                    'If anything isn\'t working, tell your instructor — '
                    'or WhatsApp us at +91 6360597966.<br><br>'
                    'We\'re here the entire way.<br><br>'
                    '<a href="{{ unsubscribe_url }}" style="color:#999;font-size:12px;">'
                    'Unsubscribe from these emails</a>'
                ),
            },
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed all GRADSKOOL drip sequences and emails.'

    def add_arguments(self, parser):
        parser.add_argument('--wipe', action='store_true',
                            help='Delete existing sequences first.')

    @transaction.atomic
    def handle(self, *args, **options):
        if options['wipe']:
            self.stdout.write('Wiping existing sequences…')
            DripSequence.objects.all().delete()

        created_sequences = 0
        created_emails    = 0

        for seq_data in SEQUENCES:
            emails = seq_data.pop('emails')

            seq, created = DripSequence.objects.update_or_create(
                slug=seq_data['slug'],
                defaults={
                    'name':          seq_data['name'],
                    'trigger_event': seq_data['trigger_event'],
                    'trigger_exam':  seq_data['trigger_exam'],
                    'description':   seq_data.get('description', ''),
                    'is_active':     True,
                }
            )
            if created:
                created_sequences += 1

            for email_data in emails:
                _, email_created = DripEmail.objects.update_or_create(
                    sequence=seq,
                    step=email_data['step'],
                    defaults={
                        'subject':          email_data['subject'],
                        'preview_text':     email_data.get('preview', ''),
                        'html_body':        email_data['body'],
                        'send_delay_hours': email_data['delay'],
                        'is_active':        True,
                    }
                )
                if email_created:
                    created_emails += 1

            self.stdout.write(
                f'  {"✓ Created" if created else "  Updated"} sequence: '
                f'{seq.name} ({len(emails)} emails)'
            )

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Seeded {DripSequence.objects.count()} sequences, '
            f'{DripEmail.objects.count()} emails total.\n'
            f'  New: {created_sequences} sequences, {created_emails} emails.'
        ))
