"""
GRADSKOOL — Admin Analytics Views (M12)

All endpoints require IsAdmin permission.

GET /api/v1/admin/overview/         → Platform-wide KPI snapshot
GET /api/v1/admin/revenue/          → Revenue trend + plan breakdown
GET /api/v1/admin/leads/            → Lead funnel + sequence performance
GET /api/v1/admin/content/          → Video publish stats + Whisper progress
GET /api/v1/admin/cohorts/          → Seat fill rates per exam/cohort
GET /api/v1/admin/tools/            → Tool usage + lead gate conversion
GET /api/v1/admin/notifications/    → WhatsApp delivery stats
"""
import logging
from datetime import timedelta

from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.urls import path

from shared.permissions import IsAdmin

logger = logging.getLogger(__name__)
CACHE_2_MIN = 60 * 2
CACHE_5_MIN = 60 * 5


class AdminOverviewView(APIView):
    """
    GET /api/v1/admin/overview/

    The headline numbers for the admin homepage dashboard.
    Cached 2 minutes — fast enough for real-time feel.
    """
    permission_classes = [IsAdmin]

    @method_decorator(cache_page(CACHE_2_MIN))
    def get(self, request):
        from apps.accounts.models import User
        from apps.payments.models import Order
        from apps.enrollments.models import Enrollment
        from apps.leads.models import Lead
        from apps.content.models import VideoProgress
        from apps.tools.models import ToolSession, ToolLead

        now       = timezone.now()
        today     = now.date()
        week_ago  = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        # ── Revenue ──────────────────────────────────────────────────────────
        rev_total = Order.objects.filter(status='paid').aggregate(
            t=Sum('total_amount')
        )['t'] or 0

        rev_month = Order.objects.filter(
            status='paid', paid_at__gte=month_ago
        ).aggregate(t=Sum('total_amount'))['t'] or 0

        rev_week = Order.objects.filter(
            status='paid', paid_at__gte=week_ago
        ).aggregate(t=Sum('total_amount'))['t'] or 0

        # ── Users ─────────────────────────────────────────────────────────────
        total_users   = User.objects.count()
        new_this_week = User.objects.filter(date_joined__gte=week_ago).count()
        verified      = User.objects.filter(is_verified=True).count()

        # ── Enrollments ───────────────────────────────────────────────────────
        active_enrollments = Enrollment.objects.filter(status='active').count()
        total_enrollments  = Enrollment.objects.count()

        # ── Leads ─────────────────────────────────────────────────────────────
        total_leads    = Lead.objects.count()
        converted      = Lead.objects.filter(status='converted').count()
        new_leads_week = Lead.objects.filter(created_at__gte=week_ago).count()
        conv_rate      = round((converted / total_leads) * 100, 1) if total_leads else 0

        # ── Content engagement ────────────────────────────────────────────────
        videos_completed  = VideoProgress.objects.filter(is_completed=True).count()
        total_watch_hours = round(
            (VideoProgress.objects.aggregate(t=Sum('watched_secs'))['t'] or 0) / 3600, 1
        )

        # ── Tool usage ────────────────────────────────────────────────────────
        tool_leads    = ToolLead.objects.count()
        tool_sessions = ToolSession.objects.count()

        # ── Revenue daily trend (last 30 days) ────────────────────────────────
        daily_revenue = list(
            Order.objects
            .filter(status='paid', paid_at__gte=month_ago)
            .annotate(date=TruncDate('paid_at'))
            .values('date')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('date')
        )

        return Response({
            'revenue': {
                'total':  float(rev_total),
                'month':  float(rev_month),
                'week':   float(rev_week),
                'daily_trend': [
                    {'date': str(d['date']), 'revenue': float(d['revenue']),
                     'orders': d['orders']}
                    for d in daily_revenue
                ],
            },
            'users': {
                'total':        total_users,
                'verified':     verified,
                'new_this_week': new_this_week,
            },
            'enrollments': {
                'active': active_enrollments,
                'total':  total_enrollments,
            },
            'leads': {
                'total':         total_leads,
                'converted':     converted,
                'new_this_week': new_leads_week,
                'conversion_rate': conv_rate,
            },
            'content': {
                'videos_completed':  videos_completed,
                'total_watch_hours': total_watch_hours,
            },
            'tools': {
                'total_leads':    tool_leads,
                'total_sessions': tool_sessions,
            },
        })


