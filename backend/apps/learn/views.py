"""
GRADSKOOL — Learning Portal API

GET  /api/v1/learn/{examSlug}/{topicSlug}/
     → Full topic sequence with student progress states

POST /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/progress/
     → Update watch progress (called every 15s from player)

GET  /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/quiz/
     → Get quiz questions (randomised)

POST /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/quiz/submit/
     → Submit quiz answers, get score + next_step

GET  /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/cheatsheet/
     → Get cheat sheet content

POST /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/cheatsheet/open/
     → Mark cheat sheet as opened (unlocks next video)

GET  /api/v1/learn/{examSlug}/{topicSlug}/live-sessions/
     → Get live sessions for topic (with access check)
"""
from django.urls import path
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from . import services
from .models import TopicVideo, LiveSession
from apps.enrollments.services import check_access


def _get_topic_video(topic_video_id, exam_slug, topic_slug):
    """Helper to fetch and validate TopicVideo."""
    return TopicVideo.objects.select_related(
        'topic__module__course__exam', 'video', 'quiz_source'
    ).get(
        id=topic_video_id,
        topic__slug=topic_slug,
        topic__module__course__exam__slug=exam_slug,
    )


def _check_enrollment(user, exam_slug):
    """Verify student is enrolled in this exam."""
    return check_access(user, exam_slug, 'can_watch_recordings')


# ── TOPIC SEQUENCE ────────────────────────────────────────────────────────────

class TopicSequenceView(APIView):
    """
    GET /api/v1/learn/{examSlug}/{topicSlug}/

    Returns the full video sequence for a topic with student progress.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug, topic_slug):
        if not _check_enrollment(request.user, exam_slug):
            return Response(
                {'error': 'Enrollment required', 'type': 'access_denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            from apps.courses.models import CurriculumTopic
            topic = CurriculumTopic.objects.select_related(
                'module__course__exam'
            ).get(
                slug=topic_slug,
                module__course__exam__slug=exam_slug,
            )
        except Exception:
            return Response({'error': 'Topic not found'}, status=status.HTTP_404_NOT_FOUND)

        sequence    = services.get_topic_sequence(request.user, topic)
        completion  = services.get_topic_completion_summary(request.user, topic)

        # Serialize
        items = []
        for item in sequence:
            tv = item['topic_video']
            p  = item['progress']

            items.append({
                'id':            tv.id,
                'sort_order':    tv.sort_order,
                'title':         tv.title,
                'difficulty':    tv.difficulty,
                'duration_mins': tv.duration_mins,
                'sub_tag':       tv.sub_tag,
                'is_standalone_quiz': tv.is_standalone_quiz,
                'is_youtube':    tv.is_youtube,

                # Video info
                'video_id':      tv.video.id if tv.video else None,
                'bunny_video_id': tv.video.bunny_video_id if tv.video else '',
                'youtube_video_id': tv.video.youtube_video_id if tv.video else '',
                'video_source':  tv.video.video_source if tv.video else '',
                'thumbnail_url': tv.video.thumbnail_url if tv.video else '',

                # Quiz info
                'has_quiz':       tv.has_quiz,
                'quiz_question_count': tv.quiz_question_count,

                # Cheat sheet info
                'has_cheatsheet': tv.has_cheatsheet,

                # Student progress
                'state':             item['state'],
                'is_locked':         item['is_locked'],
                'is_current':        item['is_current'],
                'watch_pct':         item['watch_pct'],
                'best_score_pct':    item['best_score_pct'],
                'cheatsheet_opened': item['cheatsheet_opened'],
                'quiz_attempts':     p.quiz_attempts if p else 0,
                'quiz_passed':       p.quiz_passed if p else False,
                'quiz_bypassed':     p.quiz_bypassed if p else False,
            })

        # Live sessions
        live_sessions = LiveSession.objects.filter(topic=topic).order_by('scheduled_at')
        has_live_access = check_access(request.user, exam_slug, 'can_attend_live')

        sessions_data = []
        for ls in live_sessions:
            sessions_data.append({
                'id':            ls.id,
                'title':         ls.title,
                'scheduled_at':  ls.scheduled_at.isoformat(),
                'duration_mins': ls.duration_mins,
                'status':        ls.status,
                'is_live_now':   ls.is_live_now,
                'is_upcoming':   ls.is_upcoming,
                # meet_link only shown to Full Cohort
                'meet_link':     ls.meet_link if has_live_access else '',
                'has_access':    has_live_access,
                'recording_available': ls.recording_available,
                'recording_url': ls.recording_url if has_live_access else '',
                'locked_message': '' if has_live_access
                    else 'Upgrade to Full Cohort to join live sessions.',
            })

        return Response({
            'topic': {
                'id':    topic.id,
                'slug':  topic.slug,
                'title': topic.title,
            },
            'sequence':      items,
            'completion':    completion,
            'live_sessions': sessions_data,
            'has_live_access': has_live_access,
        })


# ── WATCH PROGRESS ────────────────────────────────────────────────────────────

class WatchProgressView(APIView):
    """
    POST /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/progress/

    Body: { watch_pct, watched_secs, position_secs }
    Called every 15s from the video player.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, exam_slug, topic_slug, topic_video_id):
        if not _check_enrollment(request.user, exam_slug):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            _get_topic_video(topic_video_id, exam_slug, topic_slug)
        except TopicVideo.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        watch_pct    = float(request.data.get('watch_pct', 0))
        watched_secs = int(request.data.get('watched_secs', 0))
        position_secs = int(request.data.get('position_secs', 0))

        result = services.update_watch_progress(
            request.user, topic_video_id,
            watch_pct, watched_secs, position_secs
        )
        return Response(result)


# ── QUIZ ──────────────────────────────────────────────────────────────────────

class QuizQuestionsView(APIView):
    """
    GET /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/quiz/
    ?reshuffle=true     — reshuffle questions on retake
    ?difficulty=easy    — filter by difficulty (easy/medium/hard)
    ?adaptive=true      — auto-pick difficulty based on last score

    Returns questions with difficulty tags, question_type, marks.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug, topic_slug, topic_video_id):
        if not _check_enrollment(request.user, exam_slug):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        from apps.learn.models import TopicVideo
        try:
            tv = TopicVideo.objects.get(id=topic_video_id)
        except TopicVideo.DoesNotExist:
            return Response({'error': 'Video not found'}, status=404)

        reshuffle  = request.query_params.get('reshuffle',  'false').lower() == 'true'
        difficulty = request.query_params.get('difficulty', '')
        adaptive   = request.query_params.get('adaptive',   'false').lower() == 'true'

        questions = services.get_quiz_questions(
            request.user, topic_video_id,
            reshuffle=reshuffle,
            difficulty=difficulty,
            adaptive=adaptive,
        )

        if not questions:
            return Response(
                {'error': 'Quiz not available. Watch at least 70% of the video first.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Count by difficulty for frontend filter display
        diff_counts = {}
        for q in questions:
            d = q.get('difficulty', 'medium')
            diff_counts[d] = diff_counts.get(d, 0) + 1

        return Response({
            'questions':        questions,
            'total_questions':  len(questions),
            'duration_mins':    tv.quiz_duration_mins,
            'difficulty_counts':diff_counts,
            'adaptive_mode':    adaptive,
            'selected_difficulty': difficulty or 'all',
        })


class QuizSubmitView(APIView):
    """
    POST /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/quiz/submit/

    Body: { answers: [{question_id, selected_option_id}], time_taken_secs }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, exam_slug, topic_slug, topic_video_id):
        if not _check_enrollment(request.user, exam_slug):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        answers         = request.data.get('answers', [])
        time_taken_secs = int(request.data.get('time_taken_secs', 0))

        if not answers:
            return Response(
                {'error': 'No answers provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = services.submit_quiz(
            request.user, topic_video_id, answers, time_taken_secs
        )

        if 'error' in result:
            return Response(result, status=status.HTTP_403_FORBIDDEN)

        return Response(result)


# ── CHEAT SHEET ───────────────────────────────────────────────────────────────

class CheatSheetView(APIView):
    """
    GET  /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/cheatsheet/
         → Fetch cheat sheet content

    POST /api/v1/learn/{examSlug}/{topicSlug}/videos/{topicVideoId}/cheatsheet/open/
         → Mark as opened (unlocks next video)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug, topic_slug, topic_video_id):
        if not _check_enrollment(request.user, exam_slug):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        result = services.get_cheatsheet(request.user, topic_video_id)
        return Response(result)


class CheatSheetOpenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, exam_slug, topic_slug, topic_video_id):
        if not _check_enrollment(request.user, exam_slug):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        result = services.open_cheatsheet(request.user, topic_video_id)

        if not result.get('success'):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        return Response(result)


# ── URLs ─────────────────────────────────────────────────────────────────────

VIDEO_PREFIX = 'videos/<int:topic_video_id>'

urlpatterns = [
    # Topic sequence
    path('<slug:exam_slug>/<slug:topic_slug>/',
         TopicSequenceView.as_view(), name='topic-sequence'),

    # Watch progress
    path(f'<slug:exam_slug>/<slug:topic_slug>/{VIDEO_PREFIX}/progress/',
         WatchProgressView.as_view(), name='watch-progress'),

    # Quiz
    path(f'<slug:exam_slug>/<slug:topic_slug>/{VIDEO_PREFIX}/quiz/',
         QuizQuestionsView.as_view(), name='quiz-questions'),
    path(f'<slug:exam_slug>/<slug:topic_slug>/{VIDEO_PREFIX}/quiz/submit/',
         QuizSubmitView.as_view(), name='quiz-submit'),

    # Cheat sheet
    path(f'<slug:exam_slug>/<slug:topic_slug>/{VIDEO_PREFIX}/cheatsheet/',
         CheatSheetView.as_view(), name='cheatsheet'),
    path(f'<slug:exam_slug>/<slug:topic_slug>/{VIDEO_PREFIX}/cheatsheet/open/',
         CheatSheetOpenView.as_view(), name='cheatsheet-open'),
]

app_name = 'learn'


# ── PORTAL VIEWS ─────────────────────────────────────────────────────────────
# These power /learn/[examSlug] → sections → topics → topic detail

class PortalSectionsView(APIView):
    """
    GET /api/v1/learn/{examSlug}/sections/
    Returns all sections (CurriculumModules) for an exam with topic counts
    and student completion stats.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug):
        is_enrolled = _check_enrollment(request.user, exam_slug)
        # Don't block — return data with is_enrolled flag so frontend
        # can show free preview videos and lock paid content

        from apps.courses.models import CurriculumModule, CurriculumTopic
        from apps.learn.models import TopicVideoProgress

        try:
            from apps.courses.models import Exam
            exam = Exam.objects.get(slug=exam_slug)
        except Exception:
            return Response({'error': 'Exam not found'}, status=404)

        modules = CurriculumModule.objects.filter(
            course__exam=exam
        ).prefetch_related('topics').order_by('number')

        sections = []
        for mod in modules:
            topic_ids = mod.topics.values_list('id', flat=True)
            total_topics = len(topic_ids)

            # Count completed topics (all videos done)
            from apps.learn.models import TopicVideo
            completed_topics = 0
            for topic in mod.topics.all():
                total_vids = TopicVideo.objects.filter(topic=topic).count()
                completed_vids = TopicVideoProgress.objects.filter(
                    student=request.user,
                    topic_video__topic=topic,
                    state='completed',
                ).count()
                if total_vids > 0 and completed_vids >= total_vids:
                    completed_topics += 1

            sections.append({
                'id':              mod.id,
                'title':           mod.title,
                'short_title':     mod.short_title,
                'slug':            mod.slug or str(mod.id),
                'sort_order':      mod.number,
                'total_topics':    total_topics,
                'completed_topics': completed_topics,
                'pct':             round((completed_topics / total_topics) * 100)
                                   if total_topics else 0,
            })

        from apps.courses.models import Course as _Course
        _active = _Course.objects.filter(exam=exam, status='active').order_by('-start_date').first()
        _course_type  = _active.course_type if _active else 'recorded'
        _components   = list(_active.components.filter(is_enabled=True).values(
            'id','component_type','title','sort_order','is_mandatory','config'
        )) if _active else []

        return Response({
            'exam':        {'slug': exam_slug, 'name': exam.name},
            'course_type': _course_type,
            'components':  _components,
            'sections':    sections,
        })


