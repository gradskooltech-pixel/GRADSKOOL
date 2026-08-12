"""
GRADSKOOL — FYQ (Future Year Questions) API Views
"""
from django.core.paginator import Paginator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import FYQSection, FYQCategory, FYQTopic, FYQQuestion


def is_admin(user):
    return user.is_staff or getattr(user, 'role', '') == 'admin'


def _pdfs_for_question(q):
    try:
        return [
            {
                'id': p.id, 'title': p.title, 'slug': p.slug,
                'is_free': p.is_free, 'price_inr': str(p.price_inr),
                'cover_image_url': p.cover_image_url,
            }
            for p in q.pdfs.filter(is_published=True)
        ]
    except Exception:
        return []


# ── SERIALIZATION ────────────────────────────────────────────────────────────

def topic_to_dict(t, with_counts=False):
    d = {
        'id': t.id, 'section_id': t.section_id, 'category_id': t.category_id,
        'name': t.name, 'slug': t.slug, 'order': t.order,
    }
    if with_counts:
        d['question_count'] = t.question_count
    return d


def category_to_dict(c, with_topics=False):
    d = {'id': c.id, 'section_id': c.section_id, 'name': c.name, 'slug': c.slug, 'order': c.order}
    if with_topics:
        d['topics'] = [topic_to_dict(t, with_counts=True) for t in c.topics.all().order_by('order', 'name')]
    return d


def section_to_dict(s, with_tree=False):
    d = {'id': s.id, 'name': s.name, 'slug': s.slug, 'order': s.order, 'has_categories': s.has_categories}
    if with_tree:
        if s.has_categories:
            d['categories'] = [category_to_dict(c, with_topics=True) for c in s.categories.all().order_by('order', 'name')]
            d['topics'] = []  # a has_categories section shouldn't have direct topics, but keep shape consistent
        else:
            d['categories'] = []
            d['topics'] = [topic_to_dict(t, with_counts=True) for t in s.topics.filter(category__isnull=True).order_by('order', 'name')]
    return d


def question_to_dict(q, include_body=True):
    topic = q.topic
    d = {
        'id':              q.id,
        'question_number': q.question_number,
        'title':           q.title,
        'slug':            q.slug,
        'meta_description': q.meta_description,
        'youtube_url':     q.youtube_url,
        'has_video':       q.has_video,
        'is_published':    q.is_published,
        'topic_id':        topic.id if topic else None,
        'topic_name':      topic.name if topic else None,
        'category_id':     topic.category_id if topic else None,
        'category_name':   topic.category.name if (topic and topic.category) else None,
        'section_id':      topic.section_id if topic else None,
        'section_name':    topic.section.name if topic else None,
    }
    if include_body:
        d['long_description'] = q.long_description
        d['notes']            = q.notes
        d['pdfs']              = _pdfs_for_question(q)
    return d


def _paginate(request, qs, serializer, default_page_size=24):
    try:
        page      = max(1, int(request.query_params.get('page', 1)))
        page_size = min(100, max(1, int(request.query_params.get('page_size', default_page_size))))
    except ValueError:
        page, page_size = 1, default_page_size
    paginator = Paginator(qs, page_size)
    page_obj  = paginator.get_page(page)
    return {
        'results':    [serializer(item) for item in page_obj.object_list],
        'count':      paginator.count,
        'page':       page_obj.number,
        'num_pages':  paginator.num_pages,
        'has_next':   page_obj.has_next(),
        'has_prev':   page_obj.has_previous(),
    }


# ── PUBLIC VIEWS ─────────────────────────────────────────────────────────────

class PublicFYQTreeView(APIView):
    """GET /api/v1/fyq/tree/ — the full Section → Category → Topic browse
    tree in one call, for the public FYQ hub page."""
    permission_classes = []

    def get(self, request):
        sections = FYQSection.objects.all().order_by('order', 'name')
        return Response([section_to_dict(s, with_tree=True) for s in sections])


class PublicFYQListView(APIView):
    """GET /api/v1/fyq/?topic=<id>&category=<id>&section=<id>&search=...&page=1"""
    permission_classes = []

    def get(self, request):
        qs = FYQQuestion.objects.filter(is_published=True).select_related('topic__category__section', 'topic__section').order_by('question_number')

        topic_id = request.query_params.get('topic')
        if topic_id:
            qs = qs.filter(topic_id=topic_id)

        category_id = request.query_params.get('category')
        if category_id:
            qs = qs.filter(topic__category_id=category_id)

        section_id = request.query_params.get('section')
        if section_id:
            qs = qs.filter(topic__section_id=section_id)

        search = request.query_params.get('search', '').strip()
        if search:
            s = search.lower()
            qs = [q for q in qs if s in q.title.lower() or (q.topic and s in q.topic.name.lower())]
        else:
            qs = list(qs)

        return Response(_paginate(request, qs, lambda q: question_to_dict(q, include_body=False)))


