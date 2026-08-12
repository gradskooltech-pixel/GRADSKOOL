"""
GRADSKOOL — Foundations Django Admin

Neither model was registered before, so Foundation Series and Foundation
Classes were invisible in /admin/ — the custom admin panel at
/admin-panel/foundations is still the primary way to manage this content
day to day, this is the fallback/bulk-edit view via Django admin itself.
"""
from django.contrib import admin
from .models import FoundationSeries, FoundationClass


class FoundationClassInline(admin.TabularInline):
    model = FoundationClass
    extra = 0
    fields = ('lesson_number', 'title', 'scheduled_at', 'youtube_url', 'is_published')
    ordering = ('lesson_number',)
    show_change_link = True


@admin.register(FoundationSeries)
class FoundationSeriesAdmin(admin.ModelAdmin):
    list_display = ('title', 'exams_display', 'is_active', 'order', 'created_at')
    list_filter = ('is_active',)
    list_editable = ('order', 'is_active')
    search_fields = ('title',)
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('order', 'created_at')
    inlines = [FoundationClassInline]

    @admin.display(description='Exams')
    def exams_display(self, obj):
        return ', '.join(e.upper() for e in (obj.exams or [])) or '—'


@admin.register(FoundationClass)
class FoundationClassAdmin(admin.ModelAdmin):
    list_display = ('lesson_number', 'title', 'series', 'scheduled_at', 'is_upcoming', 'has_recording', 'is_published')
    list_filter = ('series', 'is_published')
    list_editable = ('is_published',)
    search_fields = ('title', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('series', 'lesson_number')
    autocomplete_fields = ('series',)

    @admin.display(boolean=True, description='Upcoming')
    def is_upcoming(self, obj):
        return obj.is_upcoming

    @admin.display(boolean=True, description='Has Recording')
    def has_recording(self, obj):
        return obj.has_recording