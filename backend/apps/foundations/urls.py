from django.urls import path
from .views import (
    PublicFoundationsView, PublicFoundationClassView, PublicFoundationSectionsView,
    AdminFoundationSeriesListView, AdminFoundationSeriesDetailView,
    AdminFoundationSectionListView, AdminFoundationSectionDetailView,
    AdminFoundationClassListView, AdminFoundationClassDetailView,
)

# Public routes — wired into main urls.py under /api/v1/foundations/
public_urlpatterns = [
    path('',                  PublicFoundationsView.as_view(),     name='foundations-list'),
    path('class/<slug:slug>/',PublicFoundationClassView.as_view(),  name='foundations-class'),
    path('sections/',         PublicFoundationSectionsView.as_view(), name='foundations-sections'),
]

# Standard name so this module can use the same include('apps.foundations.urls',
# namespace='foundations') pattern every other app in this codebase uses.
urlpatterns = public_urlpatterns
app_name = 'foundations'

# Admin routes — wired into dashboard urls.py under /api/v1/dashboard/foundations/
admin_urlpatterns = [
    path('series/',          AdminFoundationSeriesListView.as_view(),    name='admin-series-list'),
    path('series/<int:pk>/', AdminFoundationSeriesDetailView.as_view(),  name='admin-series-detail'),
    path('sections/',          AdminFoundationSectionListView.as_view(),   name='admin-section-list'),
    path('sections/<int:pk>/', AdminFoundationSectionDetailView.as_view(), name='admin-section-detail'),
    path('classes/',         AdminFoundationClassListView.as_view(),     name='admin-class-list'),
    path('classes/<int:pk>/',AdminFoundationClassDetailView.as_view(),   name='admin-class-detail'),
]