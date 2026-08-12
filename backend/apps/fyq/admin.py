"""
GRADSKOOL — FYQ Django Admin

None of these 4 models were registered before, so the whole FYQ hierarchy
(Section → Category → Topic → Question) was invisible in /admin/ — the
custom admin panel at /admin-panel/fyq is still the primary way to manage
this content day to day, this is the fallback/bulk-edit view via Django
admin itself.
"""
from django.contrib import admin
from .models import FYQSection, FYQCategory, FYQTopic, FYQQuestion


@admin.register(FYQSection)
class FYQSectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'has_categories')
    list_editable = ('order', 'has_categories')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order', 'name')


@admin.register(FYQCategory)
class FYQCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'section', 'order')
    list_filter = ('section',)
    list_editable = ('order',)
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('section', 'order', 'name')


@admin.register(FYQTopic)
class FYQTopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'section', 'category', 'order', 'question_count')
    list_filter = ('section', 'category')
    list_editable = ('order',)
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    ordering = ('section', 'order', 'name')


@admin.register(FYQQuestion)
class FYQQuestionAdmin(admin.ModelAdmin):
    list_display = ('question_number', 'title', 'topic', 'is_published', 'has_video', 'updated_at')
    list_filter = ('is_published', 'topic__section')
    list_editable = ('is_published',)
    search_fields = ('title', 'slug', 'question_number')
    prepopulated_fields = {'slug': ('title',)}
    ordering = ('-question_number',)
    autocomplete_fields = ('topic',)

    @admin.display(boolean=True, description='Video')
    def has_video(self, obj):
        return bool(obj.youtube_url)