class PortalTopicsView(APIView):
    """
    GET /api/v1/learn/{examSlug}/sections/{sectionSlug}/topics/
    Returns all topics in a section with per-topic progress.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug, section_slug):
        is_enrolled = _check_enrollment(request.user, exam_slug)
        # Don't block — return data with is_enrolled flag so frontend
        # can show free preview videos and lock paid content

        from apps.courses.models import CurriculumModule, CurriculumTopic
        from apps.learn.models import TopicVideo, TopicVideoProgress

        try:
            module = CurriculumModule.objects.get(
                slug=section_slug,
                course__exam__slug=exam_slug,
            )
        except CurriculumModule.DoesNotExist:
            # Fallback: try by id
            try:
                module = CurriculumModule.objects.get(
                    id=int(section_slug),
                    course__exam__slug=exam_slug,
                )
            except Exception:
                return Response({'error': 'Section not found'}, status=404)

        topics = CurriculumTopic.objects.filter(
            module=module
        ).order_by('sort_order')

        result = []
        for topic in topics:
            total_vids = TopicVideo.objects.filter(topic=topic).count()
            completed_vids = TopicVideoProgress.objects.filter(
                student=request.user,
                topic_video__topic=topic,
                state='completed',
            ).count()

            # Best quiz score for this topic
            from apps.learn.models import QuizAttempt
            best_score = QuizAttempt.objects.filter(
                progress__student=request.user,
                progress__topic_video__topic=topic,
            ).order_by('-score_pct').values_list('score_pct', flat=True).first()

            result.append({
                'id':             topic.id,
                'title':          topic.title,
                'slug':           topic.slug or slugify(topic.title),
                'sort_order':     topic.sort_order,
                'total_videos':   total_vids,
                'completed_videos': completed_vids,
                'pct':            round((completed_vids / total_vids) * 100)
                                  if total_vids else 0,
                'has_quiz':       bool(topic.quiz_source),
                'best_score':     best_score,
                'status':         'completed' if total_vids > 0 and completed_vids >= total_vids
                                  else 'in_progress' if completed_vids > 0
                                  else 'not_started',
            })

        return Response({
            'section': {
                'id':          module.id,
                'title':       module.title,
                'short_title': module.short_title,
                'slug':        module.slug,
            },
            'topics': result,
        })


class PortalTopicDetailView(APIView):
    """
    GET /api/v1/learn/{examSlug}/sections/{sectionSlug}/topics/{topicSlug}/
    Full topic detail — sequence + live sessions + quiz availability.
    Used by the 4-tab topic page.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug, section_slug, topic_slug):
        is_enrolled = _check_enrollment(request.user, exam_slug)
        # Don't block — return data with is_enrolled flag so frontend
        # can show free preview videos and lock paid content

        from apps.courses.models import CurriculumTopic

        try:
            topic = CurriculumTopic.objects.select_related(
                'module__course__exam', 'quiz_source'
            ).get(
                slug=topic_slug,
                module__slug=section_slug,
                module__course__exam__slug=exam_slug,
            )
        except CurriculumTopic.DoesNotExist:
            return Response({'error': 'Topic not found'}, status=404)

        # Reuse existing sequence logic
        sequence   = services.get_topic_sequence(request.user, topic)
        completion = services.get_topic_completion_summary(request.user, topic)

        # Live sessions
        live_sessions = LiveSession.objects.filter(topic=topic).order_by('scheduled_at')
        has_live = check_access(request.user, exam_slug, 'can_attend_live')

        sessions_data = []
        for ls in live_sessions:
            sessions_data.append({
                'id':                  ls.id,
                'title':               ls.title,
                'scheduled_at':        ls.scheduled_at.isoformat(),
                'duration_mins':       ls.duration_mins,
                'status':              ls.status,
                'is_live_now':         ls.is_live_now,
                'meet_link':           ls.meet_link if has_live else '',
                'has_access':          has_live,
                'recording_available': ls.recording_available,
                'recording_url':       ls.recording_url if has_live else '',
                'locked_message':      '' if has_live else 'Upgrade to Full Cohort to join live sessions.',
            })

        # Serialize sequence (same as TopicSequenceView)
        items = []
        for item in sequence:
            tv = item['topic_video']
            p  = item['progress']
            items.append({
                'id':            tv.id,
                'sort_order':    tv.sort_order,
                'title':         tv.title,
                'difficulty':    tv.difficulty,
                'duration_mins': tv.duration_mins,
                'sub_tag':       tv.sub_tag,
                'is_standalone_quiz': tv.is_standalone_quiz,
                'is_youtube':    tv.is_youtube,
                'video_id':      tv.video.id if tv.video else None,
                'bunny_video_id': tv.video.bunny_video_id if tv.video else '',
                'youtube_video_id': tv.video.youtube_video_id if tv.video else '',
                'video_source':  tv.video.video_source if tv.video else '',
                'thumbnail_url': tv.video.thumbnail_url if tv.video else '',
                'has_quiz':      tv.has_quiz,
                'quiz_question_count': tv.quiz_question_count,
                'has_cheatsheet': tv.has_cheatsheet,
                'state':         item['state'],
                'is_locked':     item['is_locked'],
                'is_current':    item['is_current'],
                'watch_pct':     item['watch_pct'],
                'best_score_pct': item['best_score_pct'],
                'cheatsheet_opened': item['cheatsheet_opened'],
                'quiz_attempts': p.quiz_attempts if p else 0,
                'quiz_passed':   p.quiz_passed if p else False,
                'quiz_bypassed': p.quiz_bypassed if p else False,
            })

        return Response({
            'topic': {
                'id':                  topic.id,
                'title':               topic.title,
                'slug':                topic.slug,
                'has_practice_quiz':   bool(topic.quiz_source),
                'practice_quiz_count': topic.quiz_question_count,
            },
            'section': {
                'title':       topic.module.title,
                'short_title': topic.module.short_title,
                'slug':        topic.module.slug,
            },
            'sequence':        items,
            'completion':      completion,
            'live_sessions':   sessions_data,
            'has_live_access': has_live,
        })


