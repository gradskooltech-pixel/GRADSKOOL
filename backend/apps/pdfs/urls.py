from django.urls import path
from . import views, admin_views

app_name = 'pdfs'

urlpatterns = [
    # ── Public ───────────────────────────────────────────────────────────────
    path('', views.PdfListView.as_view(), name='list'),
    path('my-library/', views.MyPdfLibraryView.as_view(), name='my-library'),
    path('bundle/order/', views.CreatePdfBundleOrderView.as_view(), name='create-bundle-order'),
    path('verify/', views.VerifyPdfPaymentView.as_view(), name='verify'),
    path('webhook/', views.PdfWebhookView.as_view(), name='webhook'),

    # ── Admin (kept namespaced under /pdfs/admin/ so this app is self-contained) ─
    path('admin/pdfs/', admin_views.AdminPdfListCreateView.as_view(), name='admin-list'),
    path('admin/pdfs/reorder/', admin_views.AdminPdfReorderView.as_view(), name='admin-reorder'),
    path('admin/pdfs/<int:pk>/', admin_views.AdminPdfDetailView.as_view(), name='admin-detail'),
    path('admin/pdfs/<int:pk>/pages/', admin_views.AdminPdfPageUploadView.as_view(), name='admin-page-upload'),
    path('admin/pdfs/<int:pk>/finalize/', admin_views.AdminPdfFinalizeView.as_view(), name='admin-finalize'),

    # ── Public detail routes (kept last — <slug:slug> would otherwise swallow 'admin') ─
    path('<slug:slug>/', views.PdfDetailView.as_view(), name='detail'),
    path('<slug:slug>/preview/', views.PdfPreviewView.as_view(), name='preview'),
    path('<slug:slug>/pages/<int:page_number>/', views.PdfPageView.as_view(), name='page'),
    path('<slug:slug>/create-order/', views.CreatePdfOrderView.as_view(), name='create-order'),
    path('<slug:slug>/claim-free/', views.ClaimFreePdfView.as_view(), name='claim-free'),
]
