"""
GRADSKOOL — PDFs Admin Views

GET/POST   /api/v1/pdfs/admin/pdfs/                    → List / create Pdf (draft)
GET/PATCH/DELETE /api/v1/pdfs/admin/pdfs/{id}/         → Detail / update / delete
POST /api/v1/pdfs/admin/pdfs/{id}/pages/               → Upload ONE rendered page image
POST /api/v1/pdfs/admin/pdfs/{id}/finalize/            → Set page_count, ready, publish
POST /api/v1/pdfs/admin/pdfs/reorder/                  → Reorder library sort order

The upload step expects the admin's BROWSER to have already rendered the PDF
to page images via pdf.js canvas rendering (same approach as the original
CAT_PDF app) — no server-side poppler/ImageMagick dependency, so this stays
compatible with your Railway deployment without extra system packages.
"""
from django.shortcuts import get_object_or_404
from rest_framework import generics, serializers
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from shared.permissions import IsAdmin
from .models import Pdf, PdfPage
from .supabase_storage import upload_bytes, delete_files
# Pages upload to Supabase Storage (private bucket) — see supabase_storage.py


class AdminPdfSerializer(serializers.ModelSerializer):
    exam_slug = serializers.CharField(source='exam.slug', default=None, read_only=True)

    class Meta:
        model = Pdf
        fields = [
            'id', 'title', 'slug', 'description', 'cover_image_url',
            'price_inr', 'is_free', 'page_count', 'status', 'is_published',
            'sort_order', 'exam', 'exam_slug', 'foundation_class', 'fyq_question', 'created_at',
        ]
        read_only_fields = ['id', 'slug', 'page_count', 'status', 'created_at']


class AdminPdfListCreateView(generics.ListCreateAPIView):
    serializer_class = AdminPdfSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Pdf.objects.all().select_related('exam').order_by('sort_order', '-created_at')
        foundation_class = self.request.query_params.get('foundation_class')
        if foundation_class:
            qs = qs.filter(foundation_class_id=foundation_class)
        fyq_question = self.request.query_params.get('fyq_question')
        if fyq_question:
            qs = qs.filter(fyq_question_id=fyq_question)
        unlinked = self.request.query_params.get('unlinked')
        if unlinked:
            # Unlinked from BOTH — a PDF already attached to a foundation
            # class shouldn't be offered as a free-floating pick for an
            # FYQ question, and vice versa.
            qs = qs.filter(foundation_class__isnull=True, fyq_question__isnull=True)
        return qs


class AdminPdfDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminPdfSerializer
    permission_classes = [IsAdmin]
    queryset = Pdf.objects.all()

    def perform_destroy(self, instance):
        paths = list(instance.pages.values_list('storage_path', flat=True))
        delete_files(paths)
        instance.delete()


class AdminPdfPageUploadView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        pdf = get_object_or_404(Pdf, pk=pk)
        page_number = request.data.get('page_number')
        file = request.FILES.get('file')

        if not page_number or not file:
            return Response({'error': {'message': 'page_number and file are required.'}}, status=400)

        try:
            page_number = int(page_number)
        except ValueError:
            return Response({'error': {'message': 'page_number must be an integer.'}}, status=400)

        storage_path = f'pdfs/{pdf.id}/page-{page_number:04d}.webp'
        ok = upload_bytes(storage_path, file.read(), content_type=file.content_type or 'image/webp')
        if not ok:
            return Response({'error': {'message': 'Upload to storage failed.'}}, status=502)

        PdfPage.objects.update_or_create(
            pdf=pdf, page_number=page_number,
            defaults={'storage_path': storage_path},
        )

        if pdf.status == 'draft':
            pdf.status = 'processing'
            pdf.save(update_fields=['status'])

        return Response({'saved': True, 'page_number': page_number}, status=201)


class AdminPdfFinalizeView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        pdf = get_object_or_404(Pdf, pk=pk)
        page_count = pdf.pages.count()
        if page_count == 0:
            return Response({'error': {'message': 'No pages uploaded yet.'}}, status=400)

        pdf.page_count = page_count
        pdf.status = 'ready'
        pdf.is_published = bool(request.data.get('publish', True))
        pdf.save(update_fields=['page_count', 'status', 'is_published'])

        return Response({'saved': True, 'page_count': page_count, 'is_published': pdf.is_published})


class AdminPdfReorderView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        """Body: { order: [pdf_id, pdf_id, ...] } — sets library sort order."""
        order = request.data.get('order', [])
        for i, pdf_id in enumerate(order):
            Pdf.objects.filter(id=pdf_id).update(sort_order=i)
        return Response({'saved': True})