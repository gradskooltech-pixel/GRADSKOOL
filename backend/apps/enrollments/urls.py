from django.urls import path
from .views import (
    EnrollmentListView, AccessSummaryView, ExamAccessView,
    StudentProgrammeSettingsView,
)
from apps.dashboard.views import StudentMockCredentialsView

app_name = 'enrollments'

urlpatterns = [
    path('',                          EnrollmentListView.as_view(),          name='list'),
    path('access/',                   AccessSummaryView.as_view(),            name='access-summary'),
    path('access/<slug:exam_slug>/',  ExamAccessView.as_view(),               name='exam-access'),
    path('programme-settings/',       StudentProgrammeSettingsView.as_view(), name='programme-settings'),
    path('mock-credentials/',            StudentMockCredentialsView.as_view(),   name='mock-credentials'),
]
