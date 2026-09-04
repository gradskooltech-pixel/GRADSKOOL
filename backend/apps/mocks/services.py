"""
GRADSKOOL — Mock test access + scoring.

Gating is a single check: PAID ACCESS — same as everything else
mocks-related: is-there attempt going through
apps.enrollments.models.CourseAccess.can_take_mocks + mock_exams_unlocked
(unless the specific MockPaper.is_free=True, or it's a topic-wise attempt
within the free-preview question cap).

Once a student has paid access, everything unlocks at once: every
topic-wise topic, every Sectional, every Full Mock. There used to be a
second "don't let them rush" layer here (Sectionals staying locked until
enough Topic-wise reps, Full Mocks staying locked until every section had
a completed Sectional) — that progression gate has been removed by
product decision, so a paying student can jump straight into any of the
three formats in any order.
"""
from decimal import Decimal

from django.db import models as django_models
from django.utils import timezone

from apps.enrollments.models import CourseAccess

from .models import MockAttempt, MockPaper, MockQuestion, MockResponse, MockSection, MockTopic

# ── TUNABLE THRESHOLDS ──────────────────────────────────────────────────────
FREE_PREVIEW_QUESTION_COUNT      = 5   # topic-wise questions allowed with no paid mocks access
MAX_TOPIC_WISE_QUESTIONS         = 30  # informational only now — paid students get every question in the topic, uncapped


def has_paid_access(user, exam) -> bool:
    if not user.is_authenticated:
        return False
    access = CourseAccess.objects.filter(user=user, exam=exam, can_take_mocks=True).first()
    if not access:
        return False
    unlocked = [e.upper() for e in (access.mock_exams_unlocked or [])]
    return exam.short_name.upper() in unlocked


def paper_unlock_status(user, paper: MockPaper) -> dict:
    """
    Paid mocks access unlocks every paper immediately — Sectionals and
    Full Mocks are no longer gated behind Topic-wise/Sectional reps.
    A paper explicitly marked free (MockPaper.is_free) stays open to
    everyone regardless of access, same as before.
    """
    if has_paid_access(user, paper.exam) or paper.is_free:
        return {'unlocked': True, 'reason': 'ok', 'needs_purchase': False}
    return {'unlocked': False, 'reason': 'Purchase mocks access to unlock this.', 'needs_purchase': True}


def topic_wise_question_limit(user, exam) -> int:
    """How many questions this user may pull into a single topic-wise attempt."""
    return MAX_TOPIC_WISE_QUESTIONS if has_paid_access(user, exam) else FREE_PREVIEW_QUESTION_COUNT


# ── ATTEMPT ASSEMBLY ────────────────────────────────────────────────────────

def build_topic_wise_questions(topic: MockTopic, difficulty: str, count: int):
    """
    Pull this topic's own authored questions (and its children's, if any)
    for a dynamic topic-wise attempt — a separate pool from mocks/
    sectionals, not tag-based reuse. count=0 (or falsy) means no cap —
    paid students get the topic's entire question bank in one attempt.
    """
    topic_ids = [topic.id] + list(topic.children.values_list('id', flat=True))
    qs = MockQuestion.objects.filter(topic_id__in=topic_ids, is_active=True)
    if difficulty:
        qs = qs.filter(difficulty=difficulty)
    qs = qs.order_by('?')
    return list(qs[:count]) if count else list(qs)


def create_attempt(user, exam, mode, *, paper=None, section=None, topic=None,
                    difficulty_filter='', question_count_requested=0, duration_mins=None):
    if mode == 'full':
        duration_mins = duration_mins or paper.total_duration_mins or 120
        questions = list(MockQuestion.objects.filter(section__paper=paper, is_active=True).order_by('section__order', 'order'))
    elif mode == 'sectional':
        section = section or paper.sections.first()
        duration_mins = duration_mins or section.time_limit_mins
        questions = list(MockQuestion.objects.filter(section=section, is_active=True).order_by('order'))
    else:  # topic
        questions = build_topic_wise_questions(topic, difficulty_filter, question_count_requested)
        duration_mins = duration_mins or max(10, len(questions))  # ~1 min/question floor, sized to what was actually pulled

    attempt = MockAttempt.objects.create(
        user=user, exam=exam, mode=mode, paper=paper, section=section, topic=topic,
        difficulty_filter=difficulty_filter, question_count_requested=question_count_requested,
        expires_at=timezone.now() + timezone.timedelta(minutes=duration_mins),
        total_questions=len(questions),
    )
    MockResponse.objects.bulk_create([
        MockResponse(attempt=attempt, question=q) for q in questions
    ])
    return attempt


def submit_attempt(attempt: MockAttempt):
    """Scores every response, fills section_breakdown, marks completed."""
    if attempt.completed:
        return attempt

    responses = list(attempt.responses.select_related('question', 'question__section', 'question__topic').all())
    correct = incorrect = unattempted = 0
    total_score = Decimal('0')
    breakdown = {}

    for r in responses:
        q = r.question
        is_correct, marks = q.score_response(r.selected_option)
        r.is_correct = is_correct
        r.marks_awarded = marks
        total_score += marks

        # Mock/sectional questions bucket by section name; topic-wise
        # questions have no section — bucket by topic name instead.
        bucket_name = q.section.name if q.section_id else (q.topic.name if q.topic_id else 'Practice')
        b = breakdown.setdefault(bucket_name, {
            'correct': 0, 'incorrect': 0, 'unattempted': 0, 'total': 0, 'score': 0,
        })
        b['total'] += 1
        if is_correct is None:
            unattempted += 1
            b['unattempted'] += 1
        elif is_correct:
            correct += 1
            b['correct'] += 1
        else:
            incorrect += 1
            b['incorrect'] += 1
        b['score'] = float(Decimal(str(b['score'])) + marks)

    MockResponse.objects.bulk_update(responses, ['is_correct', 'marks_awarded'])

    attempt.correct = correct
    attempt.incorrect = incorrect
    attempt.unattempted = unattempted
    attempt.score = total_score
    attempt.section_breakdown = breakdown
    attempt.completed = True
    attempt.completed_at = timezone.now()
    attempt.save(update_fields=[
        'correct', 'incorrect', 'unattempted', 'score', 'section_breakdown', 'completed', 'completed_at',
    ])
    return attempt
