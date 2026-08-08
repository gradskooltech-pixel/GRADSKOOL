"""
GRADSKOOL — import_from_html management command

Extracts ALL questions, passages, and vocabulary from the static
HTML tool files and loads them into the database.

Usage:
    python manage.py import_from_html --html-dir /path/to/html/files
    python manage.py import_from_html --html-dir /path/to/html/files --wipe

The --html-dir should point to the directory containing:
    gradskool-rc99-tool.html
    gradskool-rc111-tool.html
    gre-vocab-forge.html
    gradskool-cat-maths.html
    gradskool-gre-verbal-tool.html
    gradskool-grammar-tool.html
    gradskool-reasoning-tool.html
    mba-gk-tool.html
    gradskool-legal-awareness-tool.html
"""
import os
import re
import json
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify


# ── HELPERS ───────────────────────────────────────────────────────────────────

def parse_js(text):
    """Parse JavaScript object/array syntax into Python objects.
    Handles: unquoted keys, backtick strings, single-quoted strings,
    JS comments, trailing commas."""
    # Remove comments
    text = re.sub(r'//[^\n]*', '', text)
    text = re.sub(r'/\*[\s\S]*?\*/', '', text)
    # Replace backtick strings
    def fix_backtick(m):
        s = m.group(1).replace('\\`', '`').replace('"', '\\"').replace('\n', '\\n').replace('\r', '')
        return f'"{s}"'
    text = re.sub(r'`((?:[^`\\]|\\[\s\S])*)`', fix_backtick, text)
    # Replace single-quoted strings
    def fix_single(m):
        s = m.group(1).replace('"', '\\"').replace("\\'", "'")
        return f'"{s}"'
    text = re.sub(r"'((?:[^'\\]|\\[\s\S])*)'", fix_single, text)
    # Quote unquoted object keys
    text = re.sub(r'(\{|,)\s*([a-zA-Z_]\w*)\s*:', r'\1"\2":', text)
    # Remove trailing commas
    text = re.sub(r',\s*([}\]])', r'\1', text)
    return json.loads(text)


def extract_bounded(content, start_str):
    """Extract a JS object/array starting at start_str."""
    idx = content.find(start_str)
    if idx == -1:
        return None
    i = idx + len(start_str)
    while i < len(content) and content[i] not in '[{':
        i += 1
    open_char = content[i]
    close_char = ']' if open_char == '[' else '}'
    depth = 0
    start = i
    while i < len(content):
        if content[i] == open_char:
            depth += 1
        elif content[i] == close_char:
            depth -= 1
            if depth == 0:
                return content[start:i + 1]
        i += 1
    return None


def extract_cat_questions(content, array_name):
    """Extract CAT Maths questions from JS array (uses double-quoted strings)."""
    start_pat = f'const {array_name} = ['
    idx = content.find(start_pat)
    if idx == -1:
        return []
    start = idx + len(start_pat) - 1
    depth = 0
    i = start
    while i < len(content):
        if content[i] == '[':
            depth += 1
        elif content[i] == ']':
            depth -= 1
            if depth == 0:
                break
        i += 1
    arr_text = content[start:i + 1]
    # Match JS objects with double-quoted strings
    pattern = r'\{q:"((?:[^"\\]|\\[\s\S])*)",opts:\[((?:[^]]*?))\],ans:(\d+),exp:"((?:[^"\\]|\\[\s\S])*)"\}'
    matches = re.findall(pattern, arr_text)
    results = []
    for q_text, opts_str, ans_idx, exp in matches:
        opts = re.findall(r'"((?:[^"\\]|\\[\s\S])*)"', opts_str)
        results.append({
            'q': q_text,
            'opts': opts,
            'ans': int(ans_idx),
            'exp': exp,
        })
    return results


def get_biggest_script(content):
    scripts = re.findall(r'<script[^>]*>([\s\S]*?)</script>', content)
    return max(scripts, key=len) if scripts else ''


