from django.urls import path
from .views import DynamicPagePublicView

app_name = 'pages'

urlpatterns = [
    path('<slug:slug>/', DynamicPagePublicView.as_view(), name='page-detail'),
]
