"""Hand-rolled dict serializers — matches the to_dict() convention already
used in apps.fyq.views / apps.pyqs-equivalent code elsewhere, rather than
DRF ModelSerializer classes."""


def topic_dict(t, with_counts=True):
    d = {
        'id': t.id, 'name': t.name, 'slug': t.slug, 'section_name': t.section_name,
        'parent_id': t.parent_id, 'order': t.order,
    }
    if with_counts:
        d['question_count'] = t.total_question_count
    return d


def section_dict(s, with_counts=True):
    d = {'id': s.id, 'name': s.name, 'time_limit_mins': s.time_limit_mins, 'order': s.order}
    if with_counts:
        d['question_count'] = s.question_count
    return d


def paper_dict(p, with_sections=True):
    d = {
        'id': p.id, 'exam_slug': p.exam.slug, 'test_type': p.test_type,
        'title': p.title, 'slug': p.slug, 'description': p.description,
        'is_free': p.is_free, 'is_active': p.is_active, 'is_live': p.is_live,
        'release_at': p.release_at.isoformat() if p.release_at else None,
        'sort_order': p.sort_order, 'total_questions': p.total_questions,
        'total_duration_mins': p.total_duration_mins,
    }
    if with_sections:
        d['sections'] = [section_dict(s) for s in p.sections.all().order_by('order')]
    return d


def question_admin_dict(q):
    """Full detail, including the answer — admin-only."""
    return {
        'id': q.id, 'section_id': q.section_id, 'passage_id': q.passage_id, 'topic_id': q.topic_id,
        'question_type': q.question_type, 'question_text': q.question_text,
        'option_a': q.option_a, 'option_b': q.option_b, 'option_c': q.option_c,
        'option_d': q.option_d, 'option_e': q.option_e,
        'correct_option': q.correct_option, 'tita_answer': q.tita_answer,
        'difficulty': q.difficulty, 'explanation': q.explanation,
        'correct_marks': str(q.correct_marks), 'negative_marks': str(q.negative_marks),
        'order': q.order, 'is_active': q.is_active,
    }


def question_attempt_dict(q, response=None):
    """
    What the student sees WHILE an attempt is in progress — no answer,
    no explanation. `response` (a MockResponse, optional) layers in this
    student's current answer/palette state for resume.
    """
    d = {
        'id': q.id, 'passage_id': q.passage_id, 'section_id': q.section_id,
        'question_type': q.question_type, 'question_text': q.question_text,
        'options': [
            {'key': k, 'text': getattr(q, f'option_{k.lower()}')}
            for k in ['A', 'B', 'C', 'D', 'E']
            if getattr(q, f'option_{k.lower()}')
        ],
        'order': q.order,
    }
    if response is not None:
        d['selected_option'] = response.selected_option
        d['is_visited'] = response.is_visited
        d['is_marked_for_review'] = response.is_marked_for_review
    return d


def attempt_result_dict(attempt, include_responses=True):
    d = {
        'id': attempt.id, 'mode': attempt.mode, 'exam_slug': attempt.exam.slug,
        'paper_id': attempt.paper_id, 'section_id': attempt.section_id, 'topic_id': attempt.topic_id,
        'started_at': attempt.started_at.isoformat(),
        'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
        'is_auto_submitted': attempt.is_auto_submitted,
        'score': str(attempt.score), 'total_questions': attempt.total_questions,
        'correct': attempt.correct, 'incorrect': attempt.incorrect, 'unattempted': attempt.unattempted,
        'section_breakdown': attempt.section_breakdown,
    }
    if include_responses:
        d['responses'] = [
            {
                'question_id': r.question_id,
                'question_text': r.question.question_text,
                'options': [
                    {'key': k, 'text': getattr(r.question, f'option_{k.lower()}')}
                    for k in ['A', 'B', 'C', 'D', 'E'] if getattr(r.question, f'option_{k.lower()}')
                ],
                'question_type': r.question.question_type,
                'correct_option': r.question.correct_option,
                'tita_answer': r.question.tita_answer,
                'explanation': r.question.explanation,
                'selected_option': r.selected_option,
                'is_correct': r.is_correct,
                'marks_awarded': str(r.marks_awarded),
            }
            for r in attempt.responses.select_related('question').order_by('question__order')
        ]
    return d
