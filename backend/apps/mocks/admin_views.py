"""
GRADSKOOL — Mock Test admin authoring API.

Wired under /api/v1/dashboard/mocks/ (see apps.dashboard.urls), same
pattern as fyq/foundations admin routes: IsAuthenticated + inline
is_admin() check rather than a separate permission class, matching the
rest of the codebase.
"""
from decimal import Decimal, InvalidOperation

from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Exam

from .models import MockAttempt, MockPaper, MockPassage, MockQuestion, MockSection, MockTopic
from .parser import parse_pasted_text
from .serializers import paper_dict, question_admin_dict, section_dict, topic_dict


def is_admin(user):
    return user.is_staff or getattr(user, 'role', '') == 'admin'


def _forbidden():
    return Response({'error': 'Forbidden'}, status=403)


# ── PAPERS ────────────────────────────────────────────────────────────────────

class AdminMockPaperListView(APIView):
    """GET /?exam=<slug>&test_type=mock|sectional   POST create"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user): return _forbidden()
        qs = MockPaper.objects.select_related('exam').prefetch_related('sections')
        exam_slug = request.query_params.get('exam')
        if exam_slug:
            qs = qs.filter(exam__slug=exam_slug)
        test_type = request.query_params.get('test_type')
        if test_type:
            qs = qs.filter(test_type=test_type)
        return Response([paper_dict(p) for p in qs])

    def post(self, request):
        if not is_admin(request.user): return _forbidden()
        d = request.data
        exam = get_object_or_404(Exam, slug=d.get('exam_slug'))
        test_type = d.get('test_type')
        if test_type not in ('mock', 'sectional'):
            return Response({'error': "test_type must be 'mock' or 'sectional'"}, status=400)
        title = (d.get('title') or '').strip()
        if not title:
            return Response({'error': 'title is required'}, status=400)

        paper = MockPaper.objects.create(
            exam=exam, test_type=test_type, title=title,
            description=d.get('description', ''),
            is_free=bool(d.get('is_free', False)),
            is_active=bool(d.get('is_active', True)),
            release_at=d.get('release_at') or None,
            sort_order=int(d.get('sort_order', 0) or 0),
        )

        sections = d.get('sections') or []
        if test_type == 'sectional' and not sections:
            # A sectional paper needs exactly one section — require a name.
            return Response({'error': 'Sectional papers need one section — pass sections: [{name, time_limit_mins}]'}, status=400)
        for i, s in enumerate(sections, start=1):
            MockSection.objects.create(
                paper=paper, name=s.get('name', f'Section {i}'),
                time_limit_mins=int(s.get('time_limit_mins', 40) or 40),
                order=int(s.get('order', i) or i),
            )
        return Response(paper_dict(paper), status=201)


class AdminMockPaperDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not is_admin(request.user): return _forbidden()
        paper = get_object_or_404(MockPaper, pk=pk)
        return Response(paper_dict(paper))

    def patch(self, request, pk):
        if not is_admin(request.user): return _forbidden()
        paper = get_object_or_404(MockPaper, pk=pk)
        d = request.data
        for field in ['title', 'description', 'is_free', 'is_active', 'release_at', 'sort_order']:
            if field in d:
                setattr(paper, field, d[field])
        paper.save()
        return Response(paper_dict(paper))

    def delete(self, request, pk):
        if not is_admin(request.user): return _forbidden()
        get_object_or_404(MockPaper, pk=pk).delete()
        return Response(status=204)


# ── SECTIONS ──────────────────────────────────────────────────────────────────

class AdminMockSectionListView(APIView):
    """POST /papers/<paper_pk>/sections/ — add a section to an existing paper (mock papers only, sectional is fixed at creation)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, paper_pk):
        if not is_admin(request.user): return _forbidden()
        paper = get_object_or_404(MockPaper, pk=paper_pk)
        d = request.data
        name = (d.get('name') or '').strip()
        if not name:
            return Response({'error': 'name is required'}, status=400)
        section = MockSection.objects.create(
            paper=paper, name=name,
            time_limit_mins=int(d.get('time_limit_mins', 40) or 40),
            order=int(d.get('order', paper.sections.count() + 1)),
        )
        return Response(section_dict(section), status=201)


class AdminMockSectionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not is_admin(request.user): return _forbidden()
        section = get_object_or_404(MockSection, pk=pk)
        d = request.data
        if 'name' in d: section.name = d['name']
        if 'time_limit_mins' in d: section.time_limit_mins = int(d['time_limit_mins'] or 40)
        if 'order' in d: section.order = int(d['order'] or 1)
        section.save()
        return Response(section_dict(section))

    def delete(self, request, pk):
        if not is_admin(request.user): return _forbidden()
        get_object_or_404(MockSection, pk=pk).delete()
        return Response(status=204)


