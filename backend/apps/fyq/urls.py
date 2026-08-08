from django.urls import path
from .views import (
    PublicFYQTreeView, PublicFYQListView, PublicFYQDetailView,
    AdminFYQSectionListView, AdminFYQSectionDetailView,
    AdminFYQCategoryListView, AdminFYQCategoryDetailView,
    AdminFYQTopicListView, AdminFYQTopicDetailView,
    AdminFYQListView, AdminFYQDetailView,
)

# Public routes — wired into main urls.py under /api/v1/fyq/
public_urlpatterns = [
    path('',                      PublicFYQListView.as_view(),   name='fyq-list'),
    path('tree/',                 PublicFYQTreeView.as_view(),   name='fyq-tree'),
    path('question/<slug:slug>/', PublicFYQDetailView.as_view(), name='fyq-detail'),
]

urlpatterns = public_urlpatterns
app_name = 'fyq'

# Admin routes — wired into dashboard urls.py under /api/v1/dashboard/fyq/
admin_urlpatterns = [
    path('sections/',            AdminFYQSectionListView.as_view(),   name='admin-fyq-section-list'),
    path('sections/<int:pk>/',   AdminFYQSectionDetailView.as_view(), name='admin-fyq-section-detail'),
    path('categories/',          AdminFYQCategoryListView.as_view(),   name='admin-fyq-category-list'),
    path('categories/<int:pk>/', AdminFYQCategoryDetailView.as_view(), name='admin-fyq-category-detail'),
    path('topics/',              AdminFYQTopicListView.as_view(),   name='admin-fyq-topic-list'),
    path('topics/<int:pk>/',     AdminFYQTopicDetailView.as_view(), name='admin-fyq-topic-detail'),
    path('questions/',           AdminFYQListView.as_view(),   name='admin-fyq-list'),
    path('questions/<int:pk>/',  AdminFYQDetailView.as_view(), name='admin-fyq-detail'),
]