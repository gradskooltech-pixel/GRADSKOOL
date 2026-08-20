from django.urls import path, include
from .admin_views import (
    AdminOverviewView, AdminRevenueView, AdminCohortView,
    AdminToolsAnalyticsView, AdminNotificationsAnalyticsView,
)
from .seo_views import SitemapView, RobotsView
from apps.foundations.urls import admin_urlpatterns as foundation_admin_urls
from apps.fyq.urls import admin_urlpatterns as fyq_admin_urls
from .views import (
    AdminStudentListView, AdminEnrollmentListView,
    AdminEnrollmentActionView, AdminEnrolView, AdminOrderListView,
    AdminProgrammeListView, AdminProgrammeSettingsView,
    AdminExamCohortSizeView,
    AdminToolListView, AdminToolQuestionsView, AdminToolQuestionDetailView,
    AdminBlogPostListView, AdminBlogPostDetailView, AdminBlogImageUploadView,
    AdminBlogMarkdownImportView,
    AdminIndexNowResubmitView,
    AdminSiteSettingsView,
    AdminFAQListView, AdminFAQDetailView,
    AdminMockScheduleView, AdminMockScheduleDetailView,
    AdminTestimonialListView, AdminTestimonialDetailView,
    AdminExamListView, AdminExamDetailView,
    AdminHomepageContentView,
    AdminManualEnrollView, AdminListPlansView,
    DynamicPageListView, DynamicPageDetailView, DynamicPagePublicView,
    AdminMockCredentialListView, AdminMockCredentialDetailView,
    StudentMockCredentialsView,
    AdminResultsView, PublicResultsView, PublicResultDetailView, QuestionBankView, QuestionBulkUpdateView,
    AdminStudentPasswordResetView, AdminStudentSuspendView,
    AdminQuizAnalyticsView, AdminNudgeView,
    VideoQuizQuestionsView, CheatSheetManageView,
    CourseBuilderView, CourseComponentView, CourseListView,
    VideoLibraryView, AttachVideoToTopicView,
    AdminCurriculumView, AdminSectionView, AdminTopicView,
    AdminVideoView, AdminQuizQuestionView, AdminCheatSheetView,
    AdminStudentDetailView, AdminBulkEnrollView,
    AdminLiveSessionListView, AdminLiveSessionDetailView,
    AdminCouponListView, AdminAnnouncementView, AdminAnalyticsView,
    DashboardSummaryView, PerformanceTrendView, RecentActivityView,
)

app_name = 'dashboard'

