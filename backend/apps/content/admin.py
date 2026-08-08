from django.contrib import admin
from django.utils.html import format_html
from .models import VideoLibrary, VideoProgress, AITranscript
from .tasks import generate_transcript


class AITranscriptInline(admin.StackedInline):
    model  = AITranscript
    extra  = 0
    readonly_fields = ['status', 'word_count', 'processing_secs', 'error_message',
                       'created_at', 'updated_at']
    fields = ['status', 'ai_notes', 'raw_transcript', 'word_count',
              'processing_secs', 'error_message']


@admin.register(VideoLibrary)
class VideoLibraryAdmin(admin.ModelAdmin):
    list_display   = ['title', 'primary_exam', 'duration_display',
                      'is_published', 'is_free_preview', 'transcript_status', 'sort_order']
    list_filter    = ['is_published', 'is_free_preview', 'primary_exam']
    search_fields  = ['title', 'bunny_video_id']
    readonly_fields = ['bunny_video_id', 'duration_secs', 'created_at']
    ordering       = ['primary_exam', 'sort_order']
    inlines        = [AITranscriptInline]

    actions = ['publish_videos', 'trigger_transcription']

    def transcript_status(self, obj):
        try:
            t = obj.transcript
            colours = {'done': 'green', 'processing': 'orange',
                       'failed': 'red', 'pending': '#999'}
            return format_html(
                '<span style="color:{};font-weight:600;">{}</span>',
                colours.get(t.status, '#999'), t.status
            )
        except AITranscript.DoesNotExist:
            return format_html('<span style="color:#ccc;">—</span>')
    transcript_status.short_description = 'Transcript'

    def publish_videos(self, request, queryset):
        queryset.update(is_published=True)
    publish_videos.short_description = 'Mark selected videos as published'

    def trigger_transcription(self, request, queryset):
        for video in queryset.filter(is_published=True):
            generate_transcript.delay(video.id)
            self.message_user(request, f'Transcription queued for: {video.title}')
    trigger_transcription.short_description = 'Queue Whisper transcription'


@admin.register(VideoProgress)
class VideoProgressAdmin(admin.ModelAdmin):
    list_display  = ['user', 'video', 'last_position', 'is_completed', 'updated_at']
    list_filter   = ['is_completed']
    search_fields = ['user__email', 'video__title']
    readonly_fields = ['updated_at']


@admin.register(AITranscript)
class AITranscriptAdmin(admin.ModelAdmin):
    list_display  = ['video', 'status', 'word_count', 'processing_secs', 'updated_at']
    list_filter   = ['status']
    search_fields = ['video__title']
    readonly_fields = ['created_at', 'updated_at', 'processing_secs', 'word_count']
    actions = ['retry_failed']

    def retry_failed(self, request, queryset):
        for transcript in queryset.filter(status='failed'):
            generate_transcript.delay(transcript.video.id)
    retry_failed.short_description = 'Retry failed transcriptions'
