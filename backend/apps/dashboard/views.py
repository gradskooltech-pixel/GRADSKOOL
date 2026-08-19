"""
GRADSKOOL — Dashboard Views (M9)

GET /api/v1/dashboard/summary/         → Counts: enrolled courses, videos watched, etc.
GET /api/v1/dashboard/performance/     → Per-exam score trends (tool sessions)
GET /api/v1/dashboard/video-progress/  → All video progress records
GET /api/v1/dashboard/leads-activity/  → Tool sessions (for internal analytics — admin only)
"""
from django.db.models import Avg, Count, Max, Sum, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.urls import path

from apps.enrollments.models import Enrollment, CourseAccess
from apps.payments.models import Order
from apps.content.models import VideoProgress
from apps.tools.models import ToolSession, ToolLead



# ── SUMMARY ───────────────────────────────────────────────────────────────────

class DashboardSummaryView(APIView):
    """
    GET /api/v1/dashboard/summary/

    Returns aggregated counts for the current user.
    Used to populate the dashboard header cards.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Enrollments
        enrolled_exams = CourseAccess.objects.filter(user=user).count()
        active_enrollments = Enrollment.objects.filter(user=user, status='active').count()

        # Videos
        vp_qs = VideoProgress.objects.filter(user=user)
        videos_watched   = vp_qs.filter(watched_secs__gt=0).count()
        videos_completed = vp_qs.filter(is_completed=True).count()
        total_watch_time = vp_qs.aggregate(total=Sum('watched_secs'))['total'] or 0

        # Tool sessions
        tool_sessions = ToolSession.objects.filter(lead__email=user.email)
        sessions_count   = tool_sessions.count()
        questions_attempted = tool_sessions.aggregate(t=Sum('questions_seen'))['t'] or 0
        questions_correct   = tool_sessions.aggregate(t=Sum('questions_correct'))['t'] or 0
        avg_score = (
            round((questions_correct / questions_attempted) * 100, 1)
            if questions_attempted else None
        )

        # Payments
        total_spent = (
                Order.objects
                .filter(user=user, status='paid')
                .aggregate(t=Sum('total_amount'))['t'] or 0
        )

        return Response({
            'enrolled_exams':      enrolled_exams,
            'active_enrollments':  active_enrollments,
            'videos_watched':      videos_watched,
            'videos_completed':    videos_completed,
            'total_watch_mins':    round(total_watch_time / 60),
            'tool_sessions':       sessions_count,
            'questions_attempted': questions_attempted,
            'questions_correct':   questions_correct,
            'avg_score_pct':       avg_score,
            'total_spent_inr':     float(total_spent),
        })


# ── PERFORMANCE TREND ─────────────────────────────────────────────────────────

class PerformanceTrendView(APIView):
    """
    GET /api/v1/dashboard/performance/?days=30

    Returns per-session tool performance for the authenticated user.
    Used to render the performance line chart on the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)

        sessions = (
            ToolSession.objects
            .filter(
                lead__email=request.user.email,
                started_at__gte=since,
                score_pct__isnull=False,
            )
            .select_related('tool')
            .order_by('started_at')
        )

        data = [{
            'session_id':  s.id,
            'tool_name':   s.tool.name,
            'tool_slug':   s.tool.slug,
            'date':        s.started_at.date().isoformat(),
            'score_pct':   s.score_pct,
            'correct':     s.questions_correct,
            'total':       s.questions_seen,
        } for s in sessions]

        # Per-tool breakdown
        tool_breakdown = {}
        for d in data:
            slug = d['tool_slug']
            if slug not in tool_breakdown:
                tool_breakdown[slug] = {'name': d['tool_name'], 'sessions': [], 'avg': 0}
            tool_breakdown[slug]['sessions'].append(d['score_pct'])

        for slug, tb in tool_breakdown.items():
            if tb['sessions']:
                tb['avg'] = round(sum(tb['sessions']) / len(tb['sessions']), 1)

        return Response({
            'sessions':      data,
            'tool_breakdown': list(tool_breakdown.values()),
            'period_days':   days,
        })


# ── VIDEO PROGRESS SUMMARY ────────────────────────────────────────────────────

class VideoProgressSummaryView(APIView):
    """
    GET /api/v1/dashboard/video-progress/

    Returns all video progress for the user, grouped by exam.
    Used to show progress bars in the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress_qs = (
            VideoProgress.objects
            .filter(user=request.user)
            .select_related(
                'video__course__exam',
                'video__module',
            )
            .order_by('-updated_at')
        )

        # Group by exam
        by_exam = {}
        for vp in progress_qs:
            exam_slug = vp.video.course.exam.slug
            exam_name = vp.video.course.exam.name
            if exam_slug not in by_exam:
                by_exam[exam_slug] = {
                    'exam_slug':  exam_slug,
                    'exam_name':  exam_name,
                    'total':      0,
                    'watched':    0,
                    'completed':  0,
                    'videos':     [],
                }
            by_exam[exam_slug]['total']    += 1
            by_exam[exam_slug]['watched']  += 1 if vp.watched_secs > 0 else 0
            by_exam[exam_slug]['completed'] += 1 if vp.is_completed else 0
            by_exam[exam_slug]['videos'].append({
                'bunny_video_id': vp.video.bunny_video_id,
                'title':          vp.video.title,
                'module':         vp.video.module.title if vp.video.module else None,
                'last_position':  vp.last_position,
                'is_completed':   vp.is_completed,
                'updated_at':     vp.updated_at.isoformat(),
            })

        for exam in by_exam.values():
            total = exam['total']
            exam['completion_pct'] = round((exam['completed'] / total) * 100) if total else 0

        return Response({
            'by_exam': list(by_exam.values()),
            'total_videos':    sum(e['total']     for e in by_exam.values()),
            'total_completed': sum(e['completed'] for e in by_exam.values()),
        })


# ── RECENT ACTIVITY ───────────────────────────────────────────────────────────

class RecentActivityView(APIView):
    """
    GET /api/v1/dashboard/activity/

    Returns a unified timeline of recent activity:
      - Videos watched
      - Tool sessions completed
      - Enrollments
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = []

        # Recent video progress
        for vp in VideoProgress.objects.filter(
                user=request.user,
                watched_secs__gt=30,
        ).select_related('video__course__exam').order_by('-updated_at')[:10]:
            events.append({
                'type':        'video',
                'title':       vp.video.title,
                'exam':        vp.video.course.exam.short_name,
                'is_completed': vp.is_completed,
                'timestamp':   vp.updated_at.isoformat(),
                'url':         f'/watch/{vp.video.course.exam.slug}/{vp.video.bunny_video_id}',
            })

        # Recent tool sessions
        for s in ToolSession.objects.filter(
                lead__email=request.user.email,
                ended_at__isnull=False,
        ).select_related('tool').order_by('-started_at')[:10]:
            events.append({
                'type':      'tool_session',
                'title':     s.tool.name,
                'score_pct': s.score_pct,
                'correct':   s.questions_correct,
                'total':     s.questions_seen,
                'timestamp': s.started_at.isoformat(),
                'url':       f'/tools/{s.tool.slug}',
            })

        # Sort unified timeline by timestamp desc
        events.sort(key=lambda e: e['timestamp'], reverse=True)
        return Response({'events': events[:15]})



# ── ADMIN MANAGEMENT VIEWS ────────────────────────────────────────────────────


class AdminStudentListView(APIView):
    """
    GET /api/v1/dashboard/students/
    Admin: paginated student list with enrollment counts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.accounts.models import User
        from apps.enrollments.models import Enrollment
        from django.db.models import Count, Q

        qs = User.objects.annotate(
            active_enrollments=Count(
                'enrollments',
                filter=Q(enrollments__status='active')
            )
        ).order_by('-date_joined')

        search = request.query_params.get('search', '')
        filter_by = request.query_params.get('filter', 'all')

        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        if filter_by == 'enrolled':
            qs = qs.filter(active_enrollments__gt=0)
        elif filter_by == 'not_enrolled':
            qs = qs.filter(active_enrollments=0)

        per_page = int(request.query_params.get('per_page', 20))
        page     = int(request.query_params.get('page', 1))
        total    = qs.count()
        start    = (page - 1) * per_page
        students = qs[start:start + per_page]

        results = []
        for u in students:
            enrollments = Enrollment.objects.filter(
                user=u
            ).select_related('plan__exam').order_by('-enrolled_at')

            results.append({
                'id':                u.id,
                'email':             u.email,
                'first_name':        u.first_name,
                'last_name':         u.last_name,
                'target_exam':       getattr(u, 'target_exam', ''),
                'date_joined':       u.date_joined.isoformat(),
                'is_email_verified': getattr(u, 'is_email_verified', u.is_active),
                'active_enrollments': u.active_enrollments,
                'enrollments': [
                    {
                        'id':          e.id,
                        'exam_name':   e.plan.exam.name,
                        'plan_name':   e.plan.name,
                        'status':      e.status,
                        'enrolled_at': e.enrolled_at.strftime('%Y-%m-%d'),
                    }
                    for e in enrollments
                ],
            })

        return Response({'results': results, 'count': total})


class AdminEnrollmentListView(APIView):
    """
    GET /api/v1/dashboard/enrollments/
    Admin: paginated enrollment list.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.enrollments.models import Enrollment, CourseAccess

        qs = Enrollment.objects.select_related(
            'user', 'plan__exam'
        ).order_by('-enrolled_at')

        search = request.query_params.get('search', '')
        status = request.query_params.get('status', 'active')
        exam   = request.query_params.get('exam', '')

        if search:
            qs = qs.filter(user__email__icontains=search)
        if status and status != 'all':
            qs = qs.filter(status=status)
        if exam:
            qs = qs.filter(plan__exam__slug=exam)

        per_page = int(request.query_params.get('per_page', 25))
        page     = int(request.query_params.get('page', 1))
        total    = qs.count()
        start    = (page - 1) * per_page
        items    = qs[start:start + per_page]

        results = []
        for e in items:
            # Get access flags
            try:
                access = CourseAccess.objects.get(
                    user=e.user, exam=e.plan.exam
                )
                live  = access.can_attend_live
                rec   = access.can_watch_recordings
                mocks = access.can_take_mocks
            except CourseAccess.DoesNotExist:
                live = rec = mocks = False

            results.append({
                'id':                e.id,
                'student_email':     e.user.email,
                'student_name':      f'{e.user.first_name} {e.user.last_name}'.strip(),
                'exam_slug':         e.plan.exam.slug,
                'plan_name':         e.plan.name,
                'status':            e.status,
                'enrolled_at':       e.enrolled_at.isoformat(),
                'can_attend_live':   live,
                'can_watch_recordings': rec,
                'can_take_mocks':    mocks,
            })

        return Response({'results': results, 'count': total})


class AdminEnrollmentActionView(APIView):
    """
    POST /api/v1/dashboard/enrollments/{id}/suspend/
    POST /api/v1/dashboard/enrollments/{id}/reactivate/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, action):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.enrollments.models import Enrollment
        from apps.enrollments.services import rebuild_access

        try:
            enrollment = Enrollment.objects.get(pk=pk)
        except Enrollment.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if action == 'suspend':
            enrollment.status = 'suspended'
        elif action == 'reactivate':
            enrollment.status = 'active'
        else:
            return Response({'error': 'Unknown action'}, status=400)

        enrollment.save(update_fields=['status'])
        rebuild_access(enrollment.user, enrollment.plan.exam)

        return Response({'status': enrollment.status})


class AdminEnrolView(APIView):
    """
    POST /api/v1/dashboard/admin-enrol/
    Manually enrol a student — no payment required.
    Body: { email, plan_slug, access: 'full'|'recordings'|'mocks' }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.accounts.models import User
        from apps.courses.models import PricingPlan
        from apps.enrollments.models import Enrollment, CourseAccess
        from apps.enrollments.services import rebuild_access
        from apps.learn.services import unlock_all_topic_first_videos
        from django.utils import timezone

        email     = request.data.get('email') or ''
        plan_slug = request.data.get('plan_slug', '')
        access    = request.data.get('access', 'full')

        # Support user_id too (from student detail panel)
        user_id = request.data.get('user_id')

        try:
            user = User.objects.get(id=user_id) if user_id else User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': f'User not found: {email or user_id}'}, status=404)

        try:
            plan = PricingPlan.objects.select_related('exam').get(slug=plan_slug)
        except PricingPlan.DoesNotExist:
            return Response({'error': f'Plan not found: {plan_slug}'}, status=404)

        # Create enrollment (no order required)
        enrollment, created = Enrollment.objects.get_or_create(
            user=user,
            plan=plan,
            defaults={'status': 'active', 'enrolled_at': timezone.now()}
        )
        if not created:
            enrollment.status = 'active'
            enrollment.save(update_fields=['status'])

        # Build access flags
        flags = {
            'can_watch_recordings': True,
            'can_attend_live':      access == 'full',
            'can_take_mocks':       access in ('full', 'mocks'),
            'can_download_books':   access == 'full',
            'can_access_gdpi':      access == 'full',
        }

        CourseAccess.objects.update_or_create(
            user=user, exam=plan.exam, defaults=flags
        )

        # Unlock first video of every topic
        try:
            unlock_all_topic_first_videos(user, plan.exam.slug)
        except Exception:
            pass  # No videos yet — that's fine

        return Response({
            'success':    True,
            'user_email': user.email,
            'exam':       plan.exam.slug,
            'plan':       plan.name,
            'created':    created,
        })


class AdminOrderListView(APIView):
    """
    GET /api/v1/dashboard/orders/
    Admin: paginated order list.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.payments.models import Order

        qs = Order.objects.select_related(
            'user', 'plan__exam'
        ).order_by('-created_at')

        search = request.query_params.get('search', '')
        status = request.query_params.get('status', 'all')

        if search:
            qs = qs.filter(user__email__icontains=search)
        if status and status != 'all':
            qs = qs.filter(status=status)

        per_page = int(request.query_params.get('per_page', 25))
        page     = int(request.query_params.get('page', 1))
        total    = qs.count()
        start    = (page - 1) * per_page
        items    = qs[start:start + per_page]

        results = []
        for o in items:
            results.append({
                'id':                 o.id,
                'razorpay_order_id':  getattr(o, 'razorpay_order_id', ''),
                'student_email':      o.user.email,
                'student_name':       f'{o.user.first_name} {o.user.last_name}'.strip(),
                'exam_slug':          o.plan.exam.slug if o.plan else '',
                'plan_name':          o.plan.name if o.plan else '',
                'amount_inr':         str(o.amount_inr),
                'status':             o.status,
                'created_at':         o.created_at.isoformat(),
            })

        return Response({'results': results, 'count': total})


class AdminProgrammeListView(APIView):
    """
    GET /api/v1/dashboard/programmes/
    Returns all exams with their plans and per-plan settings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.courses.models import Exam, PricingPlan, ProgrammeSettings

        exams = Exam.objects.filter(is_active=True).prefetch_related(
            'plans', 'plans__settings'
        ).order_by('sort_order')

        result = []
        for exam in exams:
            plans = []
            for plan in exam.plans.all().order_by('sort_order'):
                try:
                    s = plan.settings
                except ProgrammeSettings.DoesNotExist:
                    # Auto-create defaults
                    s = ProgrammeSettings.objects.create(
                        plan=plan,
                        show_live=plan.includes_live if hasattr(plan, 'includes_live') else False,
                    )

                plans.append({
                    'id':                    plan.id,
                    'name':                  plan.name,
                    'slug':                  plan.slug,
                    'price_inr':             str(plan.price_inr),
                    'show_videos':           s.show_videos,
                    'show_practice_quiz':    s.show_practice_quiz,
                    'show_cheat_sheets':     s.show_cheat_sheets,
                    'show_live':             s.show_live,
                    'show_mocks':            s.show_mocks,
                    'show_books':            s.show_books,
                    'show_gdpi':             s.show_gdpi,
                    'mocks_redirect_url':    s.mocks_redirect_url,
                    'continue_learning_url': s.continue_learning_url,
                    'cta_label':             s.cta_label,
                    'card_note':             s.card_note,
                })

            from apps.enrollments.models import Enrollment
            enrolled = Enrollment.objects.filter(
                plan__exam=exam, status='active'
            ).count()

            result.append({
                'id':           exam.id,
                'slug':         exam.slug,
                'name':         exam.name,
                'short':        exam.short_name,
                'cohort_size':  exam.cohort_size,
                'enrolled':     enrolled,
                'remaining':    max(0, exam.cohort_size - enrolled),
                'plans':        plans,
            })

        return Response(result)


