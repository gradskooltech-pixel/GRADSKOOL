"""
GRADSKOOL — Tools Views

Public (no auth, lead gate only):
  GET  /api/v1/tools/                            → All active tools
  GET  /api/v1/tools/{slug}/                     → Tool detail + stats
  POST /api/v1/tools/{slug}/gate/                → Submit lead gate → return JWT
  GET  /api/v1/tools/{slug}/questions/           → Paginated questions (gate required)
  POST /api/v1/tools/{slug}/questions/answer/    → Check answer + return explanation
  GET  /api/v1/tools/{slug}/passages/            → Passage list (RC tools)
  GET  /api/v1/tools/{slug}/passages/{id}/       → Single passage + questions
  GET  /api/v1/tools/{slug}/vocab/               → Vocab word list (GRE tool)
  GET  /api/v1/tools/{slug}/vocab/{id}/          → Single vocab word
  GET  /api/v1/tools/{slug}/qa-topics/           → QA topics (CAT Maths tool)
  GET  /api/v1/tools/{slug}/qa-topics/{id}/      → Topic + questions
  POST /api/v1/tools/{slug}/session/start/       → Start a quiz session
  POST /api/v1/tools/{slug}/session/{id}/submit/ → Submit session + get results
  GET  /api/v1/tools/tags/                       → Tag taxonomy

All tool content endpoints validate the tool-access JWT from the gate.
"""
import logging
import jwt
from django.conf import settings
from django.core.cache import cache
from django.db.models import Count
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import Tool, ToolLead, Tag, Question, Passage, VocabWord, QATopic, ToolSession, ToolAnswer
from .serializers import (
    ToolListSerializer, LeadGateSerializer, TagSerializer,
    QuestionSerializer, QuestionWithAnswerSerializer, AnswerSubmitSerializer,
    PassageSerializer, PassageListSerializer,
    VocabWordSerializer, QATopicSerializer, SessionResultSerializer,
)
from .emails import send_tool_welcome_email

logger = logging.getLogger(__name__)


# ── TOKEN VALIDATION ──────────────────────────────────────────────────────────

def _validate_tool_token(request, tool_slug: str):
    """
    Validate the tool-access JWT from Authorization header or query param.
    Returns (email, lead_id) on success, raises PermissionError on failure.
    """
    token = (
        request.headers.get('X-Tool-Token')
        or request.query_params.get('token')
    )
    if not token:
        raise PermissionError('Tool access token required.')
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        if payload.get('tool') != tool_slug:
            raise PermissionError('Token not valid for this tool.')
        return payload['email'], payload['lead_id']
    except jwt.ExpiredSignatureError:
        raise PermissionError('Tool access token has expired. Please re-submit the gate.')
    except jwt.InvalidTokenError:
        raise PermissionError('Invalid tool access token.')


class ToolGateMixin:
    """Mixin that validates token before serving tool content."""
    def _check_gate(self, request, tool_slug):
        try:
            email, lead_id = _validate_tool_token(request, tool_slug)
            return email, lead_id
        except PermissionError as e:
            return None, None

    def get_tool_or_404(self, slug):
        try:
            return Tool.objects.get(slug=slug, is_active=True)
        except Tool.DoesNotExist:
            return None


# ── THROTTLES ─────────────────────────────────────────────────────────────────

class GateThrottle(AnonRateThrottle):
    scope = 'tool_gate'


# ── TOOL LIST + DETAIL ────────────────────────────────────────────────────────

class ToolListView(generics.ListAPIView):
    """GET /api/v1/tools/ — All active tools, cached 15 minutes."""
    serializer_class   = ToolListSerializer
    permission_classes = [AllowAny]

    @method_decorator(cache_page(60 * 15))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        return Tool.objects.filter(is_active=True).prefetch_related('tags').order_by('sort_order')


