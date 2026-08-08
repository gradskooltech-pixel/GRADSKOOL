from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Tag, Tool, ToolLead, Question, QuestionOption,
    Passage, VocabWord, QATopic, ToolSession, ToolAnswer
)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'tag_type', 'parent']
    list_filter   = ['tag_type']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


class QuestionOptionInline(admin.TabularInline):
    model  = QuestionOption
    extra  = 4
    fields = ['key', 'text', 'is_correct']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display  = ['id', 'short_text', 'question_type', 'exam_tag', 'section_tag',
                     'topic_tag', 'difficulty_tag', 'is_active']
    list_filter   = ['question_type', 'exam_tag', 'section_tag', 'difficulty_tag', 'is_active', 'tool']
    search_fields = ['question_text', 'explanation']
    filter_horizontal = ['tags']
    inlines       = [QuestionOptionInline]
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Content', {'fields': ('tool', 'passage', 'passage_position',
                                'question_type', 'question_text', 'explanation')}),
        ('Answer',  {'fields': ('correct_answer', 'marks_correct', 'marks_wrong')}),
        ('Tags (Denormalised)', {'fields': ('exam_tag', 'section_tag', 'topic_tag',
                                             'difficulty_tag', 'source_tag')}),
        ('M2M Tags', {'fields': ('tags',)}),
        ('Meta',    {'fields': ('is_active', 'created_at', 'updated_at')}),
    )

    def short_text(self, obj):
        return obj.question_text[:80] + ('…' if len(obj.question_text) > 80 else '')
    short_text.short_description = 'Question'


class QuestionInline(admin.TabularInline):
    model     = Question
    extra     = 0
    fields    = ['question_text', 'correct_answer', 'difficulty_tag', 'is_active']
    show_change_link = True


@admin.register(Passage)
class PassageAdmin(admin.ModelAdmin):
    list_display  = ['tool', 'number', 'category', 'difficulty', 'word_count']
    list_filter   = ['tool', 'category', 'difficulty']
    search_fields = ['title', 'text', 'category']
    filter_horizontal = ['tags']
    inlines       = [QuestionInline]


@admin.register(Tool)
class ToolAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'tool_type', 'question_count', 'is_active', 'sort_order']
    list_filter   = ['tool_type', 'is_active']
    search_fields = ['name', 'slug']
    filter_horizontal = ['tags']


@admin.register(ToolLead)
class ToolLeadAdmin(admin.ModelAdmin):
    list_display  = ['email', 'name', 'tool', 'target_exam', 'created_at']
    list_filter   = ['tool', 'target_exam']
    search_fields = ['email', 'name']
    readonly_fields = ['created_at', 'access_token']


@admin.register(VocabWord)
class VocabWordAdmin(admin.ModelAdmin):
    list_display  = ['word', 'difficulty', 'sort_order']
    list_filter   = ['difficulty', 'tool']
    search_fields = ['word', 'definition']


@admin.register(QATopic)
class QATopicAdmin(admin.ModelAdmin):
    list_display  = ['number', 'name', 'category', 'tool', 'sort_order']
    list_filter   = ['category', 'tool']
    search_fields = ['name']


@admin.register(ToolSession)
class ToolSessionAdmin(admin.ModelAdmin):
    list_display  = ['lead', 'tool', 'questions_seen', 'questions_correct', 'score_pct', 'started_at']
    list_filter   = ['tool']
    readonly_fields = ['started_at', 'ended_at']