# ── TOPICS ────────────────────────────────────────────────────────────────────

class AdminMockTopicListView(APIView):
    """GET /?exam=<slug>&section=<name>   POST create"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user): return _forbidden()
        qs = MockTopic.objects.select_related('parent')
        exam_slug = request.query_params.get('exam')
        if exam_slug: qs = qs.filter(exam__slug=exam_slug)
        section_name = request.query_params.get('section')
        if section_name: qs = qs.filter(section_name=section_name)
        return Response([topic_dict(t) for t in qs.order_by('section_name', 'order', 'name')])

    def post(self, request):
        if not is_admin(request.user): return _forbidden()
        d = request.data
        exam = get_object_or_404(Exam, slug=d.get('exam_slug'))
        name = (d.get('name') or '').strip()
        section_name = (d.get('section_name') or '').strip()
        if not name or not section_name:
            return Response({'error': 'name and section_name are required'}, status=400)
        parent = MockTopic.objects.filter(pk=d.get('parent_id'), exam=exam).first() if d.get('parent_id') else None
        topic, _ = MockTopic.objects.get_or_create(
            exam=exam, section_name=section_name,
            slug=slugify(name)[:180],
            defaults={'name': name, 'parent': parent, 'order': int(d.get('order', 0) or 0)},
        )
        return Response(topic_dict(topic), status=201)


class AdminMockTopicDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if not is_admin(request.user): return _forbidden()
        get_object_or_404(MockTopic, pk=pk).delete()
        return Response(status=204)


# ── QUESTIONS: manage view (list) ───────────────────────────────────────────

class AdminMockQuestionManageView(APIView):
    """GET /sections/<section_pk>/questions/ — passages + standalone questions, for the manage page."""
    permission_classes = [IsAuthenticated]

    def get(self, request, section_pk):
        if not is_admin(request.user): return _forbidden()
        section = get_object_or_404(MockSection, pk=section_pk)
        passages = section.passages.prefetch_related('questions').order_by('order')
        standalones = section.questions.filter(passage__isnull=True).order_by('order')

        return Response({
            'section': section_dict(section),
            'paper': {'id': section.paper_id, 'title': section.paper.title, 'exam_slug': section.paper.exam.slug, 'test_type': section.paper.test_type},
            'passages': [
                {
                    'id': p.id, 'order': p.order, 'passage_text': p.passage_text,
                    'questions': [question_admin_dict(q) for q in p.questions.all().order_by('order')],
                }
                for p in passages
            ],
            'standalones': [question_admin_dict(q) for q in standalones],
        })


# ── QUESTIONS: single add/edit/delete ───────────────────────────────────────

class AdminMockQuestionAddView(APIView):
    """POST /sections/<section_pk>/questions/add/ — single manual add."""
    permission_classes = [IsAuthenticated]

    def post(self, request, section_pk):
        if not is_admin(request.user): return _forbidden()
        section = get_object_or_404(MockSection, pk=section_pk)
        d = request.data
        q = _create_question_from_dict(d, section=section)
        if isinstance(q, Response):
            return q
        return Response(question_admin_dict(q), status=201)


class AdminMockQuestionDetailView(APIView):
    """Shared edit/delete for a question, regardless of whether it belongs to a section (mock/sectional) or a topic (topic-wise)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not is_admin(request.user): return _forbidden()
        q = get_object_or_404(MockQuestion, pk=pk)
        d = request.data
        for field in ['question_type', 'question_text', 'option_a', 'option_b', 'option_c',
                      'option_d', 'option_e', 'correct_option', 'tita_answer', 'difficulty',
                      'explanation', 'order', 'is_active']:
            if field in d:
                setattr(q, field, d[field])
        for field in ['correct_marks', 'negative_marks']:
            if field in d:
                try:
                    setattr(q, field, Decimal(str(d[field])))
                except InvalidOperation:
                    pass
        q.save()
        if 'move_to_passage' in d and q.section_id:
            move_to = d['move_to_passage']
            if move_to in (None, '', 'standalone'):
                q.passage = None
            else:
                target = MockPassage.objects.filter(pk=move_to, section=q.section).first()
                if target:
                    q.passage = target
            q.save(update_fields=['passage'])
        return Response(question_admin_dict(q))

    def delete(self, request, pk):
        if not is_admin(request.user): return _forbidden()
        get_object_or_404(MockQuestion, pk=pk).delete()
        return Response(status=204)


