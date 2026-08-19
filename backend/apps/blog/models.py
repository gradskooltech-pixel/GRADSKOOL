"""
GRADSKOOL — Blog Models + Serializers + Views + URLs

Models:
  BlogTag     → Exam-linked tags (CAT, GMAT, Strategy, Placements…)
  BlogPost    → Full article with Markdown body, SEO fields, author

Serializers:
  BlogTagSerializer
  BlogPostListSerializer  → Card view (no body)
  BlogPostDetailSerializer → Full article

Views:
  GET /api/v1/blog/posts/           → Paginated + tag filter
  GET /api/v1/blog/posts/{slug}/    → Single post
  GET /api/v1/blog/tags/            → All tags
  GET /api/v1/blog/featured/        → Featured posts (homepage)
"""
import math
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from shared.utils import sanitize_html
from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.urls import path


# ── MODELS ────────────────────────────────────────────────────────────────────

class BlogTag(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(unique=True, max_length=60)
    exam = models.ForeignKey(
        'courses.Exam', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='blog_tags'
    )

    class Meta:
        db_table = 'blog_tags'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    STATUS = [('draft', 'Draft'), ('published', 'Published')]

    slug          = models.SlugField(unique=True, max_length=200)
    title         = models.CharField(max_length=200)
    excerpt       = models.CharField(max_length=400)
    body          = models.TextField(help_text='Rich HTML from the Quill admin editor (sanitized on save — see save())')
    tags          = models.ManyToManyField(BlogTag, blank=True, related_name='posts')
    author        = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='blog_posts'
    )
    og_image_url        = models.URLField(blank=True,
                                          help_text='Paste Bunny CDN image URL — shown as article header and OG share image')
    thumbnail_video_url = models.URLField(blank=True,
                                          help_text='Optional YouTube or Bunny Stream URL — renders as video thumbnail on blog listing and article hero instead of static image')
    meta_title    = models.CharField(max_length=160, blank=True)
    meta_desc     = models.CharField(max_length=320, blank=True)
    status        = models.CharField(max_length=20, choices=STATUS, default='draft')
    is_featured   = models.BooleanField(default=False)
    published_at  = models.DateTimeField(null=True, blank=True)
    read_time_mins = models.IntegerField(null=True, blank=True)
    view_count    = models.IntegerField(default=0)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'blog_posts'
        ordering = ['-published_at', '-created_at']
        indexes  = [
            models.Index(fields=['status', '-published_at']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        # Rich HTML from the Quill admin editor, rendered raw via
        # dangerouslySetInnerHTML on the public post page (pages/blog/
        # [slug].jsx) — same pattern as FoundationSeries/FoundationClass/
        # FYQQuestion/QATopic, sanitized there earlier; missed here at the
        # time since this field's stale help_text ("Markdown supported")
        # made it look like plain markdown text, not raw HTML, until the
        # rendering bug that prompted this fix confirmed otherwise.
        self.body = sanitize_html(self.body)
        if self.body and not self.read_time_mins:
            word_count = len(self.body.split())
            self.read_time_mins = max(1, math.ceil(word_count / 200))
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)


# ── SERIALIZERS ───────────────────────────────────────────────────────────────

class BlogTagSerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model  = BlogTag
        fields = ['id', 'name', 'slug', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()


class AuthorSerializer(serializers.Serializer):
    full_name  = serializers.SerializerMethodField()
    avatar_url = serializers.URLField()

    def get_full_name(self, obj):
        return obj.get_full_name() if obj else ''


class BlogPostListSerializer(serializers.ModelSerializer):
    tags        = BlogTagSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model  = BlogPost
        fields = [
            'id', 'slug', 'title', 'excerpt', 'tags',
            'og_image_url', 'published_at', 'read_time_mins',
            'author_name', 'is_featured',
        ]

    def get_author_name(self, obj):
        return obj.author.get_full_name() if obj.author else 'GRADSKOOL Team'


class BlogPostDetailSerializer(BlogPostListSerializer):
    class Meta(BlogPostListSerializer.Meta):
        fields = BlogPostListSerializer.Meta.fields + [
            'body', 'meta_title', 'meta_desc', 'view_count',
        ]


# ── VIEWS ─────────────────────────────────────────────────────────────────────

class BlogPostListView(generics.ListAPIView):
    """
    GET /api/v1/blog/posts/
    ?tag=cat&featured=true&search=<text>
    """
    serializer_class   = BlogPostListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = (
            BlogPost.objects
            .filter(status='published')
            .prefetch_related('tags', 'author')
            .order_by('-published_at')
        )
        tag  = self.request.query_params.get('tag')
        feat = self.request.query_params.get('featured')
        srch = self.request.query_params.get('search')

        if tag:
            qs = qs.filter(tags__slug=tag)
        if feat and feat.lower() == 'true':
            qs = qs.filter(is_featured=True)
        if srch:
            qs = qs.filter(title__icontains=srch) | qs.filter(excerpt__icontains=srch)
        return qs


class BlogPostDetailView(generics.RetrieveAPIView):
    """GET /api/v1/blog/posts/{slug}/"""
    serializer_class   = BlogPostDetailSerializer
    permission_classes = [AllowAny]
    lookup_field       = 'slug'

    def get_queryset(self):
        return BlogPost.objects.filter(status='published').prefetch_related('tags', 'author')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count (async-safe enough for our scale)
        BlogPost.objects.filter(pk=instance.pk).update(view_count=models.F('view_count') + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class BlogTagListView(generics.ListAPIView):
    """GET /api/v1/blog/tags/"""
    serializer_class   = BlogTagSerializer
    permission_classes = [AllowAny]
    queryset           = BlogTag.objects.all().order_by('name')


class FeaturedPostsView(APIView):
    """GET /api/v1/blog/featured/ — 3 featured posts for homepage."""
    permission_classes = [AllowAny]

    def get(self, request):
        posts = (
            BlogPost.objects
            .filter(status='published', is_featured=True)
            .prefetch_related('tags', 'author')
            .order_by('-published_at')[:3]
        )
        return Response(BlogPostListSerializer(posts, many=True).data)


# ── URLS ──────────────────────────────────────────────────────────────────────

urlpatterns = [
    path('posts/',              BlogPostListView.as_view(),    name='post-list'),
    path('posts/<slug:slug>/',  BlogPostDetailView.as_view(),  name='post-detail'),
    path('tags/',               BlogTagListView.as_view(),     name='tag-list'),
    path('featured/',           FeaturedPostsView.as_view(),   name='featured'),
]

app_name = 'blog'


# ── ADMIN ─────────────────────────────────────────────────────────────────────