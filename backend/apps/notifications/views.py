"""
GRADSKOOL — Notifications Views + URLs + Admin

GET  /api/v1/notifications/           → User's notifications (paginated)
GET  /api/v1/notifications/unread-count/ → Just the count for bell badge
POST /api/v1/notifications/mark-read/ → Mark specific IDs as read
POST /api/v1/notifications/mark-all-read/ → Mark all as read
POST /api/v1/notifications/whatsapp-webhook/ → Interakt delivery webhook
"""
from django.urls import path
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import InAppNotification, WhatsAppLog, NotificationTemplate
from .services import get_unread_count, mark_all_read, get_notifications
from .whatsapp import process_interakt_webhook


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = InAppNotification
        fields = [
            'id', 'category', 'title', 'body', 'icon',
            'action_url', 'is_read', 'read_at', 'created_at',
        ]


# ── VIEWS ─────────────────────────────────────────────────────────────────────

class NotificationListView(APIView):
    """GET /api/v1/notifications/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = get_notifications(request.user, limit=30)
        return Response({
            'notifications': NotificationSerializer(notifs, many=True).data,
            'unread_count':  get_unread_count(request.user),
        })


class UnreadCountView(APIView):
    """GET /api/v1/notifications/unread-count/ — lightweight for bell badge polling"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'unread_count': get_unread_count(request.user)})


class MarkReadView(APIView):
    """POST /api/v1/notifications/mark-read/ — Body: { ids: [1,2,3] }"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids', [])
        if ids:
            InAppNotification.objects.filter(
                user=request.user, id__in=ids
            ).update(is_read=True)
        return Response({'marked': len(ids)})


class MarkAllReadView(APIView):
    """POST /api/v1/notifications/mark-all-read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        mark_all_read(request.user)
        return Response({'detail': 'All notifications marked as read.'})


class InteraktWebhookView(APIView):
    """POST /api/v1/notifications/whatsapp-webhook/ — Interakt delivery events"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        try:
            process_interakt_webhook(request.data)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).exception(f'Interakt webhook error: {exc}')
        return Response({'status': 'ok'})


# ── URLS ──────────────────────────────────────────────────────────────────────

urlpatterns = [
    path('',                  NotificationListView.as_view(),  name='list'),
    path('unread-count/',     UnreadCountView.as_view(),        name='unread-count'),
    path('mark-read/',        MarkReadView.as_view(),           name='mark-read'),
    path('mark-all-read/',    MarkAllReadView.as_view(),        name='mark-all-read'),
    path('whatsapp-webhook/', InteraktWebhookView.as_view(),    name='whatsapp-webhook'),
]

app_name = 'notifications'