class PortalPracticeQuizView(APIView):
    """
    GET  /api/v1/learn/{examSlug}/sections/{sectionSlug}/topics/{topicSlug}/practice/
         → Get questions for the CAT-style practice quiz

    POST /api/v1/learn/{examSlug}/sections/{sectionSlug}/topics/{topicSlug}/practice/submit/
         → Submit practice quiz, get result inline
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug, section_slug, topic_slug):
        if not _check_enrollment(request.user, exam_slug):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        from apps.courses.models import CurriculumTopic
        from apps.tools.models import Question

        try:
            topic = CurriculumTopic.objects.select_related('quiz_source').get(
                slug=topic_slug,
                module__slug=section_slug,
                module__course__exam__slug=exam_slug,
            )
        except CurriculumTopic.DoesNotExist:
            return Response({'error': 'Topic not found'}, status=404)

        if not topic.quiz_source:
            return Response({'available': False, 'reason': 'No practice quiz for this topic'})

        questions = list(
            Question.objects.filter(
                topic=topic.quiz_source
            ).prefetch_related('options').order_by('?')[:topic.quiz_question_count]
        )

        result = []
        for q in questions:
            result.append({
                'id':          q.id,
                'text':        q.text,
                'explanation': q.explanation,
                'options': [
                    {'id': o.id, 'key': o.key, 'text': o.text}
                    for o in q.options.all()
                ],
            })

        return Response({
            'available':       True,
            'total_questions': len(result),
            'questions':       result,
            'topic_title':     topic.title,
        })

    def post(self, request, exam_slug, section_slug, topic_slug):
        """Submit practice quiz answers — score and return inline."""
        if not _check_enrollment(request.user, exam_slug):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        from apps.tools.models import QuestionOption

        answers = request.data.get('answers', [])
        # answers = [{question_id, selected_option_id}]
        # selected_option_id = null means not attempted

        correct = 0
        wrong   = 0
        skipped = 0
        feedback = []

        for ans in answers:
            q_id   = ans.get('question_id')
            opt_id = ans.get('selected_option_id')

            if not opt_id:
                skipped += 1
                # Get correct answer for display
                try:
                    correct_opt = QuestionOption.objects.get(question_id=q_id, is_correct=True)
                    feedback.append({
                        'question_id':        q_id,
                        'selected_option_id': None,
                        'correct_option_id':  correct_opt.id,
                        'correct_option_key': correct_opt.key,
                        'correct_option_text': correct_opt.text,
                        'is_correct':         False,
                        'skipped':            True,
                        'explanation':        correct_opt.question.explanation,
                    })
                except Exception:
                    feedback.append({'question_id': q_id, 'skipped': True})
                continue

            try:
                correct_opt  = QuestionOption.objects.get(question_id=q_id, is_correct=True)
                selected_opt = QuestionOption.objects.filter(id=opt_id).first()
                is_correct   = selected_opt and selected_opt.is_correct

                if is_correct:
                    correct += 1
                else:
                    wrong += 1

                feedback.append({
                    'question_id':         q_id,
                    'selected_option_id':  opt_id,
                    'selected_option_key': selected_opt.key if selected_opt else '',
                    'correct_option_id':   correct_opt.id,
                    'correct_option_key':  correct_opt.key,
                    'correct_option_text': correct_opt.text,
                    'is_correct':          is_correct,
                    'skipped':             False,
                    'explanation':         correct_opt.question.explanation,
                })
            except Exception:
                wrong += 1
                feedback.append({'question_id': q_id, 'is_correct': False})

        total     = len(answers)
        attempted = correct + wrong
        score_pct = round((correct / attempted) * 100, 1) if attempted > 0 else 0

        return Response({
            'correct':    correct,
            'wrong':      wrong,
            'skipped':    skipped,
            'attempted':  attempted,
            'total':      total,
            'score_pct':  score_pct,
            'feedback':   feedback,
        })


# Add to urlpatterns
from django.utils.text import slugify

urlpatterns += [
    # Portal: sections
    path('<slug:exam_slug>/sections/',
         PortalSectionsView.as_view(), name='portal-sections'),

    # Portal: topics in a section
    path('<slug:exam_slug>/sections/<slug:section_slug>/topics/',
         PortalTopicsView.as_view(), name='portal-topics'),

    # Portal: topic detail (4-tab page data)
    path('<slug:exam_slug>/sections/<slug:section_slug>/topics/<slug:topic_slug>/',
         PortalTopicDetailView.as_view(), name='portal-topic-detail'),

    # Practice quiz for a topic
    path('<slug:exam_slug>/sections/<slug:section_slug>/topics/<slug:topic_slug>/practice/',
         PortalPracticeQuizView.as_view(), name='practice-quiz'),
    path('<slug:exam_slug>/sections/<slug:section_slug>/topics/<slug:topic_slug>/practice/submit/',
         PortalPracticeQuizView.as_view(), name='practice-quiz-submit'),
]


class ZoomSignatureView(APIView):
    """
    POST /learn/live-sessions/<id>/signature/
    Generates a Zoom Video SDK JWT for joining a session.
    Requires ZOOM_SDK_KEY and ZOOM_SDK_SECRET in settings/env.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        from apps.learn.models import LiveSession
        import hmac, hashlib, base64, time

        try:
            session = LiveSession.objects.get(id=session_id)
        except LiveSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        sdk_key    = getattr(__import__('django.conf', fromlist=['settings']).settings, 'ZOOM_SDK_KEY', '')
        sdk_secret = getattr(__import__('django.conf', fromlist=['settings']).settings, 'ZOOM_SDK_SECRET', '')

        if not sdk_key or not sdk_secret:
            return Response({
                'error': 'Zoom SDK not configured. Add ZOOM_SDK_KEY and ZOOM_SDK_SECRET to your .env file.',
                'setup_url': 'https://marketplace.zoom.us/develop/create'
            }, status=501)

        role = int(request.data.get('role', 0))  # 0=attendee, 1=host
        session_name = f'gradskool-{session_id}'
        ts = int(time.time()) - 30
        exp = ts + 60 * 120  # 2 hours

        # Build JWT
        import json
        header  = base64.urlsafe_b64encode(json.dumps({'alg':'HS256','typ':'JWT'}).encode()).rstrip(b'=')
        payload = base64.urlsafe_b64encode(json.dumps({
            'app_key':     sdk_key,
            'tpc':         session_name,
            'role_type':   role,
            'user_identity': str(request.user.id),
            'iat':         ts,
            'exp':         exp,
        }).encode()).rstrip(b'=')

        msg       = header + b'.' + payload
        signature = base64.urlsafe_b64encode(
            hmac.new(sdk_secret.encode(), msg, hashlib.sha256).digest()
        ).rstrip(b'=')

        token = (msg + b'.' + signature).decode()

        return Response({
            'signature':    token,
            'session_name': session_name,
            'sdk_key':      sdk_key,
            'password':     '',
        })


# ═══════════════════════════════════════════════════════════════════════════════
# RECORDING PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

class ZoomWebhookView(APIView):
    """
    POST /learn/zoom/webhook/
    Receives Zoom webhook events.
    On recording.completed → fetch from Zoom → upload to Bunny → update LiveSession.

    Setup in Zoom marketplace:
      Event subscriptions → recording.completed
      Webhook URL: https://api.gradskool.in/api/v1/learn/zoom/webhook/
    """
    permission_classes = [AllowAny]  # Public — verified via Zoom token

    def post(self, request):
        import hmac, hashlib
        from django.conf import settings

        # Verify Zoom webhook signature
        zoom_secret = getattr(settings, 'ZOOM_SDK_SECRET', '')
        if zoom_secret:
            msg       = f'v0:{request.headers.get("x-zm-request-timestamp","")}:{request.body.decode()}'
            expected  = 'v0=' + hmac.new(zoom_secret.encode(), msg.encode(), hashlib.sha256).hexdigest()
            received  = request.headers.get('x-zm-signature', '')
            if received and received != expected:
                return Response({'error': 'Invalid signature'}, status=401)

        event = request.data.get('event', '')
        payload = request.data.get('payload', {})

        # URL validation challenge (Zoom sends this on first setup)
        if event == 'endpoint.url_validation':
            plain_token = request.data.get('payload', {}).get('plainToken', '')
            if zoom_secret:
                encrypted = hmac.new(zoom_secret.encode(), plain_token.encode(), hashlib.sha256).hexdigest()
            else:
                encrypted = plain_token
            return Response({'plainToken': plain_token, 'encryptedToken': encrypted})

        # Recording completed event
        if event == 'recording.completed':
            meeting_id = payload.get('object', {}).get('id', '')
            topic      = payload.get('object', {}).get('topic', '')
            files      = payload.get('object', {}).get('recording_files', [])
            dl_token   = payload.get('download_token', '')

            # Find the MP4 recording file
            mp4_file = next((f for f in files if f.get('file_type') == 'MP4'), None)
            if not mp4_file:
                return Response({'status': 'no_mp4'})

            download_url = mp4_file.get('download_url', '')

            # Find matching LiveSession by zoom_meeting_id or meeting topic
            from apps.learn.models import LiveSession
            try:
                session = LiveSession.objects.get(zoom_meeting_id=str(meeting_id))
            except LiveSession.DoesNotExist:
                # Try to match by title
                session = LiveSession.objects.filter(title__icontains=topic).order_by('-scheduled_at').first()

            if session:
                # Save download URL + token — async upload happens separately
                session.zoom_recording_file_url = download_url
                session.zoom_recording_token    = dl_token
                session.recording_processing    = True
                session.status = 'completed'
                session.save()

                # Trigger async upload to Bunny
                _upload_recording_to_bunny.delay(session.id)

            return Response({'status': 'ok'})

        return Response({'status': 'ignored'})


def _upload_recording_to_bunny(session_id):
    """
    Upload a Zoom recording to Bunny Stream.
    Called after recording.completed webhook fires.
    In production this should be a Celery task.
    For now it's a synchronous function called via threading.
    """
    import threading, requests
    from django.conf import settings
    from apps.learn.models import LiveSession

    def run():
        try:
            session = LiveSession.objects.get(id=session_id)
            if not session.zoom_recording_file_url:
                return

            library_id = getattr(settings, 'BUNNY_LIBRARY_ID', '')
            api_key    = getattr(settings, 'BUNNY_STREAM_API_KEY', '')
            if not library_id or not api_key:
                return

            # Step 1: Create a video entry in Bunny
            create_resp = requests.post(
                f'https://video.bunnycdn.com/library/{library_id}/videos',
                headers={'AccessKey': api_key, 'Content-Type': 'application/json'},
                json={'title': session.title, 'collectionId': ''},
            )
            if create_resp.status_code != 200:
                return
            bunny_video_id = create_resp.json().get('guid', '')
            if not bunny_video_id:
                return

            # Step 2: Download from Zoom with auth token
            headers = {}
            if session.zoom_recording_token:
                headers['Authorization'] = 'Bearer ' + session.zoom_recording_token

            zoom_resp = requests.get(session.zoom_recording_file_url, headers=headers, stream=True, timeout=300)
            if zoom_resp.status_code != 200:
                return

            # Step 3: Upload to Bunny Stream
            upload_resp = requests.put(
                f'https://video.bunnycdn.com/library/{library_id}/videos/{bunny_video_id}',
                headers={'AccessKey': api_key, 'Content-Type': 'application/octet-stream'},
                data=zoom_resp.iter_content(chunk_size=65536),
            )

            if upload_resp.status_code == 200:
                pull_zone = getattr(settings, 'BUNNY_PULL_ZONE_URL', '')
                session.bunny_video_id      = bunny_video_id
                session.recording_url       = f'{pull_zone}/{bunny_video_id}/play.mp4' if pull_zone else bunny_video_id
                session.recording_available = True
                session.recording_processing= False
                session.save()

        except Exception as e:
            try:
                from apps.learn.models import LiveSession
                LiveSession.objects.filter(id=session_id).update(recording_processing=False)
            except: pass

    threading.Thread(target=run, daemon=True).start()