# ── MAIN COMMAND ──────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Import all tool content from static HTML files into the database'

    def add_arguments(self, parser):
        parser.add_argument('--html-dir', required=True,
            help='Path to directory containing the HTML tool files')
        parser.add_argument('--wipe', action='store_true',
            help='Delete existing questions, passages, and vocab before importing')
        parser.add_argument('--only',
            help='Import only specific tools (comma-separated): rc99,rc111,vocab,cat,gre-verbal,grammar,reasoning,gk,legal')

    def handle(self, *args, **options):
        html_dir = options['html_dir']
        if not os.path.isdir(html_dir):
            raise CommandError(f'Directory not found: {html_dir}')

        only = set(options['only'].split(',')) if options.get('only') else None

        from apps.tools.models import (
            Tool, Tag, Passage, Question, QuestionOption,
            VocabWord, QATopic,
        )

        if options['wipe']:
            self.stdout.write('Wiping existing data...')
            QuestionOption.objects.all().delete()
            Question.objects.filter(passage__isnull=False).delete()
            Passage.objects.all().delete()
            VocabWord.objects.all().delete()
            # Keep QATopics - just clear their questions
            Question.objects.filter(topic__isnull=False).delete()
            self.stdout.write(self.style.WARNING('  Wiped passages, questions, vocab'))

        totals = {}

        # ── RC PASSAGES ──────────────────────────────────────────────────────
        for slug, fname in [('rc99', 'gradskool-rc99-tool.html'),
                             ('rc111', 'gradskool-rc111-tool.html')]:
            if only and slug not in only:
                continue
            fpath = os.path.join(html_dir, fname)
            if not os.path.exists(fpath):
                self.stdout.write(self.style.WARNING(f'  Skipping {fname} (not found)'))
                continue

            tool = Tool.objects.filter(slug=slug).first()
            if not tool:
                self.stdout.write(self.style.WARNING(f'  Tool "{slug}" not in DB — run seed_tools first'))
                continue

            self.stdout.write(f'\nImporting {slug.upper()} passages...')
            passages, questions = self._import_rc(fpath, tool, Passage, Question, QuestionOption)
            totals[slug] = {'passages': passages, 'questions': questions}
            self.stdout.write(self.style.SUCCESS(f'  ✓ {passages} passages, {questions} questions'))

        # ── GRE VOCABULARY ───────────────────────────────────────────────────
        if not only or 'vocab' in only:
            fpath = os.path.join(html_dir, 'gre-vocab-forge.html')
            if os.path.exists(fpath):
                tool = Tool.objects.filter(slug='gre-vocab').first()
                if tool:
                    self.stdout.write('\nImporting GRE Vocabulary...')
                    count = self._import_vocab(fpath, tool, VocabWord)
                    totals['vocab'] = count
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {count} words'))

        # ── CAT MATHS ────────────────────────────────────────────────────────
        if not only or 'cat' in only:
            fpath = os.path.join(html_dir, 'gradskool-cat-maths.html')
            if os.path.exists(fpath):
                tool = Tool.objects.filter(slug='cat-maths').first()
                if tool:
                    self.stdout.write('\nImporting CAT Maths questions...')
                    count = self._import_cat_maths(fpath, tool, QATopic, Question, QuestionOption)
                    totals['cat'] = count
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {count} questions'))

        # ── GRE VERBAL ───────────────────────────────────────────────────────
        if not only or 'gre-verbal' in only:
            fpath = os.path.join(html_dir, 'gradskool-gre-verbal-tool.html')
            if os.path.exists(fpath):
                tool = Tool.objects.filter(slug='gre-verbal').first()
                if tool:
                    self.stdout.write('\nImporting GRE Verbal questions...')
                    count = self._import_mcq_tool(fpath, tool, Question, QuestionOption,
                                                   var_name='ALL_TOPIC_QUESTIONS')
                    totals['gre-verbal'] = count
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {count} questions'))

        # ── GRAMMAR ──────────────────────────────────────────────────────────
        if not only or 'grammar' in only:
            fpath = os.path.join(html_dir, 'gradskool-grammar-tool.html')
            if os.path.exists(fpath):
                tool = Tool.objects.filter(slug='grammar').first()
                if tool:
                    self.stdout.write('\nImporting Grammar questions...')
                    count = self._import_mcq_tool(fpath, tool, Question, QuestionOption,
                                                   var_name='ALL_TOPIC_QUESTIONS')
                    totals['grammar'] = count
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {count} questions'))

        # ── REASONING ────────────────────────────────────────────────────────
        if not only or 'reasoning' in only:
            fpath = os.path.join(html_dir, 'gradskool-reasoning-tool.html')
            if os.path.exists(fpath):
                tool = Tool.objects.filter(slug='reasoning').first()
                if tool:
                    self.stdout.write('\nImporting Reasoning questions...')
                    count = self._import_mcq_tool(fpath, tool, Question, QuestionOption,
                                                   var_name='ALL_TOPIC_QUESTIONS')
                    totals['reasoning'] = count
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {count} questions'))

        # ── MBA GK ───────────────────────────────────────────────────────────
        if not only or 'gk' in only:
            fpath = os.path.join(html_dir, 'mba-gk-tool.html')
            if os.path.exists(fpath):
                tool = Tool.objects.filter(slug='mba-gk').first()
                if tool:
                    self.stdout.write('\nImporting MBA GK questions...')
                    count = self._import_gk(fpath, tool, Question, QuestionOption)
                    totals['gk'] = count
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {count} questions'))

        # ── RC LEXICON ────────────────────────────────────────────────────────
        if not only or 'rc-lexicon' in only:
            fpath = os.path.join(html_dir, 'gradskool-rc-lexicon-tool.html')
            if os.path.exists(fpath):
                tool = Tool.objects.filter(slug='rc-lexicon').first()
                if tool:
                    self.stdout.write('\nImporting RC Lexicon...')
                    count = self._import_mcq_tool(fpath, tool, Question, QuestionOption,
                                                   var_name='ALL_TOPIC_QUESTIONS')
                    totals['rc-lexicon'] = count
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {count} questions'))

        # ── LEGAL AWARENESS ──────────────────────────────────────────────────
        if not only or 'legal' in only:
            fpath = os.path.join(html_dir, 'gradskool-legal-awareness-tool.html')
            if os.path.exists(fpath):
                tool = Tool.objects.filter(slug='legal-awareness').first()
                if tool:
                    self.stdout.write('\nImporting Legal Awareness questions...')
                    count = self._import_legal(fpath, tool, Question, QuestionOption)
                    totals['legal'] = count
                    self.stdout.write(self.style.SUCCESS(f'  ✓ {count} questions'))

        # ── SUMMARY ──────────────────────────────────────────────────────────
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write(self.style.SUCCESS('IMPORT COMPLETE'))
        self.stdout.write('=' * 50)
        for k, v in totals.items():
            if isinstance(v, dict):
                self.stdout.write(f'  {k}: {v}')
            else:
                self.stdout.write(f'  {k}: {v} items')

    # ── RC IMPORT ─────────────────────────────────────────────────────────────

    def _import_rc(self, fpath, tool, Passage, Question, QuestionOption):
        from bs4 import BeautifulSoup
        with open(fpath, encoding='utf-8', errors='ignore') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')

        passage_count = 0
        question_count = 0

        cat_pages = soup.find_all('div', class_='page')

        with transaction.atomic():
            for cat_page in cat_pages:
                cat_el = cat_page.find(class_='cat-title')
                category = cat_el.text.strip() if cat_el else 'General'

                for pb in cat_page.find_all('div', class_='pb'):
                    pnum_el = pb.find(class_='pnum')
                    ptopic_el = pb.find(class_='ptopic')
                    ptext_el = pb.find(class_='ptext')

                    number = 0
                    if pnum_el:
                        m = re.search(r'\d+', pnum_el.text)
                        number = int(m.group()) if m else 0

                    title = ptopic_el.text.strip() if ptopic_el else f'Passage {number}'
                    text = ptext_el.get_text('\n\n').strip() if ptext_el else ''

                    if not text:
                        continue

                    passage, _ = Passage.objects.update_or_create(
                        tool=tool,
                        number=number,
                        defaults={
                            'title': title[:300],
                            'category': category,
                            'text': text,
                            'difficulty': 'hard',
                            'source': 'original',
                        }
                    )
                    passage_count += 1

                    # Questions are inside .qb divs
                    for q_num, qb in enumerate(pb.find_all(class_='qb'), 1):
                        qtext_el = qb.find(class_='qtext')
                        if not qtext_el:
                            continue
                        q_text = qtext_el.get_text().strip()

                        # Find explanation
                        ev_el = qb.find(class_='ev') or qb.find(class_='exp')
                        explanation = ev_el.get_text().strip() if ev_el else ''

                        question, _ = Question.objects.update_or_create(
                            passage=passage,
                            number=q_num,
                            defaults={
                                'text': q_text,
                                'question_type': 'mcq',
                                'explanation': explanation,
                            }
                        )

                        # Options
                        opts_el = qb.find(class_='opts')
                        if opts_el:
                            QuestionOption.objects.filter(question=question).delete()
                            for btn in opts_el.find_all('button', class_='opt'):
                                onclick = btn.get('onclick', '')
                                # instaPick('id','selected','CORRECT',this)
                                m = re.search(r"instaPick\('[^']+','([A-D])','([A-D])'", onclick)
                                label_el = btn.find(class_='ol')
                                text_el  = btn.find(class_='ot')
                                key      = label_el.text.strip() if label_el else ''
                                opt_text = text_el.get_text().strip() if text_el else ''
                                correct  = m.group(1) == m.group(2) if m else False

                                QuestionOption.objects.create(
                                    question=question,
                                    key=key,
                                    text=opt_text,
                                    is_correct=correct,
                                )
                            question_count += 1

        return passage_count, question_count

    # ── VOCAB IMPORT ──────────────────────────────────────────────────────────

    def _import_vocab(self, fpath, tool, VocabWord):
        with open(fpath, encoding='utf-8', errors='ignore') as f:
            content = f.read()

        m = re.search(r'const RAW = (\[[\s\S]+?\]);', content)
        if not m:
            return 0

        raw = json.loads(m.group(1))
        count = 0

        DIFFICULTY_MAP = {
            'essential': 'medium', 'advanced': 'hard',
            'expert': 'hard', 'basic': 'easy',
        }

        with transaction.atomic():
            for i, entry in enumerate(raw, 1):
                if len(entry) < 3:
                    continue
                word, pos, definition = entry[0], entry[1], entry[2]
                example = entry[3] if len(entry) > 3 else ''

                # Infer difficulty by position (first 250 = easier)
                if i <= 250:
                    difficulty = 'easy'
                elif i <= 500:
                    difficulty = 'medium'
                else:
                    difficulty = 'hard'

                VocabWord.objects.update_or_create(
                    tool=tool,
                    word=word,
                    defaults={
                        'part_of_speech': pos,
                        'definition':     definition,
                        'example':        example,
                        'difficulty':     difficulty,
                        'number':         i,
                    }
                )
                count += 1

        return count

    # ── CAT MATHS IMPORT ──────────────────────────────────────────────────────

    def _import_cat_maths(self, fpath, tool, QATopic, Question, QuestionOption):
        with open(fpath, encoding='utf-8', errors='ignore') as f:
            content = f.read()

        TOPIC_MAP = {
            'Q_TClassificationOfNumbers':    'Classification of Numbers',
            'Q_TDivisibilityRules':          'Divisibility Rules',
            'Q_TFactorsAndMultiples':        'Factors and Multiples',
            'Q_TPercentages':                'Percentages',
            'Q_TRatioAndProportions':        'Ratio and Proportions',
            'Q_TProfitLossDiscounts':        'Profit Loss Discounts',
            'Q_TSurdsAndIndices':            'Surds and Indices',
            'Q_TLinearEquations':            'Linear Equations',
            'Q_TAverages':                   'Averages',
            'Q_TQuadraticEquations':         'Quadratic Equations',
            'Q_TMixturesAndAlligations':     'Mixtures and Alligations',
            'Q_TSiAndCi':                    'Simple and Compound Interest',
            'Q_TTimeSpeedAndDistance':       'Time Speed and Distance',
            'Q_TLinearAndCircularMotion':    'Linear and Circular Motion',
            'Q_TTimeAndWork':                'Time and Work',
            'Q_TDiophantineEquations':       'Diophantine Equations',
            'Q_TPolynomials':                'Polynomials',
            'Q_TModulus':                    'Modulus',
            'Q_TLogarithms':                 'Logarithms',
            'Q_TInequalities':               'Inequalities',
            'Q_TRemainders':                 'Remainders',
            'Q_TFunctions':                  'Functions',
            'Q_TGraphs':                     'Graphs',
            'Q_TLinesAndAngles':             'Lines and Angles',
            'Q_TTriangles':                  'Triangles',
            'Q_TCoordinateGeometry':         'Coordinate Geometry',
            'Q_TQuadrilaterals':             'Quadrilaterals',
            'Q_TPolygons':                   'Polygons',
            'Q_TCircles':                    'Circles',
            'Q_TTrigonometry':               'Trigonometry',
            'Q_TMensuration':                'Mensuration',
            'Q_TPermutationsAndCombinations': 'Permutations and Combinations',
            'Q_TProbability':                'Probability',
            'Q_TSequencesAndSeries':         'Sequences and Series',
        }

        q_arrays = re.findall(r'const (Q_T\w+) = \[', content)
        total = 0

        with transaction.atomic():
            for num, arr_name in enumerate(q_arrays, 1):
                topic_name = TOPIC_MAP.get(arr_name, arr_name.replace('Q_T', ''))
                qs = extract_cat_questions(content, arr_name)
                if not qs:
                    continue

                topic = QATopic.objects.filter(tool=tool, number=num).first()
                if not topic:
                    topic = QATopic.objects.filter(tool=tool, name=topic_name).first()
                if not topic:
                    from apps.tools.models import Tag
                    tag, _ = Tag.objects.get_or_create(
                        slug=slugify(topic_name),
                        defaults={'name': topic_name, 'tag_type': 'topic'}
                    )
                    topic = QATopic.objects.create(
                        tool=tool, number=num, name=topic_name,
                        category='qa', tag=tag,
                    )

                # Clear existing questions for this topic
                Question.objects.filter(topic=topic).delete()

                for q_num, q in enumerate(qs, 1):
                    question = Question.objects.create(
                        topic=topic,
                        number=q_num,
                        text=q['q'],
                        question_type='mcq',
                        explanation=q['exp'],
                    )
                    for i, opt_text in enumerate(q['opts']):
                        QuestionOption.objects.create(
                            question=question,
                            key=chr(65 + i),  # A, B, C, D
                            text=opt_text,
                            is_correct=(i == q['ans']),
                        )
                    total += 1

        return total

    # ── GENERIC MCQ IMPORT (GRE Verbal, Grammar, Reasoning) ──────────────────

    def _import_mcq_tool(self, fpath, tool, Question, QuestionOption, var_name):
        with open(fpath, encoding='utf-8', errors='ignore') as f:
            content = f.read()

        script = get_biggest_script(content)
        raw = extract_bounded(script, f'const {var_name} = {{')
        if not raw:
            return 0

        # Fix trailing commas only (these files use standard JSON strings)
        raw_fixed = re.sub(r',\s*([}\]])', r'\1', raw)
        try:
            data = json.loads(raw_fixed)
        except Exception:
            return 0

        total = 0
        with transaction.atomic():
            # Clear existing questions for this tool
            Question.objects.filter(topic__tool=tool).delete()
            Question.objects.filter(passage__tool=tool).delete()

            # Get or create a default topic for this tool
            from apps.tools.models import QATopic, Tag
            for topic_name, questions in data.items():
                tag, _ = Tag.objects.get_or_create(
                    slug=slugify(f'{tool.slug}-{topic_name}')[:80],
                    defaults={'name': topic_name[:100], 'tag_type': 'topic'}
                )
                topic, _ = QATopic.objects.update_or_create(
                    tool=tool,
                    name=topic_name[:200],
                    defaults={'tag': tag, 'category': 'mcq', 'number': total + 1}
                )

                for q_num, q in enumerate(questions, 1):
                    q_text = q.get('q', '')
                    if not q_text:
                        continue
                    opts = q.get('opts', [])
                    ans_idx = q.get('ans', 0)
                    exp = q.get('exp', '')

                    question = Question.objects.create(
                        topic=topic,
                        number=q_num,
                        text=q_text,
                        question_type='mcq',
                        explanation=exp,
                    )
                    for i, opt_text in enumerate(opts):
                        QuestionOption.objects.create(
                            question=question,
                            key=chr(65 + i),
                            text=str(opt_text),
                            is_correct=(i == ans_idx),
                        )
                    total += 1

        return total

    # ── MBA GK IMPORT ─────────────────────────────────────────────────────────

    def _import_gk(self, fpath, tool, Question, QuestionOption):
        with open(fpath, encoding='utf-8', errors='ignore') as f:
            content = f.read()

        all_questions = []
        for arr_name in ['gkQuestionBank', 'quizSectional', 'quizPYQ', 'quizReasoning']:
            for prefix in [f'const {arr_name} = [', f'var {arr_name} = [',
                           f'{arr_name} = [']:
                raw = extract_bounded(content, prefix)
                if raw:
                    try:
                        qs = parse_js(raw)
                        for q in qs:
                            if isinstance(q, dict) and 'q' in q:
                                q['_source'] = arr_name
                                all_questions.append(q)
                    except Exception:
                        pass
                    break

        from apps.tools.models import QATopic, Tag
        total = 0

        with transaction.atomic():
            Question.objects.filter(topic__tool=tool).delete()

            tag, _ = Tag.objects.get_or_create(
                slug='mba-gk-general',
                defaults={'name': 'MBA GK', 'tag_type': 'topic'}
            )
            topic, _ = QATopic.objects.update_or_create(
                tool=tool, name='MBA GK Practice',
                defaults={'tag': tag, 'category': 'mcq', 'number': 1}
            )

            for q_num, q in enumerate(all_questions, 1):
                q_text = q.get('q', '')
                opts   = q.get('opts', [])
                ans    = q.get('ans', 0)
                exp    = q.get('exp', q.get('tag', ''))

                if not q_text or not opts:
                    continue

                question = Question.objects.create(
                    topic=topic,
                    number=q_num,
                    text=q_text,
                    question_type='mcq',
                    explanation=str(exp) if exp else '',
                )
                for i, opt_text in enumerate(opts):
                    QuestionOption.objects.create(
                        question=question,
                        key=chr(65 + i),
                        text=str(opt_text),
                        is_correct=(i == ans),
                    )
                total += 1

        return total

    # ── LEGAL AWARENESS IMPORT ────────────────────────────────────────────────

    def _import_legal(self, fpath, tool, Question, QuestionOption):
        with open(fpath, encoding='utf-8', errors='ignore') as f:
            content = f.read()

        raw = extract_bounded(content, 'const CARDS = [')
        if not raw:
            return 0
        try:
            cards = parse_js(raw)
        except Exception:
            return 0

        from apps.tools.models import QATopic, Tag
        total = 0

        with transaction.atomic():
            Question.objects.filter(topic__tool=tool).delete()

            tag, _ = Tag.objects.get_or_create(
                slug='legal-awareness-general',
                defaults={'name': 'Legal Awareness', 'tag_type': 'topic'}
            )
            topic, _ = QATopic.objects.update_or_create(
                tool=tool, name='Legal Awareness Practice',
                defaults={'tag': tag, 'category': 'mcq', 'number': 1}
            )

            for q_num, card in enumerate(cards, 1):
                # Principle-application format
                principle = card.get('principle', '')
                q_text    = card.get('question', card.get('que', ''))
                opts      = card.get('options', card.get('opts', []))
                ans       = card.get('answer', card.get('ans', ''))
                exp       = card.get('explanation', card.get('exp', ''))

                if not q_text:
                    continue

                # Clean HTML tags from principle
                principle_clean = re.sub(r'<[^>]+>', '', str(principle))
                full_text = f"{principle_clean}\n\n{q_text}".strip() if principle_clean else q_text

                question = Question.objects.create(
                    topic=topic,
                    number=q_num,
                    text=full_text,
                    question_type='mcq',
                    explanation=str(exp) if exp else '',
                )

                # Options may be list or dict
                if isinstance(opts, list):
                    for i, opt_text in enumerate(opts):
                        key = chr(65 + i)
                        is_correct = (key == ans) or (i == ans) if isinstance(ans, int) else False
                        QuestionOption.objects.create(
                            question=question,
                            key=key,
                            text=str(opt_text),
                            is_correct=is_correct,
                        )
                total += 1

        return total
