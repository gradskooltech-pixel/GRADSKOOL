"""
GRADSKOOL — import_blog_posts management command

Imports all 15 blog posts from the static HTML files into the database.

Usage:
    python manage.py import_blog_posts --html-dir /path/to/html/files
    python manage.py import_blog_posts --html-dir /path/to/html/files --wipe
"""
import os
import re
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify
from django.utils import timezone


BLOG_FILES = [
    ('blog-cat-2026-syllabus.html',            'CAT'),
    ('blog-cat-dilr-strategy.html',            'CAT'),
    ('blog-cat-mock-strategy.html',            'CAT'),
    ('blog-cat-percentile-vs-score.html',      'CAT'),
    ('blog-cat-varc-rc-strategy.html',         'CAT'),
    ('blog-gmat-focus-edition.html',           'GMAT'),
    ('blog-gre-320-strategy.html',             'GRE'),
    ('blog-iim-ahmedabad-placements-2025.html','CAT'),
    ('blog-iim-bangalore-placements-2025.html','CAT'),
    ('blog-iim-calcutta-placements-2025.html', 'CAT'),
    ('blog-iim-cutoffs-2025.html',             'CAT'),
    ('blog-iim-indore-placements-2025.html',   'CAT'),
    ('blog-iim-lucknow-placements-2025.html',  'CAT'),
    ('blog-iim-placements-2025-overview.html', 'CAT'),
    ('blog-ipmat-2026-syllabus.html',          'IPMAT'),
]


def extract_blog_content(soup):
    """Extract structured blog content from BeautifulSoup object."""
    # Remove nav, footer, sidebar, scripts, styles
    for tag in soup.find_all(['nav', 'footer', 'script', 'style', 'noscript']):
        tag.decompose()

    # Remove breadcrumb
    for el in soup.find_all(class_=lambda c: c and 'breadcrumb' in ' '.join(c).lower() if c else False):
        el.decompose()

    # Get meta description
    meta_desc = ''
    meta = soup.find('meta', {'name': 'description'})
    if meta:
        meta_desc = meta.get('content', '')

    # Get title
    title_tag = soup.find('title')
    raw_title = title_tag.text.strip() if title_tag else ''
    # Strip " | GRADSKOOL" suffix
    title = re.sub(r'\s*[|—]\s*GRADSKOOL.*$', '', raw_title).strip()

    # Get H1
    h1 = soup.find('h1')
    h1_text = h1.get_text(strip=True) if h1 else title

    # Get main content area
    main = (soup.find('article') or
            soup.find('main') or
            soup.find(class_=lambda c: c and 'blog' in ' '.join(c).lower() if c else False) or
            soup.find('body'))

    if not main:
        return None

    # Convert HTML to clean markdown-like text
    body_parts = []
    for element in main.find_all(['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'table', 'blockquote'], recursive=True):
        tag  = element.name
        text = element.get_text(' ', strip=True)

        if not text or len(text) < 3:
            continue

        # Skip navigation-like text
        if any(nav in text for nav in ['Enrol Now', 'Back to Home', 'GRAD SKOOL']):
            continue

        if tag == 'h1':
            body_parts.append(f'# {text}\n')
        elif tag == 'h2':
            body_parts.append(f'\n## {text}\n')
        elif tag == 'h3':
            body_parts.append(f'\n### {text}\n')
        elif tag == 'p':
            body_parts.append(f'{text}\n')
        elif tag in ('ul', 'ol'):
            for li in element.find_all('li'):
                li_text = li.get_text(' ', strip=True)
                if li_text:
                    body_parts.append(f'- {li_text}')
            body_parts.append('')
        elif tag == 'blockquote':
            body_parts.append(f'> {text}\n')
        elif tag == 'table':
            # Simple table extraction
            rows = []
            for tr in element.find_all('tr'):
                cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
                if cells:
                    rows.append(' | '.join(cells))
            if rows:
                body_parts.append('\n'.join(rows) + '\n')

    body = '\n'.join(body_parts)

    # Clean up excessive newlines
    body = re.sub(r'\n{4,}', '\n\n\n', body)
    body = body.strip()

    # Get the slug from the filename
    return {
        'title':       title or h1_text,
        'h1':          h1_text,
        'meta_desc':   meta_desc,
        'body':        body,
        'word_count':  len(body.split()),
    }


class Command(BaseCommand):
    help = 'Import all blog posts from static HTML files into the database'

    def add_arguments(self, parser):
        parser.add_argument('--html-dir', required=True,
            help='Path to directory containing the HTML files')
        parser.add_argument('--wipe', action='store_true',
            help='Delete all existing blog posts before importing')

    def handle(self, *args, **options):
        try:
            from bs4 import BeautifulSoup
        except ImportError:
            raise CommandError('beautifulsoup4 is required: pip install beautifulsoup4')

        html_dir = options['html_dir']
        if not os.path.isdir(html_dir):
            raise CommandError(f'Directory not found: {html_dir}')

        from apps.blog.models import BlogPost, BlogTag

        if options['wipe']:
            BlogPost.objects.all().delete()
            self.stdout.write(self.style.WARNING('Wiped all existing blog posts'))

        # Ensure tags exist
        tags = {}
        for exam in ['CAT', 'GMAT', 'GRE', 'IPMAT', 'IIM', 'Strategy', 'Placements']:
            tag, _ = BlogTag.objects.get_or_create(
                slug=slugify(exam),
                defaults={'name': exam}
            )
            tags[exam] = tag

        created = 0
        updated = 0
        skipped = 0

        for fname, exam_tag in BLOG_FILES:
            fpath = os.path.join(html_dir, fname)

            if not os.path.exists(fpath):
                self.stdout.write(self.style.WARNING(f'  Skipping (not found): {fname}'))
                skipped += 1
                continue

            # Parse HTML
            with open(fpath, encoding='utf-8', errors='ignore') as f:
                soup = BeautifulSoup(f.read(), 'html.parser')

            data = extract_blog_content(soup)
            if not data or not data['title']:
                self.stdout.write(self.style.WARNING(f'  Skipping (no content): {fname}'))
                skipped += 1
                continue

            # Derive slug from filename
            slug = fname.replace('.html', '')

            # Extra tags based on content
            extra_tags = [exam_tag]
            if 'iim' in slug:
                extra_tags.append('IIM')
            if 'placement' in slug:
                extra_tags.append('Placements')
            if 'strategy' in slug or 'syllabus' in slug:
                extra_tags.append('Strategy')

            # Create or update
            post, was_created = BlogPost.objects.update_or_create(
                slug=slug,
                defaults={
                    'title':        data['title'],
                    'meta_desc':    data['meta_desc'] or data['title'],
                    'body':         data['body'],
                    'status':       'published',
                    'published_at': timezone.now(),
                    'word_count':   data['word_count'],
                    'reading_mins': max(1, data['word_count'] // 200),
                }
            )

            # Set tags
            tag_objs = [tags[t] for t in extra_tags if t in tags]
            if tag_objs:
                post.tags.set(tag_objs)

            if was_created:
                created += 1
                self.stdout.write(f'  ✓ Created: {data["title"][:60]}')
            else:
                updated += 1
                self.stdout.write(f'  ↻ Updated: {data["title"][:60]}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Blog import complete: {created} created, {updated} updated, {skipped} skipped'
        ))
