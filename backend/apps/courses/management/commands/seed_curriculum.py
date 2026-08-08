"""
GRADSKOOL — Seed Curriculum

Creates CurriculumModules and CurriculumTopics for each active exam's
current Course, based on the exam's static curriculum data.

Usage:
    python manage.py seed_curriculum
    python manage.py seed_curriculum --exam cat
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify


CAT_CURRICULUM = [
    ('01', 'Verbal Ability & Reading Comprehension', 'VARC', [
        'Reading Comprehension — Strategy & Approach',
        'RC 111 — Timed Passage Practice',
        'Para-Jumbles',
        'Para-Summary',
        'Odd Sentence Out',
        'Vocabulary & RC Lexicon',
        'Grammar for CAT',
    ]),
    ('02', 'Data Interpretation & Logical Reasoning', 'DILR', [
        'Seating Arrangements',
        'Grids & Networks',
        'Games & Tournaments',
        'Data Interpretation — Tables',
        'Data Interpretation — Charts & Caselets',
        'Logical Reasoning — Schedules & Routes',
        'Set Selection Strategy',
    ]),
    ('03', 'Quantitative Ability', 'QA', [
        'Arithmetic — Ratios, Percentages, TSD',
        'Arithmetic — Profit, Loss & Interest',
        'Algebra — Equations & Inequalities',
        'Algebra — Functions & Progressions',
        'Geometry — Lines, Triangles, Circles',
        'Geometry — Mensuration & Coordinate',
        'Number Systems & Divisibility',
        'Modern Maths — P&C, Probability',
    ]),
    ('04', 'Mock Tests & Strategic Analysis', 'Mocks', [
        'Mock Test Strategy & Attempt Planning',
        'Post-Mock Analysis Framework',
        'Time Distribution Optimisation',
        'Negative Marking & Risk Calibration',
        'Final Revision Strategy',
    ]),
    ('05', 'XAT / IIFT / SNAP Preparation', 'Other Exams', [
        'Decision Making — XAT Specific',
        'GK & Current Affairs — IIFT',
        'SNAP Speed Strategy',
        'XAT Essay Writing',
    ]),
    ('06', 'GDPI Preparation', 'GDPI', [
        'Mock Personal Interviews',
        'Profile Building & Story',
        'GD Topics & Strategy',
        'WAT Preparation',
        'IIM-Specific Interview Prep',
    ]),
]

XAT_CURRICULUM = [
    ('01', 'Decision Making — Foundations', 'DM Basics', [
        'Business Situation Analysis Framework',
        'Ethical Dilemma Reasoning',
        'Trade-off Evaluation Methodology',
        'Multi-Stakeholder Scenarios',
    ]),
    ('02', 'Decision Making — Advanced', 'DM Advanced', [
        'Complex Multi-Stakeholder Problems',
        'DM Passage-Based Question Patterns',
        'Time Management in DM Section',
        'Common Traps in DM Answer Options',
    ]),
    ('03', 'Verbal Ability & Logical Reasoning', 'VALR', [
        'Dense RC Passage Strategy for XAT',
        'Critical Reasoning — Argument Structure',
        'Para-Jumbles and Para-Summary',
        'Logical Reasoning — Deductions & Inferences',
    ]),
    ('04', 'Quantitative Aptitude & Data Interpretation', 'QADI', [
        'Arithmetic, Algebra & Number Systems',
        'Geometry and Mensuration',
        'Data Interpretation Sets',
        'Attempt Strategy & Negative Marking',
    ]),
    ('05', 'General Knowledge', 'GK', [
        'Business Awareness & Corporate GK',
        'Current Affairs — Monthly Digest',
        'Static GK — Awards, Appointments, Summits',
        'International Business & Economics',
    ]),
    ('06', 'Mock Tests & XLRI Interview Prep', 'Mocks & GDPI', [
        'Full-Length XAT Mock Analysis',
        'Sectional Tests — DM, VALR, QADI',
        'XLRI PI — Panel Format Mock Interviews',
        'GD & Essay Preparation for XLRI',
    ]),
]

SNAP_CURRICULUM = [
    ('01', 'General English', 'English', [
        'Vocabulary — Synonyms, Antonyms, Analogies',
        'Grammar and Fill in the Blanks',
        'Idioms and One-Word Substitution',
        'Verbal Reasoning',
    ]),
    ('02', 'Analytical & Logical Reasoning', 'LR', [
        'Blood Relations and Directions',
        'Syllogisms and Coding-Decoding',
        'Puzzles and Seating Arrangements',
        'Critical Reasoning and Inferences',
    ]),
    ('03', 'Quantitative, DI & DS', 'QA & DI', [
        'Arithmetic — Percentages, Ratios, P&L',
        'Data Interpretation Sets',
        'Data Sufficiency Problems',
        'Speed Management for 60-Minute Format',
    ]),
    ('04', 'No-Sectional-Time-Limit Strategy', 'Strategy', [
        'Section Order Strategy for Maximum Marks',
        'Time Banking Techniques',
        'Speed Drills for 60-Minute Environment',
    ]),
    ('05', 'Mock Tests & SIU Interview Prep', 'Mocks & GDPI', [
        'Full-Length SNAP Mock Analysis',
        'SIBM Pune and SCMHRD GE-PI Preparation',
        'WAT Essay Writing for Symbiosis Process',
    ]),
]

IPMAT_CURRICULUM = [
    ('01', 'Quantitative Ability — Arithmetic', 'QA Arithmetic', [
        'Percentages, Profit & Loss, Discount',
        'Simple and Compound Interest',
        'Ratio, Proportion, Mixtures',
        'Time-Speed-Distance, Time & Work',
        'Short Answer Strategy — Exact Computation',
    ]),
    ('02', 'Quantitative Ability — Algebra & Advanced', 'QA Algebra', [
        'Linear and Quadratic Equations',
        'Sequences, Series & Progressions',
        'Permutation, Combination & Probability',
        'Set Theory and Functions',
        'Geometry — Triangles, Circles, Mensuration',
    ]),
    ('03', 'Quantitative Ability — Number Systems & DI', 'QA Number Systems', [
        'Divisibility, HCF, LCM, Remainders',
        'Number Properties and Unit Digit Patterns',
        'Data Interpretation — Tables, Charts',
        'Venn Diagrams and Set-Based DI',
    ]),
    ('04', 'Verbal Ability — Foundation', 'VA Foundation', [
        'Vocabulary — Roots, Synonyms, Antonyms',
        'One-Word Substitution and Idioms',
        'Grammar — SVA, Tenses, Articles',
        'Sentence Correction and Error Spotting',
    ]),
    ('05', 'Verbal Ability — Reading & Reasoning', 'VA Reading', [
        'Reading Comprehension — Inference, Tone',
        'Para-Jumbles and Para-Summary',
        'Critical Reasoning for IIM Rohtak Pattern',
    ]),
    ('06', 'Mock Tests & Interview Prep', 'Mocks & PI', [
        'Full-Length IPMAT Mock Analysis',
        'IIM Indore Short Answer Practice',
        'PI and WAT Preparation',
    ]),
]

EXAM_CURRICULUM = {
    'cat':   CAT_CURRICULUM,
    'xat':   XAT_CURRICULUM,
    'snap':  SNAP_CURRICULUM,
    'nmat':  [
        ('01', 'Language Skills — Foundation', 'Language', ['RC Speed Reading & Inference', 'Vocabulary & Synonyms', 'Grammar & Para-Jumbles', '28-Minute Section Strategy']),
        ('02', 'Logical Reasoning', 'LR', ['Syllogisms & Blood Relations', 'Critical Reasoning', 'Puzzles & Arrangement Sets', '40-Minute Section Strategy']),
        ('03', 'Quantitative Skills', 'QA', ['Arithmetic & Algebra', 'Data Interpretation', 'Data Sufficiency', '52-Minute Accuracy Focus']),
        ('04', 'Section Order Strategy', 'Strategy', ['Why Start with QA', 'Language — Tightest Section', 'Retake Strategy — When & How']),
        ('05', 'Mock Tests & NMIMS Interview Prep', 'Mocks & PI', ['NMAT Mock Analysis', 'NMIMS Competency Test Prep', 'NMIMS PI & Psychometric']),
    ],
    'cmat':  [
        ('01', 'Quantitative Techniques & DI', 'QT', ['Arithmetic & Algebra', 'Geometry & Number Systems', 'Data Interpretation']),
        ('02', 'Logical Reasoning', 'LR', ['Syllogisms & Arrangements', 'Blood Relations & Coding', 'Critical Reasoning']),
        ('03', 'Language Comprehension', 'Language', ['RC Passage Strategy', 'Vocabulary & Grammar', 'Para-Jumbles']),
        ('04', 'General Awareness', 'GA', ['Current Affairs Digest', 'Business & Economic GK', 'Static GK']),
        ('05', 'Innovation & Entrepreneurship', 'IE', ['Startup Ecosystems', 'Innovation Frameworks', 'JBIMS GD-PI Prep']),
    ],
    'mhcet': [
        ('01', 'Logical Reasoning — Foundation', 'LR Foundation', ['Syllogisms', 'Arrangements', 'Blood Relations', 'Coding-Decoding']),
        ('02', 'Logical Reasoning — Advanced', 'LR Advanced', ['Statement-Assumption', 'Critical Reasoning', 'Speed Drills — 75 LR in 55 min']),
        ('03', 'Abstract Reasoning', 'Abstract', ['Visual Pattern Identification', 'Matrix & Series Completion', 'Odd-Figure-Out Technique']),
        ('04', 'Quantitative Aptitude', 'QA', ['Arithmetic & Algebra', 'Data Interpretation', 'Speed Calculation']),
        ('05', 'Verbal Ability & RC', 'VA & RC', ['RC — MHCET Passages', 'Vocabulary & Grammar', 'Para-Jumbles']),
    ],
    'gmat':  [
        ('01', 'Quantitative Reasoning — Foundation', 'QR Foundation', ['Number Properties & Arithmetic', 'Algebra — Equations & Functions', 'Geometry & Coordinate']),
        ('02', 'Quantitative Reasoning — Advanced', 'QR Advanced', ['700–800 Level Problem Solving', 'Word Problem Frameworks', 'Pattern Recognition in Hard QR']),
        ('03', 'Verbal Reasoning — RC', 'Verbal RC', ['RC Passage Structure & Main Idea', 'Inference & Application Questions', 'Eliminating Trap Answer Choices']),
        ('04', 'Verbal Reasoning — CR', 'Verbal CR', ['Argument Structure — Premises & Conclusions', 'Strengthen, Weaken, Assumption', 'Inference & Bold-Face Questions']),
        ('05', 'Data Insights', 'DI', ['Data Sufficiency — Decision Rules', 'Multi-Source Reasoning', 'Table Analysis & Graphics']),
    ],
    'gre':   [
        ('01', 'Verbal Reasoning — Vocabulary', 'Verbal Vocab', ['GRE 5,000-Word Programme', 'Text Completion — 1, 2 and 3-Blank', 'Sentence Equivalence Strategy']),
        ('02', 'Verbal Reasoning — RC', 'Verbal RC', ['GRE RC Passage Types', 'Main Idea & Inference Questions', 'Select-in-Passage Question Type']),
        ('03', 'Quantitative Reasoning — Foundation', 'QR Foundation', ['Arithmetic & Number Properties', 'Algebra & Geometry', 'Data Analysis & Statistics']),
        ('04', 'Quantitative Reasoning — Advanced', 'QR Advanced', ['Hard QC Questions', 'Overlapping Sets & Venn Diagrams', 'Combinatorics & Probability']),
        ('05', 'Analytical Writing', 'AWA', ['Analyse an Issue — Structure', 'Analyse an Argument — Flaw Identification', 'Essay Practice with Feedback']),
    ],
    'ipmat': IPMAT_CURRICULUM,
    'clat':  [
        ('01', 'Legal Reasoning', 'Legal', ['Principle-Fact-Conclusion Framework', 'Torts, Contracts, Criminal Law', 'Constitutional Law Applications']),
        ('02', 'Current Affairs & GK', 'CA & GK', ['Monthly Current Affairs Digest', 'Legal Current Affairs', 'Static GK']),
        ('03', 'English Language', 'English', ['RC Passage Strategy', 'Vocabulary in Context', 'Para-Jumbles & Summary']),
        ('04', 'Logical Reasoning', 'LR', ['Critical Reasoning — Arguments', 'Statement-Inference LR', 'LNAT Argumentative Passages']),
        ('05', 'Quantitative Techniques & LNAT', 'QT & LNAT', ['Class 10 Arithmetic', 'Data Interpretation', 'LNAT Section A & Essay']),
    ],
    'cuet':  [
        ('01', 'General Test', 'General Test', ['Current Affairs', 'General Mental Ability', 'Quantitative Aptitude', 'Logical Reasoning']),
        ('02', 'Language — English', 'Language', ['RC at CUET Difficulty', 'Vocabulary & Grammar', 'Para-Jumbles']),
        ('03', 'Accountancy', 'Accountancy', ['Financial Statements', 'Partnership Accounting', 'Cash Flow Statements']),
        ('04', 'Economics', 'Economics', ['Microeconomics — Demand & Supply', 'Macroeconomics — National Income', 'Indian Economy']),
        ('05', 'Business Studies', 'Business Studies', ['Management Principles', 'Finance & Marketing', 'Entrepreneurship']),
    ],
    'pi-wat-gd': [
        ('01', 'Profile Mapping', 'Profile', ['Academic Background Analysis', 'Gap Identification & Framing', 'PI Narrative Building']),
        ('02', 'GK & Current Affairs', 'GK', ['Economy & Business GK PDFs', 'Indian Policy & World Affairs', 'Corporate Events']),
        ('03', 'Graduation Subject Prep', 'Subjects', ['Engineering Core Subjects', 'Commerce Fundamentals', 'Arts & Social Sciences']),
        ('04', 'WAT & AWT Writing', 'Writing', ['WAT Topic Practice', 'AWT for IIM Ahmedabad', 'Timed Essay Practice']),
        ('05', 'GD Simulation', 'GD', ['Topic GDs', 'Case GDs', 'Abstract GD Topics']),
        ('06', 'Mock Personal Interviews', 'Mock PIs', ['Panel Format Mock PIs', 'Stress Round Simulation', 'Competency-Based Q&A']),
    ],
}


class Command(BaseCommand):
    help = 'Seed CurriculumModules and CurriculumTopics for all exam courses'

    def add_arguments(self, parser):
        parser.add_argument('--exam', type=str, default=None,
                            help='Seed curriculum for a specific exam slug only')

    def handle(self, *args, **options):
        from apps.courses.models import Exam, Course, CurriculumModule, CurriculumTopic

        target_exam = options.get('exam')
        created_modules = 0
        created_topics  = 0

        exams = Exam.objects.filter(is_active=True)
        if target_exam:
            exams = exams.filter(slug=target_exam)

        for exam in exams:
            curriculum = EXAM_CURRICULUM.get(exam.slug)
            if not curriculum:
                self.stdout.write(f'  ⚠ No curriculum defined for {exam.slug} — skipping')
                continue

            # Get or create an active Course for this exam
            course, _ = Course.objects.get_or_create(
                exam=exam,
                status='active',
                defaults={
                    'title':       f'{exam.short_name} 2026 — Live Cohort',
                    'slug':        f'{exam.slug}-2026-c1',
                    'batch_size':  27,
                    'is_open':     True,
                }
            )

            for num, title, short_title, topics in curriculum:
                module, m_created = CurriculumModule.objects.get_or_create(
                    course=course,
                    number=int(num),
                    defaults={
                        'title':       title,
                        'short_title': short_title,
                        'slug':        slugify(f'{exam.slug}-{short_title.lower()}'),
                    }
                )
                if m_created:
                    created_modules += 1

                for i, topic_title in enumerate(topics, start=1):
                    topic, t_created = CurriculumTopic.objects.get_or_create(
                        module=module,
                        title=topic_title,
                        defaults={
                            'slug':       slugify(topic_title),
                            'sort_order': i,
                        }
                    )
                    if t_created:
                        created_topics += 1

            self.stdout.write(f'  ✓ {exam.short_name}: modules and topics seeded')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone — created {created_modules} modules, {created_topics} topics'
        ))