def _create_question_from_dict(d, *, section=None, passage=None, topic=None, order=None):
    """Shared creator for both authoring paths — pass exactly one of section or topic."""
    question_type = d.get('question_type', 'MCQ')
    text = (d.get('question_text') or '').strip()
    if not text:
        return Response({'error': 'question_text is required'}, status=400)

    try:
        correct_marks = Decimal(str(d.get('correct_marks', 3)))
    except InvalidOperation:
        correct_marks = Decimal('3')
    try:
        negative_marks = Decimal(str(d.get('negative_marks', 1)))
    except InvalidOperation:
        negative_marks = Decimal('1')

    if order is None:
        owner_qs = section.questions if section else topic.questions
        last = owner_qs.order_by('-order').values_list('order', flat=True).first() or 0
        order = last + 1

    q = MockQuestion.objects.create(
        section=section, passage=passage, topic=topic, question_type=question_type,
        question_text=text,
        option_a=d.get('option_a', '').strip() if d.get('option_a') else '',
        option_b=d.get('option_b', '').strip() if d.get('option_b') else '',
        option_c=d.get('option_c', '').strip() if d.get('option_c') else '',
        option_d=d.get('option_d', '').strip() if d.get('option_d') else '',
        option_e=d.get('option_e', '').strip() if d.get('option_e') else '',
        correct_option=(d.get('correct_option') or '').upper().strip(),
        tita_answer=(d.get('tita_answer') or '').strip(),
        difficulty=d.get('difficulty', 'moderate'),
        explanation=d.get('explanation', ''),
        correct_marks=correct_marks, negative_marks=negative_marks,
        order=order,
    )
    return q


# ── PASTE & SPLIT ─────────────────────────────────────────────────────────────

class AdminMockPasteSplitView(APIView):
    """
    POST /sections/<section_pk>/paste-split/
    body: { raw_text, action: 'preview'|'import', difficulty?: 'moderate' }

    'preview' just parses and returns block/question counts + any errors,
    without touching the DB. 'import' does the same parse then actually
    creates MockPassage/MockQuestion rows.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, section_pk):
        if not is_admin(request.user): return _forbidden()
        section = get_object_or_404(MockSection, pk=section_pk)
        d = request.data
        raw_text = d.get('raw_text', '')
        action = d.get('action', 'preview')

        blocks = parse_pasted_text(raw_text)
        if not blocks:
            return Response({'error': 'Nothing parseable found. Check the format — see the help panel.'}, status=400)

        errors = []
        for bi, block in enumerate(blocks, start=1):
            for qi, q in enumerate(block['questions'], start=1):
                if q.get('error'):
                    errors.append({'block': bi, 'question': qi, 'error': q['error'], 'preview': q['question_text'][:80]})

        total_questions = sum(len(b['questions']) for b in blocks)
        total_passages = sum(1 for b in blocks if b['type'] == 'passage')
        total_standalone = sum(1 for b in blocks if b['type'] == 'standalone')

        if action == 'preview':
            return Response({
                'total_blocks': len(blocks), 'total_passages': total_passages,
                'total_standalone': total_standalone, 'total_questions': total_questions,
                'errors': errors,
                'sample': [
                    {'type': b['type'], 'passage_preview': b['passage_text'][:120],
                     'question_count': len(b['questions']),
                     'first_question_preview': b['questions'][0]['question_text'][:100] if b['questions'] else ''}
                    for b in blocks[:10]
                ],
            })

        if errors:
            return Response({'error': f'{len(errors)} question(s) failed to parse — fix and re-preview before importing.', 'errors': errors}, status=400)

        difficulty = d.get('difficulty', 'moderate')

        last_order = section.questions.order_by('-order').values_list('order', flat=True).first() or 0
        created_passages = 0
        created_questions = 0

        for block in blocks:
            passage_obj = None
            if block['type'] == 'passage' and block['passage_text']:
                last_passage_order = section.passages.order_by('-order').values_list('order', flat=True).first() or 0
                passage_obj = MockPassage.objects.create(
                    section=section, passage_text=block['passage_text'], order=last_passage_order + 1,
                )
                created_passages += 1

            for q in block['questions']:
                last_order += 1
                qd = dict(q)
                qd['difficulty'] = difficulty
                created = _create_question_from_dict(qd, section=section, passage=passage_obj, order=last_order)
                if isinstance(created, Response):
                    continue
                created_questions += 1

        return Response({
            'success': True, 'created_passages': created_passages, 'created_questions': created_questions,
        })


# ── TOPIC-WISE QUESTIONS: its own separate authoring pipeline ──────────────
# Same paste-and-split mechanics as a section, but questions attach
# directly to a MockTopic and never to a MockSection/MockPaper — this is
# a genuinely separate question pool, not shared/reused content.

class AdminMockTopicQuestionManageView(APIView):
    """GET /topics/<topic_pk>/questions/ — this topic's own standalone questions, for the manage page."""
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_pk):
        if not is_admin(request.user): return _forbidden()
        topic = get_object_or_404(MockTopic, pk=topic_pk)
        standalones = topic.questions.order_by('order')
        return Response({
            'topic': topic_dict(topic, with_counts=False),
            'standalones': [question_admin_dict(q) for q in standalones],
        })


