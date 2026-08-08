"""
GRADSKOOL — Foundations Admin API Views
"""
from django.utils import timezone as dj_timezone
from django.db import IntegrityError
from django.utils.dateparse import parse_datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import FoundationSeries, FoundationClass


def is_admin(user):
    return user.is_staff or getattr(user, 'role', '') == 'admin'


def _pdfs_for_class(c):
    """
    Public-safe PDF info attached to this class (cheat sheets, question
    banks). Wrapped in try/except so this endpoint degrades gracefully
    rather than 500ing if the pdfs app's foundation_class migration hasn't
    been applied yet on a given environment.
    """
    try:
        return [
            {
                'id': p.id,
                'title': p.title,
                'slug': p.slug,
                'is_free': p.is_free,
                'price_inr': str(p.price_inr),
                'cover_image_url': p.cover_image_url,
            }
            for p in c.pdfs.filter(is_published=True)
        ]
    except Exception:
        return []


def series_to_dict(s, include_classes=False, exam_filter=None):
    # Compute the (possibly exam-filtered) class list ONCE, then derive
    # both class_count and classes from it — this is what guarantees they
    # can never disagree, unlike computing count separately from a raw,
    # unfiltered DB query.
    classes = list(s.classes.filter(is_published=True).order_by('lesson_number'))
    if exam_filter:
        # A class's own `exams` override wins when set; an empty
        # override means it inherits every exam the series covers.
        classes = [c for c in classes if exam_filter in (c.exams or s.exams or [])]

    d = {
        'id':           s.id,
        'exams':        s.exams,
        'title':        s.title,
        'slug':         s.slug,
        'description':  s.description,
        'content_types':s.content_types,
        'notes':        s.notes,
        'is_active':    s.is_active,
        'order':        s.order,
        'class_count':  len(classes),
    }
    if include_classes:
        d['classes'] = [class_to_dict(c) for c in classes]
    return d


def class_to_dict(c):
    return {
        'id':             c.id,
        'series_id':      c.series_id,
        'series_title':   c.series.title,
        'exams':          c.exams or c.series.exams,  # effective — what this class actually shows under
        'exams_raw':      c.exams,                     # raw override; [] means "inherits the series"
        'series_exams':   c.series.exams,               # for reference, e.g. building the admin checkbox options
        'lesson_number':  c.lesson_number,
        'title':          c.title,
        'slug':           c.slug,
        'description':    c.description,
        'meta_description': c.meta_description,
        'long_description': c.long_description,
        'scheduled_at':   c.scheduled_at.isoformat(),
        'duration_mins':  c.duration_mins,
        'youtube_url':    c.youtube_url,
        'notes':          c.notes,
        'is_published':   c.is_published,
        'is_upcoming':    c.is_upcoming,
        'has_recording':  c.has_recording,
        'pdfs':           _pdfs_for_class(c),
    }


# ── PUBLIC VIEWS ─────────────────────────────────────────────────────────────

class PublicFoundationsView(APIView):
    """GET /api/v1/foundations/?exam=xat  — public listing for the frontend.
    Filters by membership in the series' exams list, not equality — a
    series can appear under multiple exams at once."""
    permission_classes = []

    def get(self, request):
        exam = request.query_params.get('exam', '').lower()
        series = list(FoundationSeries.objects.filter(is_active=True))
        if exam:
            series = [s for s in series if exam in (s.exams or [])]
        return Response([series_to_dict(s, include_classes=True, exam_filter=exam or None) for s in series])


class PublicFoundationClassView(APIView):
    """GET /api/v1/foundations/class/<slug>/  — single class detail"""
    permission_classes = []

    def get(self, request, slug):
        try:
            cls = FoundationClass.objects.select_related('series').get(slug=slug, is_published=True)
            return Response(class_to_dict(cls))
        except FoundationClass.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ── ADMIN VIEWS ───────────────────────────────────────────────────────────────

