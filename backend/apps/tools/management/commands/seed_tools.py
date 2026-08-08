"""
GRADSKOOL — Management Command: seed_tools

Seeds all tool metadata, tag taxonomy, QA topics (34), vocab structure,
and a representative sample of questions for each tool type.

Usage:
  python manage.py seed_tools
  python manage.py seed_tools --wipe
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.tools.models import Tag, Tool, VocabWord, QATopic, Question, QuestionOption, Passage


# ── TAG TAXONOMY ──────────────────────────────────────────────────────────────

TAGS = {
    'exam': ['CAT', 'GMAT', 'GRE', 'IPMAT', 'XAT', 'SNAP', 'NMAT', 'CMAT', 'CLAT', 'CUET'],
    'section': [
        'VARC', 'DILR', 'QA',          # CAT
        'Verbal', 'Quant', 'DI',        # GMAT
        'VerbalReasoning', 'QuantReasoning', 'AWA',  # GRE
        'LegalReasoning', 'GKSection', 'English',    # CLAT — renamed GK→GKSection
    ],
    'topic': [
        # QA Topics
        'NumberTheory', 'Arithmetic', 'Algebra', 'Geometry', 'Mensuration',
        'PermutationCombination', 'Probability', 'SetTheory', 'Progressions',
        'Functions', 'Inequalities', 'Logarithms', 'Surds', 'CoordinateGeometry',
        'TrigonometryAndHeights', 'ModernMath', 'Statistics', 'DataSufficiency',
        'TimeSpeedDistance', 'TimeWork', 'Percentages', 'ProfitLoss',
        'Ratios', 'Mixtures', 'SimpleCompoundInterest',
        # VARC Topics
        'ReadingComprehension', 'ParaJumbles', 'OddSentenceOut', 'SummaryBased',
        'VocabularyInContext', 'GrammarUsage', 'CriticalReasoning',
        # GRE Verbal
        'TextCompletion', 'SentenceEquivalence', 'ReadingComprehensionGRE',
        # DILR
        'Arrangements', 'Grouping', 'DataTables', 'Graphs', 'Caselets',
        # GK
        'CurrentAffairs', 'BusinessGK', 'SportsGK', 'ScienceGK',
    ],
    'difficulty': ['Easy', 'Medium', 'Hard'],
    'source': [
        'RC99', 'RC111', 'CATMaths', 'GREVerbal', 'GREVocab',
        'GrammarSource', 'GK450', 'Reasoning', 'LegalAwareness',  # renamed Grammar→GrammarSource
    ],
    'type': ['MCQ', 'TITA', 'Vocab', 'GrammarType', 'GKType'],  # renamed Grammar→GrammarType, GK→GKType
}


# ── TOOLS ─────────────────────────────────────────────────────────────────────

TOOLS_DATA = [
    dict(slug='rc99',  name='RC 99 Passages', tool_type='rc_passages',
         description='99 Reading Comprehension passages with questions. Classified by category and difficulty.',
         question_count=0, requires_lead_gate=True, sort_order=1,
         exam_tags=['CAT', 'XAT'], section_tags=['VARC'],
         meta_title='RC 99 Passages — Free CAT RC Practice | GRADSKOOL',
         meta_desc='99 hand-curated RC passages for CAT and XAT preparation. Free access with email.'),
    dict(slug='rc111', name='RC 111 Passages', tool_type='rc_passages',
         description='111 high-quality RC passages for advanced preparation.',
         question_count=0, requires_lead_gate=True, sort_order=2,
         exam_tags=['CAT', 'XAT'], section_tags=['VARC'],
         meta_title='RC 111 Passages — Advanced CAT RC Practice | GRADSKOOL',
         meta_desc='111 RC passages with detailed question sets for CAT VARC preparation.'),
    dict(slug='cat-maths', name='CAT QA Tool', tool_type='qa_topics',
         description='34 Quantitative Aptitude topics with concept notes, formulas, and practice questions.',
         question_count=0, requires_lead_gate=True, sort_order=3,
         exam_tags=['CAT', 'IPMAT'], section_tags=['QA'],
         meta_title='CAT Maths — 34 QA Topics | GRADSKOOL',
         meta_desc='Master CAT Quantitative Aptitude with concept notes, formulas, and 500+ practice questions.'),
    dict(slug='gre-vocab', name='GRE Vocab Forge', tool_type='vocabulary',
         description='759 GRE vocabulary words with definitions, etymology, examples, and flashcard mode.',
         question_count=759, requires_lead_gate=True, sort_order=4,
         exam_tags=['GRE'], section_tags=['VerbalReasoning'],
         meta_title='GRE Vocabulary — 759 Words | GRADSKOOL',
         meta_desc='759 high-frequency GRE words with etymology and examples. Flashcard mode included.'),
    dict(slug='cat-grammar', name='CAT Grammar Tool', tool_type='grammar',
         description='Grammar and usage questions for CAT VARC — articles, modifiers, parallelism, tenses.',
         question_count=0, requires_lead_gate=True, sort_order=5,
         exam_tags=['CAT', 'XAT'], section_tags=['VARC'],
         meta_title='CAT Grammar Practice | GRADSKOOL',
         meta_desc='Grammar correction and usage questions for CAT VARC preparation.'),
    dict(slug='mba-gk', name='MBA GK — 450 Questions', tool_type='gk',
         description='450+ General Knowledge questions covering current affairs, business, science, and sports.',
         question_count=450, requires_lead_gate=True, sort_order=6,
         exam_tags=['XAT', 'SNAP', 'CMAT', 'NMAT'], section_tags=['GK'],
         meta_title='MBA GK — 450 Questions | GRADSKOOL',
         meta_desc='450+ MBA GK questions for XAT, SNAP, CMAT, NMAT. Business, current affairs, science.'),
    dict(slug='reasoning', name='Reasoning Practice', tool_type='reasoning',
         description='DILR and Logical Reasoning practice sets for CAT, IPMAT, and all MBA entrance exams.',
         question_count=0, requires_lead_gate=True, sort_order=7,
         exam_tags=['CAT', 'IPMAT'], section_tags=['DILR'],
         meta_title='DILR Reasoning Practice | GRADSKOOL',
         meta_desc='DILR practice sets for CAT and IPMAT. Arrangements, grouping, data tables and more.'),
    dict(slug='legal-awareness', name='Legal Awareness Tool', tool_type='legal',
         description='Legal reasoning and legal awareness questions for CLAT and other law entrance exams.',
         question_count=0, requires_lead_gate=True, sort_order=8,
         exam_tags=['CLAT'], section_tags=['LegalReasoning'],
         meta_title='Legal Awareness for CLAT | GRADSKOOL',
         meta_desc='Legal reasoning and awareness questions for CLAT preparation.'),

    dict(slug='rc-lexicon', name='RC Lexicon', tool_type='vocabulary',
         description='Academic vocabulary from CAT and GMAT RC passages. '
                     '160 context-based MCQs across 8 topic categories: '
                     'Philosophy, Economics, Psychology, Science, Arts and more.',
         question_count=160, requires_lead_gate=True, sort_order=9,
         exam_tags=['CAT', 'GMAT', 'GRE', 'IPMAT'], section_tags=['VARC'],
         meta_title='RC Lexicon — CAT Vocabulary Builder | GRADSKOOL',
         meta_desc='Build academic vocabulary from CAT RC passages. 160 MCQs across Philosophy, Economics, Psychology and more.'),
]


# ── QA TOPICS (34) ────────────────────────────────────────────────────────────

QA_TOPICS = [
    (1,  'Number Theory',                    'number'),
    (2,  'HCF and LCM',                      'number'),
    (3,  'Divisibility Rules',               'number'),
    (4,  'Remainders',                       'number'),
    (5,  'Percentages',                      'arithmetic'),
    (6,  'Profit and Loss',                  'arithmetic'),
    (7,  'Simple and Compound Interest',     'arithmetic'),
    (8,  'Ratio and Proportion',             'arithmetic'),
    (9,  'Mixtures and Alligation',          'arithmetic'),
    (10, 'Time Speed Distance',              'arithmetic'),
    (11, 'Time and Work',                    'arithmetic'),
    (12, 'Averages',                         'arithmetic'),
    (13, 'Pipes and Cisterns',               'arithmetic'),
    (14, 'Linear Equations',                 'algebra'),
    (15, 'Quadratic Equations',              'algebra'),
    (16, 'Inequalities',                     'algebra'),
    (17, 'Functions and Graphs',             'algebra'),
    (18, 'Logarithms',                       'algebra'),
    (19, 'Progressions — AP, GP, HP',        'algebra'),
    (20, 'Surds and Indices',                'algebra'),
    (21, 'Geometry — Lines and Angles',      'geometry'),
    (22, 'Triangles',                        'geometry'),
    (23, 'Circles',                          'geometry'),
    (24, 'Polygons and Quadrilaterals',      'geometry'),
    (25, 'Mensuration — 2D',                 'geometry'),
    (26, 'Mensuration — 3D',                 'geometry'),
    (27, 'Coordinate Geometry',              'geometry'),
    (28, 'Trigonometry and Heights',         'geometry'),
    (29, 'Permutation and Combination',      'modern'),
    (30, 'Probability',                      'modern'),
    (31, 'Set Theory and Venn Diagrams',     'modern'),
    (32, 'Statistics',                       'modern'),
    (33, 'Data Sufficiency',                 'logic'),
    (34, 'Miscellaneous / Mixed Bag',        'logic'),
]

CONCEPT_NOTES = {
    'Number Theory': (
        'Number Theory covers the properties of integers. Key concepts include: '
        'prime numbers, composite numbers, perfect numbers, factors, multiples. '
        'Every integer >1 is either prime or can be uniquely factored into primes (FTA). '
        'The number of factors of n = p1^a × p2^b × … is (a+1)(b+1)…',
        'Sum of factors = (p1^(a+1)-1)/(p1-1) × (p2^(b+1)-1)/(p2-1) × …\n'
        'Number of co-primes to n = n × Π(1 - 1/pi)\n'
        'Sum of co-primes = n/2 × φ(n)'
    ),

    'Percentages': (
        'Percentages express a fraction as parts per hundred. '
        'Successive percentage changes: if +a% then +b%, net = a + b + ab/100. '
        'Population/price problems use multiplicative factors: 1.15 = 15% increase.',
        'Net change for two successive changes a% and b% = a + b + ab/100\n'
        'If A is r% more than B, then B is r/(100+r) × 100 % less than A\n'
        'Percentage error = (Error/True Value) × 100'
    ),
    'Time Speed Distance': (
        'Speed = Distance / Time. Relative speed: same direction = difference, '
        'opposite direction = sum. Average speed for equal distances = 2uv/(u+v). '
        'Trains: when passing a stationary object, distance = length of train.',
        'Average speed (equal distances) = 2S1×S2 / (S1+S2)\n'
        'Time to meet (head on) = D / (S1+S2)\n'
        'Circular track (same direction): T = LCM(T1,T2)'
    ),
}

# Sample GRE vocab (full 759 would be loaded from a fixture)
SAMPLE_VOCAB = [
    ('Abate',     'To reduce in intensity or amount',
     'From Latin abatere — to beat down', 'The storm abated overnight.', 'diminish, subside, wane', 'high'),
    ('Aberrant',  'Departing from the norm; atypical',
     'From Latin aberrare — to wander away', 'The scientist noted the aberrant data point.', 'anomalous, deviant', 'high'),
    ('Abeyance',  'Temporary suspension or inactivity',
     'From Anglo-French abeyance — expectation', 'The project was held in abeyance pending funding.', 'dormancy, suspension', 'medium'),
    ('Abjure',    'To formally renounce a belief or claim',
     'From Latin abjurare — to deny on oath', 'He abjured his former political views.', 'renounce, forswear, recant', 'high'),
    ('Abscond',   'To leave hurriedly and secretly, especially to avoid consequences',
     'From Latin abscondere — to hide', 'The accountant absconded with client funds.', 'flee, bolt, escape', 'medium'),
    ('Acerbic',   'Sharp or forthright in manner; harshly critical',
     'From Latin acerbus — harsh, bitter', 'Her acerbic wit alienated many colleagues.', 'caustic, mordant, trenchant', 'high'),
    ('Acrimony',  'Bitterness or ill feeling',
     'From Latin acrimonia — sharpness', 'The divorce was marked by acrimony.', 'bitterness, hostility, rancor', 'high'),
    ('Acumen',    'The ability to make good judgements and quick decisions',
     'From Latin acumen — a point or sting', 'Her business acumen made her a successful entrepreneur.', 'astuteness, shrewdness, perspicacity', 'medium'),
    ('Adumbrate', 'To outline or indicate faintly',
     'From Latin adumbrare — to overshadow', 'The proposal merely adumbrated the plan.', 'outline, sketch, foreshadow', 'medium'),
    ('Aesthetic', 'Concerned with beauty or the appreciation of beauty',
     'From Greek aisthetikos — perceptive', 'The architect had a refined aesthetic sensibility.', 'artistic, tasteful', 'low'),
]

# Sample CAT grammar questions
GRAMMAR_QUESTIONS = [
    {
        'text': 'Choose the sentence that is grammatically correct:',
        'options': [
            ('a', 'Neither the manager nor the employees was informed.'),
            ('b', 'Neither the manager nor the employees were informed.'),
            ('c', 'Neither the manager nor the employees has been informed.'),
            ('d', 'Neither the manager nor the employees have been informed.'),
        ],
        'correct': 'b',
        'explanation': (
            'When "neither...nor" connects subjects of different numbers, the verb agrees '
            'with the subject closest to it. "Employees" (plural) is closest, so use "were".'
        ),
        'topic': 'SubjectVerbAgreement', 'difficulty': 'Medium',
    },
    {
        'text': 'Identify the error in: "The data is inconclusive and needs further analysis."',
        'options': [
            ('a', '"Data" is singular, so "is" is correct.'),
            ('b', '"Data" is plural; the sentence should read "The data are inconclusive."'),
            ('c', 'No error — both usages are acceptable in modern English.'),
            ('d', '"Needs" should be "need" regardless of data\'s number.'),
        ],
        'correct': 'c',
        'explanation': (
            'Historically "data" is Latin plural of "datum", but in modern English both '
            '"data is" and "data are" are widely accepted. Option C is the best answer. '
            'CAT typically follows formal academic convention where "data are" is preferred.'
        ),
        'topic': 'GrammarUsage', 'difficulty': 'Hard',
    },
    {
        'text': 'Select the correctly punctuated sentence:',
        'options': [
            ('a', 'The results, which were unexpected surprised everyone.'),
            ('b', 'The results which were unexpected, surprised everyone.'),
            ('c', 'The results, which were unexpected, surprised everyone.'),
            ('d', 'The results which were unexpected surprised everyone.'),
        ],
        'correct': 'c',
        'explanation': (
            '"Which were unexpected" is a non-restrictive relative clause — it adds '
            'information but is not essential to identify the noun. Non-restrictive '
            'clauses must be set off by commas on both sides.'
        ),
        'topic': 'Punctuation', 'difficulty': 'Easy',
    },
]


class Command(BaseCommand):
    help = 'Seed tools, tag taxonomy, QA topics, vocab, and sample questions.'

    def add_arguments(self, parser):
        parser.add_argument('--wipe', action='store_true', help='Wipe existing tools data first.')

    @transaction.atomic
    def handle(self, *args, **options):
        if options['wipe']:
            self.stdout.write('Wiping tools data…')
            Tool.objects.all().delete()
            Tag.objects.all().delete()

        # 1. Tags
        self.stdout.write('Seeding tag taxonomy…')
        tag_map = {}
        for tag_type, names in TAGS.items():
            for name in names:
                from django.utils.text import slugify
                slug = slugify(name)
                # update_or_create by slug — the UNIQUE field — never collides
                tag, _ = Tag.objects.update_or_create(
                    slug=slug,
                    defaults={'name': name, 'tag_type': tag_type}
                )
                tag_map[name] = tag
        self.stdout.write(f'  → {Tag.objects.count()} tags')

        # 2. Tools
        self.stdout.write('Seeding tools…')
        tool_map = {}
        for td in TOOLS_DATA:
            exam_tags    = td.pop('exam_tags', [])
            section_tags = td.pop('section_tags', [])

            tool, _ = Tool.objects.update_or_create(
                slug=td['slug'], defaults=td
            )
            # Attach tags
            tool.tags.clear()
            for name in exam_tags + section_tags:
                if name in tag_map:
                    tool.tags.add(tag_map[name])
            tool_map[tool.slug] = tool
        self.stdout.write(f'  → {Tool.objects.count()} tools')

        # 3. QA Topics
        self.stdout.write('Seeding 34 QA topics…')
        cat_maths = tool_map.get('cat-maths')
        if cat_maths:
            for number, name, category in QA_TOPICS:
                from django.utils.text import slugify
                tag_name = name.replace(' ', '').replace('—', '').replace(',', '').strip()
                tag_slug = slugify(tag_name)
                # Use update_or_create by slug to avoid UNIQUE collision
                topic_tag, _ = Tag.objects.update_or_create(
                    slug=tag_slug,
                    defaults={'name': tag_name, 'tag_type': 'topic'}
                )
                notes, formulas = CONCEPT_NOTES.get(name, ('', ''))
                QATopic.objects.update_or_create(
                    tool=cat_maths, number=number,
                    defaults={
                        'name':          name,
                        'category':      category,
                        'concept_notes': notes,
                        'formulas':      formulas,
                        'tag':           topic_tag,
                        'sort_order':    number,
                    }
                )
        self.stdout.write(f'  → {QATopic.objects.count()} QA topics')

        # 4. GRE Vocab sample
        self.stdout.write('Seeding GRE vocab sample…')
        gre_vocab_tool = tool_map.get('gre-vocab')
        if gre_vocab_tool:
            gre_tag  = tag_map.get('GRE')
            verb_tag = tag_map.get('VerbalReasoning')
            for i, (word, defn, etym, example, synonyms, diff) in enumerate(SAMPLE_VOCAB):
                # Create Question for quiz mode
                q, _ = Question.objects.get_or_create(
                    tool=gre_vocab_tool,
                    question_text=f'Which of the following best defines the word "{word}"?',
                    defaults={
                        'question_type': 'vocab',
                        'correct_answer': 'a',
                        'explanation': f'{word}: {defn}. {etym}',
                        'exam_tag': 'GRE',
                        'section_tag': 'VerbalReasoning',
                        'topic_tag': 'Vocabulary',
                        'difficulty_tag': diff.capitalize(),
                        'marks_correct': 1,
                        'marks_wrong': 0,
                    }
                )
                if gre_tag:   q.tags.add(gre_tag)
                if verb_tag:  q.tags.add(verb_tag)

                # Option a = correct definition
                QuestionOption.objects.get_or_create(
                    question=q, key='a',
                    defaults={'text': defn, 'is_correct': True}
                )

                VocabWord.objects.update_or_create(
                    word=word,
                    defaults={
                        'tool':       gre_vocab_tool,
                        'question':   q,
                        'definition': defn,
                        'etymology':  etym,
                        'example':    example,
                        'synonyms':   synonyms,
                        'difficulty': diff,
                        'sort_order': i + 1,
                    }
                )
        self.stdout.write(f'  → {VocabWord.objects.count()} vocab words seeded (sample)')

        # 5. Grammar sample questions
        self.stdout.write('Seeding grammar questions…')
        grammar_tool = tool_map.get('cat-grammar')
        if grammar_tool:
            cat_tag  = tag_map.get('CAT')
            varc_tag = tag_map.get('VARC')
            for gq in GRAMMAR_QUESTIONS:
                q, created = Question.objects.get_or_create(
                    tool=grammar_tool,
                    question_text=gq['text'],
                    defaults={
                        'question_type': 'grammar',
                        'correct_answer': gq['correct'],
                        'explanation': gq['explanation'],
                        'exam_tag': 'CAT',
                        'section_tag': 'VARC',
                        'topic_tag': gq['topic'],
                        'difficulty_tag': gq['difficulty'],
                        'marks_correct': 3,
                        'marks_wrong': -1,
                    }
                )
                if created:
                    for key, text in gq['options']:
                        QuestionOption.objects.create(
                            question=q, key=key, text=text,
                            is_correct=(key == gq['correct'])
                        )
                    if cat_tag:  q.tags.add(cat_tag)
                    if varc_tag: q.tags.add(varc_tag)

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Tools seeded:\n'
            f'  Tags:       {Tag.objects.count()}\n'
            f'  Tools:      {Tool.objects.count()}\n'
            f'  QA Topics:  {QATopic.objects.count()}\n'
            f'  Vocab:      {VocabWord.objects.count()}\n'
            f'  Questions:  {Question.objects.count()}\n'
        ))
