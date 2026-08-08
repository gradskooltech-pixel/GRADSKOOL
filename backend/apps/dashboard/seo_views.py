"""
GRADSKOOL — SEO Views

GET /sitemap.xml    → Dynamically generated XML sitemap
GET /robots.txt     → robots.txt

The sitemap includes:
  - Static pages (/, /courses, /tools, /blog)
  - All active exam pages (/courses/{slug})
  - All published blog posts (/blog/{slug})
  - All active free tools (/tools/{slug})

Cached for 1 hour — regenerated on next request after cache expires.
"""
import logging
from datetime import datetime
from django.http import HttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.conf import settings

logger = logging.getLogger(__name__)

FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'https://gradskool.in')
CACHE_1_HOUR = 60 * 60


class SitemapView(View):
    """
    GET /sitemap.xml

    Generates a complete XML sitemap with:
      - Static pages
      - Exam/course pages (from Exam model)
      - Blog posts (from BlogPost model)
      - Free tool pages (from Tool model)

    Uses lastmod, changefreq, and priority tags for all URLs.
    """

    @method_decorator(cache_page(CACHE_1_HOUR))
    def get(self, request):
        urls = []

        # ── STATIC PAGES ─────────────────────────────────────────────────────
        static_pages = [
            ('/',         '1.0',  'weekly',  None),
            ('/courses',  '0.9',  'weekly',  None),
            ('/tools',    '0.9',  'weekly',  None),
            ('/blog',     '0.8',  'daily',   None),
            ('/about',    '0.5',  'monthly', None),
        ]
        for path, priority, changefreq, lastmod in static_pages:
            urls.append({
                'loc':        f'{FRONTEND_URL}{path}',
                'priority':   priority,
                'changefreq': changefreq,
                'lastmod':    lastmod,
            })

        # ── EXAM PAGES ────────────────────────────────────────────────────────
        try:
            from apps.courses.models import Exam
            exams = Exam.objects.filter(is_active=True).values('slug', 'updated_at')
            for exam in exams:
                urls.append({
                    'loc':        f'{FRONTEND_URL}/courses/{exam["slug"]}',
                    'priority':   '0.9',
                    'changefreq': 'weekly',
                    'lastmod':    exam['updated_at'].strftime('%Y-%m-%d') if exam.get('updated_at') else None,
                })
        except Exception as e:
            logger.warning(f'Sitemap: could not fetch exams: {e}')

        # ── BLOG POSTS ────────────────────────────────────────────────────────
        try:
            from apps.blog.models import BlogPost
            posts = BlogPost.objects.filter(
                status='published'
            ).values('slug', 'updated_at', 'published_at')
            for post in posts:
                lastmod = post.get('updated_at') or post.get('published_at')
                urls.append({
                    'loc':        f'{FRONTEND_URL}/blog/{post["slug"]}',
                    'priority':   '0.7',
                    'changefreq': 'monthly',
                    'lastmod':    lastmod.strftime('%Y-%m-%d') if lastmod else None,
                })
        except Exception as e:
            logger.warning(f'Sitemap: could not fetch blog posts: {e}')

        # ── FREE TOOLS ────────────────────────────────────────────────────────
        try:
            from apps.tools.models import Tool
            tools = Tool.objects.filter(is_active=True).values('slug')
            for tool in tools:
                urls.append({
                    'loc':        f'{FRONTEND_URL}/tools/{tool["slug"]}',
                    'priority':   '0.7',
                    'changefreq': 'monthly',
                    'lastmod':    None,
                })
        except Exception as e:
            logger.warning(f'Sitemap: could not fetch tools: {e}')

        xml = self._build_xml(urls)
        return HttpResponse(xml, content_type='application/xml; charset=utf-8')

    def _build_xml(self, urls: list) -> str:
        today = datetime.today().strftime('%Y-%m-%d')
        entries = []
        for url in urls:
            lastmod_tag = (
                f'    <lastmod>{url["lastmod"]}</lastmod>\n'
                if url.get('lastmod') else
                f'    <lastmod>{today}</lastmod>\n'
            )
            entry = (
                '  <url>\n'
                f'    <loc>{url["loc"]}</loc>\n'
                + lastmod_tag +
                f'    <changefreq>{url["changefreq"]}</changefreq>\n'
                f'    <priority>{url["priority"]}</priority>\n'
                '  </url>'
            )
            entries.append(entry)

        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + '\n'.join(entries) +
            '\n</urlset>'
        )


class RobotsView(View):
    """GET /robots.txt"""

    def get(self, request):
        frontend = FRONTEND_URL
        content = f"""User-agent: *
Allow: /

# Block admin and private areas
Disallow: /django-admin/
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard/
Disallow: /watch/
Disallow: /checkout/
Disallow: /admin-panel/

# Block search/filter URLs that generate duplicate content
Disallow: /*?*page=
Disallow: /*?*search=

# Crawl-delay for polite bots
Crawl-delay: 10

# Sitemap location
Sitemap: {frontend}/sitemap.xml
"""
        return HttpResponse(content, content_type='text/plain')


class OpenGraphImageView(View):
    """
    GET /api/v1/seo/og-image/{exam_slug}/
    Returns OG meta for dynamic link previews.
    Used by frontend for <meta> tags on SSG pages when og_image_url is missing.
    """
    def get(self, request, exam_slug=None):
        from apps.courses.models import Exam
        try:
            exam = Exam.objects.get(slug=exam_slug, is_active=True)
            return HttpResponse({
                'title':       exam.meta_title or f'{exam.name} Preparation — GRADSKOOL',
                'description': exam.meta_desc or exam.tagline,
                'image':       exam.og_image_url or f'{FRONTEND_URL}/og-default.jpg',
                'url':         f'{FRONTEND_URL}/courses/{exam.slug}',
            }, content_type='application/json')
        except Exam.DoesNotExist:
            return HttpResponse(status=404)
