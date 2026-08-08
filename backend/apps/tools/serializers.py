"""
GRADSKOOL — Tools Serializers
"""
import jwt
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from .models import (
    Tool, ToolLead, Tag, Question, QuestionOption,
    Passage, VocabWord, QATopic, ToolSession, ToolAnswer
)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tag
        fields = ['id', 'name', 'slug', 'tag_type']


class ToolListSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model  = Tool
        fields = [
            'id', 'slug', 'name', 'description', 'tool_type',
            'tags', 'question_count', 'requires_lead_gate',
            'og_image_url', 'meta_title', 'meta_desc', 'sort_order',
        ]


# ── LEAD GATE ─────────────────────────────────────────────────────────────────

class LeadGateSerializer(serializers.Serializer):
    name        = serializers.CharField(max_length=120)
    email       = serializers.EmailField()
    target_exam = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_email(self, value):
        return value.lower().strip()

    def create_or_get_lead(self, tool, ip=None, ua=''):
        data = self.validated_data
        lead, created = ToolLead.objects.get_or_create(
            email=data['email'],
            tool=tool,
            defaults={
                'name':        data['name'],
                'target_exam': data.get('target_exam', ''),
                'ip_address':  ip,
                'user_agent':  ua,
            }
        )
        # Generate signed access token (24h)
        payload = {
            'email':    lead.email,
            'tool':     tool.slug,
            'lead_id':  lead.id,
            'exp':      int((timezone.now() + timedelta(hours=24)).timestamp()),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        lead.access_token = token
        lead.save(update_fields=['access_token'])
        return lead, token, created


# ── QUESTION ──────────────────────────────────────────────────────────────────

class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = QuestionOption
        fields = ['key', 'text']   # Never expose is_correct here


class QuestionSerializer(serializers.ModelSerializer):
    """Safe question serialiser — never leaks correct answer or explanation."""
    options = QuestionOptionSerializer(many=True, read_only=True)
    tags    = TagSerializer(many=True, read_only=True)

    class Meta:
        model  = Question
        fields = [
            'id', 'question_type', 'question_text',
            'options', 'tags',
            'exam_tag', 'section_tag', 'topic_tag', 'difficulty_tag',
            'marks_correct', 'marks_wrong',
        ]


class QuestionWithAnswerSerializer(QuestionSerializer):
    """Extended serialiser that includes the answer — used AFTER submission."""
    class Meta(QuestionSerializer.Meta):
        fields = QuestionSerializer.Meta.fields + ['correct_answer', 'explanation']


class AnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected    = serializers.CharField(max_length=20, allow_blank=True)
    time_spent  = serializers.IntegerField(min_value=0, default=0)

    def validate_question_id(self, value):
        try:
            q = Question.objects.get(id=value, is_active=True)
        except Question.DoesNotExist:
            raise serializers.ValidationError('Question not found.')
        self.context['question'] = q
        return value


# ── PASSAGE ───────────────────────────────────────────────────────────────────

class PassageSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    tags      = TagSerializer(many=True, read_only=True)

    class Meta:
        model  = Passage
        fields = [
            'id', 'number', 'category', 'title', 'text',
            'word_count', 'difficulty', 'tags', 'questions',
        ]


class PassageListSerializer(serializers.ModelSerializer):
    """Lightweight — for the passage grid. No full text."""
    class Meta:
        model  = Passage
        fields = ['id', 'number', 'category', 'title', 'word_count', 'difficulty']


# ── VOCAB ─────────────────────────────────────────────────────────────────────

class VocabWordSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VocabWord
        fields = [
            'id', 'word', 'definition', 'etymology',
            'example', 'synonyms', 'difficulty', 'sort_order',
        ]


# ── QA TOPIC ──────────────────────────────────────────────────────────────────

class QATopicSerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    tag            = TagSerializer(read_only=True)

    class Meta:
        model  = QATopic
        fields = [
            'id', 'number', 'name', 'category',
            'concept_notes', 'formulas', 'tag', 'question_count',
        ]

    def get_question_count(self, obj):
        return obj.question_count()


# ── SESSION ───────────────────────────────────────────────────────────────────

class SessionResultSerializer(serializers.ModelSerializer):
    answers = serializers.SerializerMethodField()

    class Meta:
        model  = ToolSession
        fields = [
            'id', 'questions_seen', 'questions_correct',
            'score_pct', 'started_at', 'answers',
        ]

    def get_answers(self, obj):
        answers = obj.answers.select_related('question').prefetch_related('question__options')
        return [{
            'question_id':   a.question_id,
            'selected':      a.selected,
            'correct_answer': a.question.correct_answer,
            'is_correct':    a.is_correct,
            'explanation':   a.question.explanation,
            'question_text': a.question.question_text,
            'options':       QuestionOptionSerializer(a.question.options.all(), many=True).data,
        } for a in answers]
