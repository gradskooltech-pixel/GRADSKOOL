"""
GRADSKOOL — Learning Portal Admin
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import TopicVideo, LiveSession, TopicVideoProgress, QuizAttempt


@admin.register(TopicVideo)
class TopicVideoAdmin(admin.ModelAdmin):
    list_display  = [
        'sort_order', 'topic', 'title', 'difficulty',
        'duration_mins', 'sub_tag', 'has_quiz', 'has_cheatsheet', 'is_youtube_badge'
    ]
    list_filter   = ['difficulty', 'has_quiz', 'has_cheatsheet', 'topic__module__course__exam']
    search_fields = ['title', 'topic__title', 'sub_tag']
    ordering      = ['topic', 'sort_order']
    autocomplete_fields = ['video', 'quiz_source']
    fieldsets = (
        ('Position', {'fields': ('topic', 'sort_order')}),
        ('Video',    {'fields': ('video', 'title', 'difficulty', 'duration_mins', 'sub_tag')}),
        ('Quiz',     {'fields': ('has_quiz', 'quiz_source', 'quiz_question_count')}),
        ('Cheat Sheet', {'fields': ('has_cheatsheet',)}),
    )

    def is_youtube_badge(self, obj):
        if obj.is_youtube:
            return format_html(
                '<span style="background:#FF0000;color:white;padding:2px 6px;'
                'border-radius:2px;font-size:11px">YT</span>'
            )
        return format_html(
            '<span style="background:#10b981;color:white;padding:2px 6px;'
            'border-radius:2px;font-size:11px">Bunny</span>'
        )
    is_youtube_badge.short_description = 'Source'


@admin.register(LiveSession)
class LiveSessionAdmin(admin.ModelAdmin):
    list_display  = [
        'topic', 'title', 'scheduled_at', 'duration_mins',
        'status', 'recording_available'
    ]
    list_filter   = ['status', 'recording_available', 'topic__module__course__exam']
    search_fields = ['title', 'topic__title']
    ordering      = ['-scheduled_at']
    fieldsets = (
        ('Session',    {'fields': ('topic', 'title', 'description')}),
        ('Schedule',   {'fields': ('scheduled_at', 'duration_mins', 'status')}),
        ('Links',      {'fields': ('meet_link', 'recording_url', 'recording_available')}),
    )


@admin.register(TopicVideoProgress)
class TopicVideoProgressAdmin(admin.ModelAdmin):
    list_display  = [
        'student', 'topic_video', 'state', 'watch_pct_display',
        'quiz_attempts', 'best_score_pct', 'cheatsheet_opened',
    ]
    list_filter   = ['state', 'quiz_passed', 'quiz_bypassed', 'cheatsheet_opened']
    search_fields = ['student__email', 'topic_video__title']
    readonly_fields = [
        'state', 'watch_pct', 'watched_secs', 'quiz_attempts',
        'best_score_pct', 'quiz_passed', 'quiz_bypassed',
        'cheatsheet_opened', 'cheatsheet_opened_at',
        'started_at', 'completed_at', 'updated_at',
    ]
    ordering = ['-updated_at']

    def watch_pct_display(self, obj):
        pct = obj.watch_pct
        color = '#10b981' if pct >= 70 else '#f59e0b' if pct >= 30 else '#9ca3af'
        return format_html(
            '<span style="color:{};font-weight:600">{:.0f}%</span>',
            color, pct
        )
    watch_pct_display.short_description = 'Watched'

    def has_add_permission(self, request):
        return False


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display  = [
        'progress', 'attempt_number', 'score_display',
        'correct', 'total', 'time_taken_secs', 'submitted_at',
    ]
    list_filter   = ['submitted_at']
    search_fields = ['progress__student__email']
    readonly_fields = ['answers', 'submitted_at']
    ordering = ['-submitted_at']

    def score_display(self, obj):
        color = '#10b981' if obj.score_pct >= 70 else '#ef4444'
        return format_html(
            '<span style="color:{};font-weight:700">{:.0f}%</span>',
            color, obj.score_pct
        )
    score_display.short_description = 'Score'

    def has_add_permission(self, request):
        return False