class AdminMockTopicQuestionAddView(APIView):
    """POST /topics/<topic_pk>/questions/add/ — single manual add, direct to the topic's own pool."""
    permission_classes = [IsAuthenticated]

    def post(self, request, topic_pk):
        if not is_admin(request.user): return _forbidden()
        topic = get_object_or_404(MockTopic, pk=topic_pk)
        d = request.data
        q = _create_question_from_dict(d, topic=topic)
        if isinstance(q, Response):
            return q
        return Response(question_admin_dict(q), status=201)


class AdminMockTopicPasteSplitView(APIView):
    """
    POST /topics/<topic_pk>/paste-split/
    body: { raw_text, action: 'preview'|'import', difficulty?: 'moderate' }

    Same format as section paste-and-split, but PASSAGE blocks aren't
    supported here (RC/DILR sets belong to a section, not a topic-wise
    drill) — they're reported as skipped rather than imported.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, topic_pk):
        if not is_admin(request.user): return _forbidden()
        topic = get_object_or_404(MockTopic, pk=topic_pk)
        d = request.data
        raw_text = d.get('raw_text', '')
        action = d.get('action', 'preview')

        blocks = parse_pasted_text(raw_text)
        if not blocks:
            return Response({'error': 'Nothing parseable found. Check the format — see the help panel.'}, status=400)

        standalone_blocks = [b for b in blocks if b['type'] == 'standalone']
        skipped_passages = sum(1 for b in blocks if b['type'] == 'passage')

        errors = []
        for bi, block in enumerate(standalone_blocks, start=1):
            for qi, q in enumerate(block['questions'], start=1):
                if q.get('error'):
                    errors.append({'block': bi, 'question': qi, 'error': q['error'], 'preview': q['question_text'][:80]})

        total_questions = sum(len(b['questions']) for b in standalone_blocks)

        if action == 'preview':
            return Response({
                'total_blocks': len(standalone_blocks), 'total_questions': total_questions,
                'skipped_passages': skipped_passages, 'errors': errors,
                'sample': [
                    {'type': b['type'], 'question_count': len(b['questions']),
                     'first_question_preview': b['questions'][0]['question_text'][:100] if b['questions'] else ''}
                    for b in standalone_blocks[:10]
                ],
            })

        if errors:
            return Response({'error': f'{len(errors)} question(s) failed to parse — fix and re-preview before importing.', 'errors': errors}, status=400)

        difficulty = d.get('difficulty', 'moderate')
        last_order = topic.questions.order_by('-order').values_list('order', flat=True).first() or 0
        created_questions = 0

        for block in standalone_blocks:
            for q in block['questions']:
                last_order += 1
                qd = dict(q)
                qd['difficulty'] = difficulty
                created = _create_question_from_dict(qd, topic=topic, order=last_order)
                if isinstance(created, Response):
                    continue
                created_questions += 1

        return Response({
            'success': True, 'created_questions': created_questions, 'skipped_passages': skipped_passages,
        })


# ── ATTEMPTS (admin view — analytics/debugging) ─────────────────────────────

class AdminMockAttemptListView(APIView):
    """GET /attempts/?exam=<slug>&user_email=<email> — lightweight lookup, mainly for support."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user): return _forbidden()
        qs = MockAttempt.objects.select_related('user', 'exam', 'paper', 'topic')
        exam_slug = request.query_params.get('exam')
        if exam_slug: qs = qs.filter(exam__slug=exam_slug)
        email = request.query_params.get('user_email')
        if email: qs = qs.filter(user__email__icontains=email)
        qs = qs.order_by('-started_at')[:200]
        return Response([
            {
                'id': a.id, 'user_email': a.user.email, 'mode': a.mode,
                'paper_title': a.paper.title if a.paper else None,
                'topic_name': a.topic.name if a.topic else None,
                'started_at': a.started_at.isoformat(), 'completed': a.completed,
                'score': str(a.score), 'correct': a.correct, 'incorrect': a.incorrect, 'unattempted': a.unattempted,
            }
            for a in qs
        ])
