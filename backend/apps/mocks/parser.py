"""
GRADSKOOL — Paste & Split parser for bulk-adding mock/sectional questions.

Same input format GRADSCALE's PYQ admin already uses (ported deliberately,
not reinvented — it's real, working, hand-tuned regex logic):

    PASSAGE 1
    <passage text>

    Q1. question
    A) option
    B) option
    C) option
    D) option
    ANS: B
    EXP: explanation

    [STANDALONE]
    Q5. standalone MCQ
    A) ...
    ANS: A
    EXP: ...

    [STANDALONE]
    Q6. TITA example
    TITA: 42
    EXP: ...

Rules:
  - [STANDALONE] marks every standalone question individually — each gets
    its own difficulty/topic tagging afterward in the admin UI.
  - PASSAGE N marks an RC passage / DILR-set block; every bare Q<n> chunk
    that follows belongs to it until the next [STANDALONE]/PASSAGE/---.
  - --- is a hard divider — closes off passage question-collection.
  - Any order of PASSAGE / [STANDALONE] blocks is valid.
  - TITA: two accepted forms — "Q3. TITA - <question>" with the answer on
    its own "TITA: <answer>" line, or plain question text followed by a
    "TITA: <answer>" line.
"""
import re


def parse_pasted_text(raw: str) -> list[dict]:
    """
    Returns a list of blocks:
      {'type': 'standalone' | 'passage', 'passage_text': str, 'questions': [q, ...]}
    Each question dict:
      {question_text, question_type, option_a..e, correct_option, tita_answer,
       explanation, error (or None)}
    """
    results = []
    raw = (raw or '').strip()
    if not raw:
        return results

    token_re = re.compile(
        r'(?=^\[STANDALONE\]|^PASSAGE\s+\d+|^-{3,}\s*$|^Q\d+[\.\)]\s)',
        re.MULTILINE | re.IGNORECASE
    )
    chunks = token_re.split(raw)
    chunks = [c.strip() for c in chunks if c.strip()]

    cleaned_chunks = []
    for c in chunks:
        if re.match(r'^-{3,}\s*$', c):
            cleaned_chunks.append('__DIVIDER__')
        else:
            cleaned_chunks.append(c)
    chunks = cleaned_chunks

    def parse_single_question(qb):
        qb = qb.strip()
        if not re.match(r'^Q\d*[\.\)]\s', qb, re.IGNORECASE):
            return None

        q = {
            'question_text': '', 'option_a': '', 'option_b': '',
            'option_c': '', 'option_d': '', 'option_e': '', 'correct_option': '',
            'explanation': '', 'question_type': 'MCQ', 'tita_answer': '', 'error': None,
        }

        format_a = re.match(r'^Q\d*[\.\)]\s+TITA\s*[-–—:]?\s*(.+)', qb, re.DOTALL | re.IGNORECASE)
        tita_answer_line = re.search(r'(?m)^TITA\s*[:\.]?\s*([^\n]+)$', qb, re.IGNORECASE)

        if format_a or tita_answer_line:
            q['question_type'] = 'TITA'
            q['correct_option'] = ''  # not applicable to TITA

            if format_a:
                raw_body = format_a.group(1)
                tita_answer_in_body = re.search(r'\nTITA\s*[:\.]?\s*([^\n]+)', raw_body, re.IGNORECASE)
                if tita_answer_in_body:
                    q['question_text'] = raw_body[:tita_answer_in_body.start()].strip()
                    q['tita_answer'] = tita_answer_in_body.group(1).strip()
                else:
                    q['question_text'] = raw_body.split('\nEXP')[0].strip()
                    q['tita_answer'] = ''
            else:
                q['tita_answer'] = tita_answer_line.group(1).strip()
                qtm = re.match(r'^Q\d*[\.\)]\s*(.+?)(?=\nTITA)', qb, re.DOTALL | re.IGNORECASE)
                q['question_text'] = qtm.group(1).strip() if qtm else qb.split('\nTITA')[0].strip()

            em = re.search(r'(?m)^EXP(?:LANATION)?\s*[:\.]?\s*(.+?)(?=\nQ\d|\Z)', qb, re.DOTALL)
            if em:
                q['explanation'] = em.group(1).strip()
            if not q['tita_answer']:
                q['error'] = 'Missing TITA: <answer> line'
            return q

        # ── MCQ ──
        qm = re.match(r'^Q\d*[\.\)]\s*(.+?)(?=\n[Aa][\)\.]\s)', qb, re.DOTALL)
        if qm:
            q['question_text'] = qm.group(1).strip()
        else:
            q['error'] = 'Could not parse question text — check it starts with Q1. and options start with A)'
            return q

        for letter in ['A', 'B', 'C', 'D', 'E']:
            om = re.search(
                rf'(?m)^{letter}[\)\.]\s*(.+?)(?=\n[BCDE][\)\.]\s|\nANS|\nCorrect Answer|\nEXP|\Z)',
                qb, re.DOTALL
            )
            if om:
                q[f'option_{letter.lower()}'] = om.group(1).strip()

        am = re.search(r'(?:ANS(?:WER)?|Correct Answer)\s*[:\.]?\s*([A-E])', qb, re.IGNORECASE)
        if am:
            q['correct_option'] = am.group(1).upper()
        else:
            q['error'] = 'Missing ANS: A/B/C/D/E'

        em = re.search(r'(?m)^EXP(?:LANATION)?\s*[:\.]?\s*(.+?)(?=\nQ\d|\Z)', qb, re.DOTALL)
        if em:
            q['explanation'] = em.group(1).strip()

        if not q['error']:
            missing = [l for l in ['A', 'B', 'C', 'D'] if not q[f'option_{l.lower()}']]
            if missing:
                q['error'] = f"Missing option(s): {', '.join(missing)}"

        return q

    i = 0
    while i < len(chunks):
        chunk = chunks[i]

        if re.match(r'^\[STANDALONE\]', chunk, re.IGNORECASE):
            body = re.sub(r'^\[STANDALONE\]\s*\n?', '', chunk, flags=re.IGNORECASE).strip()
            q = parse_single_question(body)
            if q:
                results.append({'type': 'standalone', 'passage_text': '', 'questions': [q]})
            i += 1

        elif re.match(r'^PASSAGE\s+\d+', chunk, re.IGNORECASE):
            pt_match = re.match(r'^PASSAGE\s+\d+\s*\n(.+)', chunk, re.DOTALL | re.IGNORECASE)
            passage_text = pt_match.group(1).strip() if pt_match else ''
            first_q_in_chunk = re.search(r'(?:^|\n)(Q\d+[\.\)]\s.*)', passage_text, re.DOTALL)
            questions = []
            if first_q_in_chunk:
                passage_text = passage_text[:first_q_in_chunk.start()].strip()
                q = parse_single_question(first_q_in_chunk.group(1).strip())
                if q:
                    questions.append(q)

            i += 1
            while i < len(chunks) and re.match(r'^Q\d+[\.\)]\s', chunks[i], re.IGNORECASE):
                q = parse_single_question(chunks[i])
                if q:
                    questions.append(q)
                i += 1

            if questions:
                results.append({'type': 'passage', 'passage_text': passage_text, 'questions': questions})

        elif re.match(r'^Q\d+[\.\)]\s', chunk, re.IGNORECASE):
            q = parse_single_question(chunk)
            if q:
                results.append({'type': 'standalone', 'passage_text': '', 'questions': [q]})
            i += 1

        else:
            i += 1

    return results
