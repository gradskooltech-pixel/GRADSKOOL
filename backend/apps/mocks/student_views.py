"""
GRADSKOOL — Mock Test student-facing API.

Wired at /api/v1/mocks/ (see urls.py / config/urls.py).
"""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Exam

from . import services
from .models import MockAttempt, MockPaper, MockQuestion, MockResponse, MockTopic
from .serializers import attempt_result_dict, paper_dict, question_attempt_dict, topic_dict


# ── TEST HUB ──────────────────────────────────────────────────────────────────

class MockTestHubView(APIView):
    """
    GET /api/v1/mocks/<exam_slug>/
    Everything the test-hub page (3 tabs) needs in one call: topic list,
    sectional papers, full-mock papers — each with its unlock status.

    Public on purpose — the hub itself is a catalog page (crawlable/
    shareable like any other course page), not the attempt-taking flow.
    services.has_paid_access() and paper_unlock_status() already handle
    an unauthenticated request correctly (has_paid_access short-circuits
    on user.is_authenticated), so a logged-out visitor just sees the
    same free-preview shape a logged-in-but-unpaid student would.
    Actually STARTING an attempt still requires login — see
    MockAttemptStartView below, unchanged.
    """
    permission_classes = [AllowAny]

    def get(self, request, exam_slug):
        exam = get_object_or_404(Exam, slug=exam_slug)
        has_access = services.has_paid_access(request.user, exam)

        topics = list(
            MockTopic.objects.filter(exam=exam, parent__isnull=True)
            .prefetch_related('children').order_by('section_name', 'order', 'name')
        )
        topics_out = []
        for t in topics:
            td = topic_dict(t)
            td['children'] = [topic_dict(c) for c in t.children.all().order_by('order', 'name')]
            topics_out.append(td)

        sectional_papers = MockPaper.objects.filter(exam=exam, test_type='sectional', is_active=True).prefetch_related('sections')
        full_papers = MockPaper.objects.filter(exam=exam, test_type='mock', is_active=True).prefetch_related('sections')

        def _paper_with_status(p):
            d = paper_dict(p)
            d['unlock'] = services.paper_unlock_status(request.user, p)
            return d

        return Response({
            'exam_slug': exam.slug, 'exam_name': exam.short_name,
            'has_paid_access': has_access,
            'topic_wise_question_limit': services.topic_wise_question_limit(request.user, exam),
            'topics': topics_out,
            'sectionals': [_paper_with_status(p) for p in sectional_papers.order_by('sort_order') if p.is_live],
            'full_mocks': [_paper_with_status(p) for p in full_papers.order_by('sort_order') if p.is_live],
        })


# ── ATTEMPT LIFECYCLE ─────────────────────────────────────────────────────────

