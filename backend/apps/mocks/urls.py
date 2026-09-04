from django.urls import path

from . import admin_views as av
from . import student_views as sv

app_name = 'mocks'

# Student routes — wired into main urls.py under /api/v1/mocks/
urlpatterns = [
    path('my-attempts/',                     sv.MockMyAttemptsView.as_view(),      name='my-attempts'),
    path('attempts/start/',                  sv.MockAttemptStartView.as_view(),    name='attempt-start'),
    path('attempts/<int:attempt_id>/',       sv.MockAttemptDetailView.as_view(),   name='attempt-detail'),
    path('attempts/<int:attempt_id>/answer/', sv.MockAttemptAnswerView.as_view(),  name='attempt-answer'),
    path('attempts/<int:attempt_id>/submit/', sv.MockAttemptSubmitView.as_view(),  name='attempt-submit'),
    path('attempts/<int:attempt_id>/result/', sv.MockAttemptResultView.as_view(),  name='attempt-result'),
    path('<slug:exam_slug>/',                sv.MockTestHubView.as_view(),         name='test-hub'),
]

# Admin routes — wired into dashboard urls.py under /api/v1/dashboard/mocks/
admin_urlpatterns = [
    path('papers/',                          av.AdminMockPaperListView.as_view(),      name='admin-paper-list'),
    path('papers/<int:pk>/',                 av.AdminMockPaperDetailView.as_view(),    name='admin-paper-detail'),
    path('papers/<int:paper_pk>/sections/',  av.AdminMockSectionListView.as_view(),    name='admin-section-list'),
    path('sections/<int:pk>/',               av.AdminMockSectionDetailView.as_view(),  name='admin-section-detail'),
    path('sections/<int:section_pk>/questions/',        av.AdminMockQuestionManageView.as_view(), name='admin-question-manage'),
    path('sections/<int:section_pk>/questions/add/',    av.AdminMockQuestionAddView.as_view(),    name='admin-question-add'),
    path('sections/<int:section_pk>/paste-split/',      av.AdminMockPasteSplitView.as_view(),     name='admin-paste-split'),
    path('questions/<int:pk>/',              av.AdminMockQuestionDetailView.as_view(), name='admin-question-detail'),
    path('topics/',                          av.AdminMockTopicListView.as_view(),      name='admin-topic-list'),
    path('topics/<int:pk>/',                 av.AdminMockTopicDetailView.as_view(),    name='admin-topic-detail'),
    path('topics/<int:topic_pk>/questions/',        av.AdminMockTopicQuestionManageView.as_view(), name='admin-topic-question-manage'),
    path('topics/<int:topic_pk>/questions/add/',    av.AdminMockTopicQuestionAddView.as_view(),    name='admin-topic-question-add'),
    path('topics/<int:topic_pk>/paste-split/',      av.AdminMockTopicPasteSplitView.as_view(),     name='admin-topic-paste-split'),
    path('attempts/',                        av.AdminMockAttemptListView.as_view(),    name='admin-attempt-list'),
]