class AdminProgrammeSettingsView(APIView):
    """
    PATCH /api/v1/dashboard/programmes/plan/{plan_id}/
    Update settings for a single plan.
    Body: { show_videos, show_practice_quiz, show_cheat_sheets,
            show_live, show_mocks, show_books, show_gdpi, mocks_redirect_url }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, plan_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.courses.models import PricingPlan, ProgrammeSettings

        try:
            plan = PricingPlan.objects.get(id=plan_id)
        except PricingPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)

        settings, _ = ProgrammeSettings.objects.get_or_create(plan=plan)

        fields = [
            'show_videos', 'show_practice_quiz', 'show_cheat_sheets',
            'show_live', 'show_mocks', 'show_books', 'show_gdpi',
            'mocks_redirect_url',
        ]
        for field in fields:
            if field in request.data:
                setattr(settings, field, request.data[field])

        settings.save()
        return Response({'success': True, 'plan_id': plan_id})


class AdminExamCohortSizeView(APIView):
    """
    PATCH /api/v1/dashboard/programmes/exam/{exam_id}/cohort-size/
    Update cohort_size for an exam.
    Body: { cohort_size: 27 }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, exam_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.courses.models import Exam

        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=404)

        size = request.data.get('cohort_size')
        if size is None or not str(size).isdigit() or int(size) < 1:
            return Response({'error': 'Invalid cohort_size'}, status=400)

        exam.cohort_size = int(size)
        exam.save(update_fields=['cohort_size'])

        from apps.enrollments.models import Enrollment
        enrolled  = Enrollment.objects.filter(plan__exam=exam, status='active').count()
        remaining = max(0, exam.cohort_size - enrolled)

        return Response({
            'success':      True,
            'cohort_size':  exam.cohort_size,
            'enrolled':     enrolled,
            'remaining':    remaining,
        })



# ── TOOLS ADMIN VIEWS ────────────────────────────────────────────────────────

