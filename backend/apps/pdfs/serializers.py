from rest_framework import serializers
from .models import Pdf, PdfPurchase


class PdfListSerializer(serializers.ModelSerializer):
    exam_slug = serializers.CharField(source='exam.slug', default=None, read_only=True)
    is_owned  = serializers.SerializerMethodField()

    class Meta:
        model = Pdf
        fields = [
            'id', 'title', 'slug', 'description', 'cover_image_url',
            'price_inr', 'is_free', 'page_count', 'exam_slug', 'is_owned',
            # Added so the frontend (both the library grid and the
            # individual PDF detail page) can know whether THIS specific
            # PDF is bundle-eligible, without hardcoding "only on the
            # cat-fyqs page" logic — the real backend restriction (see
            # apps.pdfs.services.create_pdf_bundle_order) is this exact
            # flag, so the frontend should check the same thing rather
            # than a proxy for it.
            'fyq_category',
            # So the frontend can show an "Upcoming" badge and still allow
            # selection in bundle checkout — is_upcoming PDFs are real,
            # published, purchasable rows (see seed_upcoming_quant_pdfs),
            # just without actual page content attached yet.
            'is_upcoming',
        ]

    def get_is_owned(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return PdfPurchase.objects.filter(user=request.user, pdf=obj, status='paid').exists()


class PdfPurchaseSerializer(serializers.ModelSerializer):
    pdf_title       = serializers.CharField(source='pdf.title', read_only=True)
    pdf_slug        = serializers.CharField(source='pdf.slug', read_only=True)
    pdf_cover_url   = serializers.CharField(source='pdf.cover_image_url', read_only=True)

    class Meta:
        model = PdfPurchase
        fields = [
            'id', 'pdf', 'pdf_title', 'pdf_slug', 'pdf_cover_url',
            'amount_inr', 'status', 'created_at', 'paid_at',
        ]
        read_only_fields = fields