class AdminRevenueView(APIView):
    """GET /api/v1/admin/revenue/ — Revenue breakdown by plan, exam, method."""
    permission_classes = [IsAdmin]

    @method_decorator(cache_page(CACHE_5_MIN))
    def get(self, request):
        from apps.payments.models import Order

        days = int(request.query_params.get('days', 90))
        since = timezone.now() - timedelta(days=days)

        paid_orders = Order.objects.filter(status='paid', paid_at__gte=since)

        # Monthly revenue
        monthly = list(
            paid_orders
            .annotate(month=TruncMonth('paid_at'))
            .values('month')
            .annotate(
                revenue=Sum('total_amount'),
                orders=Count('id'),
            )
            .order_by('month')
        )

        # By exam
        by_exam = list(
            paid_orders
            .values('plan__exam__name', 'plan__exam__slug')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('-revenue')[:10]
        )

        # By plan
        by_plan = list(
            paid_orders
            .values('plan__name', 'plan__exam__slug')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('-revenue')[:10]
        )

        # By payment method
        by_method = list(
            paid_orders
            .exclude(payment_method='')
            .values('payment_method')
            .annotate(count=Count('id'), revenue=Sum('total_amount'))
            .order_by('-revenue')
        )

        # Recent orders
        recent = list(
            paid_orders
            .select_related('user', 'plan__exam')
            .order_by('-paid_at')[:20]
            .values(
                'id', 'razorpay_order_id', 'invoice_number',
                'user__email', 'plan__name', 'plan__exam__slug',
                'total_amount', 'payment_method', 'paid_at',
            )
        )

        total = paid_orders.aggregate(t=Sum('total_amount'))['t'] or 0

        return Response({
            'total_revenue': float(total),
            'period_days':   days,
            'monthly':  [{'month': str(m['month'])[:7], 'revenue': float(m['revenue']),
                          'orders': m['orders']} for m in monthly],
            'by_exam':  [{'exam': e['plan__exam__name'], 'slug': e['plan__exam__slug'],
                          'revenue': float(e['revenue']), 'orders': e['orders']}
                         for e in by_exam],
            'by_plan':  [{'plan': p['plan__name'], 'slug': p['plan__exam__slug'],
                          'revenue': float(p['revenue']), 'orders': p['orders']}
                         for p in by_plan],
            'by_method': [{'method': m['payment_method'], 'count': m['count'],
                           'revenue': float(m['revenue'])} for m in by_method],
            'recent_orders': [
                {**o, 'total_amount': float(o['total_amount']),
                 'paid_at': str(o['paid_at'])[:10]}
                for o in recent
            ],
        })


class AdminCohortView(APIView):
    """GET /api/v1/admin/cohorts/ — Cohort seat fill rates and enrollment counts."""
    permission_classes = [IsAdmin]

    @method_decorator(cache_page(CACHE_2_MIN))
    def get(self, request):
        from apps.courses.models import Course
        from apps.enrollments.models import Enrollment

        courses = (
            Course.objects
            .filter(status__in=['active', 'upcoming'])
            .select_related('exam')
            .order_by('exam__sort_order', '-start_date')
        )

        data = []
        for course in courses:
            enrolled = Enrollment.objects.filter(
                plan__exam=course.exam, status='active'
            ).count()

            data.append({
                'course_id':      course.id,
                'exam_name':      course.exam.name,
                'exam_slug':      course.exam.slug,
                'cohort_label':   course.cohort_label,
                'status':         course.status,
                'batch_size':     course.batch_size,
                'seats_filled':   course.seats_filled,
                'seats_available': course.seats_available,
                'fill_pct':       round((course.seats_filled / course.batch_size) * 100)
                                  if course.batch_size else 0,
                'active_enrollments': enrolled,
                'start_date':     str(course.start_date) if course.start_date else None,
            })

        return Response({'cohorts': data, 'total': len(data)})