urlpatterns = [
    # Analytics
    path('overview/',      AdminOverviewView.as_view(),              name='overview'),
    path('revenue/',       AdminRevenueView.as_view(),               name='revenue'),
    path('cohorts/',       AdminCohortView.as_view(),                name='cohorts'),
    path('tools/',         AdminToolsAnalyticsView.as_view(),        name='tools'),
    path('notifications/', AdminNotificationsAnalyticsView.as_view(),name='notifications'),
    # SEO
    path('sitemap.xml',    SitemapView.as_view(),                    name='sitemap'),
    path('robots.txt',     RobotsView.as_view(),                     name='robots'),
    # Students & Enrollments
    path('students/',      AdminStudentListView.as_view(),           name='admin-students'),
    path('enrollments/',   AdminEnrollmentListView.as_view(),        name='admin-enrollments'),
    path('enrollments/<int:pk>/<str:action>/',
         AdminEnrollmentActionView.as_view(),      name='admin-enrollment-action'),
    path('admin-enrol/',   AdminEnrolView.as_view(),                 name='admin-enrol'),
    path('orders/',        AdminOrderListView.as_view(),             name='admin-orders'),
    # Programmes & Cohorts
    path('programmes/',    AdminProgrammeListView.as_view(),         name='admin-programmes'),
    path('programmes/plan/<int:plan_id>/',
         AdminProgrammeSettingsView.as_view(),     name='admin-programme-settings'),
    path('programmes/exam/<int:exam_id>/cohort-size/',
         AdminExamCohortSizeView.as_view(),        name='admin-cohort-size'),
    # Tools management
    path('tools-admin/',                              AdminToolListView.as_view(),            name='admin-tools-list'),
    path('tools-admin/<int:tool_id>/questions/',      AdminToolQuestionsView.as_view(),       name='admin-tool-questions'),
    path('tools-admin/questions/<int:q_id>/',         AdminToolQuestionDetailView.as_view(),  name='admin-tool-question-detail'),
    # Blog management
    path('blog/',                                     AdminBlogPostListView.as_view(),        name='admin-blog-list'),
    path('blog/upload-image/',                        AdminBlogImageUploadView.as_view(),     name='admin-blog-upload'),
    path('blog/import-markdown/',                      AdminBlogMarkdownImportView.as_view(),  name='admin-blog-import-md'),
    path('indexnow/resubmit/',                         AdminIndexNowResubmitView.as_view(),    name='admin-indexnow-resubmit'),
    path('blog/<slug:slug>/',                         AdminBlogPostDetailView.as_view(),      name='admin-blog-detail'),

    # Site settings
    path('site-settings/',                        AdminSiteSettingsView.as_view(),          name='admin-site-settings'),
    # FAQs
    path('faqs/',                                 AdminFAQListView.as_view(),               name='admin-faq-list'),
    path('faqs/<int:faq_id>/',                    AdminFAQDetailView.as_view(),             name='admin-faq-detail'),
    # Mock schedule
    path('mock-schedule/',                        AdminMockScheduleView.as_view(),          name='admin-mock-schedule'),
    path('mock-schedule/<int:entry_id>/',         AdminMockScheduleDetailView.as_view(),    name='admin-mock-schedule-detail'),
    # Testimonials
    path('testimonials/',                         AdminTestimonialListView.as_view(),       name='admin-testimonials'),
    path('testimonials/<int:t_id>/',              AdminTestimonialDetailView.as_view(),     name='admin-testimonial-detail'),
    # Exams
    path('exams/',                                AdminExamListView.as_view(),              name='admin-exam-list'),
    path('exams/<slug:slug>/',                    AdminExamDetailView.as_view(),            name='admin-exam-detail'),
    # Homepage content
    path('homepage-content/',                     AdminHomepageContentView.as_view(),       name='admin-homepage-content'),

    # Dynamic pages
    path('pages/',               DynamicPageListView.as_view(),   name='admin-pages-list'),
    path('pages/<slug:slug>/',   DynamicPageDetailView.as_view(), name='admin-pages-detail'),

    path('manual-enroll/',   AdminManualEnrollView.as_view(), name='admin-manual-enroll'),
    path('plans/',           AdminListPlansView.as_view(),    name='admin-plans-list'),

    # Mock credentials
    path('mock-credentials/',            AdminMockCredentialListView.as_view(),   name='admin-mock-creds'),
    path('mock-credentials/<int:cred_id>/', AdminMockCredentialDetailView.as_view(), name='admin-mock-cred-detail'),

    # Student dashboard data endpoints
    path('summary/',     DashboardSummaryView.as_view(),   name='dashboard-summary'),
    path('performance/', PerformanceTrendView.as_view(),   name='dashboard-performance'),
    path('activity/',    RecentActivityView.as_view(),     name='dashboard-activity'),

    # Curriculum management
    path('curriculum/',                              AdminCurriculumView.as_view(),      name='curriculum'),
    path('curriculum/sections/',                     AdminSectionView.as_view(),          name='section-create'),
    path('curriculum/sections/<int:section_id>/',    AdminSectionView.as_view(),          name='section-detail'),
    path('curriculum/topics/',                       AdminTopicView.as_view(),            name='topic-create'),
    path('curriculum/topics/<int:topic_id>/',        AdminTopicView.as_view(),            name='topic-detail'),
    path('curriculum/videos/',                       AdminVideoView.as_view(),            name='video-create'),
    path('curriculum/videos/<int:video_id>/',        AdminVideoView.as_view(),            name='video-detail'),
    path('curriculum/videos/<int:video_id>/quiz/',   AdminQuizQuestionView.as_view(),     name='video-quiz'),
    path('curriculum/videos/<int:video_id>/quiz/<int:question_id>/', AdminQuizQuestionView.as_view(), name='video-quiz-delete'),
    path('curriculum/videos/<int:video_id>/cheatsheet/', AdminCheatSheetView.as_view(),   name='video-cheatsheet'),

    # Student detail
    path('students/<int:pk>/',                AdminStudentDetailView.as_view(),   name='student-detail'),

    # Bulk enrollment
    path('bulk-enroll/',                       AdminBulkEnrollView.as_view(),      name='bulk-enroll'),

    # Live sessions
    path('live-sessions/',                     AdminLiveSessionListView.as_view(), name='live-sessions'),
    path('live-sessions/<int:session_id>/',    AdminLiveSessionDetailView.as_view(), name='live-session-detail'),

    # Coupons
    path('coupons/',                           AdminCouponListView.as_view(),      name='coupons'),
    path('coupons/<str:coupon_id>/',           AdminCouponListView.as_view(),      name='coupon-delete'),

    # Announcement
    path('announcement/',                      AdminAnnouncementView.as_view(),    name='announcement'),

    # Analytics
    path('analytics/',                         AdminAnalyticsView.as_view(),       name='analytics'),

    # Course builder
    path('courses/',                                          CourseListView.as_view(),        name='course-list'),
    path('course-builder/<int:course_id>/',                  CourseBuilderView.as_view(),      name='course-builder'),
    path('course-builder/<int:course_id>/components/',       CourseComponentView.as_view(),    name='course-components'),
    path('course-builder/<int:course_id>/components/<int:component_id>/', CourseComponentView.as_view(), name='course-component-detail'),

    # Video library (reusable videos)
    path('video-library/',                            VideoLibraryView.as_view(),        name='video-library'),
    path('video-library/<int:video_id>/',             VideoLibraryView.as_view(),        name='video-library-detail'),
    path('video-library/<int:video_id>/attach/',      AttachVideoToTopicView.as_view(),  name='attach-video'),

    path('results-wall/',                    AdminResultsView.as_view(), name='results-wall'),
    path('results-wall/<int:result_id>/',     AdminResultsView.as_view(), name='result-detail'),
    path('results-wall/public/',              PublicResultsView.as_view(), name='results-wall-public'),
    path('results-wall/public/<slug:slug>/',  PublicResultDetailView.as_view(), name='results-wall-public-detail'),

    path('questions/',                        QuestionBankView.as_view(),        name='question-bank'),
    path('questions/<int:question_id>/',      QuestionBankView.as_view(),        name='question-detail'),
    path('questions/bulk-update/',            QuestionBulkUpdateView.as_view(),  name='question-bulk'),

    # Quiz questions per video (full CRUD)
    path('curriculum/videos/<int:video_id>/quiz/',
         VideoQuizQuestionsView.as_view(),           name='video-quiz-questions'),
    path('curriculum/videos/<int:video_id>/quiz/<int:question_id>/',
         VideoQuizQuestionsView.as_view(),           name='video-quiz-question-detail'),
    path('curriculum/videos/<int:video_id>/quiz/attach/<int:question_id>/',
         VideoQuizQuestionsView.as_view(),           name='video-quiz-attach'),

    # Cheat sheet (text + PDF files)
    path('curriculum/videos/<int:video_id>/cheatsheet/',
         CheatSheetManageView.as_view(),             name='video-cheatsheet'),
    path('curriculum/videos/<int:video_id>/cheatsheet/file/',
         CheatSheetManageView.as_view(),             name='video-cheatsheet-file'),
    path('curriculum/videos/<int:video_id>/cheatsheet/file/<int:file_id>/',
         CheatSheetManageView.as_view(),             name='video-cheatsheet-file-delete'),

    path('quiz-analytics/',    AdminQuizAnalyticsView.as_view(), name='quiz-analytics'),
    path('nudge/',             AdminNudgeView.as_view(),         name='admin-nudge'),

    path('students/<int:pk>/reset-password/', AdminStudentPasswordResetView.as_view(), name='student-reset-pw'),
    path('students/<int:pk>/suspend/',        AdminStudentSuspendView.as_view(),        name='student-suspend'),

    # Foundations (was imported above but never actually wired in — this is the fix)
    path('foundations/', include(foundation_admin_urls)),

    # FYQ — Future Year Questions
    path('fyq/', include(fyq_admin_urls)),
]