class AdminFoundationSeriesListView(APIView):
    """GET/POST /api/v1/dashboard/foundations/series/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        exam = request.query_params.get('exam', '')
        series = list(FoundationSeries.objects.all())
        if exam:
            series = [s for s in series if exam in (s.exams or [])]
        return Response([series_to_dict(s, include_classes=True) for s in series])

    def post(self, request):
        if not is_admin(request.user):
            return Response({'error': 'Forbidden'}, status=403)
        d = request.data
        s = FoundationSeries.objects.create(
            exams         = d.get('exams', []),
            title         = d.get('title', ''),
            description   = d.get('description', ''),
            content_types = d.get('content_types', []),
            notes         = d.get('notes', ''),
            is_active     = d.get('is_active', True),
            order         = d.get('order', 0),
        )
        return Response(series_to_dict(s), status=201)


class AdminFoundationSeriesDetailView(APIView):
    """GET/PATCH/DELETE /api/v1/dashboard/foundations/series/<pk>/"""
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return FoundationSeries.objects.get(pk=pk)
        except FoundationSeries.DoesNotExist:
            return None

    def get(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        s = self._get(pk)
        if not s: return Response({'error':'Not found'}, status=404)
        return Response(series_to_dict(s, include_classes=True))

    def patch(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        s = self._get(pk)
        if not s: return Response({'error':'Not found'}, status=404)
        for field in ['title','description','content_types','notes','is_active','order','exams']:
            if field in request.data:
                setattr(s, field, request.data[field])
        s.save()
        return Response(series_to_dict(s))

    def delete(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        s = self._get(pk)
        if not s: return Response({'error':'Not found'}, status=404)
        s.delete()
        return Response(status=204)


class AdminFoundationClassListView(APIView):
    """GET/POST /api/v1/dashboard/foundations/classes/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        exam   = request.query_params.get('exam', '')
        series = request.query_params.get('series', '')
        qs     = FoundationClass.objects.select_related('series').all()
        if series: qs = qs.filter(series_id=series)
        classes = list(qs)
        if exam:
            classes = [c for c in classes if exam in (c.exams or c.series.exams or [])]
        return Response([class_to_dict(c) for c in classes])

    def post(self, request):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        d = request.data
        try:
            series = FoundationSeries.objects.get(pk=d.get('series_id'))
        except FoundationSeries.DoesNotExist:
            return Response({'error': 'Series not found'}, status=400)

        scheduled_at = parse_datetime(d.get('scheduled_at', ''))
        if not scheduled_at:
            return Response({'error': 'Invalid scheduled_at datetime'}, status=400)
        if dj_timezone.is_naive(scheduled_at):
            # The admin form's datetime-local input has no timezone info —
            # it's labelled (IST) on the form, so interpret it as the
            # project's configured TIME_ZONE rather than leaving it naive
            # (which Django accepts but warns about, and can silently
            # misinterpret later).
            scheduled_at = dj_timezone.make_aware(scheduled_at)

        try:
            cls = FoundationClass.objects.create(
                series         = series,
                exams          = d.get('exams', []),
                lesson_number  = d.get('lesson_number', 1),
                title          = d.get('title', ''),
                slug           = d.get('slug', ''),
                description    = d.get('description', ''),
                meta_description = d.get('meta_description', ''),
                long_description = d.get('long_description', ''),
                scheduled_at   = scheduled_at,
                duration_mins  = d.get('duration_mins', 60),
                youtube_url    = d.get('youtube_url', ''),
                notes          = d.get('notes', ''),
                is_published   = d.get('is_published', True),
            )
        except IntegrityError:
            return Response(
                {'error': f"Lesson {d.get('lesson_number', 1)} already exists in this series — pick a different lesson number, or this class may already have been saved (refresh to check)."},
                status=400,
            )
        return Response(class_to_dict(cls), status=201)


class AdminFoundationClassDetailView(APIView):
    """GET/PATCH/DELETE /api/v1/dashboard/foundations/classes/<pk>/"""
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return FoundationClass.objects.select_related('series').get(pk=pk)
        except FoundationClass.DoesNotExist:
            return None

    def get(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        c = self._get(pk)
        return Response(class_to_dict(c)) if c else Response({'error':'Not found'}, status=404)

    def patch(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        c = self._get(pk)
        if not c: return Response({'error':'Not found'}, status=404)
        d = request.data
        for field in ['title','slug','description','meta_description','long_description','duration_mins','youtube_url','notes','is_published','lesson_number','exams']:
            if field in d:
                setattr(c, field, d[field])
        if 'scheduled_at' in d:
            dt = parse_datetime(d['scheduled_at'])
            if dt:
                if dj_timezone.is_naive(dt):
                    dt = dj_timezone.make_aware(dt)
                c.scheduled_at = dt
        c.save()
        return Response(class_to_dict(c))

    def delete(self, request, pk):
        if not is_admin(request.user): return Response({'error':'Forbidden'}, status=403)
        c = self._get(pk)
        if not c: return Response({'error':'Not found'}, status=404)
        c.delete()
        return Response(status=204)