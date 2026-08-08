from django.urls import path
from .views import (
    ToolListView, ToolDetailView, LeadGateView,
    QuestionListView, AnswerCheckView,
    PassageListView, PassageDetailView,
    VocabListView, VocabDetailView,
    QATopicListView, QATopicDetailView,
    SessionStartView, SessionSubmitView,
    TagListView,
)

app_name = 'tools'

urlpatterns = [
    # Tool catalogue
    path('',                                     ToolListView.as_view(),         name='list'),
    path('tags/',                                TagListView.as_view(),           name='tag-list'),
    path('<slug:slug>/',                         ToolDetailView.as_view(),        name='detail'),
    path('<slug:slug>/gate/',                    LeadGateView.as_view(),          name='gate'),

    # Questions
    path('<slug:slug>/questions/',               QuestionListView.as_view(),      name='questions'),
    path('<slug:slug>/questions/answer/',        AnswerCheckView.as_view(),       name='answer'),

    # Passage (RC tools)
    path('<slug:slug>/passages/',                PassageListView.as_view(),       name='passages'),
    path('<slug:slug>/passages/<int:pk>/',       PassageDetailView.as_view(),     name='passage-detail'),

    # Vocab (GRE)
    path('<slug:slug>/vocab/',                   VocabListView.as_view(),         name='vocab'),
    path('<slug:slug>/vocab/<int:pk>/',          VocabDetailView.as_view(),       name='vocab-detail'),

    # QA Topics (CAT Maths)
    path('<slug:slug>/qa-topics/',               QATopicListView.as_view(),       name='qa-topics'),
    path('<slug:slug>/qa-topics/<int:pk>/',      QATopicDetailView.as_view(),     name='qa-topic-detail'),

    # Sessions
    path('<slug:slug>/session/start/',           SessionStartView.as_view(),      name='session-start'),
    path('<slug:slug>/session/<int:session_id>/submit/', SessionSubmitView.as_view(), name='session-submit'),
]