class AdminToolListView(APIView):
    """GET /api/v1/dashboard/tools-admin/ — all tools with question counts"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.tools.models import Tool, Question
        tools = Tool.objects.all().order_by('sort_order')
        return Response([{
            'id':               t.id,
            'slug':             t.slug,
            'name':             t.name,
            'description':      t.description,
            'tool_type':        t.tool_type,
            'is_active':        t.is_active,
            'access_model':     t.access_model,
            'price_inr':        str(t.price_inr) if t.price_inr else None,
            'razorpay_plan_id': t.razorpay_plan_id,
            'preview_questions':t.preview_questions,
            'badge_text':       t.badge_text,
            'question_count':   Question.objects.filter(tools=t).count(),
            'sort_order':       t.sort_order,
        } for t in tools])

    def patch(self, request):
        """PATCH /api/v1/dashboard/tools-admin/ — bulk update tool settings"""
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.tools.models import Tool
        tool_id = request.data.get('id')
        try:
            tool = Tool.objects.get(id=tool_id)
        except Tool.DoesNotExist:
            return Response({'error': 'Tool not found'}, status=404)

        fields = ['name','description','is_active','access_model',
                  'price_inr','razorpay_plan_id','preview_questions','badge_text','sort_order']
        for f in fields:
            if f in request.data:
                val = request.data[f]
                if val == '': val = None
                setattr(tool, f, val)
        tool.save()
        return Response({'success': True})


class AdminToolQuestionsView(APIView):
    """
    GET  /api/v1/dashboard/tools-admin/{tool_id}/questions/  — list questions
    POST /api/v1/dashboard/tools-admin/{tool_id}/questions/  — create question
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, tool_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.tools.models import Tool, Question, QuestionOption
        try:
            tool = Tool.objects.get(id=tool_id)
        except Tool.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        page     = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 30))
        search   = request.query_params.get('search', '')
        diff     = request.query_params.get('difficulty', '')

        qs = Question.objects.filter(tools=tool).prefetch_related('options', 'tags')
        if search:
            qs = qs.filter(text__icontains=search)
        if diff:
            qs = qs.filter(tags__name__iexact=diff, tags__tag_type='difficulty')

        total = qs.count()
        start = (page - 1) * per_page
        items = qs[start:start+per_page]

        results = []
        for q in items:
            options = [{'id':o.id,'label':o.label,'text':o.text,'is_correct':o.is_correct}
                       for o in q.options.all()]
            tags = [{'name':t.name,'type':t.tag_type} for t in q.tags.all()]
            results.append({
                'id':          q.id,
                'text':        q.text,
                'q_type':      q.q_type,
                'explanation': q.explanation,
                'options':     options,
                'tags':        tags,
                'difficulty':  next((t['name'] for t in tags if t['type']=='difficulty'), ''),
                'topic':       next((t['name'] for t in tags if t['type']=='topic'), ''),
            })
        return Response({'results': results, 'count': total, 'total_pages': (total + per_page - 1) // per_page})

    def post(self, request, tool_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.tools.models import Tool, Question, QuestionOption, Tag
        try:
            tool = Tool.objects.get(id=tool_id)
        except Tool.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        text     = request.data.get('text', '').strip()
        options  = request.data.get('options', [])
        exp      = request.data.get('explanation', '')
        diff     = request.data.get('difficulty', 'Medium')
        topic    = request.data.get('topic', '')
        q_type   = request.data.get('q_type', 'mcq')

        if not text:
            return Response({'error': 'Question text required'}, status=400)

        q = Question.objects.create(text=text, explanation=exp, q_type=q_type)
        q.tools.add(tool)

        for opt in options:
            QuestionOption.objects.create(
                question=q, label=opt.get('label','A'),
                text=opt.get('text',''), is_correct=opt.get('is_correct', False)
            )

        # Tags
        for tag_name, tag_type in [(diff,'difficulty'),(topic,'topic')]:
            if tag_name:
                from django.utils.text import slugify
                tag, _ = Tag.objects.get_or_create(
                    name=tag_name, defaults={'slug':slugify(tag_name),'tag_type':tag_type}
                )
                q.tags.add(tag)

        # Update cached count
        tool.question_count = Question.objects.filter(tools=tool).count()
        tool.save(update_fields=['question_count'])

        return Response({'success': True, 'id': q.id}, status=201)


class AdminToolQuestionDetailView(APIView):
    """
    PATCH  /api/v1/dashboard/tools-admin/questions/{q_id}/ — edit
    DELETE /api/v1/dashboard/tools-admin/questions/{q_id}/ — delete
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, q_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.tools.models import Question, QuestionOption, Tag
        try:
            q = Question.objects.get(id=q_id)
        except Question.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if 'text' in request.data: q.text = request.data['text']
        if 'explanation' in request.data: q.explanation = request.data['explanation']
        q.save()

        if 'options' in request.data:
            q.options.all().delete()
            for opt in request.data['options']:
                QuestionOption.objects.create(
                    question=q, label=opt.get('label','A'),
                    text=opt.get('text',''), is_correct=opt.get('is_correct',False)
                )
        return Response({'success': True})

    def delete(self, request, q_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.tools.models import Question
        try:
            Question.objects.get(id=q_id).delete()
            return Response({'success': True})
        except Question.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ── BLOG ADMIN VIEWS ─────────────────────────────────────────────────────────

class AdminBlogPostListView(APIView):
    """
    GET  /api/v1/dashboard/blog/               — all posts (admin, includes drafts)
    POST /api/v1/dashboard/blog/               — create post
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.blog.models import BlogPost, BlogTag
        status = request.query_params.get('status', '')
        qs = BlogPost.objects.prefetch_related('tags').order_by('-created_at')
        if status: qs = qs.filter(status=status)

        return Response([{
            'id':          p.id,
            'slug':        p.slug,
            'title':       p.title,
            'status':      p.status,
            'is_featured': p.is_featured,
            'og_image_url':p.og_image_url,
            'tags':        [{'id':t.id,'name':t.name} for t in p.tags.all()],
            'published_at':p.published_at.isoformat() if p.published_at else None,
            'updated_at':  p.updated_at.isoformat(),
            'view_count':  p.view_count,
            'read_time_mins': p.read_time_mins,
            'word_count':  len(p.body.split()) if p.body else 0,
        } for p in qs])

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.blog.models import BlogPost, BlogTag
        from django.utils.text import slugify
        from django.utils import timezone

        title    = request.data.get('title','').strip()
        body     = request.data.get('body','').strip()
        if not title: return Response({'error':'Title required'}, status=400)

        # Auto-generate slug
        base_slug = request.data.get('slug') or slugify(title)
        slug = base_slug
        n = 1
        while BlogPost.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{n}'; n += 1

        words   = len(body.split()) if body else 0
        status  = request.data.get('status','draft')

        post = BlogPost.objects.create(
            slug         = slug,
            title        = title,
            body         = body,
            excerpt      = request.data.get('excerpt', body[:200] if body else ''),
            meta_title   = request.data.get('meta_title', title),
            meta_desc    = request.data.get('meta_desc',''),
            og_image_url = request.data.get('og_image_url',''),
            status       = status,
            is_featured  = request.data.get('is_featured', False),
            read_time_mins = max(1, words // 200),
            published_at = timezone.now() if status == 'published' else None,
            author       = request.user,
        )

        for tag_name in request.data.get('tags', []):
            tag, _ = BlogTag.objects.get_or_create(name=tag_name, defaults={'slug':slugify(tag_name)})
            post.tags.add(tag)

        return Response({'success':True,'slug':post.slug,'id':post.id}, status=201)


class AdminBlogPostDetailView(APIView):
    """
    GET    /api/v1/dashboard/blog/{slug}/    — full post for editing
    PATCH  /api/v1/dashboard/blog/{slug}/    — update
    DELETE /api/v1/dashboard/blog/{slug}/    — delete
    """
    permission_classes = [IsAuthenticated]

    def _get_post(self, slug):
        from apps.blog.models import BlogPost
        try: return BlogPost.objects.get(slug=slug)
        except BlogPost.DoesNotExist: return None

    def get(self, request, slug):
        if not (request.user.is_staff or request.user.role == 'admin'): return Response({'error':'Forbidden'}, status=403)
        post = self._get_post(slug)
        if not post: return Response({'error':'Not found'}, status=404)
        return Response({
            'id':          post.id,
            'slug':        post.slug,
            'title':       post.title,
            'body':        post.body,
            'excerpt':     post.excerpt,
            'meta_title':  post.meta_title,
            'meta_desc':   post.meta_desc,
            'og_image_url':post.og_image_url,
            'status':      post.status,
            'is_featured': post.is_featured,
            'tags':        [t.name for t in post.tags.all()],
            'read_time_mins': post.read_time_mins,
        })

    def patch(self, request, slug):
        if not (request.user.is_staff or request.user.role == 'admin'): return Response({'error':'Forbidden'}, status=403)
        from apps.blog.models import BlogPost, BlogTag
        from django.utils import timezone
        from django.utils.text import slugify as dslug
        post = self._get_post(slug)
        if not post: return Response({'error':'Not found'}, status=404)

        fields = ['title','body','excerpt','meta_title','meta_desc','og_image_url','is_featured']
        for f in fields:
            if f in request.data: setattr(post, f, request.data[f])

        # slug deliberately handled separately, not in the generic fields
        # list above — this was the actual bug (2026-08-19): the admin
        # panel's slug field silently did nothing on save, no matter what
        # was typed in, because it was never included in that loop at all.
        # Needs its own handling anyway, not just inclusion in the list —
        # slugs are unique (that's how _get_post() looks posts up by URL),
        # so a blind setattr() would let two posts collide and crash with
        # a raw IntegrityError on save() instead of a clean error message.
        if 'slug' in request.data:
            new_slug = (request.data['slug'] or '').strip()
            if not new_slug:
                return Response({'error': 'Slug cannot be empty.'}, status=400)
            if BlogPost.objects.exclude(pk=post.pk).filter(slug=new_slug).exists():
                return Response({'error': f'The slug "{new_slug}" is already used by another post.'}, status=400)
            post.slug = new_slug

        if 'status' in request.data:
            new_status = request.data['status']
            if new_status == 'published' and post.status != 'published':
                post.published_at = timezone.now()
            post.status = new_status

        if 'tags' in request.data:
            post.tags.clear()
            for tag_name in request.data['tags']:
                tag, _ = BlogTag.objects.get_or_create(name=tag_name, defaults={'slug':dslug(tag_name)})
                post.tags.add(tag)

        body = request.data.get('body', post.body) or ''
        post.read_time_mins = max(1, len(body.split()) // 200)
        post.save()
        return Response({'success': True})

    def delete(self, request, slug):
        if not (request.user.is_staff or request.user.role == 'admin'): return Response({'error':'Forbidden'}, status=403)
        post = self._get_post(slug)
        if not post: return Response({'error':'Not found'}, status=404)
        post.delete()
        return Response({'success': True})


class AdminBlogImageUploadView(APIView):
    """
    POST /api/v1/dashboard/blog/upload-image/
    Uploads an image to Bunny Storage, returns the CDN URL.
    Body: multipart/form-data with 'image' file field.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        import os, requests as req_lib
        from django.utils.crypto import get_random_string

        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image file provided'}, status=400)

        # Validate file type
        allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if image_file.content_type not in allowed:
            return Response({'error': 'Invalid file type. Use JPEG, PNG, WEBP or GIF.'}, status=400)

        # Max 5MB
        if image_file.size > 5 * 1024 * 1024:
            return Response({'error': 'File too large. Max 5MB.'}, status=400)

        bunny_storage_zone = os.environ.get('BUNNY_STORAGE_ZONE', 'gradskool')
        bunny_storage_key  = os.environ.get('BUNNY_STORAGE_KEY', '')
        bunny_cdn_url      = os.environ.get('BUNNY_CDN_URL', 'https://gradskool.b-cdn.net')

        if not bunny_storage_key:
            return Response({'error': 'Bunny Storage not configured. Add BUNNY_STORAGE_KEY to .env'}, status=500)

        ext      = image_file.name.split('.')[-1].lower()
        filename = f"blog/{get_random_string(16)}.{ext}"
        upload_url = f"https://storage.bunnycdn.com/{bunny_storage_zone}/{filename}"

        try:
            resp = req_lib.put(
                upload_url,
                data=image_file.read(),
                headers={
                    'AccessKey':     bunny_storage_key,
                    'Content-Type':  image_file.content_type,
                },
                timeout=30,
            )
            if resp.status_code not in (200, 201):
                return Response({'error': f'Bunny upload failed: {resp.status_code}'}, status=500)
        except Exception as e:
            return Response({'error': f'Upload error: {str(e)}'}, status=500)

        cdn_url = f"{bunny_cdn_url.rstrip('/')}/{filename}"
        return Response({'url': cdn_url, 'filename': filename})


# ── SITE SETTINGS ─────────────────────────────────────────────────────────────

class AdminSiteSettingsView(APIView):
    """
    GET  /api/v1/dashboard/site-settings/   — load settings
    PATCH /api/v1/dashboard/site-settings/  — save settings
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import SiteSettings
        s = SiteSettings.load()
        return Response({
            f.name: getattr(s, f.name)
            for f in s._meta.fields
            if f.name not in ('id',)
        })

    def patch(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import SiteSettings
        s = SiteSettings.load()
        excluded = ('id', 'updated_at')
        for field in s._meta.fields:
            if field.name in excluded:
                continue
            if field.name in request.data:
                setattr(s, field.name, request.data[field.name])
        s.save()
        return Response({'success': True})


# ── FAQs ADMIN ────────────────────────────────────────────────────────────────

class AdminFAQListView(APIView):
    """
    GET  /api/v1/dashboard/faqs/        — all FAQs (optionally ?exam=cat)
    POST /api/v1/dashboard/faqs/        — create FAQ
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import FAQ
        qs = FAQ.objects.select_related('exam').order_by('exam', 'category', 'sort_order')
        exam_slug = request.query_params.get('exam')
        if exam_slug == 'site':
            qs = qs.filter(exam__isnull=True)
        elif exam_slug:
            qs = qs.filter(exam__slug=exam_slug)
        return Response([{
            'id':         f.id,
            'exam_slug':  f.exam.slug if f.exam else None,
            'exam_name':  f.exam.short_name if f.exam else 'Site-wide',
            'category':   f.category,
            'question':   f.question,
            'answer':     f.answer,
            'sort_order': f.sort_order,
            'is_active':  f.is_active,
        } for f in qs])

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import FAQ, Exam
        exam = None
        if request.data.get('exam_slug'):
            try:
                exam = Exam.objects.get(slug=request.data['exam_slug'])
            except Exam.DoesNotExist:
                pass
        faq = FAQ.objects.create(
            exam       = exam,
            category   = request.data.get('category', 'general'),
            question   = request.data.get('question', ''),
            answer     = request.data.get('answer', ''),
            sort_order = request.data.get('sort_order', 0),
            is_active  = request.data.get('is_active', True),
        )
        return Response({'success': True, 'id': faq.id}, status=201)


class AdminFAQDetailView(APIView):
    """
    PATCH  /api/v1/dashboard/faqs/{id}/
    DELETE /api/v1/dashboard/faqs/{id}/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, faq_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import FAQ, Exam
        try:
            faq = FAQ.objects.get(id=faq_id)
        except FAQ.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for field in ['category', 'question', 'answer', 'sort_order', 'is_active']:
            if field in request.data:
                setattr(faq, field, request.data[field])
        if 'exam_slug' in request.data:
            if request.data['exam_slug']:
                try:
                    faq.exam = Exam.objects.get(slug=request.data['exam_slug'])
                except Exam.DoesNotExist:
                    pass
            else:
                faq.exam = None
        faq.save()
        return Response({'success': True})

    def delete(self, request, faq_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import FAQ
        try:
            FAQ.objects.get(id=faq_id).delete()
            return Response({'success': True})
        except FAQ.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ── MOCK SCHEDULE ADMIN ───────────────────────────────────────────────────────

class AdminMockScheduleView(APIView):
    """
    GET  /api/v1/dashboard/mock-schedule/?exam=cat
    POST /api/v1/dashboard/mock-schedule/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import MockScheduleEntry
        qs = MockScheduleEntry.objects.select_related('exam').order_by('exam', 'entry_type', '-sort_order')
        exam_slug = request.query_params.get('exam')
        if exam_slug:
            qs = qs.filter(exam__slug=exam_slug)
        return Response([{
            'id':           e.id,
            'exam_slug':    e.exam.slug,
            'exam_name':    e.exam.short_name,
            'entry_type':   e.entry_type,
            'name':         e.name,
            'release_date': e.release_date.isoformat() if e.release_date else None,
            'is_free':      e.is_free,
            'duration_mins':e.duration_mins,
            'sort_order':   e.sort_order,
            'is_active':    e.is_active,
            'is_live':      e.is_live,
            'testfunda_url':e.testfunda_url,
        } for e in qs])

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import MockScheduleEntry, Exam
        try:
            exam = Exam.objects.get(slug=request.data.get('exam_slug', 'cat'))
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=404)
        entry = MockScheduleEntry.objects.create(
            exam         = exam,
            entry_type   = request.data.get('entry_type', 'full_length'),
            name         = request.data.get('name', ''),
            release_date = request.data.get('release_date') or None,
            is_free      = request.data.get('is_free', False),
            duration_mins= request.data.get('duration_mins', 120),
            sort_order   = request.data.get('sort_order', 0),
            testfunda_url= request.data.get('testfunda_url', ''),
        )
        return Response({'success': True, 'id': entry.id}, status=201)


class AdminMockScheduleDetailView(APIView):
    """
    PATCH  /api/v1/dashboard/mock-schedule/{id}/
    DELETE /api/v1/dashboard/mock-schedule/{id}/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, entry_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import MockScheduleEntry
        try:
            e = MockScheduleEntry.objects.get(id=entry_id)
        except MockScheduleEntry.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for field in ['name', 'entry_type', 'duration_mins', 'is_free',
                      'sort_order', 'is_active', 'testfunda_url']:
            if field in request.data:
                setattr(e, field, request.data[field])
        if 'release_date' in request.data:
            e.release_date = request.data['release_date'] or None
        e.save()
        return Response({'success': True})

    def delete(self, request, entry_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import MockScheduleEntry
        try:
            MockScheduleEntry.objects.get(id=entry_id).delete()
            return Response({'success': True})
        except MockScheduleEntry.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ── TESTIMONIALS ADMIN ────────────────────────────────────────────────────────

class AdminTestimonialListView(APIView):
    """
    GET  /api/v1/dashboard/testimonials/
    POST /api/v1/dashboard/testimonials/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import Testimonial
        qs = Testimonial.objects.select_related('exam').order_by('exam', '-id')
        exam_slug = request.query_params.get('exam')
        if exam_slug:
            qs = qs.filter(exam__slug=exam_slug)
        return Response([{
            'id':           t.id,
            'exam_slug':    t.exam.slug if t.exam else None,
            'exam_name':    t.exam.short_name if t.exam else 'Homepage',
            'student_name': t.student_name,
            'detail':       t.detail,
            'text':         t.text,
            'rating':       t.rating,
            'photo_url':    t.photo_url,
            'is_active':    t.is_active,
        } for t in qs])

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import Testimonial, Exam
        exam = None
        if request.data.get('exam_slug'):
            try:
                exam = Exam.objects.get(slug=request.data['exam_slug'])
            except Exam.DoesNotExist:
                pass
        t = Testimonial.objects.create(
            exam         = exam,
            student_name = request.data.get('student_name', ''),
            detail       = request.data.get('detail', ''),
            text         = request.data.get('text', ''),
            rating       = request.data.get('rating', 5),
            photo_url    = request.data.get('photo_url', ''),
            is_active    = request.data.get('is_active', True),
        )
        return Response({'success': True, 'id': t.id}, status=201)


class AdminTestimonialDetailView(APIView):
    """
    PATCH  /api/v1/dashboard/testimonials/{id}/
    DELETE /api/v1/dashboard/testimonials/{id}/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, t_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import Testimonial, Exam
        try:
            t = Testimonial.objects.get(id=t_id)
        except Testimonial.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for field in ['student_name', 'detail', 'text', 'rating', 'photo_url', 'is_active']:
            if field in request.data:
                setattr(t, field, request.data[field])
        if 'exam_slug' in request.data:
            if request.data['exam_slug']:
                try:
                    t.exam = Exam.objects.get(slug=request.data['exam_slug'])
                except Exam.DoesNotExist:
                    pass
            else:
                t.exam = None
        t.save()
        return Response({'success': True})

    def delete(self, request, t_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import Testimonial
        try:
            Testimonial.objects.get(id=t_id).delete()
            return Response({'success': True})
        except Testimonial.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ── EXAM ADMIN (rich content) ──────────────────────────────────────────────────

class AdminExamListView(APIView):
    """GET /api/v1/dashboard/exams/ — all exams for admin"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import Exam
        exams = Exam.objects.order_by('sort_order')
        return Response([{
            'id': e.id, 'slug': e.slug, 'name': e.name, 'short_name': e.short_name,
            'tagline': e.tagline, 'category': e.category, 'is_active': e.is_active,
            'is_featured': e.is_featured, 'sort_order': e.sort_order,
            'cohort_size': e.cohort_size, 'exam_date': str(e.exam_date) if e.exam_date else None,
            'conducting_body': e.conducting_body, 'score_range': e.score_range,
            'og_image_url': e.og_image_url, 'meta_title': e.meta_title, 'meta_desc': e.meta_desc,
        } for e in exams])


class AdminExamDetailView(APIView):
    """
    GET   /api/v1/dashboard/exams/{slug}/   — full exam data for editing
    PATCH /api/v1/dashboard/exams/{slug}/   — update exam
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import Exam
        try:
            e = Exam.objects.get(slug=slug)
        except Exam.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response({
            'id': e.id, 'slug': e.slug, 'name': e.name, 'short_name': e.short_name,
            'tagline': e.tagline, 'description': e.description,
            'category': e.category, 'is_active': e.is_active, 'is_featured': e.is_featured,
            'sort_order': e.sort_order, 'cohort_size': e.cohort_size,
            'exam_date': str(e.exam_date) if e.exam_date else None,
            'conducting_body': e.conducting_body, 'score_range': e.score_range,
            'exam_overview': e.exam_overview, 'eligibility': e.eligibility,
            'key_dates': e.key_dates, 'exam_pattern': e.exam_pattern,
            'top_colleges': e.top_colleges,
            'og_image_url': e.og_image_url, 'meta_title': e.meta_title, 'meta_desc': e.meta_desc,
        })

    def patch(self, request, slug):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import Exam
        try:
            e = Exam.objects.get(slug=slug)
        except Exam.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        text_fields = ['name', 'short_name', 'tagline', 'description', 'category',
                       'conducting_body', 'score_range', 'exam_overview', 'eligibility',
                       'og_image_url', 'meta_title', 'meta_desc']
        json_fields = ['key_dates', 'exam_pattern', 'top_colleges']
        bool_fields = ['is_active', 'is_featured']
        int_fields  = ['sort_order', 'cohort_size']
        for f in text_fields + bool_fields + int_fields:
            if f in request.data:
                setattr(e, f, request.data[f])
        for f in json_fields:
            if f in request.data:
                setattr(e, f, request.data[f])
        if 'exam_date' in request.data:
            e.exam_date = request.data['exam_date'] or None
        e.save()
        return Response({'success': True})


# ── HOMEPAGE CONTENT ADMIN ────────────────────────────────────────────────────

class AdminHomepageContentView(APIView):
    """
    GET   /api/v1/dashboard/homepage-content/
    PATCH /api/v1/dashboard/homepage-content/
    Body: { key: 'hero_title', value: '...' }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import HomepageContent
        items = HomepageContent.objects.all()
        return Response({i.key: i.value for i in items})

    def patch(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import HomepageContent
        key   = request.data.get('key')
        value = request.data.get('value', '')
        if not key:
            return Response({'error': 'key required'}, status=400)
        obj, _ = HomepageContent.objects.update_or_create(
            key=key, defaults={'value': value}
        )
        return Response({'success': True, 'key': key})


# ── ADMIN: MANUAL ENROLLMENT ──────────────────────────────────────────────────

class AdminManualEnrollView(APIView):
    """
    POST /api/v1/dashboard/manual-enroll/

    Admin-only endpoint to manually enroll a student in a plan.
    Used for: testing, scholarship enrollments, demo access.

    Body: { email, plan_id, note }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)

        from apps.courses.models import PricingPlan
        from apps.accounts.models import User
        from apps.enrollments.models import Enrollment, CourseAccess
        from apps.enrollments.services import rebuild_access_for_user

        email   = request.data.get('email', '').strip().lower()
        plan_id = request.data.get('plan_id')
        note    = request.data.get('note', 'Manual enrollment by admin')

        if not email or not plan_id:
            return Response({'error': 'email and plan_id are required'}, status=400)

        # Get or create user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': f'No user found with email {email}. Ask student to register first.'}, status=404)

        # Get plan
        try:
            plan = PricingPlan.objects.select_related('exam').get(id=plan_id)
        except PricingPlan.DoesNotExist:
            return Response({'error': f'Plan {plan_id} not found'}, status=404)

        # Create enrollment (no order needed for manual)
        enrollment, created = Enrollment.objects.get_or_create(
            user=user,
            plan=plan,
            defaults={
                'status': 'active',
                'order':  None,
            }
        )
        if not created:
            enrollment.status = 'active'
            enrollment.save()

        # Rebuild CourseAccess
        try:
            rebuild_access_for_user(user)
        except Exception:
            pass  # Not critical — access will be rebuilt on next request

        return Response({
            'success': True,
            'enrollment_id': enrollment.id,
            'user': email,
            'plan': plan.name,
            'exam': plan.exam.name,
            'created': created,
            'note': note,
        }, status=201)


class AdminPricingPlansView(APIView):
    """
    Full CRUD for pricing plans (create/edit/delete), for the admin panel's
    Pricing Plans manager. Separate from AdminListPlansView below, which is
    a read-only simplified list used for the manual-enrollment dropdown.
    GET    /dashboard/pricing-plans/            — all plans (full detail) + exam list
    POST   /dashboard/pricing-plans/            — create
    PATCH  /dashboard/pricing-plans/<id>/       — update
    DELETE /dashboard/pricing-plans/<id>/       — delete
    """
    permission_classes = [IsAuthenticated]

    def _serialize(self, p):
        return {
            'id': p.id, 'exam_id': p.exam_id, 'exam_slug': p.exam.slug, 'exam_name': p.exam.short_name,
            'name': p.name, 'slug': p.slug, 'description': p.description,
            'price_inr': str(p.price_inr), 'original_price': str(p.original_price) if p.original_price else None,
            'badge_text': p.badge_text, 'is_featured': p.is_featured, 'is_active': p.is_active,
            'sort_order': p.sort_order, 'includes_live': p.includes_live, 'includes_mocks': p.includes_mocks,
            'includes_books': p.includes_books, 'includes_gdpi': p.includes_gdpi,
            'includes_recordings': p.includes_recordings, 'mock_exams_covered': p.mock_exams_covered,
            'razorpay_sku': p.razorpay_sku,
        }

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'): return Response({'error':'Forbidden'},status=403)
        from apps.courses.models import PricingPlan, Exam
        plans = PricingPlan.objects.select_related('exam').order_by('exam__sort_order', 'sort_order', 'price_inr')
        exams = list(Exam.objects.order_by('sort_order').values('id', 'slug', 'short_name'))
        return Response({'plans': [self._serialize(p) for p in plans], 'exams': exams})

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'): return Response({'error':'Forbidden'},status=403)
        from django.utils.text import slugify
        from apps.courses.models import PricingPlan, Exam
        d = request.data
        try:
            exam = Exam.objects.get(id=d.get('exam_id'))
        except Exam.DoesNotExist:
            return Response({'error': 'Invalid exam'}, status=400)
        slug = d.get('slug', '').strip() or slugify(d.get('name', ''))
        sku = d.get('razorpay_sku', '').strip() or f'{exam.slug}-{slug}'
        p = PricingPlan.objects.create(
            exam=exam, name=d.get('name', ''), slug=slug, description=d.get('description', ''),
            price_inr=d.get('price_inr', 0), original_price=d.get('original_price') or None,
            badge_text=d.get('badge_text', ''), is_featured=bool(d.get('is_featured', False)),
            is_active=bool(d.get('is_active', True)), sort_order=int(d.get('sort_order', 0)),
            includes_live=bool(d.get('includes_live', False)), includes_mocks=bool(d.get('includes_mocks', False)),
            includes_books=bool(d.get('includes_books', False)), includes_gdpi=bool(d.get('includes_gdpi', False)),
            includes_recordings=bool(d.get('includes_recordings', False)),
            mock_exams_covered=d.get('mock_exams_covered', []), razorpay_sku=sku,
        )
        return Response(self._serialize(p), status=201)

    def patch(self, request, plan_id):
        if not (request.user.is_staff or request.user.role == 'admin'): return Response({'error':'Forbidden'},status=403)
        from apps.courses.models import PricingPlan, Exam
        try:
            p = PricingPlan.objects.get(id=plan_id)
        except PricingPlan.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        d = request.data
        if 'exam_id' in d:
            try: p.exam = Exam.objects.get(id=d['exam_id'])
            except Exam.DoesNotExist: return Response({'error': 'Invalid exam'}, status=400)
        text_fields = ['name', 'slug', 'description', 'badge_text', 'razorpay_sku']
        for f in text_fields:
            if f in d: setattr(p, f, d[f])
        if 'price_inr' in d: p.price_inr = d['price_inr']
        if 'original_price' in d: p.original_price = d['original_price'] or None
        if 'sort_order' in d: p.sort_order = int(d['sort_order'])
        for f in ['is_featured', 'is_active', 'includes_live', 'includes_mocks', 'includes_books', 'includes_gdpi', 'includes_recordings']:
            if f in d: setattr(p, f, bool(d[f]))
        if 'mock_exams_covered' in d: p.mock_exams_covered = d['mock_exams_covered']
        p.save()
        return Response(self._serialize(p))

    def delete(self, request, plan_id):
        if not (request.user.is_staff or request.user.role == 'admin'): return Response({'error':'Forbidden'},status=403)
        from apps.courses.models import PricingPlan
        PricingPlan.objects.filter(id=plan_id).delete()
        return Response({'deleted': True})


class AdminListPlansView(APIView):
    """
    GET /api/v1/dashboard/plans/
    Returns all plans (for manual enrollment dropdown in admin panel)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import PricingPlan
        plans = PricingPlan.objects.select_related('exam').order_by('exam__sort_order', 'price_inr')
        return Response([{
            'id':        p.id,
            'name':      p.name,
            'exam':      p.exam.short_name,
            'exam_slug': p.exam.slug,
            'price':     str(p.price_inr),
            'badge':     p.badge_text or '',
        } for p in plans])


# ── DYNAMIC PAGES ─────────────────────────────────────────────────────────────

class DynamicPageListView(APIView):
    """
    GET  /api/v1/dashboard/pages/        — all pages (admin)
    POST /api/v1/dashboard/pages/        — create page
    """
    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import DynamicPage
        pages = DynamicPage.objects.all()
        return Response([{
            'id': p.id, 'slug': p.slug, 'title': p.title,
            'is_active': p.is_active, 'updated_at': p.updated_at.isoformat(),
            'block_count': len(p.blocks),
        } for p in pages])

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import DynamicPage
        from django.utils.text import slugify
        slug = request.data.get('slug') or slugify(request.data.get('title', 'new-page'))
        page = DynamicPage.objects.create(
            slug       = slug,
            title      = request.data.get('title', 'New Page'),
            is_active  = request.data.get('is_active', True),
            blocks     = request.data.get('blocks', []),
            meta_title = request.data.get('meta_title', ''),
            meta_desc  = request.data.get('meta_desc', ''),
            created_by = request.user.username,
        )
        return Response({'id': page.id, 'slug': page.slug}, status=201)

    permission_classes = [IsAuthenticated]


class DynamicPageDetailView(APIView):
    """
    GET    /api/v1/dashboard/pages/<slug>/   — get page (admin)
    PATCH  /api/v1/dashboard/pages/<slug>/   — update page
    DELETE /api/v1/dashboard/pages/<slug>/   — delete page
    """
    permission_classes = [IsAuthenticated]

    def _get_page(self, slug):
        from apps.courses.models import DynamicPage
        try:
            return DynamicPage.objects.get(slug=slug)
        except DynamicPage.DoesNotExist:
            return None

    def get(self, request, slug):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        page = self._get_page(slug)
        if not page:
            return Response({'error': 'Not found'}, status=404)
        return Response({
            'id': page.id, 'slug': page.slug, 'title': page.title,
            'is_active': page.is_active, 'blocks': page.blocks,
            'meta_title': page.meta_title, 'meta_desc': page.meta_desc,
            'created_at': page.created_at.isoformat(),
            'updated_at': page.updated_at.isoformat(),
        })

    def patch(self, request, slug):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        page = self._get_page(slug)
        if not page:
            return Response({'error': 'Not found'}, status=404)
        for field in ['title', 'is_active', 'blocks', 'meta_title', 'meta_desc']:
            if field in request.data:
                setattr(page, field, request.data[field])
        if 'slug' in request.data and request.data['slug'] != slug:
            page.slug = request.data['slug']
        page.save()
        return Response({'success': True, 'slug': page.slug})

    def delete(self, request, slug):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        page = self._get_page(slug)
        if not page:
            return Response({'error': 'Not found'}, status=404)
        page.delete()
        return Response({'success': True})


class DynamicPagePublicView(APIView):
    """
    GET /api/v1/pages/<slug>/   — public endpoint for frontend
    Returns page data if is_active=True, else 404.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        from apps.courses.models import DynamicPage
        try:
            page = DynamicPage.objects.get(slug=slug, is_active=True)
        except DynamicPage.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response({
            'slug': page.slug, 'title': page.title,
            'blocks': page.blocks,
            'meta_title': page.meta_title or page.title,
            'meta_desc': page.meta_desc,
        })


# ── MOCK CREDENTIALS (ADMIN) ──────────────────────────────────────────────────

class AdminMockCredentialListView(APIView):
    """
    GET  /api/v1/dashboard/mock-credentials/           — all credentials
    POST /api/v1/dashboard/mock-credentials/           — send credentials to student
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import MockCredential
        qs = MockCredential.objects.select_related('user', 'exam').order_by('-sent_at')
        exam_slug = request.query_params.get('exam')
        if exam_slug:
            qs = qs.filter(exam__slug=exam_slug)
        return Response([{
            'id':           c.id,
            'user_email':   c.user.email,
            'user_name':    c.user.get_full_name() or c.user.email,
            'exam_slug':    c.exam.slug if c.exam else None,
            'exam_name':    c.exam.short_name if c.exam else 'General',
            'username':     c.username,
            'password':     c.password,
            'platform_url': c.platform_url,
            'note':         c.note,
            'sent_at':      c.sent_at.isoformat(),
            'sent_by':      c.sent_by,
        } for c in qs])

    def post(self, request):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import MockCredential, Exam
        from apps.accounts.models import User
        email = request.data.get('user_email', '').strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': f'No user with email {email}'}, status=404)
        exam = None
        if request.data.get('exam_slug'):
            try:
                exam = Exam.objects.get(slug=request.data['exam_slug'])
            except Exam.DoesNotExist:
                pass
        cred = MockCredential.objects.create(
            user         = user,
            exam         = exam,
            username     = request.data.get('username', ''),
            password     = request.data.get('password', ''),
            platform_url = request.data.get('platform_url', ''),
            note         = request.data.get('note', ''),
            sent_by      = request.user.username,
        )
        return Response({'success': True, 'id': cred.id}, status=201)


class AdminMockCredentialDetailView(APIView):
    """
    PATCH  /api/v1/dashboard/mock-credentials/{id}/
    DELETE /api/v1/dashboard/mock-credentials/{id}/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, cred_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import MockCredential
        try:
            c = MockCredential.objects.get(id=cred_id)
        except MockCredential.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for field in ['username', 'password', 'platform_url', 'note']:
            if field in request.data:
                setattr(c, field, request.data[field])
        c.save()
        return Response({'success': True})

    def delete(self, request, cred_id):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Forbidden'}, status=403)
        from apps.courses.models import MockCredential
        try:
            MockCredential.objects.get(id=cred_id).delete()
            return Response({'success': True})
        except MockCredential.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class StudentMockCredentialsView(APIView):
    """
    GET /api/v1/enrollments/mock-credentials/
    Returns credentials for the logged-in student.
    Called by dashboard to show credentials card.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.courses.models import MockCredential
        creds = MockCredential.objects.filter(
            user=request.user
        ).select_related('exam').order_by('-sent_at')
        return Response([{
            'id':           c.id,
            'exam_slug':    c.exam.slug if c.exam else None,
            'exam_name':    c.exam.short_name if c.exam else 'General',
            'exam_color':   c.exam.category if c.exam else '',
            'username':     c.username,
            'password':     c.password,
            'platform_url': c.platform_url,
            'note':         c.note,
            'sent_at':      c.sent_at.isoformat(),
        } for c in creds])


# ── CURRICULUM ADMIN VIEWS ────────────────────────────────────────────────────

class AdminCurriculumView(APIView):
    """
    GET  /dashboard/curriculum/?exam=cat          → list all sections + topics
    POST /dashboard/curriculum/sections/          → create section
    PUT  /dashboard/curriculum/sections/<id>/     → update section
    DELETE /dashboard/curriculum/sections/<id>/   → delete section
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        exam_slug = request.query_params.get('exam', 'cat')
        from apps.courses.models import CurriculumModule, CurriculumTopic, Exam
        try:
            exam = Exam.objects.get(slug=exam_slug)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=404)

        modules = CurriculumModule.objects.filter(
            course__exam=exam
        ).prefetch_related('topics__topic_videos__video').order_by('number')

        data = []
        for m in modules:
            topics = []
            for t in m.topics.all().order_by('sort_order'):
                videos = []
                for tv in t.topic_videos.all().order_by('sort_order'):
                    videos.append({
                        'id':            tv.id,
                        'title':         tv.title,
                        'sort_order':    tv.sort_order,
                        'duration_mins': tv.duration_mins,
                        'difficulty':    tv.difficulty,
                        'bunny_video_id': tv.video.bunny_video_id if tv.video else '',
                        'youtube_video_id': tv.video.bunny_video_id if tv.video and tv.video.video_source == 'youtube' else '',
                        'video_source':  tv.video.video_source if tv.video else '',
                        'has_quiz':      tv.has_quiz,
                        'has_cheatsheet':tv.has_cheatsheet,
                        'has_live':      tv.has_live,
                        'live_description': tv.live_description,
                        'sub_tag':       tv.sub_tag,
                    })
                topics.append({
                    'id':         t.id,
                    'title':      t.title,
                    'slug':       t.slug,
                    'sort_order': t.sort_order,
                    'video_count': len(videos),
                    'videos':     videos,
                })
            data.append({
                'id':          m.id,
                'number':      m.number,
                'title':       m.title,
                'short_title': m.short_title,
                'slug':        m.slug,
                'topic_count': len(topics),
                'topics':      topics,
            })
        return Response({'exam': exam_slug, 'sections': data})


class AdminSectionView(APIView):
    """CRUD for curriculum sections (modules)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.courses.models import CurriculumModule, Course, Exam
        from django.utils.text import slugify
        d = request.data
        try:
            exam = Exam.objects.get(slug=d.get('exam_slug','cat'))
            course = Course.objects.filter(exam=exam).first()
            if not course: return Response({'error':'No course for this exam'},status=400)
            m = CurriculumModule.objects.create(
                course=course,
                number=d.get('number', CurriculumModule.objects.filter(course=course).count()+1),
                title=d['title'],
                short_title=d.get('short_title',''),
                slug=d.get('slug') or slugify(d.get('short_title') or d['title']),
                description=d.get('description',''),
            )
            return Response({'id':m.id,'title':m.title,'slug':m.slug}, status=201)
        except Exception as e:
            return Response({'error':str(e)},status=400)

    def put(self, request, section_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.courses.models import CurriculumModule
        try:
            m = CurriculumModule.objects.get(id=section_id)
            d = request.data
            for field in ['title','short_title','description']:
                if field in d: setattr(m, field, d[field])
            m.save()
            return Response({'id':m.id,'title':m.title})
        except CurriculumModule.DoesNotExist:
            return Response({'error':'Not found'},status=404)

    def delete(self, request, section_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.courses.models import CurriculumModule
        try:
            CurriculumModule.objects.get(id=section_id).delete()
            return Response({'deleted':True})
        except CurriculumModule.DoesNotExist:
            return Response({'error':'Not found'},status=404)


class AdminTopicView(APIView):
    """CRUD for topics within a section."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.courses.models import CurriculumTopic, CurriculumModule
        from django.utils.text import slugify
        d = request.data
        try:
            m = CurriculumModule.objects.get(id=d['section_id'])
            t = CurriculumTopic.objects.create(
                module=m,
                title=d['title'],
                slug=d.get('slug') or slugify(d['title']),
                sort_order=d.get('sort_order', CurriculumTopic.objects.filter(module=m).count()+1),
            )
            return Response({'id':t.id,'title':t.title,'slug':t.slug}, status=201)
        except Exception as e:
            return Response({'error':str(e)},status=400)

    def put(self, request, topic_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.courses.models import CurriculumTopic
        try:
            t = CurriculumTopic.objects.get(id=topic_id)
            for field in ['title','sort_order']:
                if field in request.data: setattr(t, field, request.data[field])
            t.save()
            return Response({'id':t.id,'title':t.title})
        except CurriculumTopic.DoesNotExist:
            return Response({'error':'Not found'},status=404)

    def delete(self, request, topic_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.courses.models import CurriculumTopic
        try:
            CurriculumTopic.objects.get(id=topic_id).delete()
            return Response({'deleted':True})
        except CurriculumTopic.DoesNotExist:
            return Response({'error':'Not found'},status=404)


class AdminVideoView(APIView):
    """CRUD for videos within a topic."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.courses.models import CurriculumTopic
        from apps.learn.models import TopicVideo
        from apps.content.models import VideoLibrary
        from apps.courses.models import Course
        d = request.data
        try:
            topic = CurriculumTopic.objects.get(id=d['topic_id'])
            video_source = d.get('video_source','bunny')
            video_id     = d.get('bunny_video_id','').strip()

            video = None
            if video_id:
                video, _ = VideoLibrary.objects.get_or_create(
                    bunny_video_id=video_id,
                    defaults={
                        'title':        d.get('title',''),
                        'course':       Course.objects.filter(exam=topic.module.course.exam).first(),
                        'video_source': video_source,
                        'duration_secs': int(d.get('duration_mins',10)) * 60,
                        'is_published': True,
                    }
                )

            sort_order = d.get('sort_order',
                               TopicVideo.objects.filter(topic=topic).count() + 1)

            tv = TopicVideo.objects.create(
                topic=topic,
                video=video,
                title=d.get('title',''),
                sort_order=sort_order,
                duration_mins=int(d.get('duration_mins',10)),
                difficulty=d.get('difficulty','beginner'),
                has_quiz=bool(d.get('has_quiz',False)),
                has_cheatsheet=bool(d.get('has_cheatsheet',True)),
                has_live=bool(d.get('has_live',False)),
                live_description=d.get('live_description',''),
                sub_tag=d.get('sub_tag',''),
            )
            return Response({
                'id':tv.id,'title':tv.title,
                'bunny_video_id': video.bunny_video_id if video else '',
                'sort_order':tv.sort_order,
            }, status=201)
        except Exception as e:
            return Response({'error':str(e)},status=400)

    def put(self, request, video_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import TopicVideo
        from apps.content.models import VideoLibrary
        try:
            tv = TopicVideo.objects.get(id=video_id)
            d  = request.data
            for field in ['title','duration_mins','difficulty','has_quiz','has_cheatsheet','has_live','live_description','sub_tag','sort_order']:
                if field in d: setattr(tv, field, d[field])

            # Update video ID if provided
            vid_id = d.get('bunny_video_id','').strip()
            if vid_id:
                if tv.video:
                    tv.video.bunny_video_id = vid_id
                    tv.video.save()
                else:
                    from apps.courses.models import Course
                    v, _ = VideoLibrary.objects.get_or_create(
                        bunny_video_id=vid_id,
                        defaults={
                            'title': tv.title,
                            'course': Course.objects.filter(exam=tv.topic.module.course.exam).first(),
                            'video_source': d.get('video_source','bunny'),
                            'duration_secs': tv.duration_mins * 60,
                            'is_published': True,
                        }
                    )
                    tv.video = v

            tv.save()
            return Response({'id':tv.id,'title':tv.title})
        except TopicVideo.DoesNotExist:
            return Response({'error':'Not found'},status=404)

    def delete(self, request, video_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import TopicVideo
        try:
            TopicVideo.objects.get(id=video_id).delete()
            return Response({'deleted':True})
        except TopicVideo.DoesNotExist:
            return Response({'error':'Not found'},status=404)


class AdminQuizQuestionView(APIView):
    """CRUD for quiz questions attached to a topic video."""
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import TopicVideo
        from apps.tools.models import Question
        try:
            tv = TopicVideo.objects.get(id=video_id)
            if tv.quiz_source:
                questions = Question.objects.filter(
                    topic=tv.quiz_source
                ).prefetch_related('options').order_by('id')
                data = []
                for q in questions:
                    data.append({
                        'id': q.id,
                        'text': q.text,
                        'explanation': q.explanation,
                        'options': [
                            {'id':o.id,'key':o.key,'text':o.text,'is_correct':o.is_correct}
                            for o in q.options.all()
                        ]
                    })
                return Response({'questions': data, 'count': len(data)})
            return Response({'questions':[], 'count':0})
        except TopicVideo.DoesNotExist:
            return Response({'error':'Not found'},status=404)

    def post(self, request, video_id):
        """Add a question to a video's quiz."""
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import TopicVideo
        from apps.tools.models import Question, QuestionOption, QATopic
        d = request.data
        try:
            tv = TopicVideo.objects.get(id=video_id)
            # Create or get QATopic for this video
            if not tv.quiz_source:
                qa_topic, _ = QATopic.objects.get_or_create(
                    name=f'{tv.topic.title} — Video {tv.sort_order}',
                    defaults={'exam_slug': tv.topic.module.course.exam.slug}
                )
                tv.quiz_source = qa_topic
                tv.has_quiz    = True
                tv.save()

            q = Question.objects.create(
                topic=tv.quiz_source,
                text=d['text'],
                explanation=d.get('explanation',''),
                difficulty=d.get('difficulty','medium'),
            )
            options = d.get('options', [])
            for opt in options:
                QuestionOption.objects.create(
                    question=q,
                    key=opt['key'],
                    text=opt['text'],
                    is_correct=opt.get('is_correct', False),
                )
            return Response({'id':q.id,'text':q.text,'options':len(options)}, status=201)
        except TopicVideo.DoesNotExist:
            return Response({'error':'Video not found'},status=404)
        except Exception as e:
            return Response({'error':str(e)},status=400)

    def put(self, request, video_id, question_id=None):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.tools.models import Question, QuestionOption
        d = request.data
        try:
            q = Question.objects.get(id=question_id)
            if 'text'        in d: q.text        = d['text']
            if 'explanation' in d: q.explanation  = d['explanation']
            if 'difficulty'  in d: q.difficulty   = d['difficulty']
            q.save()
            if 'options' in d:
                q.options.all().delete()
                for opt in d['options']:
                    QuestionOption.objects.create(
                        question=q, key=opt['key'],
                        text=opt['text'], is_correct=opt.get('is_correct', False)
                    )
            return Response({'id': q.id, 'updated': True})
        except Question.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

    def delete(self, request, video_id, question_id=None):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.tools.models import Question
        try:
            Question.objects.get(id=question_id).delete()
            return Response({'deleted':True})
        except Question.DoesNotExist:
            return Response({'error':'Not found'},status=404)


class AdminCheatSheetView(APIView):
    """Get/set cheat sheet content for a topic video."""
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import TopicVideo
        # For now return placeholder — will be generated from transcript
        try:
            tv = TopicVideo.objects.get(id=video_id)
            return Response({
                'video_id':    video_id,
                'video_title': tv.title,
                'has_cheatsheet': tv.has_cheatsheet,
                'summary':     '',
                'key_points':  [],
                'note':        'Cheat sheets are auto-generated after video upload. You can also add manually below.',
            })
        except TopicVideo.DoesNotExist:
            return Response({'error':'Not found'},status=404)

    def post(self, request, video_id):
        """Manually set cheat sheet content."""
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import TopicVideo
        try:
            tv = TopicVideo.objects.get(id=video_id)
            tv.has_cheatsheet = True
            tv.save()
            # Store in a simple cache/model — for now accept and return success
            # Full implementation would use a CheatSheet model
            return Response({'saved': True, 'video_id': video_id})
        except TopicVideo.DoesNotExist:
            return Response({'error':'Not found'},status=404)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 1 — STUDENT DETAIL
# ═══════════════════════════════════════════════════════════════════════════════

class AdminStudentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.accounts.models import User
        from apps.enrollments.models import Enrollment, CourseAccess
        from apps.learn.models import TopicVideoProgress, QuizAttempt
        from apps.payments.models import Order

        try: user = User.objects.get(pk=pk)
        except User.DoesNotExist: return Response({'error':'Not found'}, status=404)

        enrollments = Enrollment.objects.filter(user=user).select_related('plan__exam')
        orders = []
        try: orders = list(Order.objects.filter(user=user).values('id','amount','status','created_at'))
        except: pass

        progress = TopicVideoProgress.objects.filter(user=user)
        quiz_attempts = QuizAttempt.objects.filter(user=user)

        return Response({
            'id': user.id, 'email': user.email,
            'first_name': user.first_name, 'last_name': user.last_name,
            'phone': user.phone, 'target_exam': user.target_exam,
            'is_verified': user.is_verified, 'role': user.role,
            'created_at': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if hasattr(user,'last_login') and user.last_login else None,
            'enrollments': [
                {'id':e.id,'exam':e.plan.exam.name,'plan':e.plan.name,'status':e.status,
                 'enrolled_at':e.created_at.isoformat() if hasattr(e,'created_at') else ''}
                for e in enrollments
            ],
            'orders': orders,
            'videos_watched': progress.filter(watch_pct__gte=70).count(),
            'total_watch_mins': sum(p.watch_pct * (p.topic_video.duration_mins if hasattr(p,'topic_video') else 0) / 100 for p in progress),
            'quiz_attempts': quiz_attempts.count(),
            'avg_quiz_score': quiz_attempts.aggregate(avg=__import__('django.db.models',fromlist=['Avg']).Avg('score_pct'))['avg'] or 0,
        })

    def patch(self, request, pk):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.accounts.models import User
        try: user = User.objects.get(pk=pk)
        except User.DoesNotExist: return Response({'error':'Not found'}, status=404)
        for field in ['first_name','last_name','phone','target_exam','is_verified','role']:
            if field in request.data: setattr(user, field, request.data[field])
        user.save()
        return Response({'id':user.id,'email':user.email,'updated':True})


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 2 — BULK ENROLLMENT
# ═══════════════════════════════════════════════════════════════════════════════

class AdminBulkEnrollView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.accounts.models import User
        from apps.courses.models import PricingPlan, Exam
        from apps.enrollments.models import Enrollment, CourseAccess

        emails   = request.data.get('emails', [])
        plan_id  = request.data.get('plan_id')
        exam_slug= request.data.get('exam_slug')

        if not emails or not plan_id:
            return Response({'error':'emails and plan_id required'}, status=400)

        try: plan = PricingPlan.objects.get(id=plan_id)
        except PricingPlan.DoesNotExist: return Response({'error':'Plan not found'}, status=404)

        results = {'enrolled':[], 'skipped':[], 'not_found':[]}

        for email in [e.strip().lower() for e in emails if e.strip()]:
            try:
                user = User.objects.get(email=email)
                e, created = Enrollment.objects.get_or_create(user=user, plan=plan, defaults={'status':'active'})
                if not created: e.status = 'active'; e.save()
                CourseAccess.objects.get_or_create(user=user, exam=plan.exam,
                                                   defaults={'can_watch_recordings':True,'can_attempt_quizzes':True,
                                                             'can_view_cheat_sheets':True,'can_access_mocks':True})
                results['enrolled'].append(email) if created else results['skipped'].append(email)
            except User.DoesNotExist:
                results['not_found'].append(email)
            except Exception as ex:
                results['skipped'].append(f'{email} ({ex})')

        return Response({
            'enrolled_count': len(results['enrolled']),
            'skipped_count':  len(results['skipped']),
            'not_found':      results['not_found'],
            'enrolled':       results['enrolled'],
            'skipped':        results['skipped'],
        })


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 3 — LIVE SESSION MANAGER
# ═══════════════════════════════════════════════════════════════════════════════

class AdminLiveSessionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.learn.models import LiveSession
        from apps.courses.models import Exam
        exam_slug = request.query_params.get('exam', '')
        qs = LiveSession.objects.select_related('topic__module__course__exam').order_by('scheduled_at')
        if exam_slug: qs = qs.filter(topic__module__course__exam__slug=exam_slug)
        data = []
        for s in qs:
            data.append({
                'id':s.id, 'title':s.title, 'description':s.description,
                'scheduled_at':s.scheduled_at.isoformat(),
                'duration_mins':s.duration_mins, 'meet_link':s.meet_link,
                'status':s.status, 'recording_url':s.recording_url,
                'recording_available':s.recording_available,
                'topic_id':s.topic_id, 'topic_title':s.topic.title if s.topic else '',
                'exam_slug':s.topic.module.course.exam.slug if s.topic else '',
                'exam_name':s.topic.module.course.exam.name if s.topic else '',
            })
        return Response({'sessions':data, 'count':len(data)})

    def post(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.learn.models import LiveSession
        from apps.courses.models import CurriculumTopic
        from django.utils import timezone
        import datetime
        d = request.data
        try:
            topic = CurriculumTopic.objects.get(id=d['topic_id'])
            s = LiveSession.objects.create(
                topic=topic,
                title=d['title'],
                description=d.get('description',''),
                scheduled_at=d['scheduled_at'],
                duration_mins=int(d.get('duration_mins',90)),
                meet_link=d.get('meet_link',''),
                status=d.get('status','upcoming'),
            )
            return Response({'id':s.id,'title':s.title}, status=201)
        except CurriculumTopic.DoesNotExist:
            return Response({'error':'Topic not found'}, status=404)
        except Exception as e:
            return Response({'error':str(e)}, status=400)


class AdminLiveSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, session_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.learn.models import LiveSession
        try:
            s = LiveSession.objects.get(id=session_id)
            for field in ['title','description','scheduled_at','duration_mins','meet_link','status','recording_url','recording_available']:
                if field in request.data: setattr(s, field, request.data[field])
            s.save()
            return Response({'id':s.id,'title':s.title,'updated':True})
        except LiveSession.DoesNotExist:
            return Response({'error':'Not found'}, status=404)

    def delete(self, request, session_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.learn.models import LiveSession
        try: LiveSession.objects.get(id=session_id).delete(); return Response({'deleted':True})
        except LiveSession.DoesNotExist: return Response({'error':'Not found'}, status=404)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 4 — COUPON CODES
# ═══════════════════════════════════════════════════════════════════════════════

class AdminCouponListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        # Return stored coupons from SiteSettings or a simple JSON field
        from apps.courses.models import SiteSettings
        settings = SiteSettings.objects.first()
        import json
        coupons = []
        try:
            raw = getattr(settings, 'coupons_json', '[]') or '[]'
            coupons = json.loads(raw)
        except: pass
        return Response({'coupons': coupons})

    def post(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.courses.models import SiteSettings
        import json, uuid
        d = request.data
        settings = SiteSettings.objects.first()
        if not settings: return Response({'error':'Site settings not found'}, status=404)

        try:
            coupons = json.loads(getattr(settings,'coupons_json','[]') or '[]')
        except: coupons = []

        code = d.get('code','').upper().strip()
        if not code: return Response({'error':'code required'}, status=400)
        if any(c['code']==code for c in coupons):
            return Response({'error':'Code already exists'}, status=400)

        new_coupon = {
            'id':   str(uuid.uuid4())[:8],
            'code': code,
            'type': d.get('type','percent'),  # percent | flat
            'value': float(d.get('value',10)),
            'max_uses': int(d.get('max_uses',100)),
            'uses': 0,
            'exam_slug': d.get('exam_slug',''),  # blank = all exams
            'expiry': d.get('expiry',''),
            'active': True,
            'description': d.get('description',''),
        }
        coupons.append(new_coupon)
        try:
            settings.coupons_json = json.dumps(coupons)
            settings.save()
        except Exception as e:
            return Response({'error': f'coupons_json field missing — add it to SiteSettings model: {e}'}, status=500)
        return Response(new_coupon, status=201)

    def delete(self, request, coupon_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.courses.models import SiteSettings
        import json
        settings = SiteSettings.objects.first()
        try:
            coupons = json.loads(getattr(settings,'coupons_json','[]') or '[]')
            coupons = [c for c in coupons if c['id'] != coupon_id]
            settings.coupons_json = json.dumps(coupons)
            settings.save()
            return Response({'deleted':True})
        except Exception as e:
            return Response({'error':str(e)}, status=400)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 5 — ANNOUNCEMENT BANNER
# ═══════════════════════════════════════════════════════════════════════════════

class AdminAnnouncementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.courses.models import SiteSettings
        s = SiteSettings.objects.first()
        return Response({
            'text':    getattr(s,'announcement_text','') or '',
            'active':  getattr(s,'announcement_active',False) or False,
            'link':    getattr(s,'announcement_link','') or '',
            'color':   getattr(s,'announcement_color','#0f0f0f') or '#0f0f0f',
        })

    def post(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.courses.models import SiteSettings
        s = SiteSettings.objects.first()
        if not s: return Response({'error':'No site settings'}, status=404)
        try:
            s.announcement_text   = request.data.get('text','')
            s.announcement_active = bool(request.data.get('active', False))
            s.announcement_link   = request.data.get('link','')
            s.announcement_color  = request.data.get('color','#0f0f0f')
            s.save()
            return Response({'saved':True})
        except Exception as e:
            return Response({'error': f'announcement fields missing from SiteSettings: {e}'}, status=500)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE 6 — ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════

class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from django.utils import timezone
        import datetime
        from apps.accounts.models import User
        from apps.enrollments.models import Enrollment
        from apps.learn.models import TopicVideoProgress, QuizAttempt

        now  = timezone.now()
        days = int(request.query_params.get('days', 30))
        since = now - datetime.timedelta(days=days)

        # Daily signups
        from django.db.models import Count
        from django.db.models.functions import TruncDate
        signups = list(
            User.objects.filter(created_at__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date').annotate(count=Count('id')).order_by('date')
        )

        # Daily enrollments
        enrollments = list(
            Enrollment.objects.filter(created_at__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date').annotate(count=Count('id')).order_by('date')
        )

        # Videos watched per day
        videos = list(
            TopicVideoProgress.objects.filter(completed_at__gte=since, watch_pct__gte=70)
            .annotate(date=TruncDate('completed_at'))
            .values('date').annotate(count=Count('id')).order_by('date')
        )

        # Enrollments by exam
        by_exam = list(
            Enrollment.objects.filter(status='active')
            .values('plan__exam__name').annotate(count=Count('id')).order_by('-count')
        )

        # Funnel
        total_users     = User.objects.count()
        verified_users  = User.objects.filter(is_verified=True).count()
        enrolled_users  = Enrollment.objects.filter(status='active').values('user').distinct().count()
        active_learners = TopicVideoProgress.objects.filter(completed_at__gte=now-datetime.timedelta(days=7)).values('user').distinct().count()

        return Response({
            'days': days,
            'signups':     [{'date':str(r['date']),'count':r['count']} for r in signups],
            'enrollments': [{'date':str(r['date']),'count':r['count']} for r in enrollments],
            'videos':      [{'date':str(r['date']),'count':r['count']} for r in videos],
            'by_exam':     [{'exam':r['plan__exam__name'],'count':r['count']} for r in by_exam],
            'funnel': {
                'total_users':    total_users,
                'verified':       verified_users,
                'enrolled':       enrolled_users,
                'active_learners':active_learners,
            },
        })

class AdminOverviewView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.accounts.models import User
        from apps.enrollments.models import Enrollment
        from apps.payments.models import Order
        from django.utils import timezone
        import datetime
        now = timezone.now()
        week_ago = now - datetime.timedelta(days=7)
        month_ago = now - datetime.timedelta(days=30)
        try:
            revenue_total = sum(float(o.amount) for o in Order.objects.filter(status='paid'))
            revenue_month = sum(float(o.amount) for o in Order.objects.filter(status='paid', created_at__gte=month_ago))
            revenue_week  = sum(float(o.amount) for o in Order.objects.filter(status='paid', created_at__gte=week_ago))
        except: revenue_total = revenue_month = revenue_week = 0
        return Response({
            'revenue': {'total': revenue_total, 'month': revenue_month, 'week': revenue_week},
            'users':   {'total': User.objects.count(), 'new_week': User.objects.filter(created_at__gte=week_ago).count(),
                        'enrolled': Enrollment.objects.filter(status='active').values('user').distinct().count()},
        })

class AdminRevenueView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.payments.models import Order
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncDate
        from django.utils import timezone
        import datetime
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - datetime.timedelta(days=days)
        daily = list(
            Order.objects.filter(status='paid', created_at__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date').annotate(revenue=Sum('amount'), orders=Count('id')).order_by('date')
        )
        return Response({
            'daily': [{'date':str(r['date']),'revenue':float(r['revenue']),'orders':r['orders']} for r in daily],
            'total': sum(r['revenue'] for r in daily),
        })

class AdminCohortView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.courses.models import Course
        cohorts = Course.objects.select_related('exam').order_by('-created_at')
        return Response({'cohorts': [
            {'id':c.id,'title':c.title,'exam':c.exam.name,'exam_slug':c.exam.slug,
             'slug':c.slug,'status':c.status,'batch_size':c.batch_size,
             'seats_filled':c.seats_filled,'custom_page_slug':c.custom_page_slug}
            for c in cohorts
        ]})
    def patch(self, request, cohort_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.courses.models import Course
        try:
            c = Course.objects.get(id=cohort_id)
            for field in ['custom_page_slug','status','seats_filled','batch_size']:
                if field in request.data: setattr(c, field, request.data[field])
            c.save()
            return Response({'id':c.id,'updated':True})
        except Course.DoesNotExist: return Response({'error':'Not found'},status=404)

class AdminToolsAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        from apps.tools.models import Tool, ToolSession, ToolLead
        tools = Tool.objects.filter(is_active=True)
        return Response({'tools': [
            {'id':t.id,'name':t.name,'slug':t.slug,
             'sessions': ToolSession.objects.filter(tool=t).count() if hasattr(ToolSession,'tool') else 0,
             'leads':    ToolLead.objects.filter(tool=t).count()}
            for t in tools
        ]})

class AdminNotificationsAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'}, status=403)
        return Response({'notifications': [], 'count': 0})

class SitemapView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from apps.courses.models import Exam
        from apps.blog.models import BlogPost
        exams = list(Exam.objects.values_list('slug', flat=True))
        posts = list(BlogPost.objects.filter(is_published=True).values_list('slug', flat=True)) if hasattr(BlogPost, 'is_published') else []
        return Response({'exams': exams, 'posts': posts})

class RobotsView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        from django.http import HttpResponse
        return HttpResponse(
            "User-agent: *\nAllow: /\nDisallow: /admin-panel/\nDisallow: /api/\n"
            "Sitemap: https://gradskool.in/sitemap.xml",
            content_type='text/plain'
        )


# ═══════════════════════════════════════════════════════════════════════════════
# COURSE BUILDER — full course management from admin panel
# ═══════════════════════════════════════════════════════════════════════════════

class CourseBuilderView(APIView):
    """
    GET  /dashboard/course-builder/<course_id>/
         Full course data: type, components, sections, topics, videos, settings
    PATCH /dashboard/course-builder/<course_id>/
         Update course type, settings
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.courses.models import Course, CurriculumModule, CourseComponent
        from apps.learn.models import TopicVideo
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        # Components
        components = CourseComponent.objects.filter(course=course).order_by('sort_order')

        # Sections → Topics → Videos
        modules = CurriculumModule.objects.filter(course=course).prefetch_related(
            'topics__topic_videos__video'
        ).order_by('sort_order', 'number')

        sections_data = []
        for m in modules:
            topics_data = []
            for t in m.topics.all().order_by('sort_order'):
                videos_data = []
                for tv in t.topic_videos.all().order_by('sort_order'):
                    videos_data.append({
                        'id':               tv.id,
                        'title':            tv.title,
                        'sort_order':       tv.sort_order,
                        'duration_mins':    tv.duration_mins,
                        'difficulty':       tv.difficulty,
                        'is_free_preview':  tv.is_free_preview,
                        'bunny_video_id':   tv.video.bunny_video_id if tv.video else '',
                        'video_source':     tv.video.video_source if tv.video else '',
                        'has_quiz':         tv.has_quiz,
                        'has_cheatsheet':   tv.has_cheatsheet,
                        'has_live':         tv.has_live,
                        'live_description': tv.live_description,
                        'quiz_duration_mins':   tv.quiz_duration_mins,
                        'quiz_question_count':  tv.quiz_question_count,
                        'sub_tag':          tv.sub_tag,
                    })
                topics_data.append({
                    'id':          t.id,
                    'title':       t.title,
                    'slug':        t.slug,
                    'sort_order':  t.sort_order,
                    'video_count': len(videos_data),
                    'videos':      videos_data,
                })
            sections_data.append({
                'id':          m.id,
                'number':      m.number,
                'title':       m.title,
                'short_title': m.short_title,
                'slug':        m.slug,
                'sort_order':  m.sort_order,
                'topic_count': len(topics_data),
                'topics':      topics_data,
            })

        return Response({
            'id':          course.id,
            'title':       course.title,
            'slug':        course.slug,
            'exam_slug':   course.exam.slug,
            'exam_name':   course.exam.name,
            'course_type': course.course_type,
            'status':      course.status,
            'start_date':  str(course.start_date) if course.start_date else None,
            'end_date':    str(course.end_date) if course.end_date else None,
            'batch_size':  course.batch_size,
            'seats_filled': course.seats_filled,
            'description': course.description,
            'components':  [{
                'id':             c.id,
                'component_type': c.component_type,
                'title':          c.display_title,
                'description':    c.description,
                'sort_order':     c.sort_order,
                'is_enabled':     c.is_enabled,
                'is_mandatory':   c.is_mandatory,
                'config':         c.config,
            } for c in components],
            'sections': sections_data,
        })

    def patch(self, request, course_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.courses.models import Course
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for field in ['course_type', 'status', 'title', 'description',
                      'batch_size', 'start_date', 'end_date', 'custom_page_slug']:
            if field in request.data:
                setattr(course, field, request.data[field])
        course.save()
        return Response({'id': course.id, 'course_type': course.course_type, 'updated': True})


class CourseComponentView(APIView):
    """
    POST   /dashboard/course-builder/<course_id>/components/          create
    PUT    /dashboard/course-builder/<course_id>/components/<id>/      update
    DELETE /dashboard/course-builder/<course_id>/components/<id>/      delete
    POST   /dashboard/course-builder/<course_id>/components/reorder/   reorder
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id, component_id=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.courses.models import Course, CourseComponent
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        # Reorder action
        if request.data.get('action') == 'reorder':
            order = request.data.get('order', [])
            for i, cid in enumerate(order):
                CourseComponent.objects.filter(id=cid, course=course).update(sort_order=i)
            return Response({'reordered': True})

        d = request.data
        c = CourseComponent.objects.create(
            course=course,
            component_type=d.get('component_type', 'video'),
            title=d.get('title', ''),
            description=d.get('description', ''),
            sort_order=d.get('sort_order',
                             CourseComponent.objects.filter(course=course).count()),
            is_enabled=bool(d.get('is_enabled', True)),
            is_mandatory=bool(d.get('is_mandatory', False)),
            config=d.get('config', {}),
        )
        return Response({'id': c.id, 'component_type': c.component_type}, status=201)

    def put(self, request, course_id, component_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.courses.models import CourseComponent
        try:
            c = CourseComponent.objects.get(id=component_id, course_id=course_id)
        except CourseComponent.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for field in ['title', 'description', 'is_enabled', 'is_mandatory', 'config', 'sort_order']:
            if field in request.data:
                setattr(c, field, request.data[field])
        c.save()
        return Response({'id': c.id, 'updated': True})

    def delete(self, request, course_id, component_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.courses.models import CourseComponent
        try:
            CourseComponent.objects.get(id=component_id, course_id=course_id).delete()
            return Response({'deleted': True})
        except CourseComponent.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class CourseListView(APIView):
    """
    GET /dashboard/courses/   — list all courses with type + stats
    POST /dashboard/courses/  — create new course
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.courses.models import Course
        from apps.enrollments.models import Enrollment
        courses = Course.objects.select_related('exam').order_by('exam__slug', '-start_date')
        data = []
        for c in courses:
            enrolled = Enrollment.objects.filter(plan__exam=c.exam, status='active').count()
            data.append({
                'id':          c.id,
                'title':       c.title,
                'slug':        c.slug,
                'exam_slug':   c.exam.slug,
                'exam_name':   c.exam.name,
                'course_type': c.course_type,
                'status':      c.status,
                'batch_size':  c.batch_size,
                'seats_filled': c.seats_filled,
                'start_date':  str(c.start_date) if c.start_date else None,
                'enrolled':    enrolled,
                'component_count': c.components.count(),
            })
        return Response({'courses': data})

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.courses.models import Course, Exam, CourseComponent
        d = request.data
        try:
            exam = Exam.objects.get(slug=d.get('exam_slug', 'cat'))
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=404)
        course = Course.objects.create(
            exam=exam,
            title=d['title'],
            cohort_label=d.get('cohort_label', ''),
            course_type=d.get('course_type', 'recorded'),
            status=d.get('status', 'upcoming'),
            batch_size=int(d.get('batch_size', 27)),
            description=d.get('description', ''),
        )
        # Auto-create default components based on course type
        default_components = {
            'recorded':      [('video','Video Lectures',True), ('quiz','Quiz',True), ('cheatsheet','Cheat Sheet',True)],
            'live_recorded': [('pre_test','Pre-Test',False), ('video','Video Lectures',True), ('quiz','Quiz',True), ('cheatsheet','Cheat Sheet',True), ('live','Live Class',True)],
            'mocks_only':    [('mock_test','Mock Tests',True)],
            'crash_course':  [('pre_test','Pre-Test Diagnostic',True), ('video','Video Lectures',True), ('quiz','Quiz',True), ('post_test','Post-Test',True)],
            'self_paced':    [('video','Video Lectures',True), ('notes','Reading Material',True), ('assignment','Assignments',True), ('quiz','Quiz',True)],
            'gdpi_prep':     [('video','PI Strategy Videos',True), ('notes','WAT Material',True), ('assignment','Mock WAT Essays',True), ('live','Mock PI Sessions',True)],
            'custom':        [],
        }
        defaults = default_components.get(course.course_type, [])
        for i, (ctype, ctitle, cmandatory) in enumerate(defaults):
            CourseComponent.objects.create(
                course=course, component_type=ctype, title=ctitle,
                sort_order=i, is_enabled=True, is_mandatory=cmandatory,
            )
        return Response({'id': course.id, 'slug': course.slug, 'title': course.title}, status=201)


# ═══════════════════════════════════════════════════════════════════════════════
# VIDEO LIBRARY — search, upload, reuse videos across courses
# ═══════════════════════════════════════════════════════════════════════════════

class VideoLibraryView(APIView):
    """
    GET  /dashboard/video-library/?exam=cat&search=rc&source=bunny
         Returns all videos in the library with search/filter.
    POST /dashboard/video-library/
         Add a new video to the library (without attaching to any topic yet).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.content.models import VideoLibrary
        from apps.learn.models import TopicVideo

        qs = VideoLibrary.objects.select_related('primary_exam').order_by('-created_at')

        # Filters
        exam   = request.query_params.get('exam', '')
        search = request.query_params.get('search', '').lower()
        source = request.query_params.get('source', '')

        if exam:   qs = qs.filter(primary_exam__slug=exam)
        if source: qs = qs.filter(video_source=source)
        if search: qs = qs.filter(title__icontains=search) | qs.filter(tags__icontains=search)

        data = []
        for v in qs[:100]:
            # How many topics use this video?
            usage = TopicVideo.objects.filter(video=v).select_related(
                'topic__module__course__exam'
            )
            data.append({
                'id':               v.id,
                'title':            v.title,
                'description':      v.description,
                'video_source':     v.video_source,
                'bunny_video_id':   v.bunny_video_id,
                'youtube_video_id': v.youtube_video_id,
                'duration_secs':    v.duration_secs,
                'duration_display': v.duration_display,
                'is_published':     v.is_published,
                'tags':             v.tags,
                'exam':             v.primary_exam.name if v.primary_exam else '',
                'exam_slug':        v.primary_exam.slug if v.primary_exam else '',
                'thumbnail_url':    v.thumbnail_url,
                # Usage: list of all topics this video appears in
                'used_in': [{
                    'topic_video_id': u.id,
                    'topic':  u.topic.title,
                    'section': u.topic.module.short_title,
                    'course': u.topic.module.course.title,
                    'exam':   u.topic.module.course.exam.name,
                } for u in usage],
                'usage_count': usage.count(),
            })
        return Response({'videos': data, 'count': len(data)})

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.content.models import VideoLibrary
        from apps.courses.models import Exam
        d = request.data
        exam = None
        if d.get('exam_slug'):
            exam = Exam.objects.filter(slug=d['exam_slug']).first()

        v = VideoLibrary.objects.create(
            title=d.get('title', ''),
            description=d.get('description', ''),
            video_source=d.get('video_source', 'bunny'),
            bunny_video_id=d.get('bunny_video_id', '').strip(),
            youtube_video_id=d.get('youtube_video_id', '').strip(),
            duration_secs=int(d.get('duration_mins', 0)) * 60,
            tags=d.get('tags', ''),
            is_published=bool(d.get('is_published', True)),
            primary_exam=exam,
        )
        return Response({'id': v.id, 'title': v.title}, status=201)

    def put(self, request, video_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.content.models import VideoLibrary
        from apps.courses.models import Exam
        try:
            v = VideoLibrary.objects.get(id=video_id)
        except VideoLibrary.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for field in ['title','description','bunny_video_id','youtube_video_id','tags','is_published']:
            if field in request.data:
                setattr(v, field, request.data[field])
        if 'duration_mins' in request.data:
            v.duration_secs = int(request.data['duration_mins']) * 60
        if 'exam_slug' in request.data:
            v.primary_exam = Exam.objects.filter(slug=request.data['exam_slug']).first()
        v.save()
        return Response({'id': v.id, 'title': v.title, 'updated': True})

    def delete(self, request, video_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.content.models import VideoLibrary
        try:
            v = VideoLibrary.objects.get(id=video_id)
            usage = v.topic_videos.count()
            if usage > 0:
                return Response({
                    'error': f'This video is used in {usage} topic(s). Remove it from all topics first.'
                }, status=400)
            v.delete()
            return Response({'deleted': True})
        except VideoLibrary.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class AttachVideoToTopicView(APIView):
    """
    POST /dashboard/video-library/<video_id>/attach/
    Attaches an existing library video to a topic.
    One video can be attached to multiple topics across different courses.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, video_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.content.models import VideoLibrary
        from apps.courses.models import CurriculumTopic
        from apps.learn.models import TopicVideo
        d = request.data
        try:
            video = VideoLibrary.objects.get(id=video_id)
            topic = CurriculumTopic.objects.get(id=d['topic_id'])
        except VideoLibrary.DoesNotExist:
            return Response({'error': 'Video not found'}, status=404)
        except CurriculumTopic.DoesNotExist:
            return Response({'error': 'Topic not found'}, status=404)

        sort_order = d.get('sort_order',
                           TopicVideo.objects.filter(topic=topic).count() + 1)

        tv = TopicVideo.objects.create(
            topic=topic,
            video=video,
            title=d.get('title') or video.title,
            sort_order=sort_order,
            duration_mins=int(video.duration_secs // 60) if video.duration_secs else int(d.get('duration_mins', 20)),
            difficulty=d.get('difficulty', 'beginner'),
            has_cheatsheet=bool(d.get('has_cheatsheet', True)),
            has_quiz=bool(d.get('has_quiz', False)),
            has_live=bool(d.get('has_live', False)),
            quiz_duration_mins=int(d.get('quiz_duration_mins', 40)),
            quiz_question_count=int(d.get('quiz_question_count', 10)),
        )
        return Response({
            'id':            tv.id,
            'title':         tv.title,
            'video_title':   video.title,
            'bunny_video_id': video.bunny_video_id,
            'topic':         topic.title,
        }, status=201)


class AdminResultsView(APIView):
    """CRUD for the student results wall."""
    permission_classes = [IsAuthenticated]

    def _unique_slug(self, base, exclude_id=None):
        from django.utils.text import slugify
        from apps.learn.models import StudentResult
        base = slugify(base) or 'result'
        slug = base
        n = 1
        qs = StudentResult.objects.filter(slug=slug)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        while qs.exists():
            n += 1
            slug = f'{base}-{n}'
            qs = StudentResult.objects.filter(slug=slug)
            if exclude_id:
                qs = qs.exclude(id=exclude_id)
        return slug

    def get(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import StudentResult
        results = list(StudentResult.objects.order_by('-percentile').values())
        return Response({'results': results})

    def post(self, request):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import StudentResult
        d = request.data
        slug = d.get('slug','').strip() or self._unique_slug(d.get('name',''))
        r = StudentResult.objects.create(
            name=d.get('name',''), exam=d.get('exam','cat'),
            year=int(d.get('year',2025)), percentile=float(d.get('percentile',0)),
            score=d.get('score',''), college_calls=d.get('college_calls',''),
            photo_url=d.get('photo_url',''), testimonial=d.get('testimonial',''),
            is_verified=bool(d.get('is_verified',False)), is_featured=bool(d.get('is_featured',False)),
            slug=slug, video_type=d.get('video_type',''), video_url=d.get('video_url',''),
            body=d.get('body',''), meta_title=d.get('meta_title',''),
            meta_description=d.get('meta_description',''),
            tag=d.get('tag',''), subtitle=d.get('subtitle',''), pull_quote=d.get('pull_quote',''),
            whatsapp_message=d.get('whatsapp_message',''),
            outcome_label=d.get('outcome_label','Outcome'), outcome_value=d.get('outcome_value',''),
            outcome_description=d.get('outcome_description',''),
        )
        return Response({'id':r.id,'name':r.name,'slug':r.slug},status=201)

    def patch(self, request, result_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import StudentResult
        try:
            r = StudentResult.objects.get(id=result_id)
        except StudentResult.DoesNotExist:
            return Response({'error':'Not found'}, status=404)
        d = request.data
        fields = ['name','exam','score','college_calls','photo_url','testimonial',
                  'video_type','video_url','body','meta_title','meta_description',
                  'tag','subtitle','pull_quote','whatsapp_message',
                  'outcome_label','outcome_value','outcome_description']
        for f in fields:
            if f in d: setattr(r, f, d[f])
        if 'year' in d: r.year = int(d['year'])
        if 'percentile' in d: r.percentile = float(d['percentile'])
        if 'is_verified' in d: r.is_verified = bool(d['is_verified'])
        if 'is_featured' in d: r.is_featured = bool(d['is_featured'])
        if 'slug' in d:
            new_slug = d['slug'].strip()
            r.slug = self._unique_slug(new_slug, exclude_id=r.id) if new_slug else self._unique_slug(r.name, exclude_id=r.id)
        r.save()
        return Response({'id':r.id,'name':r.name,'slug':r.slug})

    def delete(self, request, result_id):
        if request.user.role != 'admin': return Response({'error':'Admin only'},status=403)
        from apps.learn.models import StudentResult
        StudentResult.objects.filter(id=result_id).delete()
        return Response({'deleted':True})


class PublicResultsView(APIView):
    """GET /results-wall/public/ — verified results only, no auth required."""
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.learn.models import StudentResult
        exam = request.query_params.get('exam', '')
        qs = StudentResult.objects.filter(is_verified=True).order_by('-is_featured', '-percentile', '-year')
        if exam and exam != 'all':
            qs = qs.filter(exam=exam)
        results = list(qs.values(
            'id','name','exam','year','percentile','score','college_calls',
            'photo_url','testimonial','slug','video_type','video_url','tag',
        ))
        return Response({'results': results})


class PublicResultDetailView(APIView):
    """GET /results-wall/public/<slug>/ — single verified result by slug, no auth required."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        from apps.learn.models import StudentResult
        try:
            r = StudentResult.objects.get(slug=slug, is_verified=True)
        except StudentResult.DoesNotExist:
            return Response({'error':'Not found'}, status=404)
        return Response({
            'id': r.id, 'name': r.name, 'exam': r.exam, 'year': r.year,
            'percentile': r.percentile, 'score': r.score, 'college_calls': r.college_calls,
            'photo_url': r.photo_url, 'testimonial': r.testimonial, 'slug': r.slug,
            'video_type': r.video_type, 'video_url': r.video_url, 'body': r.body,
            'meta_title': r.meta_title, 'meta_description': r.meta_description,
            'tag': r.tag, 'subtitle': r.subtitle, 'pull_quote': r.pull_quote,
            'whatsapp_message': r.whatsapp_message, 'outcome_label': r.outcome_label,
            'outcome_value': r.outcome_value, 'outcome_description': r.outcome_description,
        })


class QuestionBankView(APIView):
    """GET /dashboard/questions/ — browse all questions with filters."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.tools.models import Question, QuestionOption
        from django.db.models import Q

        qs = Question.objects.prefetch_related('options').order_by('-id')

        exam = request.query_params.get('exam', '')
        diff = request.query_params.get('difficulty', '')
        search = request.query_params.get('search', '')

        if exam:   qs = qs.filter(exam_tag=exam)
        if diff:   qs = qs.filter(difficulty_tag=diff)
        if search: qs = qs.filter(Q(question_text__icontains=search) | Q(explanation__icontains=search))

        total = qs.count()
        qs = qs[:100]

        data = []
        for q in qs:
            opts = q.options.all()
            data.append({
                'id':             q.id,
                'question_text':  q.question_text,
                'explanation':    q.explanation,
                'difficulty_tag': q.difficulty_tag,
                'exam_tag':       q.exam_tag,
                'section_tag':    q.section_tag,
                'options':        [{'id':o.id,'key':o.key,'text':o.text,'is_correct':o.is_correct} for o in opts],
            })
        return Response({'questions': data, 'count': total})

    def patch(self, request, question_id=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.tools.models import Question
        try:
            q = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for field in ['question_text', 'explanation', 'difficulty_tag']:
            if field in request.data:
                setattr(q, field, request.data[field])
        q.save()
        return Response({'id': q.id, 'updated': True})

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.tools.models import Question, QuestionOption
        d = request.data
        q = Question.objects.create(
            question_text   = d.get('question_text', ''),
            explanation     = d.get('explanation', ''),
            question_type   = d.get('question_type', 'mcq'),
            difficulty_tag  = d.get('difficulty_tag', 'medium'),
            exam_tag        = d.get('exam_tag', 'cat'),
            section_tag     = d.get('section_tag', ''),
            marks_correct   = d.get('marks_correct', 3),
            marks_wrong     = d.get('marks_wrong', -1),
            correct_answer  = d.get('correct', 'A'),
        )
        for opt in d.get('options', []):
            if opt.get('text'):
                QuestionOption.objects.create(
                    question=q, key=opt['key'],
                    text=opt['text'], is_correct=opt.get('is_correct', False)
                )
        return Response({'id': q.id, 'question_text': q.question_text}, status=201)

    def delete(self, request, question_id=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.tools.models import Question
        Question.objects.filter(id=question_id).delete()
        return Response({'deleted': True})


class QuestionBulkUpdateView(APIView):
    """POST /dashboard/questions/bulk-update/ — bulk tag questions."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.tools.models import Question
        ids = request.data.get('ids', [])
        difficulty = request.data.get('difficulty', '')
        if difficulty:
            Question.objects.filter(id__in=ids).update(difficulty_tag=difficulty)
        return Response({'updated': len(ids)})


# ═══════════════════════════════════════════════════════════════════════════════
# QUIZ QUESTIONS — admin manages questions per video
# ═══════════════════════════════════════════════════════════════════════════════

class VideoQuizQuestionsView(APIView):
    """
    GET  /dashboard/curriculum/videos/<id>/quiz/
         Returns all questions linked to this video's quiz.
    POST /dashboard/curriculum/videos/<id>/quiz/
         Create a new Question and link it to this video.
    PUT  /dashboard/curriculum/videos/<id>/quiz/<qid>/
         Edit an existing question.
    DELETE /dashboard/curriculum/videos/<id>/quiz/<qid>/
         Unlink question from video (optionally delete).
    POST /dashboard/curriculum/videos/<id>/quiz/attach/<qid>/
         Attach an existing question from the bank to this video.
    POST /dashboard/curriculum/videos/<id>/quiz/reorder/
         Reorder questions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import TopicVideo, TopicVideoQuestion
        from apps.tools.models import QuestionOption
        try:
            tv = TopicVideo.objects.get(id=video_id)
        except TopicVideo.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        # Get questions linked via TopicVideoQuestion (admin-managed)
        tvqs = TopicVideoQuestion.objects.filter(
            topic_video=tv, is_active=True
        ).select_related('question').prefetch_related('question__options').order_by('sort_order')

        questions = []
        for tvq in tvqs:
            q = tvq.question
            questions.append({
                'id':            q.id,
                'tvq_id':        tvq.id,
                'sort_order':    tvq.sort_order,
                'text':          q.question_text,
                'question_type': q.question_type,
                'explanation':   q.explanation,
                'difficulty':    q.difficulty_tag,
                'marks_correct': str(q.marks_correct),
                'marks_wrong':   str(q.marks_wrong),
                'options': [{
                    'id':         o.id,
                    'key':        o.key,
                    'text':       o.text,
                    'is_correct': o.is_correct,
                } for o in q.options.all().order_by('key')],
            })

        return Response({
            'video_id':      video_id,
            'video_title':   tv.title,
            'has_quiz':      tv.has_quiz,
            'duration_mins': tv.quiz_duration_mins,
            'question_count':tv.quiz_question_count,
            'questions':     questions,
        })

    def post(self, request, video_id, question_id=None, action=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import TopicVideo, TopicVideoQuestion
        from apps.tools.models import Question, QuestionOption, Tool

        try:
            tv = TopicVideo.objects.get(id=video_id)
        except TopicVideo.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        d = request.data

        # Reorder action
        if d.get('action') == 'reorder':
            order = d.get('order', [])
            for i, tvq_id in enumerate(order):
                TopicVideoQuestion.objects.filter(id=tvq_id, topic_video=tv).update(sort_order=i)
            return Response({'reordered': True})

        # Attach existing question
        if d.get('action') == 'attach' and question_id:
            from apps.tools.models import Question as Q
            try:
                q = Q.objects.get(id=question_id)
                tvq, created = TopicVideoQuestion.objects.get_or_create(
                    topic_video=tv, question=q,
                    defaults={
                        'sort_order':  TopicVideoQuestion.objects.filter(topic_video=tv).count(),
                        'added_by':    request.user,
                        'is_active':   True,
                    }
                )
                return Response({'id': tvq.id, 'created': created}, status=201)
            except Q.DoesNotExist:
                return Response({'error': 'Question not found'}, status=404)

        # Create new question and link to video
        opts_data = d.get('options', [])
        if not opts_data:
            # Build from opt_A, opt_B, opt_C, opt_D, correct
            opts_data = []
            for key in ['A', 'B', 'C', 'D']:
                text = d.get(f'opt_{key}', '').strip()
                if text:
                    opts_data.append({
                        'key': key,
                        'text': text,
                        'is_correct': d.get('correct', '').upper() == key,
                    })

        q = Question.objects.create(
            question_text   = d.get('text', ''),
            explanation     = d.get('explanation', ''),
            question_type   = d.get('question_type', 'mcq'),
            difficulty_tag  = d.get('difficulty', 'medium'),
            exam_tag        = tv.topic.module.course.exam.slug if tv.topic else '',
            marks_correct   = d.get('marks_correct', 3),
            marks_wrong     = d.get('marks_wrong', -1),
            correct_answer  = d.get('correct', 'A'),
        )
        for opt in opts_data:
            QuestionOption.objects.create(
                question=q, key=opt['key'],
                text=opt['text'], is_correct=opt.get('is_correct', False)
            )

        tvq = TopicVideoQuestion.objects.create(
            topic_video = tv,
            question    = q,
            sort_order  = TopicVideoQuestion.objects.filter(topic_video=tv).count(),
            added_by    = request.user,
        )

        # Auto-enable quiz on video
        if not tv.has_quiz:
            tv.has_quiz = True
            tv.save()

        return Response({
            'id':     q.id,
            'tvq_id': tvq.id,
            'text':   q.question_text,
        }, status=201)

    def put(self, request, video_id, question_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.tools.models import Question, QuestionOption
        try:
            q = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        d = request.data
        if 'text'        in d: q.question_text  = d['text']
        if 'explanation' in d: q.explanation    = d['explanation']
        if 'difficulty'  in d: q.difficulty_tag = d['difficulty']
        if 'marks_correct' in d: q.marks_correct = d['marks_correct']
        if 'marks_wrong'   in d: q.marks_wrong   = d['marks_wrong']
        if 'correct'     in d: q.correct_answer = d['correct']
        q.save()

        # Rebuild options if provided
        if 'options' in d:
            q.options.all().delete()
            for opt in d['options']:
                QuestionOption.objects.create(
                    question=q, key=opt['key'],
                    text=opt['text'], is_correct=opt.get('is_correct', False)
                )

        return Response({'id': q.id, 'updated': True})

    def delete(self, request, video_id, question_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import TopicVideoQuestion
        from apps.tools.models import Question

        d = request.data
        # Unlink from video
        TopicVideoQuestion.objects.filter(
            topic_video_id=video_id, question_id=question_id
        ).delete()

        # Also delete the question itself if it has no other links
        if d.get('delete_question', False):
            q = Question.objects.filter(id=question_id).first()
            if q and not q.topic_video_quizzes.exists() and not q.tool:
                q.delete()
                return Response({'deleted': True, 'question_deleted': True})

        return Response({'unlinked': True})


# ═══════════════════════════════════════════════════════════════════════════════
# CHEAT SHEET MANAGEMENT — text + PDF file
# ═══════════════════════════════════════════════════════════════════════════════

class CheatSheetManageView(APIView):
    """
    GET    /dashboard/curriculum/videos/<id>/cheatsheet/
    POST   /dashboard/curriculum/videos/<id>/cheatsheet/        save text
    DELETE /dashboard/curriculum/videos/<id>/cheatsheet/        clear text
    POST   /dashboard/curriculum/videos/<id>/cheatsheet/file/   upload PDF metadata
    DELETE /dashboard/curriculum/videos/<id>/cheatsheet/file/<file_id>/  remove PDF
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import TopicVideo, CheatSheet, CheatSheetFile
        try:
            tv = TopicVideo.objects.get(id=video_id)
        except TopicVideo.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        cs    = CheatSheet.objects.filter(topic_video=tv).first()
        files = list(CheatSheetFile.objects.filter(
            topic_video=tv, is_active=True
        ).values('id', 'title', 'bunny_file_url', 'file_size_kb', 'uploaded_at'))

        return Response({
            'video_id':      video_id,
            'video_title':   tv.title,
            'has_cheatsheet':tv.has_cheatsheet,
            # Structured text content
            'summary':       cs.summary      if cs else '',
            'key_points':    cs.key_points   if cs else [],
            'formulas':      cs.formulas      if cs else [],
            'raw_markdown':  cs.raw_markdown  if cs else '',
            'updated_at':    cs.updated_at.isoformat() if cs else None,
            # PDF files
            'files':         files,
        })

    def post(self, request, video_id, action=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import TopicVideo, CheatSheet, CheatSheetFile

        try:
            tv = TopicVideo.objects.get(id=video_id)
        except TopicVideo.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        d = request.data

        # PDF file upload metadata (file is uploaded directly to Bunny by frontend)
        if action == 'file':
            f = CheatSheetFile.objects.create(
                topic_video        = tv,
                title              = d.get('title', f'{tv.title} — Cheat Sheet'),
                bunny_file_url     = d.get('bunny_file_url', ''),
                bunny_storage_path = d.get('bunny_storage_path', ''),
                file_size_kb       = int(d.get('file_size_kb', 0)),
                uploaded_by        = request.user,
            )
            tv.has_cheatsheet = True
            tv.save()
            return Response({'id': f.id, 'title': f.title, 'url': f.bunny_file_url}, status=201)

        # Save structured text content
        cs, _ = CheatSheet.objects.get_or_create(topic_video=tv)
        if 'summary'      in d: cs.summary      = d['summary']
        if 'key_points'   in d: cs.key_points   = d['key_points']
        if 'formulas'     in d: cs.formulas      = d['formulas']
        if 'raw_markdown' in d: cs.raw_markdown  = d['raw_markdown']
        cs.updated_by = request.user
        cs.save()
        tv.has_cheatsheet = True
        tv.save()
        return Response({'saved': True, 'updated_at': cs.updated_at.isoformat()})

    def delete(self, request, video_id, file_id=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import TopicVideo, CheatSheet, CheatSheetFile

        if file_id:
            CheatSheetFile.objects.filter(id=file_id, topic_video_id=video_id).update(is_active=False)
            return Response({'deleted': True})

        # Clear text cheat sheet
        CheatSheet.objects.filter(topic_video_id=video_id).delete()
        return Response({'cleared': True})


# ═══════════════════════════════════════════════════════════════════════════════
# ACTIVE COURSE — student selects which course to focus on
# ═══════════════════════════════════════════════════════════════════════════════

class ActiveCourseView(APIView):
    """
    GET  /learn/active-course/    enrolled courses + active course
    POST /learn/active-course/    set active course
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.enrollments.models import Enrollment, CourseAccess
        from apps.learn.models import ActiveCourse
        from apps.courses.models import Course

        user = request.user

        # All active enrollments
        enrollments = Enrollment.objects.filter(
            user=user, status='active'
        ).select_related('plan__exam').order_by('-enrolled_at')

        enrolled = []
        for e in enrollments:
            exam  = e.plan.exam
            # Get the course for this enrollment
            course = Course.objects.filter(exam=exam, status='active').order_by('-start_date').first()
            ac     = ActiveCourse.objects.filter(user=user, exam_slug=exam.slug).first()

            enrolled.append({
                'exam_slug':    exam.slug,
                'exam_name':    exam.name,
                'plan_name':    e.plan.name,
                'enrolled_at':  e.enrolled_at.isoformat(),
                'expires_at':   e.expires_at.isoformat() if e.expires_at else None,
                'is_active':    bool(ac),
                'is_primary':   bool(ac and ac.is_primary),
                'course_id':    course.id if course else None,
                'course_title': course.title if course else '',
                'course_type':  course.course_type if course else '',
                'batch_size':   course.batch_size if course else 0,
                'start_date':   str(course.start_date) if course and course.start_date else None,
            })

        # Primary active course
        primary = ActiveCourse.objects.filter(user=user, is_primary=True).first()

        # Recommended courses for unenrolled exams
        enrolled_exam_slugs = {e['exam_slug'] for e in enrolled}
        recommended = []
        from apps.courses.models import Exam
        for exam in Exam.objects.exclude(slug__in=enrolled_exam_slugs)[:3]:
            course = Course.objects.filter(exam=exam, status__in=['active','upcoming']).first()
            if course:
                recommended.append({
                    'exam_slug':  exam.slug,
                    'exam_name':  exam.name,
                    'course_id':  course.id,
                    'course_title': course.title,
                    'course_type': course.course_type,
                    'price':      None,  # shown on exam landing page
                })

        return Response({
            'enrolled':     enrolled,
            'primary_exam': primary.exam_slug if primary else (enrolled[0]['exam_slug'] if enrolled else None),
            'recommended':  recommended,
        })

    def post(self, request):
        from apps.learn.models import ActiveCourse

        exam_slug = request.data.get('exam_slug', '')
        is_primary = bool(request.data.get('is_primary', True))

        if not exam_slug:
            return Response({'error': 'exam_slug required'}, status=400)

        # Set as primary — unset others
        if is_primary:
            ActiveCourse.objects.filter(user=request.user).update(is_primary=False)

        ac, _ = ActiveCourse.objects.update_or_create(
            user=request.user, exam_slug=exam_slug,
            defaults={'is_primary': is_primary}
        )
        return Response({'set': True, 'exam_slug': exam_slug, 'is_primary': is_primary})


# =============================================================================
# QUIZ ANALYTICS
# =============================================================================

class AdminQuizAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import QuizAttempt, TopicVideoProgress, TopicVideo
        from apps.tools.models import Question
        from django.db.models import Avg, Count, Q
        import json

        exam_slug = request.query_params.get('exam', 'cat')

        # All attempts for this exam
        attempts = QuizAttempt.objects.filter(
            progress__topic_video__topic__module__course__exam__slug=exam_slug
        ).select_related('progress__topic_video__topic__module')

        total_attempts = attempts.count()
        if not total_attempts:
            return Response({'total_attempts': 0, 'topics': [], 'questions': [],
                             'distribution': [], 'pass_rate': 0})

        # Pass rate (score >= 60%)
        passes = attempts.filter(score_pct__gte=60).count()
        pass_rate = round(passes / total_attempts * 100) if total_attempts else 0

        # Avg score
        avg_score = attempts.aggregate(avg=Avg('score_pct'))['avg'] or 0

        # Score distribution buckets: 0-10, 11-20, ... 91-100
        distribution = []
        for low in range(0, 100, 10):
            high = low + 10
            cnt = attempts.filter(score_pct__gte=low, score_pct__lt=high if high < 100 else 101).count()
            distribution.append({'range': f'{low}-{high}', 'count': cnt})

        # Per-topic stats
        topics_data = []
        from apps.courses.models import CurriculumModule
        modules = CurriculumModule.objects.filter(
            course__exam__slug=exam_slug
        ).prefetch_related('topics__topic_videos')
        for mod in modules:
            for topic in mod.topics.all():
                topic_attempts = attempts.filter(
                    progress__topic_video__topic=topic
                )
                if not topic_attempts.exists():
                    continue
                t_avg  = topic_attempts.aggregate(avg=Avg('score_pct'))['avg'] or 0
                t_pass = topic_attempts.filter(score_pct__gte=60).count()
                topics_data.append({
                    'topic':       topic.title,
                    'section':     mod.short_title or mod.title,
                    'attempts':    topic_attempts.count(),
                    'avg_score':   round(t_avg, 1),
                    'pass_rate':   round(t_pass / topic_attempts.count() * 100) if topic_attempts.count() else 0,
                })
        topics_data.sort(key=lambda x: x['avg_score'])

        # Hardest questions — questions with lowest correct rate
        # Parse answers JSON from QuizAttempt
        question_stats = {}
        for attempt in attempts.exclude(answers=None)[:500]:
            try:
                raw = attempt.answers
                answers = raw if isinstance(raw, list) else json.loads(raw) if raw else []
                for ans in answers:
                    qid = ans.get('question_id')
                    if not qid:
                        continue
                    if qid not in question_stats:
                        question_stats[qid] = {'correct': 0, 'total': 0}
                    question_stats[qid]['total'] += 1
                    if ans.get('is_correct'):
                        question_stats[qid]['correct'] += 1
            except Exception:
                continue

        # Fetch question text for worst performers
        hardest = []
        if question_stats:
            rated = sorted(
                question_stats.items(),
                key=lambda x: (x[1]['correct'] / max(x[1]['total'], 1))
            )[:10]
            qids = [qid for qid, _ in rated]
            qs   = {q.id: q for q in Question.objects.filter(id__in=qids)}
            for qid, stats in rated:
                q = qs.get(qid)
                if not q:
                    continue
                rate = round(stats['correct'] / max(stats['total'], 1) * 100)
                hardest.append({
                    'id':           qid,
                    'text':         q.question_text[:120],
                    'difficulty':   q.difficulty_tag or 'medium',
                    'total':        stats['total'],
                    'correct':      stats['correct'],
                    'correct_rate': rate,
                })

        return Response({
            'exam':            exam_slug,
            'total_attempts':  total_attempts,
            'pass_rate':       pass_rate,
            'avg_score':       round(avg_score, 1),
            'distribution':    distribution,
            'topics':          topics_data[:20],
            'hardest':         hardest,
        })


# =============================================================================
# NUDGE / BROADCAST TO STUDENT
# =============================================================================

class AdminNudgeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)
        from apps.notifications.models import InAppNotification
        from apps.accounts.models import User

        user_ids = request.data.get('user_ids', [])
        message  = request.data.get('message', '').strip()
        title    = request.data.get('title', 'Message from your instructor').strip()
        nudge_type = request.data.get('type', 'inapp')  # 'inapp' | 'whatsapp'

        if not user_ids or not message:
            return Response({'error': 'user_ids and message required'}, status=400)

        users = User.objects.filter(id__in=user_ids)
        sent  = 0

        for user in users:
            # In-app notification (always)
            InAppNotification.objects.create(
                user=user,
                title=title,
                body=message,
                notification_type='nudge',
            )
            sent += 1

            # WhatsApp if requested and phone available
            if nudge_type == 'whatsapp' and user.phone:
                try:
                    from apps.notifications.utils import send_whatsapp
                    send_whatsapp(user.phone, message)
                except Exception:
                    pass  # Fail silently — in-app was sent

        return Response({'sent': sent, 'total': len(user_ids)})


class AdminStudentPasswordResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not (request.user.role == 'admin' or request.user.is_staff):
            return Response({'error': 'Admin only'}, status=403)
        from apps.accounts.models import User
        password = request.data.get('password', '').strip()
        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=400)
        try:
            user = User.objects.get(pk=pk)
            user.set_password(password)
            user.save()
            return Response({'reset': True})
        except User.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class AdminStudentSuspendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not (request.user.role == 'admin' or request.user.is_staff):
            return Response({'error': 'Admin only'}, status=403)
        from apps.accounts.models import User
        is_active = request.data.get('is_active', True)
        try:
            user = User.objects.get(pk=pk)
            user.is_active = is_active
            user.save()
            return Response({'is_active': user.is_active})
        except User.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)