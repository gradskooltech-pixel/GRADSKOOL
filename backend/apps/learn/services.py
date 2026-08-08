"""
GRADSKOOL — Learning Portal Services

get_topic_sequence(user, topic)
    → Returns full ordered list of TopicVideos with the user's progress state.
    → Used by the portal page to render the sequence.

unlock_first_video(user, topic)
    → Called when a student enrols — unlocks the first video in every topic.

update_watch_progress(user, topic_video_id, watch_pct, watched_secs, position_secs)
    → Called every 15s from the video player.
    → Transitions state if 70% threshold crossed.
    → Unlocks next video if current is completed.

submit_quiz(user, topic_video_id, answers)
    → Scores the quiz, stores QuizAttempt, transitions state.
    → Returns result dict with next_step.

open_cheatsheet(user, topic_video_id)
    → Marks cheat sheet as opened, transitions to COMPLETED.
    → Unlocks next video in sequence.

get_cheatsheet(user, topic_video_id)
    → Returns AI cheat sheet text for a video.
    → Only available in CHEATSHEET_REQUIRED or COMPLETED state.
"""
import logging
from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)

WATCH_THRESHOLD = 70.0   # percent watched to unlock quiz/cheatsheet
QUIZ_PASS_SCORE = 70.0   # percent correct to pass quiz
MAX_ATTEMPTS    = 2      # attempts before Option B bypass


def get_topic_sequence(user, topic):
    """
    Returns the full ordered sequence of TopicVideos for a topic
    with the current student's progress state attached.

    Each item in the returned list has:
      topic_video  — TopicVideo instance
      progress     — TopicVideoProgress instance (or None if not started)
      state        — current state string
      is_locked    — bool
      is_current   — bool (the active video the student should work on)
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress

    topic_videos = TopicVideo.objects.filter(
        topic=topic
    ).select_related('video', 'quiz_source').order_by('sort_order')

    # Bulk fetch all progress for this user+topic
    progress_map = {
        p.topic_video_id: p
        for p in TopicVideoProgress.objects.filter(
            student=user,
            topic_video__topic=topic,
        )
    }

    sequence = []
    found_current = False

    for tv in topic_videos:
        progress = progress_map.get(tv.id)
        state    = progress.state if progress else 'locked'
        is_current = False

        if not found_current and state != 'completed':
            is_current = True
            found_current = True

        sequence.append({
            'topic_video':    tv,
            'progress':       progress,
            'state':          state,
            'is_locked':      state == 'locked',
            'is_current':     is_current,
            'watch_pct':      progress.watch_pct if progress else 0,
            'best_score_pct': progress.best_score_pct if progress else None,
            'cheatsheet_opened': progress.cheatsheet_opened if progress else False,
        })

    return sequence


def unlock_first_video(user, topic):
    """
    Unlock the first video in a topic for a student.
    Called when enrollment is confirmed.
    Safe to call multiple times (idempotent).
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress

    first = TopicVideo.objects.filter(
        topic=topic
    ).order_by('sort_order').first()

    if not first:
        return

    TopicVideoProgress.objects.get_or_create(
        student=user,
        topic_video=first,
        defaults={'state': 'unlocked'},
    )


def unlock_all_topic_first_videos(user, exam_slug):
    """
    Unlock the first video of every topic in an exam.
    Called after enrollment is confirmed.
    """
    from apps.courses.models import CurriculumTopic

    topics = CurriculumTopic.objects.filter(
        module__course__exam__slug=exam_slug
    )
    for topic in topics:
        unlock_first_video(user, topic)


