"""
GRADSKOOL — Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.dashboard.seo_views import SitemapView, RobotsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('django-admin/', admin.site.urls),  # alias for convenience

    # SEO — served at root level
    path('sitemap.xml', SitemapView.as_view(), name='sitemap'),
    path('robots.txt',  RobotsView.as_view(),  name='robots'),

    # Social auth (Google OAuth)
    path('social-auth/', include('social_django.urls', namespace='social')),

    # API v1
    path('api/v1/auth/',          include('apps.accounts.urls',         namespace='accounts')),
    path('api/v1/courses/',       include('apps.courses.urls',          namespace='courses')),
    path('api/v1/enrollments/',   include('apps.enrollments.urls',      namespace='enrollments')),
    path('api/v1/payments/',      include('apps.payments.urls',         namespace='payments')),
    path('api/v1/content/',       include('apps.content.urls',          namespace='content')),
    path('api/v1/tools/',         include('apps.tools.urls',            namespace='tools')),
    path('api/v1/blog/',          include('apps.blog.urls',             namespace='blog')),
    path('api/v1/dashboard/',     include('apps.dashboard.urls',        namespace='dashboard')),
    path('api/v1/pages/',         include('apps.dashboard.page_urls',   namespace='pages')),
    path('api/v1/leads/',         include('apps.leads.urls',            namespace='leads')),
    path('api/v1/notifications/', include('apps.notifications.urls',    namespace='notifications')),
    path('api/v1/learn/',         include('apps.learn.urls',             namespace='learn')),
    path('api/v1/foundations/',   include('apps.foundations.urls',       namespace='foundations')),
    path('api/v1/fyq/',           include('apps.fyq.urls',               namespace='fyq')),
    path('api/v1/pdfs/',          include('apps.pdfs.urls',              namespace='pdfs')),
    path('api/v1/admin/',         include('apps.dashboard.admin_views', namespace='admin_analytics')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

admin.site.site_header = 'GRADSKOOL Admin'
admin.site.site_title  = 'GRADSKOOL'
admin.site.index_title = 'Platform Administration'