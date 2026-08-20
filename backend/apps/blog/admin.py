"""
GRADSKOOL — Blog Admin
"""
from django.contrib import admin
from .models import BlogTag, BlogPost


@admin.register(BlogTag)
class BlogTagAdmin(admin.ModelAdmin):
    list_display        = ['name', 'slug', 'exam']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display        = ['title', 'status', 'is_featured', 'published_at',
                           'view_count', 'read_time_mins']
    list_filter         = ['status', 'is_featured', 'tags']
    search_fields       = ['title', 'excerpt', 'body']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal   = ['tags']
    readonly_fields     = ['view_count', 'read_time_mins', 'created_at', 'updated_at']
    fieldsets = (
        ('Content',    {'fields': ('title', 'slug', 'excerpt', 'body', 'tags', 'author')}),
        ('Publishing', {'fields': ('status', 'is_featured', 'published_at')}),
        # thumbnail_video_url existed on the model (with its own help_text
        # explicitly describing "renders as video thumbnail on blog listing
        # and article hero instead of static image") but was never added to
        # any admin fieldset — genuinely no way to set it from Django admin
        # at all, since Django doesn't render a field for anything not
        # explicitly listed here. Own section rather than tucked into SEO,
        # since it's a content/media choice, not search metadata like the
        # other fields in that group.
        ('Media',      {'fields': ('thumbnail_video_url',),
                        'description': 'Optional — if set, this video shows as the article hero instead of the static OG image below. The OG image is still used for WhatsApp/social link previews either way.'}),
        ('SEO',        {'fields': ('meta_title', 'meta_desc', 'og_image_url'),
                        'classes': ('collapse',)}),
        ('Stats',      {'fields': ('view_count', 'read_time_mins',
                                   'created_at', 'updated_at')}),
    )
    actions = ['publish_selected']

    def publish_selected(self, request, queryset):
        for post in queryset.filter(status='draft'):
            post.status = 'published'
            post.save()
    publish_selected.short_description = 'Publish selected posts'