@transaction.atomic
def update_watch_progress(user, topic_video_id: int,
                          watch_pct: float, watched_secs: int,
                          position_secs: int) -> dict:
    """
    Called every 15s from the video player.
    Updates progress and triggers state transitions.

    Returns:
      { state, watch_pct, newly_unlocked_next }
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress

    tv = TopicVideo.objects.select_related('video', 'topic').get(id=topic_video_id)

    progress, _ = TopicVideoProgress.objects.select_for_update().get_or_create(
        student=user,
        topic_video=tv,
        defaults={'state': 'unlocked'},
    )

    if progress.state == 'locked':
        return {'state': 'locked', 'watch_pct': 0, 'newly_unlocked_next': False}

    prev_state = progress.state
    progress.update_watch_progress(watch_pct, watched_secs, position_secs)

    # If state transitioned to completed, unlock next video
    newly_unlocked = False
    if prev_state != 'completed' and progress.state == 'completed':
        newly_unlocked = _unlock_next(user, tv)

    return {
        'state':                progress.state,
        'watch_pct':            progress.watch_pct,
        'newly_unlocked_next':  newly_unlocked,
    }


@transaction.atomic
def submit_quiz(user, topic_video_id: int, answers: list,
                time_taken_secs: int = 0) -> dict:
    """
    Score a quiz attempt.

    answers: [{ question_id, selected_option_id }, ...]

    Returns:
      { passed, score_pct, correct, total, attempts,
        next_step ('retake'|'cheatsheet'),
        message, answers_with_feedback }
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress, QuizAttempt
    from apps.tools.models import Question, QuestionOption

    tv = TopicVideo.objects.select_related('quiz_source', 'video').get(id=topic_video_id)

    progress = TopicVideoProgress.objects.select_for_update().get(
        student=user, topic_video=tv
    )

    if progress.state not in ('quiz_ready', 'unlocked'):
        return {'error': 'Quiz not available in current state'}

    # Score the answers
    correct = 0
    total   = len(answers)
    answers_with_feedback = []

    for ans in answers:
        q_id   = ans.get('question_id')
        opt_id = ans.get('selected_option_id')

        try:
            correct_opt = QuestionOption.objects.get(question_id=q_id, is_correct=True)
            selected_opt = QuestionOption.objects.filter(id=opt_id).first()
            is_correct   = selected_opt and selected_opt.is_correct

            if is_correct:
                correct += 1

            answers_with_feedback.append({
                'question_id':       q_id,
                'selected_option_id': opt_id,
                'correct_option_id':  correct_opt.id,
                'correct_option_text': correct_opt.text,
                'is_correct':         is_correct,
                'explanation':        correct_opt.question.explanation,
            })
        except QuestionOption.DoesNotExist:
            answers_with_feedback.append({
                'question_id': q_id,
                'is_correct':  False,
                'error':       'Question not found',
            })

    score_pct = (correct / total * 100) if total > 0 else 0

    # Store attempt
    attempt_number = progress.quiz_attempts + 1
    QuizAttempt.objects.create(
        progress=progress,
        attempt_number=attempt_number,
        score_pct=score_pct,
        correct=correct,
        total=total,
        answers=answers_with_feedback,
        time_taken_secs=time_taken_secs,
    )

    # Transition state
    result = progress.record_quiz_attempt(score_pct)
    result['correct']  = correct
    result['total']    = total
    result['answers_with_feedback'] = answers_with_feedback

    return result


def get_quiz_questions(
    user,
    topic_video_id: int,
    reshuffle: bool = False,
    difficulty: str = '',       # '' = all, 'easy'/'medium'/'hard'
    adaptive:   bool = False,   # auto-pick difficulty based on recent score
) -> list:
    """
    Return questions for a topic video's quiz.

    Priority:
      1. TopicVideoQuestion rows (admin-linked questions, ordered)
      2. quiz_source (QATopic) — fallback for older content

    Returns full question data including:
      - difficulty tag (easy / medium / hard)
      - question_type (mcq / tita / mcq_multi)
      - marks_correct, marks_wrong
      - options with is_correct hidden (revealed only after submit)
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress, TopicVideoQuestion, QuizAttempt
    from apps.tools.models import Question, QuestionOption
    import random

    try:
        tv = TopicVideo.objects.select_related('quiz_source', 'topic__module__course__exam').get(id=topic_video_id)
    except TopicVideo.DoesNotExist:
        return []

    if not tv.has_quiz:
        return []

    # Verify student can access quiz (must have watched ≥70%)
    try:
        progress = TopicVideoProgress.objects.get(student=user, topic_video=tv)
        if progress.state not in ('quiz_ready', 'unlocked', 'cheatsheet_required', 'completed'):
            return []
    except TopicVideoProgress.DoesNotExist:
        return []

    # Adaptive difficulty: look at student's last score on this topic
    if adaptive and not difficulty:
        last = QuizAttempt.objects.filter(
            progress__student=user,
            progress__topic_video=tv,
        ).order_by('-submitted_at').first()
        if last:
            if last.score_pct >= 70:
                difficulty = 'hard'
            elif last.score_pct <= 40:
                difficulty = 'easy'
            else:
                difficulty = 'medium'

    # --- Source 1: TopicVideoQuestion (admin-managed, ordered) ---
    tvqs = TopicVideoQuestion.objects.filter(
        topic_video=tv, is_active=True
    ).select_related('question').prefetch_related('question__options').order_by('sort_order')

    if tvqs.exists():
        questions_raw = [tvq.question for tvq in tvqs]
    # --- Source 2: QATopic fallback ---
    elif tv.quiz_source:
        qs = Question.objects.filter(
            topic=tv.quiz_source, is_active=True
        ).prefetch_related('options')
        questions_raw = list(qs)
    else:
        return []

    # Filter by difficulty if specified
    if difficulty:
        filtered = [q for q in questions_raw if q.difficulty_tag == difficulty]
        # If filter yields too few, blend in some from adjacent difficulty
        if len(filtered) < 3:
            filtered = questions_raw

        questions_raw = filtered

    # Shuffle if requested, otherwise respect sort_order
    if reshuffle:
        random.shuffle(questions_raw)

    questions_raw = questions_raw[:tv.quiz_question_count]

    result = []
    for q in questions_raw:
        opts = list(q.options.all().order_by('key'))
        if reshuffle:
            random.shuffle(opts)

        result.append({
            'id':            q.id,
            'text':          q.question_text,
            'question_type': q.question_type,   # mcq / tita / mcq_multi
            'explanation':   q.explanation,
            'difficulty':    q.difficulty_tag or 'medium',
            'marks_correct': float(q.marks_correct),
            'marks_wrong':   float(q.marks_wrong),
            'correct_answer':q.correct_answer,  # for TITA
            'options': [
                {'id': o.id, 'key': o.key, 'text': o.text}
                # NOTE: is_correct intentionally omitted here (revealed on submit)
                for o in opts
            ] if q.question_type != 'tita' else [],
        })
    return result


@transaction.atomic
def open_cheatsheet(user, topic_video_id: int) -> dict:
    """
    Mark cheat sheet as opened — the final gate before next video unlocks.
    Returns { success, next_video_unlocked, next_topic_video_id }
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress

    tv = TopicVideo.objects.select_related('video', 'topic').get(id=topic_video_id)

    progress = TopicVideoProgress.objects.select_for_update().get(
        student=user, topic_video=tv
    )

    if progress.state != 'cheatsheet_required':
        return {'success': False, 'error': 'Cheat sheet not required in current state'}

    progress.open_cheatsheet()

    # Unlock next video
    next_tv = _unlock_next(user, tv)

    return {
        'success':             True,
        'next_video_unlocked': bool(next_tv),
        'next_topic_video_id': next_tv.id if next_tv else None,
    }


