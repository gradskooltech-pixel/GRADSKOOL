"""
GRADSKOOL — Courses URLs
"""
from django.urls import path
from .views import (
    ExamListView, ExamDetailView, ExamPlansView,
    InstructorListView, InstructorDetailView,
    TestimonialListView, HomepageDataView,
    CohortListView, CohortDetailView,
)

app_name = 'courses'

urlpatterns = [
    # Homepage data
    path('homepage/',                  HomepageDataView.as_view(),     name='homepage'),

    # Exams
    path('exams/',                     ExamListView.as_view(),         name='exam-list'),
    path('exams/<slug:slug>/',         ExamDetailView.as_view(),       name='exam-detail'),
    path('exams/<slug:slug>/plans/',   ExamPlansView.as_view(),        name='exam-plans'),

    # Cohorts
    path('cohorts/',                   CohortListView.as_view(),       name='cohort-list'),
    path('cohorts/<slug:slug>/',       CohortDetailView.as_view(),     name='cohort-detail'),

    # Instructors
    path('instructors/',               InstructorListView.as_view(),   name='instructor-list'),
    path('instructors/<slug:slug>/',   InstructorDetailView.as_view(), name='instructor-detail'),

    # Testimonials
    path('testimonials/',              TestimonialListView.as_view(),  name='testimonial-list'),
]
