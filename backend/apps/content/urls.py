from django.urls import path
from .views import VideoListView, StreamURLView, ProgressView, AINotesView

app_name = 'content'

urlpatterns = [
    # Video list for an exam
    path('<slug:exam_slug>/videos/',                           VideoListView.as_view(),  name='video-list'),
    # Per-video endpoints
    path('videos/<str:bunny_video_id>/stream/',                StreamURLView.as_view(),  name='stream-url'),
    path('videos/<str:bunny_video_id>/progress/',              ProgressView.as_view(),   name='progress'),
    path('videos/<str:bunny_video_id>/notes/',                 AINotesView.as_view(),    name='ai-notes'),
]
