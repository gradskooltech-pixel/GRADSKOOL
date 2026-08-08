from django.urls import path
from .views import (
    VideoBookmarkView, VideoChapterView, StudentNoteView, VideoTranscriptView,
    WatchSessionView, StudyHeatmapView, CohortComparisonView, MilestoneView,
    AdminContentPerformanceView, AdminBatchHealthView, AdminDropoffHeatmapView,
    ResultsWallView,
    StudentGamificationView, StudentGoalView, SpacedRepetitionView,
    StudyPlanView, MockScoreView, ProgressDetailView, TodaysPlanView,
    AdaptiveQuizView, PortalNotesView, StudentProfileView, BadgeCheckView,
    ZoomSignatureView, ZoomWebhookView,
    RecordingUploadView, RecordingStatusView,
    PortalRecordingsView,
    PortalSectionsView, PortalTopicsView, PortalTopicDetailView,
    PortalPracticeQuizView, TopicSequenceView, WatchProgressView,
    QuizQuestionsView, QuizSubmitView, CheatSheetView,
)

app_name = 'learn'

urlpatterns = [
    # Portal sections
    path('<slug:exam_slug>/sections/',
         PortalSectionsView.as_view(), name='sections'),

    # Portal topics in a section
    path('<slug:exam_slug>/sections/<slug:section_slug>/topics/',
         PortalTopicsView.as_view(), name='topics'),

    # Portal topic detail (videos, quiz, cheatsheet, live)
    path('<slug:exam_slug>/sections/<slug:section_slug>/<slug:topic_slug>/',
         PortalTopicDetailView.as_view(), name='topic-detail'),

    # Practice quiz for a topic (GET questions, POST submit)
    path('<slug:exam_slug>/sections/<slug:section_slug>/<slug:topic_slug>/quiz/',
         PortalPracticeQuizView.as_view(), name='topic-quiz'),

    # Video progress
    path('<slug:exam_slug>/<slug:topic_slug>/sequence/',
         TopicSequenceView.as_view(), name='sequence'),
    path('videos/<str:video_id>/progress/',
         WatchProgressView.as_view(), name='progress'),

    # Per-video quiz (old flow)
    path('quiz/<int:topic_id>/questions/',
         QuizQuestionsView.as_view(), name='quiz-questions'),
    path('quiz/<int:topic_id>/submit/',
         QuizSubmitView.as_view(), name='quiz-submit'),

    # Recordings (live session recordings)
    path('<slug:exam_slug>/recordings/',
         PortalRecordingsView.as_view(), name='recordings'),

    # Zoom signature
    path('live-sessions/<int:session_id>/signature/',
         ZoomSignatureView.as_view(), name='zoom-signature'),

    # Zoom webhook (Zoom calls this when recording is ready)
    path('zoom/webhook/',
         ZoomWebhookView.as_view(), name='zoom-webhook'),

    # Recording management
    path('live-sessions/<int:session_id>/upload-recording/',
         RecordingUploadView.as_view(), name='upload-recording'),
    path('live-sessions/<int:session_id>/recording-status/',
         RecordingStatusView.as_view(), name='recording-status'),

    # Cheat sheet
    path('cheatsheet/<int:topic_id>/',
         CheatSheetView.as_view(), name='cheatsheet'),

    # Gamification
    path('gamification/',                        StudentGamificationView.as_view(), name='gamification'),
    path('goals/',                               StudentGoalView.as_view(),         name='goals'),
    path('goals/<int:goal_id>/',                 StudentGoalView.as_view(),         name='goal-delete'),
    path('spaced-rep/',                          SpacedRepetitionView.as_view(),    name='spaced-rep'),
    path('check-badges/',                        BadgeCheckView.as_view(),          name='check-badges'),
    path('profile/',                             StudentProfileView.as_view(),      name='student-profile'),

    # Adaptive quiz per exam
    path('<slug:exam_slug>/adaptive-quiz/',       AdaptiveQuizView.as_view(),        name='adaptive-quiz'),

    # Notes / resources per exam
    path('<slug:exam_slug>/notes/',              PortalNotesView.as_view(),         name='portal-notes'),

    # Video features
    path('videos/<int:topic_video_id>/bookmarks/',           VideoBookmarkView.as_view(), name='bookmarks'),
    path('videos/<int:topic_video_id>/bookmarks/<int:bookmark_id>/', VideoBookmarkView.as_view(), name='bookmark-delete'),
    path('videos/<int:topic_video_id>/chapters/',            VideoChapterView.as_view(), name='chapters'),
    path('videos/<int:topic_video_id>/transcript/',          VideoTranscriptView.as_view(), name='transcript'),

    # Student notes
    path('notes/',                                           StudentNoteView.as_view(), name='student-notes'),

    # Watch session (engagement tracking)
    path('watch-session/',                                   WatchSessionView.as_view(), name='watch-session'),

    # Study heatmap + cohort
    path('study-heatmap/',                                   StudyHeatmapView.as_view(), name='study-heatmap'),
    path('cohort-comparison/',                               CohortComparisonView.as_view(), name='cohort-comparison'),

    # Milestones
    path('milestones/',                                      MilestoneView.as_view(), name='milestones'),

    # Public results wall
    path('results-wall/',                                    ResultsWallView.as_view(), name='results-wall'),

    # Admin analytics
    path('admin/content-performance/',                       AdminContentPerformanceView.as_view(), name='content-performance'),
    path('admin/batch-health/',                              AdminBatchHealthView.as_view(), name='batch-health'),
    path('admin/dropoff-heatmap/',                           AdminDropoffHeatmapView.as_view(), name='dropoff-heatmap'),

    path('study-plan/',     StudyPlanView.as_view(),      name='study-plan'),
    path('study-plan/<int:plan_id>/', StudyPlanView.as_view(), name='study-plan-detail'),

    path('mock-scores/',               MockScoreView.as_view(),       name='mock-scores'),
    path('mock-scores/<int:score_id>/',MockScoreView.as_view(),       name='mock-score-detail'),
    path('progress-detail/',           ProgressDetailView.as_view(),  name='progress-detail'),
    path('todays-plan/',               TodaysPlanView.as_view(),      name='todays-plan'),
]
