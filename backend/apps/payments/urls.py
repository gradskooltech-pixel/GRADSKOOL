from django.urls import path
from .views import (
    CreateOrderView, VerifyPaymentView, RazorpayWebhookView,
    OrderListView, OrderDetailView,
)

app_name = 'payments'

urlpatterns = [
    path('create-order/', CreateOrderView.as_view(),    name='create-order'),
    path('verify/',       VerifyPaymentView.as_view(),  name='verify'),
    path('webhook/',      RazorpayWebhookView.as_view(), name='webhook'),
    path('orders/',       OrderListView.as_view(),      name='order-list'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