class PublicFYQDetailView(APIView):
    """GET /api/v1/fyq/question/<slug>/"""
    permission_classes = []

    def get(self, request, slug):
        try:
            q = FYQQuestion.objects.select_related('topic__category__section', 'topic__section').get(slug=slug, is_published=True)
        except FYQQuestion.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        d = question_to_dict(q)
        # Sequential prev/next by question_number across the whole bank
        # (not scoped to topic), matching the FYQ 001/002/003 numbering.
        prev_q = (FYQQuestion.objects.filter(is_published=True, question_number__lt=q.question_number)
                  .order_by('-question_number').values('slug', 'question_number', 'title').first())
        next_q = (FYQQuestion.objects.filter(is_published=True, question_number__gt=q.question_number)
                  .order_by('question_number').values('slug', 'question_number', 'title').first())
        d['prev'] = prev_q
        d['next'] = next_q
        return Response(d)


# ── ADMIN VIEWS: hierarchy ────────────────────────────────────────────────────

class AdminFYQSectionListView(APIView):
    """GET/POST /api/v1/dashboard/fyq/sections/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        sections = FYQSection.objects.all().order_by('order', 'name')
        return Response([section_to_dict(s, with_tree=True) for s in sections])

    def post(self, request):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        d = request.data
        if FYQSection.objects.filter(name=d.get('name', '')).exists():
            return Response({'error': 'A section with this name already exists.'}, status=400)
        s = FYQSection.objects.create(
            name=d.get('name', ''), order=d.get('order', 0),
            has_categories=d.get('has_categories', False),
        )
        return Response(section_to_dict(s, with_tree=True), status=201)


class AdminFYQSectionDetailView(APIView):
    """PATCH/DELETE /api/v1/dashboard/fyq/sections/<pk>/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        try: s = FYQSection.objects.get(pk=pk)
        except FYQSection.DoesNotExist: return Response({'error':'Not found'}, status=404)
        for field in ['name', 'order', 'has_categories']:
            if field in request.data: setattr(s, field, request.data[field])
        s.save()
        return Response(section_to_dict(s, with_tree=True))

    def delete(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        try: s = FYQSection.objects.get(pk=pk)
        except FYQSection.DoesNotExist: return Response({'error':'Not found'}, status=404)
        s.delete()
        return Response(status=204)


class AdminFYQCategoryListView(APIView):
    """GET/POST /api/v1/dashboard/fyq/categories/?section=<id>"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        qs = FYQCategory.objects.all().order_by('order', 'name')
        section_id = request.query_params.get('section')
        if section_id: qs = qs.filter(section_id=section_id)
        return Response([category_to_dict(c, with_topics=True) for c in qs])

    def post(self, request):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        d = request.data
        try:
            section = FYQSection.objects.get(pk=d.get('section_id'))
        except FYQSection.DoesNotExist:
            return Response({'error': 'Section not found'}, status=400)
        if FYQCategory.objects.filter(section=section, name=d.get('name', '')).exists():
            return Response({'error': 'A category with this name already exists in this section.'}, status=400)
        c = FYQCategory.objects.create(section=section, name=d.get('name', ''), order=d.get('order', 0))
        return Response(category_to_dict(c, with_topics=True), status=201)


class AdminFYQCategoryDetailView(APIView):
    """PATCH/DELETE /api/v1/dashboard/fyq/categories/<pk>/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        try: c = FYQCategory.objects.get(pk=pk)
        except FYQCategory.DoesNotExist: return Response({'error':'Not found'}, status=404)
        for field in ['name', 'order']:
            if field in request.data: setattr(c, field, request.data[field])
        c.save()
        return Response(category_to_dict(c, with_topics=True))

    def delete(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        try: c = FYQCategory.objects.get(pk=pk)
        except FYQCategory.DoesNotExist: return Response({'error':'Not found'}, status=404)
        c.delete()
        return Response(status=204)


class AdminFYQTopicListView(APIView):
    """GET/POST /api/v1/dashboard/fyq/topics/?section=<id>&category=<id>"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        qs = FYQTopic.objects.all().order_by('order', 'name')
        section_id = request.query_params.get('section')
        category_id = request.query_params.get('category')
        if section_id: qs = qs.filter(section_id=section_id)
        if category_id: qs = qs.filter(category_id=category_id)
        return Response([topic_to_dict(t, with_counts=True) for t in qs])

    def post(self, request):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        d = request.data
        try:
            section = FYQSection.objects.get(pk=d.get('section_id'))
        except FYQSection.DoesNotExist:
            return Response({'error': 'Section not found'}, status=400)
        category = None
        if d.get('category_id'):
            try:
                category = FYQCategory.objects.get(pk=d['category_id'])
            except FYQCategory.DoesNotExist:
                return Response({'error': 'Category not found'}, status=400)
        t = FYQTopic.objects.create(section=section, category=category, name=d.get('name', ''), order=d.get('order', 0))
        return Response(topic_to_dict(t, with_counts=True), status=201)


class AdminFYQTopicDetailView(APIView):
    """PATCH/DELETE /api/v1/dashboard/fyq/topics/<pk>/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        try: t = FYQTopic.objects.get(pk=pk)
        except FYQTopic.DoesNotExist: return Response({'error':'Not found'}, status=404)
        for field in ['name', 'order']:
            if field in request.data: setattr(t, field, request.data[field])
        t.save()
        return Response(topic_to_dict(t, with_counts=True))

    def delete(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        try: t = FYQTopic.objects.get(pk=pk)
        except FYQTopic.DoesNotExist: return Response({'error':'Not found'}, status=404)
        t.delete()
        return Response(status=204)


# ── ADMIN VIEWS: questions ────────────────────────────────────────────────────

class AdminFYQListView(APIView):
    """GET/POST /api/v1/dashboard/fyq/questions/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        qs = FYQQuestion.objects.select_related('topic__category__section', 'topic__section').all()

        topic_id = request.query_params.get('topic')
        if topic_id: qs = qs.filter(topic_id=topic_id)

        search = request.query_params.get('search', '').strip()
        if search:
            s = search.lower()
            qs = [q for q in qs if s in q.title.lower() or (q.topic and s in q.topic.name.lower()) or str(q.question_number) == s]
        else:
            qs = list(qs)

        return Response(_paginate(request, qs, lambda q: question_to_dict(q, include_body=False), default_page_size=50))

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        d = request.data
        if FYQQuestion.objects.filter(question_number=d.get('question_number')).exists():
            return Response({'error': f"FYQ {d.get('question_number')} already exists — pick a different number, or this may already be saved (refresh to check)."}, status=400)
        topic = None
        if d.get('topic_id'):
            try:
                topic = FYQTopic.objects.get(pk=d['topic_id'])
            except FYQTopic.DoesNotExist:
                return Response({'error': 'Topic not found'}, status=400)
        q = FYQQuestion.objects.create(
            question_number   = d.get('question_number'),
            topic             = topic,
            title             = d.get('title', ''),
            slug              = d.get('slug', ''),
            meta_description  = d.get('meta_description', ''),
            youtube_url       = d.get('youtube_url', ''),
            long_description  = d.get('long_description', ''),
            notes             = d.get('notes', ''),
            is_published      = d.get('is_published', True),
        )
        return Response(question_to_dict(q), status=201)


class AdminFYQDetailView(APIView):
    """GET/PATCH/DELETE /api/v1/dashboard/fyq/questions/<pk>/"""
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return FYQQuestion.objects.select_related('topic__category__section', 'topic__section').get(pk=pk)
        except FYQQuestion.DoesNotExist:
            return None

    def get(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        q = self._get(pk)
        return Response(question_to_dict(q)) if q else Response({'error':'Not found'}, status=404)

    def patch(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        q = self._get(pk)
        if not q: return Response({'error':'Not found'}, status=404)
        d = request.data
        if 'question_number' in d and d['question_number'] != q.question_number:
            if FYQQuestion.objects.filter(question_number=d['question_number']).exclude(pk=q.pk).exists():
                return Response({'error': f"FYQ {d['question_number']} is already used by another question."}, status=400)
        if 'topic_id' in d:
            if d['topic_id']:
                try:
                    q.topic = FYQTopic.objects.get(pk=d['topic_id'])
                except FYQTopic.DoesNotExist:
                    return Response({'error': 'Topic not found'}, status=400)
            else:
                q.topic = None
        for field in ['question_number', 'title', 'slug', 'meta_description', 'youtube_url', 'long_description', 'notes', 'is_published']:
            if field in d:
                setattr(q, field, d[field])
        q.save()
        return Response(question_to_dict(q))

    def delete(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        q = self._get(pk)
        if not q: return Response({'error':'Not found'}, status=404)
        q.delete()
        return Response(status=204)