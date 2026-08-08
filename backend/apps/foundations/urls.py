from django.urls import path
from .views import (
    PublicFoundationsView, PublicFoundationClassView,
    AdminFoundationSeriesListView, AdminFoundationSeriesDetailView,
    AdminFoundationClassListView, AdminFoundationClassDetailView,
)

# Public routes — wired into main urls.py under /api/v1/foundations/
public_urlpatterns = [
    path('',                  PublicFoundationsView.as_view(),     name='foundations-list'),
    path('class/<slug:slug>/',PublicFoundationClassView.as_view(),  name='foundations-class'),
]

# Standard name so this module can use the same include('apps.foundations.urls',
# namespace='foundations') pattern every other app in this codebase uses.
urlpatterns = public_urlpatterns
app_name = 'foundations'

# Admin routes — wired into dashboard urls.py under /api/v1/dashboard/foundations/
admin_urlpatterns = [
    path('series/',          AdminFoundationSeriesListView.as_view(),    name='admin-series-list'),
    path('series/<int:pk>/', AdminFoundationSeriesDetailView.as_view(),  name='admin-series-detail'),
    path('classes/',         AdminFoundationClassListView.as_view(),     name='admin-class-list'),
    path('classes/<int:pk>/',AdminFoundationClassDetailView.as_view(),   name='admin-class-detail'),
]