class MockAttemptStartView(APIView):
    """
    POST /api/v1/mocks/attempts/start/
    body: { mode: 'full'|'sectional'|'topic', exam_slug,
            paper_id? (full/sectional), topic_id? (topic),
            difficulty? , question_count? }
    difficulty/question_count only apply to free-preview topic-wise
    attempts (capped at services.FREE_PREVIEW_QUESTION_COUNT); a student
    with paid mocks access always gets the topic's full question bank,
    mixed difficulty, regardless of what's sent here.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        d = request.data
        exam = get_object_or_404(Exam, slug=d.get('exam_slug'))
        mode = d.get('mode')
        if mode not in ('full', 'sectional', 'topic'):
            return Response({'error': "mode must be 'full', 'sectional' or 'topic'"}, status=400)

        # Resume an existing in-progress attempt of the exact same thing instead of starting a second one.
        existing_qs = MockAttempt.objects.filter(user=request.user, exam=exam, mode=mode, completed=False)

        if mode in ('full', 'sectional'):
            paper = get_object_or_404(MockPaper, pk=d.get('paper_id'), exam=exam)
            status = services.paper_unlock_status(request.user, paper)
            if not status['unlocked']:
                return Response({'error': status['reason'], 'needs_purchase': status.get('needs_purchase', False)}, status=403)

            existing = existing_qs.filter(paper=paper).first()
            if existing:
                if existing.is_expired:
                    services.submit_attempt(existing)
                else:
                    return Response(_attempt_payload(existing), status=200)

            attempt = services.create_attempt(request.user, exam, mode, paper=paper)
        else:
            topic = get_object_or_404(MockTopic, pk=d.get('topic_id'), exam=exam)
            if services.has_paid_access(request.user, exam):
                # Paid access: no picker, no cap — the whole topic's question bank, mixed difficulty.
                count = 0
                difficulty = ''
            else:
                limit = services.FREE_PREVIEW_QUESTION_COUNT
                requested = int(d.get('question_count', limit) or limit)
                count = max(1, min(requested, limit))
                difficulty = d.get('difficulty', '')

            attempt = services.create_attempt(
                request.user, exam, 'topic', topic=topic,
                difficulty_filter=difficulty, question_count_requested=count,
            )
            if attempt.total_questions == 0:
                attempt.delete()
                return Response({'error': 'No questions available for this topic yet.'}, status=404)

        return Response(_attempt_payload(attempt), status=201)


def _attempt_payload(attempt: MockAttempt):
    responses = {r.question_id: r for r in attempt.responses.select_related('question').order_by('question__order')}
    questions = [question_attempt_dict(r.question, r) for r in responses.values()]
    return {
        'id': attempt.id, 'mode': attempt.mode, 'exam_slug': attempt.exam.slug,
        'paper_title': attempt.paper.title if attempt.paper else None,
        'started_at': attempt.started_at.isoformat(),
        'expires_at': attempt.expires_at.isoformat(),
        'time_remaining_secs': attempt.time_remaining_secs,
        'total_questions': attempt.total_questions,
        'sections': [
            {'id': s.id, 'name': s.name, 'time_limit_mins': s.time_limit_mins}
            for s in (attempt.paper.sections.all().order_by('order') if attempt.paper else
                      ([attempt.section] if attempt.section else []))
        ],
        'questions': questions,
    }


class MockAttemptDetailView(APIView):
    """GET /api/v1/mocks/attempts/<id>/ — resume: current question state + time left. Auto-submits if the clock ran out."""
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        attempt = get_object_or_404(MockAttempt, pk=attempt_id, user=request.user)
        if attempt.is_expired and not attempt.completed:
            attempt.is_auto_submitted = True
            attempt.save(update_fields=['is_auto_submitted'])
            services.submit_attempt(attempt)
        if attempt.completed:
            return Response(attempt_result_dict(attempt))
        return Response(_attempt_payload(attempt))


class MockAttemptAnswerView(APIView):
    """
    POST /api/v1/mocks/attempts/<id>/answer/
    body: { question_id, selected_option, is_marked_for_review?, time_taken_secs? }
    Autosave — called on every question navigation, not just on submit.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(MockAttempt, pk=attempt_id, user=request.user)
        if attempt.completed:
            return Response({'error': 'Attempt already submitted.'}, status=400)
        if attempt.is_expired:
            services.submit_attempt(attempt)
            return Response({'error': 'Time is up — this attempt was auto-submitted.'}, status=410)

        d = request.data
        response = get_object_or_404(MockResponse, attempt=attempt, question_id=d.get('question_id'))
        if 'selected_option' in d:
            response.selected_option = d['selected_option'] or ''
        if 'is_marked_for_review' in d:
            response.is_marked_for_review = bool(d['is_marked_for_review'])
        if 'time_taken_secs' in d:
            response.time_taken_secs += int(d.get('time_taken_secs', 0) or 0)
        response.is_visited = True
        response.save()
        return Response({'success': True, 'time_remaining_secs': attempt.time_remaining_secs})


class MockAttemptSubmitView(APIView):
    """POST /api/v1/mocks/attempts/<id>/submit/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        attempt = get_object_or_404(MockAttempt, pk=attempt_id, user=request.user)
        if not attempt.completed:
            services.submit_attempt(attempt)
        return Response(attempt_result_dict(attempt))


class MockAttemptResultView(APIView):
    """GET /api/v1/mocks/attempts/<id>/result/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        attempt = get_object_or_404(MockAttempt, pk=attempt_id, user=request.user)
        if not attempt.completed:
            return Response({'error': 'Not submitted yet.'}, status=400)
        return Response(attempt_result_dict(attempt))


class MockMyAttemptsView(APIView):
    """GET /api/v1/mocks/my-attempts/?exam=<slug>&mode=full|sectional|topic"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = MockAttempt.objects.filter(user=request.user, completed=True).select_related('paper', 'topic', 'exam')
        exam_slug = request.query_params.get('exam')
        if exam_slug: qs = qs.filter(exam__slug=exam_slug)
        mode = request.query_params.get('mode')
        if mode: qs = qs.filter(mode=mode)
        qs = qs.order_by('-completed_at')[:100]
        return Response([
            {
                'id': a.id, 'mode': a.mode,
                'title': a.paper.title if a.paper else (a.topic.name if a.topic else 'Attempt'),
                'completed_at': a.completed_at.isoformat() if a.completed_at else None,
                'score': str(a.score), 'total_questions': a.total_questions,
                'correct': a.correct, 'incorrect': a.incorrect, 'unattempted': a.unattempted,
            }
            for a in qs
        ])