def get_cheatsheet(user, topic_video_id: int) -> dict:
    """
    Return the AI cheat sheet for a video.
    Only available once student reaches CHEATSHEET_REQUIRED or COMPLETED state.
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress
    from apps.content.models import AITranscript

    tv = TopicVideo.objects.select_related('video').get(id=topic_video_id)

    # Check access
    try:
        progress = TopicVideoProgress.objects.get(student=user, topic_video=tv)
        if progress.state not in ('cheatsheet_required', 'completed'):
            return {'available': False, 'reason': 'Complete quiz first'}
    except TopicVideoProgress.DoesNotExist:
        return {'available': False, 'reason': 'Video not unlocked'}

    # YouTube videos have no cheat sheet
    if tv.is_youtube:
        return {'available': False, 'reason': 'No cheat sheet for YouTube videos'}

    if not tv.video:
        return {'available': False, 'reason': 'No video attached'}

    # Get transcript → AI notes
    try:
        transcript = AITranscript.objects.get(video=tv.video)
    except AITranscript.DoesNotExist:
        return {
            'available': False,
            'reason':    'Cheat sheet is being generated. Check back in a few minutes.',
            'generating': True,
        }

    if not transcript.ai_notes:
        if transcript.status in ('pending', 'processing'):
            return {
                'available': False,
                'reason':    'Cheat sheet is being generated…',
                'generating': True,
            }
        return {'available': False, 'reason': 'Cheat sheet not available for this video'}

    return {
        'available':    True,
        'title':        f'Cheat Sheet — {tv.title}',
        'ai_notes':     transcript.ai_notes,
        'word_count':   transcript.word_count,
        'generated_at': str(transcript.updated_at)[:10] if hasattr(transcript, 'updated_at') else '',
        'video_title':  tv.title,
    }


def get_topic_completion_summary(user, topic) -> dict:
    """
    Returns completion stats for a topic — used for Live Session + Cheat Sheet unlock.
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress

    total = TopicVideo.objects.filter(topic=topic).count()
    completed = TopicVideoProgress.objects.filter(
        student=user,
        topic_video__topic=topic,
        state='completed',
    ).count()

    all_done = total > 0 and completed >= total

    return {
        'total':       total,
        'completed':   completed,
        'all_done':    all_done,
        'pct':         round((completed / total) * 100) if total else 0,
    }


# ── PRIVATE HELPERS ──────────────────────────────────────────────────────────

def _unlock_next(user, current_tv) -> 'TopicVideo | None':
    """
    Unlock the next TopicVideo in sequence after current is completed.
    Returns the newly unlocked TopicVideo or None if none exists.
    """
    from apps.learn.models import TopicVideo, TopicVideoProgress

    next_tv = TopicVideo.objects.filter(
        topic=current_tv.topic,
        sort_order__gt=current_tv.sort_order,
    ).order_by('sort_order').first()

    if not next_tv:
        return None

    progress, created = TopicVideoProgress.objects.get_or_create(
        student=user,
        topic_video=next_tv,
        defaults={'state': 'unlocked'},
    )

    if not created and progress.state == 'locked':
        progress.state = 'unlocked'
        progress.save(update_fields=['state'])

    logger.info(
        f'Unlocked next video for {user.email}: '
        f'[{next_tv.sort_order}] {next_tv.title}'
    )
    return next_tv