class RecordingUploadView(APIView):
    """
    POST /learn/live-sessions/<id>/upload-recording/
    Admin-triggered: fetches recording from Zoom and uploads to Bunny.
    Use this when webhook isn't configured or as a manual trigger.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=403)

        from apps.learn.models import LiveSession
        try:
            session = LiveSession.objects.get(id=session_id)
        except LiveSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        # If a direct URL is provided (manual upload path)
        direct_url = request.data.get('recording_url', '')
        if direct_url:
            session.zoom_recording_file_url = direct_url
            session.recording_processing = True
            session.status = 'completed'
            session.save()
            _upload_recording_to_bunny(session.id)
            return Response({'status': 'uploading', 'message': 'Upload started. Check back in a few minutes.'})

        # Try to fetch from Zoom API
        from django.conf import settings
        account_id    = getattr(settings, 'ZOOM_ACCOUNT_ID', '')
        client_id     = getattr(settings, 'ZOOM_CLIENT_ID', '')
        client_secret = getattr(settings, 'ZOOM_CLIENT_SECRET', '')

        if not all([account_id, client_id, client_secret]):
            return Response({
                'error': 'Zoom API not configured. Add ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET to .env',
                'alternative': 'POST with {"recording_url": "https://..."} to upload a direct URL instead'
            }, status=501)

        try:
            import requests as req, base64

            # Get OAuth token
            creds = base64.b64encode(f'{client_id}:{client_secret}'.encode()).decode()
            token_resp = req.post(
                'https://zoom.us/oauth/token',
                params={'grant_type': 'account_credentials', 'account_id': account_id},
                headers={'Authorization': f'Basic {creds}'}
            )
            access_token = token_resp.json().get('access_token', '')
            if not access_token:
                return Response({'error': 'Failed to get Zoom OAuth token'}, status=502)

            # Get recordings for the meeting
            meeting_id = session.zoom_meeting_id
            if not meeting_id:
                return Response({'error': 'zoom_meeting_id not set on this session. Set it in the admin panel.'}, status=400)

            rec_resp = req.get(
                f'https://api.zoom.us/v2/meetings/{meeting_id}/recordings',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            if rec_resp.status_code != 200:
                return Response({'error': f'Zoom API error: {rec_resp.json()}'}, status=502)

            files = rec_resp.json().get('recording_files', [])
            mp4   = next((f for f in files if f.get('file_type') == 'MP4'), None)

            if not mp4:
                return Response({'error': 'No MP4 recording found for this meeting'}, status=404)

            session.zoom_recording_file_url = mp4['download_url']
            session.zoom_recording_token    = access_token
            session.recording_processing    = True
            session.status = 'completed'
            session.save()

            _upload_recording_to_bunny(session.id)
            return Response({'status': 'uploading', 'message': 'Fetched from Zoom. Uploading to Bunny Stream now...'})

        except Exception as e:
            return Response({'error': str(e)}, status=500)


class RecordingStatusView(APIView):
    """
    GET /learn/live-sessions/<id>/recording-status/
    Poll this to check if recording is ready.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        from apps.learn.models import LiveSession
        try:
            s = LiveSession.objects.get(id=session_id)
            return Response({
                'session_id':           s.id,
                'recording_available':  s.recording_available,
                'recording_processing': s.recording_processing,
                'bunny_video_id':       s.bunny_video_id,
                'recording_url':        s.recording_url,
                'status':               s.status,
            })
        except LiveSession.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