class ToolDetailView(APIView):
    """GET /api/v1/tools/{slug}/ — Tool detail."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            tool = Tool.objects.prefetch_related('tags').get(slug=slug, is_active=True)
        except Tool.DoesNotExist:
            return Response(status=404)
        return Response(ToolListSerializer(tool).data)


# ── LEAD GATE ─────────────────────────────────────────────────────────────────

class LeadGateView(APIView):
    """
    POST /api/v1/tools/{slug}/gate/
    Lead gate removed — returns access token without collecting any user data.
    """
    permission_classes = [AllowAny]

    def post(self, request, slug):
        import hashlib, time
        # Return access immediately — no name, email, or phone collected
        token = hashlib.sha256(f"{slug}:{time.time()}".encode()).hexdigest()[:32]
        return Response({
            'access_token': token,
            'is_new_lead':  False,
        })


class QuestionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class QuestionListView(ToolGateMixin, generics.ListAPIView):
    """
    GET /api/v1/tools/{slug}/questions/

    Query params:
      section=VARC, topic=NumberTheory, difficulty=Hard
      passage_id=<id>   → Questions for a specific passage
      random=true       → Randomize order
    """
    serializer_class   = QuestionSerializer
    permission_classes = [AllowAny]
    pagination_class   = QuestionPagination

    def get_queryset(self):
        tool = self.get_tool_or_404(self.kwargs['slug'])
        if not tool:
            return Question.objects.none()

        qs = (
            Question.objects
            .filter(tool=tool, is_active=True)
            .prefetch_related('options', 'tags')
        )
        params = self.request.query_params
        if params.get('section'):
            qs = qs.filter(section_tag__iexact=params['section'])
        if params.get('topic'):
            qs = qs.filter(topic_tag__iexact=params['topic'])
        if params.get('difficulty'):
            qs = qs.filter(difficulty_tag__iexact=params['difficulty'])
        if params.get('passage_id'):
            qs = qs.filter(passage_id=params['passage_id'])
        if params.get('random') == 'true':
            qs = qs.order_by('?')
        else:
            qs = qs.order_by('passage', 'passage_position', 'id')
        return qs

    def list(self, request, *args, **kwargs):
        tool = self.get_tool_or_404(self.kwargs['slug'])
        if not tool:
            return Response(status=404)

        # Check gate if required
        if tool.requires_lead_gate:
            email, _ = self._check_gate(request, self.kwargs['slug'])
            if not email:
                return Response(
                    {'error': {'code': 'gate_required', 'message': 'Please submit the tool gate first.'}},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().list(request, *args, **kwargs)


class AnswerCheckView(ToolGateMixin, APIView):
    """
    POST /api/v1/tools/{slug}/questions/answer/
    Body: { question_id, selected, time_spent }

    Validates the answer and returns correct answer + explanation.
    Does NOT require gate — answers are public knowledge.
    """
    permission_classes = [AllowAny]

    def post(self, request, slug):
        serializer = AnswerSubmitSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        question   = serializer.context['question']
        selected   = serializer.validated_data['selected'].strip().lower()
        correct    = set(question.correct_answer.lower().split(','))
        is_correct = selected in correct if selected else None

        return Response({
            'question_id':    question.id,
            'selected':       selected,
            'correct_answer': question.correct_answer,
            'is_correct':     is_correct,
            'explanation':    question.explanation,
            'marks_earned':   float(question.marks_correct) if is_correct else (
                0.0 if question.question_type == 'tita' or not selected
                else float(question.marks_wrong)
            ),
        })


# ── PASSAGE ENDPOINTS ─────────────────────────────────────────────────────────

class PassageListView(ToolGateMixin, generics.ListAPIView):
    """GET /api/v1/tools/{slug}/passages/ — Passage grid (no full text)."""
    serializer_class   = PassageListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        tool = self.get_tool_or_404(self.kwargs['slug'])
        if not tool:
            return Passage.objects.none()
        qs = Passage.objects.filter(tool=tool).order_by('number')
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category__iexact=cat)
        diff = self.request.query_params.get('difficulty')
        if diff:
            qs = qs.filter(difficulty=int(diff))
        return qs

    def list(self, request, *args, **kwargs):
        tool = self.get_tool_or_404(self.kwargs['slug'])
        if not tool:
            return Response(status=404)
        if tool.requires_lead_gate:
            email, _ = self._check_gate(request, self.kwargs['slug'])
            if not email:
                return Response(
                    {'error': {'code': 'gate_required', 'message': 'Please submit the tool gate first.'}},
                    status=status.HTTP_403_FORBIDDEN
                )
        queryset = self.get_queryset()
        # Return with category breakdown
        categories = list(
            queryset.values('category').annotate(count=Count('id')).order_by('category')
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response({'passages': serializer.data, 'categories': categories})


class PassageDetailView(ToolGateMixin, APIView):
    """GET /api/v1/tools/{slug}/passages/{id}/ — Full passage + questions."""
    permission_classes = [AllowAny]

    def get(self, request, slug, pk):
        tool = self.get_tool_or_404(slug)
        if not tool:
            return Response(status=404)
        if tool.requires_lead_gate:
            email, _ = self._check_gate(request, slug)
            if not email:
                return Response(
                    {'error': {'code': 'gate_required'}}, status=403
                )
        try:
            passage = Passage.objects.prefetch_related('questions__options', 'questions__tags', 'tags').get(
                id=pk, tool=tool
            )
        except Passage.DoesNotExist:
            return Response(status=404)
        return Response(PassageSerializer(passage).data)


# ── VOCAB ENDPOINTS ───────────────────────────────────────────────────────────

class VocabListView(ToolGateMixin, generics.ListAPIView):
    """GET /api/v1/tools/{slug}/vocab/?difficulty=high"""
    serializer_class   = VocabWordSerializer
    permission_classes = [AllowAny]
    pagination_class   = QuestionPagination

    def get_queryset(self):
        tool = self.get_tool_or_404(self.kwargs['slug'])
        if not tool:
            return VocabWord.objects.none()
        qs = VocabWord.objects.filter(tool=tool).order_by('sort_order', 'word')
        diff = self.request.query_params.get('difficulty')
        if diff:
            qs = qs.filter(difficulty=diff)
        if self.request.query_params.get('random') == 'true':
            qs = qs.order_by('?')
        return qs

    def list(self, request, *args, **kwargs):
        tool = self.get_tool_or_404(self.kwargs['slug'])
        if not tool:
            return Response(status=404)
        if tool.requires_lead_gate:
            email, _ = self._check_gate(request, self.kwargs['slug'])
            if not email:
                return Response({'error': {'code': 'gate_required'}}, status=403)
        return super().list(request, *args, **kwargs)


class VocabDetailView(APIView):
    """GET /api/v1/tools/{slug}/vocab/{id}/"""
    permission_classes = [AllowAny]

    def get(self, request, slug, pk):
        try:
            word = VocabWord.objects.get(id=pk, tool__slug=slug)
        except VocabWord.DoesNotExist:
            return Response(status=404)
        return Response(VocabWordSerializer(word).data)


# ── QA TOPIC ENDPOINTS ────────────────────────────────────────────────────────

class QATopicListView(ToolGateMixin, generics.ListAPIView):
    """GET /api/v1/tools/{slug}/qa-topics/?category=arithmetic"""
    serializer_class   = QATopicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        tool = self.get_tool_or_404(self.kwargs['slug'])
        if not tool:
            return QATopic.objects.none()
        qs = QATopic.objects.filter(tool=tool).select_related('tag').order_by('sort_order', 'number')
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category__iexact=cat)
        return qs

    def list(self, request, *args, **kwargs):
        tool = self.get_tool_or_404(self.kwargs['slug'])
        if not tool:
            return Response(status=404)
        if tool.requires_lead_gate:
            email, _ = self._check_gate(request, self.kwargs['slug'])
            if not email:
                return Response({'error': {'code': 'gate_required'}}, status=403)
        queryset = self.get_queryset()
        categories = list(
            queryset.values('category').annotate(count=Count('id')).order_by('category')
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response({'topics': serializer.data, 'categories': categories})


class QATopicDetailView(ToolGateMixin, APIView):
    """GET /api/v1/tools/{slug}/qa-topics/{id}/ — Topic + its questions."""
    permission_classes = [AllowAny]

    def get(self, request, slug, pk):
        tool = self.get_tool_or_404(slug)
        if tool and tool.requires_lead_gate:
            email, _ = self._check_gate(request, slug)
            if not email:
                return Response({'error': {'code': 'gate_required'}}, status=403)
        try:
            topic = QATopic.objects.select_related('tag').get(id=pk, tool__slug=slug)
        except QATopic.DoesNotExist:
            return Response(status=404)

        questions = Question.objects.none()
        if topic.tag:
            questions = (
                Question.objects
                .filter(tags=topic.tag, tool=topic.tool, is_active=True)
                .prefetch_related('options', 'tags')
                .order_by('id')
            )
        return Response({
            **QATopicSerializer(topic).data,
            'questions': QuestionSerializer(questions, many=True).data,
        })


# ── SESSION ───────────────────────────────────────────────────────────────────

class SessionStartView(ToolGateMixin, APIView):
    """
    POST /api/v1/tools/{slug}/session/start/
    Body: { question_ids: [1,2,3,…] }
    """
    permission_classes = [AllowAny]

    def post(self, request, slug):
        tool = self.get_tool_or_404(slug)
        if not tool:
            return Response(status=404)

        email, lead_id = self._check_gate(request, slug)
        if not email:
            return Response({'error': {'code': 'gate_required'}}, status=403)

        try:
            lead = ToolLead.objects.get(id=lead_id, tool=tool)
        except ToolLead.DoesNotExist:
            return Response({'error': {'message': 'Lead not found.'}}, status=400)

        session = ToolSession.objects.create(lead=lead, tool=tool)
        return Response({'session_id': session.id})


class SessionSubmitView(ToolGateMixin, APIView):
    """
    POST /api/v1/tools/{slug}/session/{session_id}/submit/
    Body: { answers: [{question_id, selected, time_spent}, …] }
    """
    permission_classes = [AllowAny]

    def post(self, request, slug, session_id):
        tool = self.get_tool_or_404(slug)
        if not tool:
            return Response(status=404)

        email, lead_id = self._check_gate(request, slug)
        if not email:
            return Response({'error': {'code': 'gate_required'}}, status=403)

        try:
            session = ToolSession.objects.get(id=session_id, lead__email=email)
        except ToolSession.DoesNotExist:
            return Response({'error': {'message': 'Session not found.'}}, status=404)

        answers_data = request.data.get('answers', [])
        correct_count = 0
        total = len(answers_data)

        for ans in answers_data:
            try:
                question = Question.objects.get(id=ans['question_id'], is_active=True)
            except Question.DoesNotExist:
                continue

            selected   = str(ans.get('selected', '')).strip().lower()
            correct    = set(question.correct_answer.lower().split(','))
            is_correct = selected in correct if selected else None
            if is_correct:
                correct_count += 1

            ToolAnswer.objects.create(
                session=session,
                question=question,
                selected=selected,
                is_correct=is_correct,
                time_spent_secs=ans.get('time_spent', 0),
            )

        session.questions_seen    = total
        session.questions_correct = correct_count
        session.score_pct = round((correct_count / total) * 100, 1) if total else 0
        from django.utils import timezone
        session.ended_at = timezone.now()
        session.save()

        return Response(SessionResultSerializer(session).data)


# ── TAG TAXONOMY ──────────────────────────────────────────────────────────────

class TagListView(generics.ListAPIView):
    """GET /api/v1/tools/tags/?type=exam|section|topic"""
    serializer_class   = TagSerializer
    permission_classes = [AllowAny]

    @method_decorator(cache_page(60 * 60))
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        qs = Tag.objects.all().order_by('tag_type', 'name')
        tag_type = self.request.query_params.get('type')
        if tag_type:
            qs = qs.filter(tag_type=tag_type)
        return qs
