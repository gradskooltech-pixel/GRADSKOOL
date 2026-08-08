"""
GRADSKOOL — Content Views

GET  /api/v1/content/{exam_slug}/videos/              → Course video list
GET  /api/v1/content/videos/{bunny_video_id}/stream/  → Signed Bunny URL
POST /api/v1/content/videos/{bunny_video_id}/progress/ → Save watch position
GET  /api/v1/content/videos/{bunny_video_id}/notes/   → AI study notes
"""
import logging
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle

from apps.enrollments.permissions import AccessGateMixin
from apps.enrollments.services import check_access
from .models import VideoLibrary, VideoProgress, AITranscript
from .bunny import generate_signed_url, build_thumbnail_url

logger = logging.getLogger(__name__)


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

class VideoListSerializer(serializers.ModelSerializer):
    module_title    = serializers.CharField(source='module.title', default=None, read_only=True)
    duration_display = serializers.ReadOnlyField()
    thumbnail_url   = serializers.SerializerMethodField()
    is_locked       = serializers.SerializerMethodField()
    progress        = serializers.SerializerMethodField()

    class Meta:
        model  = VideoLibrary
        fields = [
            'id', 'video_source', 'bunny_video_id', 'youtube_video_id',
            'embed_url', 'title', 'description',
            'module_title', 'duration_secs', 'duration_display',
            'thumbnail_url', 'is_free_preview', 'is_locked',
            'sort_order', 'progress',
        ]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail_url:
            return obj.thumbnail_url
        if obj.video_source == 'youtube' and obj.youtube_video_id:
            return f'https://img.youtube.com/vi/{obj.youtube_video_id}/maxresdefault.jpg'
        if obj.bunny_video_id:
            return build_thumbnail_url(obj.bunny_video_id)
        return ''


    def get_is_locked(self, obj):
        if obj.is_free_preview:
            return False
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return True
        return not check_access(request.user, self.context.get('exam_slug', ''), 'can_watch_recordings')

    def get_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        try:
            p = VideoProgress.objects.get(user=request.user, video=obj)
            return {
                'last_position': p.last_position,
                'watched_secs': p.watched_secs,
                'is_completed': p.is_completed,
            }
        except VideoProgress.DoesNotExist:
            return None


class ProgressUpdateSerializer(serializers.Serializer):
    position_secs = serializers.IntegerField(min_value=0)
    watched_secs  = serializers.IntegerField(min_value=0)
    is_completed  = serializers.BooleanField(required=False, default=False)


# ── VIEWS ─────────────────────────────────────────────────────────────────────

class VideoListView(generics.ListAPIView):
    """
    GET /api/v1/content/{exam_slug}/videos/

    Returns all published videos for an exam's active course.
    Unauthenticated users see the list but videos are marked locked.
    """
    serializer_class   = VideoListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        exam_slug = self.kwargs['exam_slug']
        return (
            VideoLibrary.objects
            .filter(
                course__exam__slug=exam_slug,
                course__status='active',
                is_published=True,
            )
            .select_related('module', 'course__exam')
            .order_by('sort_order', 'created_at')
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['exam_slug'] = self.kwargs['exam_slug']
        return ctx

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True, context=self.get_serializer_context())
        # Group by module for the player sidebar
        grouped = {}
        for video in serializer.data:
            key = video['module_title'] or 'General'
            grouped.setdefault(key, []).append(video)
        return Response({'videos': serializer.data, 'grouped': grouped})


class StreamURLView(AccessGateMixin, APIView):
    """
    GET /api/v1/content/videos/{bunny_video_id}/stream/

    Returns a signed Bunny Stream URL valid for 1 hour.
    Access gated by can_watch_recordings — unless free preview.
    """
    permission_classes = [IsAuthenticated]
    required_access_flag = 'can_watch_recordings'

    def get(self, request, bunny_video_id):
        video = self._get_video(bunny_video_id)
        if not video:
            return Response({'error': {'message': 'Video not found.'}}, status=404)

        # Free preview bypasses access check
        if not video.is_free_preview:
            exam_slug = video.course.exam.slug
            if not self.check_exam_access(request, exam_slug):
                return self.access_denied_response('can_watch_recordings')

        signed_url = generate_signed_url(
            video_id=bunny_video_id,
            user_id=request.user.id,
            expires_in=3600,
        )

        return Response({
            'stream_url':  signed_url,
            'video_id':    bunny_video_id,
            'title':       video.title,
            'duration_secs': video.duration_secs,
            'has_notes':   hasattr(video, 'transcript') and bool(video.transcript.ai_notes),
        })

    def _get_video(self, bunny_video_id):
        try:
            return VideoLibrary.objects.select_related(
                'course__exam', 'transcript'
            ).get(bunny_video_id=bunny_video_id, is_published=True)
        except VideoLibrary.DoesNotExist:
            return None


class ProgressView(APIView):
    """
    POST /api/v1/content/videos/{bunny_video_id}/progress/

    Upserts the watch position for the authenticated user.
    Called every 15 seconds by the video player.
    """
    permission_classes = [IsAuthenticated]

    class ProgressThrottle(UserRateThrottle):
        scope = 'video_progress'
        rate  = '200/hour'

    throttle_classes = [ProgressThrottle]

    def post(self, request, bunny_video_id):
        try:
            video = VideoLibrary.objects.get(bunny_video_id=bunny_video_id)
        except VideoLibrary.DoesNotExist:
            return Response(status=404)

        serializer = ProgressUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        progress, _ = VideoProgress.objects.update_or_create(
            user=request.user,
            video=video,
            defaults={
                'last_position': d['position_secs'],
                'watched_secs':  d['watched_secs'],
                'is_completed':  d.get('is_completed', False),
            }
        )

        return Response({'saved': True, 'is_completed': progress.is_completed})


class AINotesView(AccessGateMixin, APIView):
    """
    GET /api/v1/content/videos/{bunny_video_id}/notes/

    Returns AI-generated study notes for a video.
    Same access gate as stream URL.
    """
    permission_classes = [IsAuthenticated]
    required_access_flag = 'can_watch_recordings'

    def get(self, request, bunny_video_id):
        try:
            video = VideoLibrary.objects.select_related(
                'course__exam', 'transcript'
            ).get(bunny_video_id=bunny_video_id, is_published=True)
        except VideoLibrary.DoesNotExist:
            return Response(status=404)

        if not video.is_free_preview:
            if not self.check_exam_access(request, video.course.exam.slug):
                return self.access_denied_response('can_watch_recordings')

        try:
            transcript = video.transcript
            return Response({
                'video_id':         bunny_video_id,
                'title':            video.title,
                'ai_notes':         transcript.ai_notes,
                'raw_transcript':   transcript.raw_transcript,
                'notes_status':     transcript.status,
                'word_count':       transcript.word_count,
            })
        except AITranscript.DoesNotExist:
            return Response({
                'video_id':     bunny_video_id,
                'ai_notes':     None,
                'notes_status': 'pending',
            })