class PortalRecordingsView(APIView):
    """
    GET /learn/<exam_slug>/recordings/
    Returns all recordings for enrolled students:
    - Live session recordings (bunny_video_id set + recording_available)
    - Curriculum videos marked as recordings
    Grouped by section.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug):
        from apps.courses.models import Exam, CurriculumModule
        from apps.learn.models import LiveSession
        from apps.enrollments.models import CourseAccess

        try:
            exam = Exam.objects.get(slug=exam_slug)
        except Exam.DoesNotExist:
            return Response({'error': 'Exam not found'}, status=404)

        # Check enrollment
        has_access = CourseAccess.objects.filter(
            user=request.user, exam=exam, can_watch_recordings=True
        ).exists()

        # Live session recordings
        live_recs = LiveSession.objects.filter(
            topic__module__course__exam=exam,
            recording_available=True,
            bunny_video_id__isnull=False
        ).exclude(bunny_video_id='').select_related('topic__module').order_by('-scheduled_at')

        data = []
        for session in live_recs:
            data.append({
                'id':             f'live-{session.id}',
                'type':           'live_session',
                'title':          session.title,
                'section_title':  session.topic.module.title,
                'section_slug':   session.topic.module.slug,
                'topic_title':    session.topic.title,
                'topic_slug':     session.topic.slug,
                'bunny_video_id': session.bunny_video_id,
                'duration_mins':  session.duration_mins,
                'recorded_at':    session.scheduled_at.isoformat(),
                'label':          '📡 Live Recording',
            })

        return Response({
            'exam_slug':  exam_slug,
            'recordings': data,
            'count':      len(data),
        })


# ═══════════════════════════════════════════════════════════════════════════════
# GAMIFICATION VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class StudentGamificationView(APIView):
    """GET /learn/gamification/ — XP, streak, badges, goals for current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import (Badge, StudentBadge, StudentGoal,
                                        SpacedRepetition, TopicVideoProgress)
        from apps.courses.models import Exam
        from django.utils import timezone
        import datetime

        user = request.user
        exam_slug = request.query_params.get('exam', '')

        # XP: sum all video completions (30 per video) + quiz attempts (50 per passing attempt)
        video_count = TopicVideoProgress.objects.filter(user=user, watch_pct__gte=70).count()
        from apps.learn.models import QuizAttempt
        pass_count  = QuizAttempt.objects.filter(user=user, score_pct__gte=60).count()
        xp = video_count * 30 + pass_count * 50

        # Streak: count consecutive days with at least one video watched
        streak = 0
        today  = timezone.now().date()
        for i in range(60):
            day = today - datetime.timedelta(days=i)
            watched = TopicVideoProgress.objects.filter(
                user=user,
                completed_at__date=day,
                watch_pct__gte=70
            ).exists()
            if watched:
                streak += 1
            else:
                break

        # Earned badges
        badges = list(StudentBadge.objects.filter(user=user).select_related('badge').values(
            'badge__name', 'badge__icon', 'badge__description',
            'badge__badge_type', 'earned_at', 'exam_slug'
        ))

        # Goals
        goals_qs = StudentGoal.objects.filter(user=user, is_active=True)
        if exam_slug: goals_qs = goals_qs.filter(exam_slug=exam_slug)
        goals = []
        for g in goals_qs:
            # Calculate today's progress toward each goal
            progress = 0
            today_start = timezone.now().replace(hour=0, minute=0, second=0)
            if g.metric == 'videos':
                progress = TopicVideoProgress.objects.filter(
                    user=user, completed_at__gte=today_start, watch_pct__gte=70
                ).count()
            elif g.metric == 'quiz_score':
                last = QuizAttempt.objects.filter(user=user).order_by('-created_at').first()
                progress = round(last.score_pct) if last else 0
            goals.append({
                'id': g.id, 'period': g.period, 'metric': g.metric,
                'target': g.target, 'progress': progress,
                'pct': min(100, round(progress / g.target * 100)) if g.target else 0,
            })

        # Spaced repetition — topics due for review today
        due_reviews = list(
            SpacedRepetition.objects.filter(
                user=user, review_due__lte=today
            ).select_related('topic__module__course__exam').values(
                'topic__id', 'topic__title', 'topic__slug',
                'topic__module__slug', 'topic__module__course__exam__slug',
                'last_score', 'review_due', 'reps'
            )[:10]
        )

        # Weak topics: quiz attempts with score < 50%
        weak = list(QuizAttempt.objects.filter(
            user=user, score_pct__lt=50
        ).select_related('topic_video__topic__module__course__exam').values(
            'topic_video__topic__id', 'topic_video__topic__title',
            'topic_video__topic__slug', 'topic_video__topic__module__slug',
            'topic_video__topic__module__course__exam__slug',
            'score_pct'
        ).order_by('score_pct')[:8])

        return Response({
            'xp':           xp,
            'streak':       streak,
            'level':        min(10, xp // 500 + 1),
            'xp_to_next':   500 - (xp % 500),
            'badges':       badges,
            'goals':        goals,
            'due_reviews':  due_reviews,
            'weak_topics':  weak,
        })


class StudentGoalView(APIView):
    """POST/DELETE /learn/goals/ — create or remove a study goal."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.learn.models import StudentGoal
        d = request.data
        g = StudentGoal.objects.create(
            user=request.user,
            exam_slug=d.get('exam_slug', ''),
            period=d.get('period', 'daily'),
            metric=d.get('metric', 'videos'),
            target=int(d.get('target', 2)),
        )
        return Response({'id': g.id, 'metric': g.metric, 'target': g.target}, status=201)

    def delete(self, request, goal_id):
        from apps.learn.models import StudentGoal
        StudentGoal.objects.filter(id=goal_id, user=request.user).update(is_active=False)
        return Response({'deleted': True})


class SpacedRepetitionView(APIView):
    """
    GET  /learn/spaced-rep/?exam=cat  — topics due for review
    POST /learn/spaced-rep/           — update after reviewing (pass score)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import SpacedRepetition
        import datetime
        today = __import__('datetime').date.today()
        due = SpacedRepetition.objects.filter(
            user=request.user, review_due__lte=today
        ).select_related('topic__module__course__exam')
        exam = request.query_params.get('exam', '')
        if exam: due = due.filter(topic__module__course__exam__slug=exam)
        return Response({'due': [{
            'topic_id':    d.topic.id,
            'title':       d.topic.title,
            'slug':        d.topic.slug,
            'section':     d.topic.module.slug,
            'exam':        d.topic.module.course.exam.slug,
            'last_score':  d.last_score,
            'review_due':  str(d.review_due),
            'reps':        d.reps,
        } for d in due]})

    def post(self, request):
        from apps.learn.models import SpacedRepetition
        from apps.courses.models import CurriculumTopic
        import datetime
        d = request.data
        topic_id  = d.get('topic_id')
        score_pct = float(d.get('score_pct', 0))
        try:
            topic = CurriculumTopic.objects.get(id=topic_id)
            sr, _ = SpacedRepetition.objects.get_or_create(
                user=request.user, topic=topic,
                defaults={'review_due': datetime.date.today(), 'interval_days': 1}
            )
            sr.next_interval(score_pct)
            return Response({'next_review': str(sr.review_due), 'interval': sr.interval_days})
        except CurriculumTopic.DoesNotExist:
            return Response({'error': 'Topic not found'}, status=404)


class AdaptiveQuizView(APIView):
    """
    GET /learn/<exam_slug>/adaptive-quiz/?topic_id=X
    Returns questions adapted to student's performance on this topic.
    Harder questions if recent score > 70%, easier if < 40%, mixed otherwise.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug):
        from apps.learn.models import QuizAttempt, TopicVideo
        from apps.tools.models import Question, QuestionOption
        from apps.courses.models import CurriculumTopic

        topic_id = request.query_params.get('topic_id')
        count    = int(request.query_params.get('count', 10))

        # Get recent score for this topic
        recent_score = 50  # default mid
        if topic_id:
            last_attempt = QuizAttempt.objects.filter(
                user=request.user,
                topic_video__topic_id=topic_id
            ).order_by('-created_at').first()
            if last_attempt:
                recent_score = last_attempt.score_pct

        # Choose difficulty based on score
        if recent_score >= 70:
            difficulties = ['hard', 'advanced']
            label = 'Challenge mode — pushing you harder'
        elif recent_score <= 40:
            difficulties = ['easy', 'medium']
            label = "Building foundations — strengthening the basics"
        else:
            difficulties = ['medium']
            label = 'Standard — calibrated to your current level'

        # Get questions
        qs = Question.objects.filter(
            exam_tag=exam_slug, is_active=True,
        )
        if topic_id:
            # Get questions tagged to this topic
            from apps.tools.models import Tag
            tag = Tag.objects.filter(name=f'topic:{CurriculumTopic.objects.get(id=topic_id).slug}').first()
            if tag: qs = qs.filter(tags=tag)

        # Try difficulty-filtered first, fallback to all
        filtered = qs.filter(difficulty_tag__in=difficulties)
        if filtered.count() < count:
            filtered = qs

        import random
        selected = random.sample(list(filtered), min(count, filtered.count()))

        return Response({
            'label':      label,
            'difficulty': 'hard' if recent_score >= 70 else 'easy' if recent_score <= 40 else 'medium',
            'count':      len(selected),
            'questions':  [{
                'id':          q.id,
                'text':        q.question_text,
                'explanation': q.explanation,
                'options':     [{'key':o.key,'text':o.text,'is_correct':o.is_correct}
                                for o in QuestionOption.objects.filter(question=q)],
            } for q in selected],
        })


class PortalNotesView(APIView):
    """GET /learn/<exam_slug>/notes/ — resources and notes for enrolled students."""
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_slug):
        from apps.courses.models import Exam, Course, CourseComponent
        from apps.enrollments.models import CourseAccess
        try:
            exam = Exam.objects.get(slug=exam_slug)
        except Exam.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        courses = Course.objects.filter(exam=exam, status='active')
        all_resources = []
        for course in courses:
            resource_comps = CourseComponent.objects.filter(
                course=course,
                component_type__in=['resources', 'notes'],
                is_enabled=True
            )
            for comp in resource_comps:
                items = comp.config.get('items', [])
                all_resources.append({
                    'course': course.title,
                    'type':   comp.component_type,
                    'title':  comp.display_title,
                    'items':  items,
                })

        return Response({
            'exam': exam_slug,
            'sections': all_resources,
        })


class StudentProfileView(APIView):
    """GET/PATCH /learn/profile/ — student can view and edit their own profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        from apps.enrollments.models import Enrollment
        from apps.learn.models import TopicVideoProgress, QuizAttempt
        enrollments = Enrollment.objects.filter(user=u, status='active').select_related('plan__exam')
        return Response({
            'id':          u.id,
            'first_name':  u.first_name,
            'last_name':   u.last_name,
            'email':       u.email,
            'phone':       u.phone,
            'target_exam': u.target_exam,
            'target_score':getattr(u, 'target_score', ''),
            'exam_date':   str(getattr(u, 'exam_date', '') or ''),
            'avatar_color':getattr(u, 'avatar_color', '#ff5e5f'),
            'joined':      u.created_at.isoformat(),
            'enrollments': [{'exam': e.plan.exam.name, 'plan': e.plan.name} for e in enrollments],
            'videos_watched': TopicVideoProgress.objects.filter(user=u, watch_pct__gte=70).count(),
            'quizzes_done':   QuizAttempt.objects.filter(user=u).count(),
        })

    def patch(self, request):
        u = request.user
        for field in ['first_name', 'last_name', 'phone', 'target_exam']:
            if field in request.data:
                setattr(u, field, request.data[field])
        u.save()
        return Response({'updated': True})


class BadgeCheckView(APIView):
    """
    POST /learn/check-badges/
    Called after a video watch or quiz — checks and awards any newly earned badges.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.learn.models import (Badge, StudentBadge, TopicVideoProgress,
                                        QuizAttempt)
        from django.utils import timezone
        import datetime

        user = request.user
        exam_slug = request.data.get('exam_slug', '')
        newly_earned = []

        # Check all active badges
        for badge in Badge.objects.filter(is_active=True):
            # Already earned?
            if StudentBadge.objects.filter(user=user, badge=badge, exam_slug=exam_slug).exists():
                continue

            earned = False
            if badge.badge_type == 'streak':
                # Count streak
                streak = 0
                today = timezone.now().date()
                for i in range(badge.threshold + 5):
                    day = today - datetime.timedelta(days=i)
                    if TopicVideoProgress.objects.filter(user=user, completed_at__date=day, watch_pct__gte=70).exists():
                        streak += 1
                    else:
                        break
                earned = streak >= badge.threshold

            elif badge.badge_type == 'completion':
                count = TopicVideoProgress.objects.filter(user=user, watch_pct__gte=70).count()
                earned = count >= badge.threshold

            elif badge.badge_type == 'score':
                best = QuizAttempt.objects.filter(user=user).order_by('-score_pct').first()
                earned = best and best.score_pct >= badge.threshold

            if earned:
                StudentBadge.objects.create(user=user, badge=badge, exam_slug=exam_slug)
                newly_earned.append({
                    'name':        badge.name,
                    'icon':        badge.icon,
                    'description': badge.description,
                    'xp_reward':   badge.xp_reward,
                })

        return Response({'newly_earned': newly_earned, 'count': len(newly_earned)})


# ═══════════════════════════════════════════════════════════════════════════════
# BOOKMARKS + CHAPTERS
# ═══════════════════════════════════════════════════════════════════════════════

class VideoBookmarkView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_video_id):
        from apps.learn.models import VideoBookmark
        bm = VideoBookmark.objects.filter(user=request.user, topic_video_id=topic_video_id).order_by('timestamp_secs')
        return Response([{
            'id': b.id, 'timestamp_secs': b.timestamp_secs,
            'timestamp_display': b.timestamp_display, 'note': b.note,
        } for b in bm])

    def post(self, request, topic_video_id):
        from apps.learn.models import VideoBookmark, TopicVideo
        try:
            tv = TopicVideo.objects.get(id=topic_video_id)
        except TopicVideo.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        b = VideoBookmark.objects.create(
            user=request.user, topic_video=tv,
            timestamp_secs=int(request.data.get('timestamp_secs', 0)),
            note=request.data.get('note', ''),
        )
        return Response({'id': b.id, 'timestamp_display': b.timestamp_display}, status=201)

    def delete(self, request, topic_video_id, bookmark_id=None):
        from apps.learn.models import VideoBookmark
        VideoBookmark.objects.filter(id=bookmark_id, user=request.user).delete()
        return Response({'deleted': True})


class VideoChapterView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_video_id):
        from apps.learn.models import VideoChapter
        chapters = VideoChapter.objects.filter(topic_video_id=topic_video_id)
        return Response([{
            'id': c.id, 'title': c.title,
            'timestamp_secs': c.timestamp_secs,
            'timestamp_display': f"{c.timestamp_secs//60}:{c.timestamp_secs%60:02d}",
        } for c in chapters])

    def post(self, request, topic_video_id):
        if request.user.role != 'admin': return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import VideoChapter, TopicVideo
        tv = TopicVideo.objects.get(id=topic_video_id)
        c = VideoChapter.objects.create(
            topic_video=tv,
            title=request.data.get('title', ''),
            timestamp_secs=int(request.data.get('timestamp_secs', 0)),
            sort_order=VideoChapter.objects.filter(topic_video=tv).count(),
        )
        return Response({'id': c.id, 'title': c.title}, status=201)


# ═══════════════════════════════════════════════════════════════════════════════
# STUDENT NOTES (personal, per topic/video)
# ═══════════════════════════════════════════════════════════════════════════════

class StudentNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import StudentNote
        topic_video_id = request.query_params.get('topic_video_id')
        topic_id       = request.query_params.get('topic_id')
        if topic_video_id:
            note = StudentNote.objects.filter(user=request.user, topic_video_id=topic_video_id).first()
        elif topic_id:
            note = StudentNote.objects.filter(user=request.user, topic_id=topic_id).first()
        else:
            return Response({'error': 'topic_video_id or topic_id required'}, status=400)
        return Response({'content': note.content if note else '', 'updated_at': note.updated_at.isoformat() if note else None})

    def post(self, request):
        from apps.learn.models import StudentNote, TopicVideo
        from apps.courses.models import CurriculumTopic
        topic_video_id = request.data.get('topic_video_id')
        topic_id       = request.data.get('topic_id')
        content        = request.data.get('content', '')
        if topic_video_id:
            tv = TopicVideo.objects.get(id=topic_video_id)
            note, _ = StudentNote.objects.update_or_create(
                user=request.user, topic_video=tv,
                defaults={'content': content}
            )
        elif topic_id:
            t = CurriculumTopic.objects.get(id=topic_id)
            note, _ = StudentNote.objects.update_or_create(
                user=request.user, topic=t,
                defaults={'content': content}
            )
        else:
            return Response({'error': 'topic_video_id or topic_id required'}, status=400)
        return Response({'saved': True, 'updated_at': note.updated_at.isoformat()})


# ═══════════════════════════════════════════════════════════════════════════════
# TRANSCRIPT
# ═══════════════════════════════════════════════════════════════════════════════

class VideoTranscriptView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_video_id):
        from apps.learn.models import VideoTranscript
        t = VideoTranscript.objects.filter(topic_video_id=topic_video_id, language='en').first()
        if not t:
            return Response({'available': False, 'segments': [], 'full_text': ''})
        return Response({'available': True, 'segments': t.segments, 'full_text': t.full_text})


# ═══════════════════════════════════════════════════════════════════════════════
# WATCH SESSION (for heatmap + drop-off)
# ═══════════════════════════════════════════════════════════════════════════════

class WatchSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.learn.models import WatchSession, TopicVideo, StudySession
        import datetime
        d = request.data
        tv_id = d.get('topic_video_id')
        try:
            tv = TopicVideo.objects.get(id=tv_id)
        except TopicVideo.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        WatchSession.objects.create(
            user=request.user,
            topic_video=tv,
            max_reached_secs=int(d.get('max_reached_secs', 0)),
            total_watch_secs=int(d.get('total_watch_secs', 0)),
            speed=float(d.get('speed', 1.0)),
            heatmap=d.get('heatmap', []),
        )

        # Update study session for today
        today = datetime.date.today()
        exam_slug = tv.topic.module.course.exam.slug if tv.topic else ''
        ss, _ = StudySession.objects.get_or_create(
            user=request.user, date=today, exam_slug=exam_slug,
            defaults={'minutes': 0, 'videos': 0, 'quizzes': 0}
        )
        ss.minutes += max(0, int(d.get('total_watch_secs', 0)) // 60)
        ss.videos  += 1
        ss.save()
        return Response({'saved': True})


# ═══════════════════════════════════════════════════════════════════════════════
# STUDY TIME HEATMAP
# ═══════════════════════════════════════════════════════════════════════════════

class StudyHeatmapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import StudySession
        import datetime
        exam_slug = request.query_params.get('exam', '')
        qs = StudySession.objects.filter(user=request.user)
        if exam_slug: qs = qs.filter(exam_slug=exam_slug)

        # Last 365 days
        today = datetime.date.today()
        start = today - datetime.timedelta(days=364)
        qs = qs.filter(date__gte=start)

        data = {str(s.date): {'minutes': s.minutes, 'videos': s.videos, 'quizzes': s.quizzes}
                for s in qs}
        return Response({
            'heatmap': data,
            'total_days': len(data),
            'total_minutes': sum(v['minutes'] for v in data.values()),
            'total_videos': sum(v['videos'] for v in data.values()),
            'longest_streak': _calc_streak(data, today),
        })


def _calc_streak(data, today):
    import datetime
    streak = 0
    for i in range(365):
        day = today - datetime.timedelta(days=i)
        if str(day) in data and data[str(day)]['minutes'] > 0:
            streak += 1
        else:
            break
    return streak


# ═══════════════════════════════════════════════════════════════════════════════
# COHORT COMPARISON
# ═══════════════════════════════════════════════════════════════════════════════

class CohortComparisonView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import TopicVideoProgress, QuizAttempt
        from apps.enrollments.models import Enrollment
        from django.db.models import Avg, Count
        exam_slug = request.query_params.get('exam', '')

        # Get all students in same cohort
        try:
            enroll = Enrollment.objects.filter(user=request.user, status='active').first()
            if enroll:
                cohort_users = Enrollment.objects.filter(
                    plan=enroll.plan, status='active'
                ).values_list('user_id', flat=True)
            else:
                cohort_users = []
        except: cohort_users = []

        # My stats
        my_videos = TopicVideoProgress.objects.filter(user=request.user, watch_pct__gte=70).count()
        my_quiz   = QuizAttempt.objects.filter(user=request.user).aggregate(avg=Avg('score_pct'))['avg'] or 0

        # Cohort stats
        if cohort_users:
            cohort_videos = TopicVideoProgress.objects.filter(
                student__in=cohort_users, watch_pct__gte=70
            ).values('student').annotate(c=Count('id')).aggregate(avg=Avg('c'))['avg'] or 0
            cohort_quiz = QuizAttempt.objects.filter(
                user__in=cohort_users
            ).aggregate(avg=Avg('score_pct'))['avg'] or 0
            cohort_size = len(cohort_users)
        else:
            cohort_videos = my_videos * 0.9  # demo
            cohort_quiz   = my_quiz * 0.95
            cohort_size   = 1

        return Response({
            'me': {
                'videos_watched': my_videos,
                'avg_quiz_score': round(my_quiz, 1),
            },
            'cohort': {
                'avg_videos': round(cohort_videos, 1),
                'avg_quiz':   round(cohort_quiz, 1),
                'size':       cohort_size,
            },
            'percentile': {
                'videos': min(99, round(my_videos / max(cohort_videos, 1) * 70 + 15)),
                'quiz':   min(99, round(my_quiz / max(cohort_quiz, 1) * 70 + 15)),
            }
        })


# ═══════════════════════════════════════════════════════════════════════════════
# MILESTONES — check and mark
# ═══════════════════════════════════════════════════════════════════════════════

class MilestoneView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import StudentMilestone
        milestones = StudentMilestone.objects.filter(user=request.user)
        # Get uncelebrated ones to show popup
        uncelebrated = list(milestones.filter(celebrated=False).values('id','milestone','achieved_at'))
        # Mark as celebrated
        milestones.filter(celebrated=False).update(celebrated=True)
        return Response({'uncelebrated': uncelebrated, 'total': milestones.count()})

    def post(self, request):
        """Check if any new milestones earned and record them."""
        from apps.learn.models import (StudentMilestone, TopicVideoProgress,
                                        QuizAttempt, Badge, StudentBadge)
        import datetime
        user = request.user
        exam_slug = request.data.get('exam_slug', '')
        newly = []

        checks = {
            'first_video':   TopicVideoProgress.objects.filter(user=user, watch_pct__gte=70).count() >= 1,
            'first_quiz':    QuizAttempt.objects.filter(user=user).count() >= 1,
            'videos_10':     TopicVideoProgress.objects.filter(user=user, watch_pct__gte=70).count() >= 10,
            'videos_50':     TopicVideoProgress.objects.filter(user=user, watch_pct__gte=70).count() >= 50,
            'perfect_score': QuizAttempt.objects.filter(user=user, score_pct=100).exists(),
        }

        for milestone, earned in checks.items():
            if earned and not StudentMilestone.objects.filter(user=user, milestone=milestone, exam_slug=exam_slug).exists():
                StudentMilestone.objects.create(user=user, milestone=milestone, exam_slug=exam_slug)
                label = dict(StudentMilestone.MILESTONES).get(milestone, milestone)
                newly.append({'milestone': milestone, 'label': label})

        return Response({'newly_earned': newly})


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN — Content Performance
# ═══════════════════════════════════════════════════════════════════════════════

class AdminContentPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin': return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import TopicVideo, WatchSession, TopicVideoProgress, QuizAttempt
        from apps.courses.models import Exam
        from django.db.models import Avg, Count, Max
        exam_slug = request.query_params.get('exam', 'cat')

        videos = TopicVideo.objects.filter(
            topic__module__course__exam__slug=exam_slug
        ).select_related('topic__module').prefetch_related('watch_sessions', 'progress_records')

        data = []
        for v in videos:
            sessions = WatchSession.objects.filter(topic_video=v)
            progress = TopicVideoProgress.objects.filter(topic_video=v)
            quizzes  = QuizAttempt.objects.filter(topic_video=v)

            total_views    = sessions.count()
            unique_viewers = sessions.values('user').distinct().count()
            avg_watch_pct  = progress.aggregate(avg=Avg('watch_pct'))['avg'] or 0
            completed      = progress.filter(watch_pct__gte=70).count()
            avg_quiz_score = quizzes.aggregate(avg=Avg('score_pct'))['avg'] or 0

            # Per-student breakdown
            student_data = []
            for p in progress.select_related('student').order_by('-watch_pct')[:20]:
                last_session = sessions.filter(user=p.student).order_by('-started_at').first()
                q = quizzes.filter(user=p.student).order_by('-created_at').first()
                student_data.append({
                    'name':       f'{p.student.first_name} {p.student.last_name}'.strip() or p.student.email,
                    'watch_pct':  round(p.watch_pct),
                    'watched_secs': p.watched_secs,
                    'last_watched': last_session.started_at.isoformat() if last_session else None,
                    'quiz_score': round(q.score_pct) if q else None,
                })

            data.append({
                'id':            v.id,
                'title':         v.title,
                'section':       v.topic.module.short_title,
                'topic':         v.topic.title,
                'duration_mins': v.duration_mins,
                'total_views':   total_views,
                'unique_viewers':unique_viewers,
                'avg_watch_pct': round(avg_watch_pct),
                'completion_rate': round(completed / max(unique_viewers, 1) * 100),
                'avg_quiz_score':round(avg_quiz_score),
                'students':      student_data,
            })

        # Sort by views desc
        data.sort(key=lambda x: -x['unique_viewers'])
        return Response({'videos': data, 'exam': exam_slug})


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN — Batch Health + Drop-off Heatmap
# ═══════════════════════════════════════════════════════════════════════════════

class AdminBatchHealthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin': return Response({'error': 'Admin only'}, status=403)
        from apps.enrollments.models import Enrollment
        from apps.learn.models import TopicVideoProgress, QuizAttempt, WatchSession
        from apps.courses.models import Exam
        from django.utils import timezone
        import datetime

        exam_slug = request.query_params.get('exam', 'cat')
        now       = timezone.now()

        try:
            exam     = Exam.objects.get(slug=exam_slug)
            students = Enrollment.objects.filter(
                plan__exam=exam, status='active'
            ).select_related('user').order_by('-created_at')
        except:
            return Response({'students': [], 'summary': {}})

        data = []
        at_risk = engaged = inactive = 0

        for e in students:
            u = e.user
            last_session = WatchSession.objects.filter(user=u).order_by('-started_at').first()
            days_since   = (now - last_session.started_at).days if last_session else 999

            videos   = TopicVideoProgress.objects.filter(student=u, watch_pct__gte=70).count()
            quizzes  = QuizAttempt.objects.filter(user=u).count()
            avg_quiz = QuizAttempt.objects.filter(user=u).aggregate(
                avg=__import__('django.db.models',fromlist=['Avg']).Avg('score_pct')
            )['avg'] or 0

            status = 'at_risk' if days_since >= 5 else 'inactive' if days_since >= 2 else 'engaged'
            if status == 'at_risk': at_risk += 1
            elif status == 'inactive': inactive += 1
            else: engaged += 1

            data.append({
                'id':          u.id,
                'name':        f'{u.first_name} {u.last_name}'.strip() or u.email,
                'email':       u.email,
                'days_since':  days_since,
                'videos':      videos,
                'quizzes':     quizzes,
                'avg_quiz':    round(avg_quiz),
                'status':      status,
                'enrolled_at': e.created_at.isoformat() if hasattr(e, 'created_at') else '',
            })

        data.sort(key=lambda x: -x['days_since'])
        return Response({
            'students': data,
            'summary': {
                'total':    len(data),
                'engaged':  engaged,
                'inactive': inactive,
                'at_risk':  at_risk,
            }
        })


class AdminDropoffHeatmapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin': return Response({'error': 'Admin only'}, status=403)
        from apps.learn.models import WatchSession, TopicVideo
        from django.db.models import Avg, Count
        exam_slug = request.query_params.get('exam', 'cat')

        videos = TopicVideo.objects.filter(
            topic__module__course__exam__slug=exam_slug
        ).select_related('topic__module')[:20]

        data = []
        for v in videos:
            sessions = WatchSession.objects.filter(topic_video=v)
            total    = sessions.count()
            if total == 0: continue

            # Calculate drop-off: what % of viewers reached each quartile
            duration = v.duration_mins * 60
            quartiles = {}
            for pct in [25, 50, 75, 100]:
                secs = duration * pct // 100
                reached = sessions.filter(max_reached_secs__gte=secs).count()
                quartiles[f'q{pct}'] = round(reached / total * 100)

            data.append({
                'id':       v.id,
                'title':    v.title[:50],
                'section':  v.topic.module.short_title,
                'views':    total,
                'quartiles': quartiles,
                'avg_watch': round(sessions.aggregate(avg=Avg('max_reached_secs'))['avg'] or 0),
                'duration_secs': duration,
            })

        data.sort(key=lambda x: -x['views'])
        return Response({'videos': data, 'exam': exam_slug})


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC — Results Wall, Concept Glossary
# ═══════════════════════════════════════════════════════════════════════════════

class ResultsWallView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from apps.learn.models import StudentResult
        exam = request.query_params.get('exam', '')
        qs   = StudentResult.objects.filter(is_verified=True).order_by('-percentile')
        if exam: qs = qs.filter(exam=exam)
        results = list(qs[:30].values(
            'id','name','exam','year','percentile','score',
            'college_calls','photo_url','testimonial','is_featured'
        ))
        return Response({'results': results})


# ═══════════════════════════════════════════════════════════════════════════════
# STUDY PLAN — AI-generated personalised plan
# ═══════════════════════════════════════════════════════════════════════════════

class StudyPlanView(APIView):
    """
    GET  /learn/study-plan/?exam=cat        latest active plan
    POST /learn/study-plan/                  generate new plan
    PUT  /learn/study-plan/<id>/task/       mark a task done/undone
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import StudyPlan
        exam_slug = request.query_params.get('exam', request.user.target_exam or 'cat')
        plan = StudyPlan.objects.filter(
            user=request.user, exam_slug=exam_slug, is_active=True
        ).order_by('-generated_at').first()

        if not plan:
            return Response({'plan': None, 'message': 'No plan yet. Generate one below.'})

        return Response({
            'id':           plan.id,
            'exam_slug':    plan.exam_slug,
            'exam_date':    str(plan.exam_date),
            'daily_hours':  plan.daily_hours,
            'days_to_exam': plan.days_to_exam,
            'total_weeks':  plan.total_weeks,
            'generated_at': plan.generated_at.isoformat(),
            'plan_data':    plan.plan_data,
            'context_used': plan.context_used,
        })

    def post(self, request):
        """Generate a new AI study plan."""
        from apps.learn.models import (StudyPlan, QuizAttempt,
                                        TopicVideoProgress, StudentGoal,
                                        SpacedRepetition)
        from apps.courses.models import Exam, CurriculumModule
        from django.conf import settings
        import datetime, json

        d           = request.data
        exam_slug   = d.get('exam_slug', request.user.target_exam or 'cat')
        exam_date_s = d.get('exam_date', '')
        daily_hours = float(d.get('daily_hours', 2.0))
        daily_mins  = int(daily_hours * 60)

        # Parse exam date
        try:
            exam_date = datetime.date.fromisoformat(exam_date_s)
        except:
            # Default to CAT date Nov 24
            exam_date = datetime.date(datetime.date.today().year, 11, 24)

        days_left = max(7, (exam_date - datetime.date.today()).days)

        # ── Gather student context ──────────────────────────────────────────
        user = request.user

        # Weak topics (quiz score < 60%)
        weak_topics = list(
            QuizAttempt.objects.filter(user=user, score_pct__lt=60)
            .select_related('topic_video__topic__module')
            .values(
                'topic_video__topic__title',
                'topic_video__topic__slug',
                'topic_video__topic__module__title',
                'topic_video__topic__module__slug',
                'score_pct'
            ).order_by('score_pct')[:10]
        )

        # Topics not yet started
        watched_topic_ids = set(
            TopicVideoProgress.objects.filter(user=user, watch_pct__gte=70)
            .values_list('topic_video__topic_id', flat=True)
        )

        # Full curriculum for this exam
        try:
            exam = Exam.objects.get(slug=exam_slug)
            modules = CurriculumModule.objects.filter(
                course__exam=exam
            ).prefetch_related('topics').order_by('sort_order', 'number')

            all_topics = []
            for mod in modules:
                for t in mod.topics.all().order_by('sort_order'):
                    all_topics.append({
                        'topic':    t.title,
                        'slug':     t.slug,
                        'section':  mod.title,
                        'section_slug': mod.slug,
                        'done':     t.id in watched_topic_ids,
                    })
        except Exception:
            all_topics = []

        # Goals
        goals = list(
            StudentGoal.objects.filter(user=user, exam_slug=exam_slug, is_active=True)
            .values('metric', 'target', 'period')
        )

        # Due reviews (spaced rep)
        due_reviews = list(
            SpacedRepetition.objects.filter(
                user=user,
                review_due__lte=datetime.date.today(),
                topic__module__course__exam__slug=exam_slug
            ).values('topic__title', 'topic__slug', 'last_score')[:5]
        )

        context = {
            'exam':         exam_slug.upper(),
            'exam_date':    str(exam_date),
            'days_left':    days_left,
            'daily_mins':   daily_mins,
            'weak_topics':  weak_topics,
            'all_topics':   all_topics[:30],
            'goals':        goals,
            'due_reviews':  due_reviews,
            'student_name': user.first_name or 'Student',
        }

        # ── Rule-based plan generation — no external API ──────────────────
        plan_data   = _generate_smart_plan(context)
        summary     = _generate_summary(context)
        key_advice  = _generate_advice(context)

                # Deactivate old plans
        StudyPlan.objects.filter(user=user, exam_slug=exam_slug).update(is_active=False)

        # Save new plan
        plan = StudyPlan.objects.create(
            user=user,
            exam_slug=exam_slug,
            exam_date=exam_date,
            daily_hours=daily_hours,
            plan_data=plan_data,
            context_used={**context, 'summary': summary, 'key_advice': key_advice},
        )

        return Response({
            'id':           plan.id,
            'exam_slug':    plan.exam_slug,
            'exam_date':    str(plan.exam_date),
            'daily_hours':  plan.daily_hours,
            'days_to_exam': plan.days_to_exam,
            'total_weeks':  plan.total_weeks,
            'generated_at': plan.generated_at.isoformat(),
            'plan_data':    plan.plan_data,
            'summary':      summary,
            'key_advice':   key_advice,
            'context_used': plan.context_used,
        }, status=201)


def _generate_fallback_plan(ctx):
    """Rule-based fallback plan when OpenAI is not configured."""
    import datetime

    today      = datetime.date.today()
    days_left  = min(ctx['days_left'], 42)
    daily_mins = ctx['daily_mins']
    weak       = ctx.get('weak_topics', [])
    all_topics = ctx.get('all_topics', [])
    undone     = [t for t in all_topics if not t.get('done')]

    weeks = []
    current_date = today
    week_num = 0
    day_num  = 0
    undone_idx = 0

    # Group by week
    while day_num < days_left:
        week_num += 1
        week_days = []
        is_last_week = (days_left - day_num) <= 7

        for d in range(7):
            if day_num >= days_left:
                break
            day_date  = current_date + datetime.timedelta(days=day_num)
            is_sunday = day_date.weekday() == 6
            avail     = max(30, daily_mins // 2 if is_sunday else daily_mins)
            tasks     = []
            used_mins = 0

            # Add weak topic review (every 3rd day)
            if weak and day_num % 3 == 1:
                wt = weak[day_num % len(weak)]
                tasks.append({
                    'type': 'review',
                    'title': f'Review: {wt.get("topic_video__topic__title","Weak topic")}',
                    'topic_slug': wt.get('topic_video__topic__slug',''),
                    'section_slug': wt.get('topic_video__topic__module__slug',''),
                    'duration_mins': 20,
                    'priority': 'high',
                    'note': f'Previous score: {round(wt.get("score_pct",0))}%',
                })
                used_mins += 20

            # Add new topic video
            if undone_idx < len(undone) and used_mins + 25 <= avail:
                t = undone[undone_idx % len(undone)]
                tasks.append({
                    'type': 'video',
                    'title': t['topic'],
                    'topic_slug': t['slug'],
                    'section_slug': t.get('section_slug',''),
                    'duration_mins': 25,
                    'priority': 'high',
                    'note': '',
                })
                used_mins += 25
                undone_idx += 1

                # Add quiz after video
                if used_mins + 15 <= avail:
                    tasks.append({
                        'type': 'quiz',
                        'title': f'{t["topic"]} Quiz',
                        'topic_slug': t['slug'],
                        'duration_mins': 15,
                        'priority': 'medium',
                        'note': '',
                    })
                    used_mins += 15

            # Mock on Sundays or final week
            if is_sunday and is_last_week:
                tasks.append({
                    'type': 'mock',
                    'title': 'Full length mock test',
                    'duration_mins': min(30, avail - used_mins),
                    'priority': 'high',
                    'note': 'Analyse sectional scores after',
                })

            if not tasks:
                tasks.append({
                    'type': 'rest',
                    'title': 'Rest day' if is_sunday else 'Revision day',
                    'duration_mins': 0,
                    'priority': 'low',
                    'note': 'Light revision or complete rest',
                })

            week_days.append({
                'day':        day_num + 1,
                'date':       str(day_date),
                'day_label':  day_date.strftime('%A'),
                'total_mins': sum(t['duration_mins'] for t in tasks),
                'tasks':      tasks,
            })
            day_num += 1

        themes = ['Foundation', 'Core Concepts', 'Practice & Weak Areas', 'Deep Dive', 'Revision', 'Final Sprint']
        weeks.append({
            'week':  week_num,
            'theme': themes[min(week_num-1, len(themes)-1)],
            'focus': f'Week {week_num} — {ctx["exam"]} prep',
            'days':  week_days,
        })

    return weeks


# =============================================================================
# MOCK SCORE TRACKER
# =============================================================================

class MockScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import MockScore
        exam_slug = request.query_params.get('exam', request.user.target_exam or 'cat')
        scores = list(MockScore.objects.filter(
            user=request.user, exam_slug=exam_slug
        ).order_by('taken_on', 'mock_number').values())
        return Response({'scores': scores, 'exam': exam_slug})

    def post(self, request):
        from apps.learn.models import MockScore
        import datetime
        d = request.data
        taken = d.get('taken_on', str(datetime.date.today()))
        ms = MockScore.objects.create(
            user=request.user,
            exam_slug=d.get('exam_slug', request.user.target_exam or 'cat'),
            mock_name=d.get('mock_name', ''),
            provider=d.get('provider', 'testfunda'),
            taken_on=taken,
            mock_number=d.get('mock_number', 0),
            overall_score=float(d.get('overall_score', 0)),
            overall_percentile=d.get('overall_percentile') or None,
            sections=d.get('sections', {}),
            notes=d.get('notes', ''),
        )
        return Response({'id': ms.id}, status=201)

    def put(self, request, score_id):
        from apps.learn.models import MockScore
        try:
            ms = MockScore.objects.get(id=score_id, user=request.user)
        except MockScore.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        for f in ['mock_name','provider','taken_on','mock_number',
                  'overall_score','overall_percentile','sections','notes']:
            if f in request.data:
                setattr(ms, f, request.data[f])
        ms.save()
        return Response({'updated': True})

    def delete(self, request, score_id):
        from apps.learn.models import MockScore
        MockScore.objects.filter(id=score_id, user=request.user).delete()
        return Response({'deleted': True})


# =============================================================================
# DETAILED PROGRESS API
# =============================================================================

class ProgressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import (TopicVideoProgress, QuizAttempt,
                                        StudySession)
        from apps.courses.models import CurriculumModule, Exam
        from django.db.models import Avg, Count
        import datetime

        user      = request.user
        exam_slug = request.query_params.get('exam', user.target_exam or 'cat')

        # Section completion
        sections_data = []
        try:
            exam = Exam.objects.get(slug=exam_slug)
            modules = CurriculumModule.objects.filter(
                course__exam=exam
            ).prefetch_related('topics__topic_videos')
            for mod in modules:
                total = 0
                done  = 0
                for t in mod.topics.all():
                    for tv in t.topic_videos.all():
                        total += 1
                        if TopicVideoProgress.objects.filter(
                            student=user, topic_video=tv, watch_pct__gte=70
                        ).exists():
                            done += 1
                if total > 0:
                    sections_data.append({
                        'section':   mod.short_title or mod.title,
                        'total':     total,
                        'done':      done,
                        'pct':       round(done / total * 100),
                    })
        except Exception:
            pass

        # Quiz score trend — last 20 attempts
        attempts = list(QuizAttempt.objects.filter(
            progress__student=user,
            progress__topic_video__topic__module__course__exam__slug=exam_slug,
        ).order_by('submitted_at').values(
            'score_pct', 'submitted_at', 'correct', 'total'
        )[:30])
        score_trend = [{
            'date':      a['submitted_at'].strftime('%b %d') if a['submitted_at'] else '',
            'score_pct': round(a['score_pct']),
            'correct':   a['correct'],
            'total':     a['total'],
        } for a in attempts]

        # Weekly study time — last 8 weeks
        today = datetime.date.today()
        weekly = []
        for i in range(7, -1, -1):
            week_start = today - datetime.timedelta(days=today.weekday() + 7*i)
            week_end   = week_start + datetime.timedelta(days=6)
            agg = StudySession.objects.filter(
                user=user, exam_slug=exam_slug,
                date__gte=week_start, date__lte=week_end
            ).aggregate(mins=__import__('django.db.models',fromlist=['Sum']).Sum('minutes'),
                        vids=__import__('django.db.models',fromlist=['Sum']).Sum('videos'))
            weekly.append({
                'week':    f'W{8-i}',
                'label':   week_start.strftime('%b %d'),
                'minutes': agg['mins'] or 0,
                'videos':  agg['vids'] or 0,
            })

        # Overall stats
        total_videos   = TopicVideoProgress.objects.filter(student=user, watch_pct__gte=70).count()
        avg_quiz_score = QuizAttempt.objects.filter(
            progress__student=user
        ).aggregate(avg=Avg('score_pct'))['avg'] or 0
        total_mins = StudySession.objects.filter(
            user=user, exam_slug=exam_slug
        ).aggregate(total=__import__('django.db.models',fromlist=['Sum']).Sum('minutes'))['total'] or 0

        return Response({
            'sections':    sections_data,
            'score_trend': score_trend,
            'weekly_time': weekly,
            'stats': {
                'total_videos':    total_videos,
                'avg_quiz_score':  round(avg_quiz_score, 1),
                'total_hours':     round(total_mins / 60, 1),
            },
        })


# =============================================================================
# TODAY'S STUDY PLAN TASKS
# =============================================================================

class TodaysPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.learn.models import StudyPlan, SpacedRepetition, QuizAttempt
        import datetime

        user      = request.user
        exam_slug = request.query_params.get('exam', user.target_exam or 'cat')
        today     = datetime.date.today()

        # Get latest active study plan
        plan = StudyPlan.objects.filter(
            user=user, exam_slug=exam_slug, is_active=True
        ).order_by('-generated_at').first()

        tasks = []
        if plan and plan.plan_data:
            # Find today in the plan
            today_str = str(today)
            for week in plan.plan_data:
                for day in week.get('days', []):
                    if day.get('date') == today_str:
                        tasks = day.get('tasks', [])
                        break
                if tasks:
                    break

        # If no plan or no tasks for today, generate smart defaults
        if not tasks:
            tasks = _get_smart_today_tasks(user, exam_slug)

        return Response({
            'date':      str(today),
            'tasks':     tasks,
            'has_plan':  bool(plan),
            'plan_id':   plan.id if plan else None,
        })


def _get_smart_today_tasks(user, exam_slug):
    """Generate today tasks without a full plan."""
    from apps.learn.models import (SpacedRepetition, QuizAttempt,
                                    TopicVideoProgress)
    from apps.courses.models import CurriculumTopic
    import datetime

    tasks = []
    today = datetime.date.today()

    # 1. Spaced repetition reviews due
    due = SpacedRepetition.objects.filter(
        user=user, review_due__lte=today,
        topic__module__course__exam__slug=exam_slug,
    ).select_related('topic__module')[:2]
    for d in due:
        tasks.append({
            'type':         'review',
            'title':        f'Review: {d.topic.title}',
            'topic_slug':   d.topic.slug,
            'section_slug': d.topic.module.slug,
            'duration_mins':15,
            'priority':     'high',
            'note':         f'Last score: {round(d.last_score)}%',
        })

    # 2. Weakest topic to practice
    weak = QuizAttempt.objects.filter(
        progress__student=user,
        progress__topic_video__topic__module__course__exam__slug=exam_slug,
        score_pct__lt=60,
    ).select_related('progress__topic_video__topic__module').order_by('score_pct').first()
    if weak and len(tasks) < 3:
        tv = weak.progress.topic_video
        tasks.append({
            'type':         'review',
            'title':        f'Weak area: {tv.topic.title}',
            'topic_slug':   tv.topic.slug,
            'section_slug': tv.topic.module.slug,
            'duration_mins':20,
            'priority':     'high',
            'note':         f'Quiz score: {round(weak.score_pct)}% — needs work',
        })

    # 3. Next unwatched video
    watched_ids = set(TopicVideoProgress.objects.filter(
        student=user, watch_pct__gte=70
    ).values_list('topic_video_id', flat=True))

    from apps.courses.models import CurriculumTopic
    from apps.learn.models import TopicVideo
    next_tv = TopicVideo.objects.filter(
        topic__module__course__exam__slug=exam_slug,
    ).exclude(id__in=watched_ids).select_related('topic__module').order_by(
        'topic__module__sort_order', 'topic__sort_order', 'sort_order'
    ).first()

    if next_tv and len(tasks) < 3:
        tasks.append({
            'type':         'video',
            'title':        next_tv.title or next_tv.topic.title,
            'topic_slug':   next_tv.topic.slug,
            'section_slug': next_tv.topic.module.slug,
            'duration_mins':next_tv.duration_mins or 25,
            'priority':     'medium',
            'note':         next_tv.topic.module.short_title or '',
        })

    return tasks
