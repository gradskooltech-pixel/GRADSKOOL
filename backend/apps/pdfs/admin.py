from django.contrib import admin
from .models import Pdf, PdfPage, PdfPurchase


class PdfPageInline(admin.TabularInline):
    model = PdfPage
    extra = 0
    fields = ['page_number', 'storage_path', 'width', 'height']


@admin.register(Pdf)
class PdfAdmin(admin.ModelAdmin):
    list_display = ['title', 'exam', 'price_inr', 'is_free', 'status', 'is_published', 'page_count']
    list_filter = ['status', 'is_published', 'is_free', 'exam']
    search_fields = ['title', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [PdfPageInline]


@admin.register(PdfPurchase)
class PdfPurchaseAdmin(admin.ModelAdmin):
    list_display = ['user', 'pdf', 'amount_inr', 'phone_captured', 'status', 'created_at', 'paid_at']
    list_filter = ['status']
    search_fields = ['user__email', 'pdf__title', 'phone_captured']