class AdminToolsAnalyticsView(APIView):
    """GET /api/v1/admin/tools-analytics/ — Tool usage, lead gate stats, session scores."""
    permission_classes = [IsAdmin]

    @method_decorator(cache_page(CACHE_5_MIN))
    def get(self, request):
        from apps.tools.models import Tool, ToolLead, ToolSession

        tools = Tool.objects.filter(is_active=True).annotate(
            lead_count=Count('leads', distinct=True),
            session_count=Count('toolsession', distinct=True),
        ).order_by('-lead_count')

        tool_data = []
        for tool in tools:
            sessions = ToolSession.objects.filter(
                tool=tool, score_pct__isnull=False
            )
            avg_score = sessions.aggregate(a=Avg('score_pct'))['a']

            tool_data.append({
                'slug':          tool.slug,
                'name':          tool.name,
                'tool_type':     tool.tool_type,
                'lead_count':    tool.lead_count,
                'session_count': tool.session_count,
                'avg_score':     round(avg_score, 1) if avg_score else None,
            })

        # Lead gate conversion: leads who used a tool → became registered users
        from apps.accounts.models import User
        tool_lead_emails = set(
            ToolLead.objects.values_list('email', flat=True)
        )
        converted_to_user = User.objects.filter(
            email__in=tool_lead_emails
        ).count()

        return Response({
            'tools': tool_data,
            'total_tool_leads':      ToolLead.objects.count(),
            'total_sessions':        ToolSession.objects.count(),
            'tool_to_user_conv':     converted_to_user,
            'tool_to_user_conv_pct': round(
                (converted_to_user / len(tool_lead_emails)) * 100, 1
            ) if tool_lead_emails else 0,
        })


class AdminNotificationsAnalyticsView(APIView):
    """GET /api/v1/admin/notifications-analytics/ — In-app notification stats.
    WhatsApp (Interakt) is disabled. Enable by setting INTERAKT_API_KEY."""
    permission_classes = [IsAdmin]

    @method_decorator(cache_page(CACHE_5_MIN))
    def get(self, request):
        from apps.notifications.models import InAppNotification

        in_app_total  = InAppNotification.objects.count()
        in_app_read   = InAppNotification.objects.filter(is_read=True).count()
        in_app_unread = InAppNotification.objects.filter(is_read=False).count()

        return Response({
            'whatsapp': {
                'enabled': False,
                'message': 'WhatsApp (Interakt) is not configured. Set INTERAKT_API_KEY to enable.',
                'total': 0, 'sent': 0, 'delivered': 0, 'read': 0, 'failed': 0,
                'send_rate': 0, 'delivery_rate': 0, 'read_rate': 0, 'by_template': [],
            },
            'in_app': {
                'total':     in_app_total,
                'read':      in_app_read,
                'unread':    in_app_unread,
                'read_rate': round((in_app_read / in_app_total) * 100, 1) if in_app_total else 0,
            },
        })


# ── URLS ──────────────────────────────────────────────────────────────────────

urlpatterns = [
    path('overview/',                  AdminOverviewView.as_view(),                name='overview'),
    path('revenue/',                   AdminRevenueView.as_view(),                 name='revenue'),
    path('cohorts/',                   AdminCohortView.as_view(),                  name='cohorts'),
    path('tools-analytics/',           AdminToolsAnalyticsView.as_view(),          name='tools-analytics'),
    path('notifications-analytics/',   AdminNotificationsAnalyticsView.as_view(),  name='notifications-analytics'),
]

app_name = 'admin_analytics'
