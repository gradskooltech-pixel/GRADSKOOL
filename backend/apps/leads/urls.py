from django.urls import path
from .views import (
    LeadCaptureView,
    UnsubscribeView,
    ResendWebhookView,
    LeadAnalyticsView,
    LeadListView,
    LeadDetailView,
    LeadEnrollSequenceView,
    LeadAddNoteView,
)

app_name = 'leads'

urlpatterns = [
    # Public
    path('capture/',          LeadCaptureView.as_view(),    name='capture'),
    path('unsubscribe/',      UnsubscribeView.as_view(),    name='unsubscribe'),
    path('resend-webhook/',   ResendWebhookView.as_view(),  name='resend-webhook'),

    # Admin
    path('analytics/',        LeadAnalyticsView.as_view(),  name='analytics'),
    path('',                  LeadListView.as_view(),        name='list'),
    path('<int:pk>/',         LeadDetailView.as_view(),      name='detail'),
    path('<int:pk>/enroll/',  LeadEnrollSequenceView.as_view(), name='enroll'),
    path('<int:pk>/note/',    LeadAddNoteView.as_view(),     name='add-note'),
]
