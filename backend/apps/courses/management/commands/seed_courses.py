"""
GRADSKOOL  -  Management Command: seed_courses

Seeds the database with all 13 exams, pricing plans, and platform stats
derived from the ZIP analysis.

Usage:
  python manage.py seed_courses
  python manage.py seed_courses --wipe   (clears existing data first)
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.courses.models import (
    Exam, ExamStat, PricingPlan, PlanFeature, Instructor,
)

# ── EXAMS DATA ────────────────────────────────────────────────────────────────

EXAMS = [
    # MBA India
    dict(slug='cat',  name='CAT 2026', short_name='CAT',
         tagline='30 full-length mocks. 400+ hours live. IIMs, FMS, SPJIMR.',
         category='mba_india', is_featured=True, sort_order=1,
         meta_title='CAT 2026 Preparation  -  GRADSKOOL',
         meta_desc='CAT 2026 live coaching. 30 mocks, 30 sectionals, 400+ hrs live. Limited cohort of 27.',
         og_image_url='https://gradskool.in/assets/og-cat.jpg',
         conducting_body='IIMs (rotating)',
         score_range='0 – 204',
         exam_overview=(
             'The Common Admission Test (CAT) is India most competitive MBA entrance exam  -  '
             'conducted annually by the IIMs. A strong CAT score is the gateway to IIMs, FMS, '
             'SPJIMR, MDI, IMI and hundreds of top B-schools across India.'
         ),
         eligibility=(
             'A Bachelors degree in any discipline from a UGC/AICTE-recognised university. '
             'Minimum 50% aggregate (45% for SC/ST/PwD). Final-year students are also eligible. '
             'No age limit. No limit on number of attempts.'
         ),
         exam_pattern=[
             {'label': 'Total Duration',   'value': '2 Hours'},
             {'label': 'Total Questions',  'value': '68 Questions'},
             {'label': 'Total Marks',      'value': '204 Marks'},
             {'label': 'Marking Scheme',   'value': '+3 / -1'},
             {'label': 'Mode',             'value': 'Computer Based'},
             {'label': 'VARC',             'value': '24 Qs  -  40 Min'},
             {'label': 'DILR',             'value': '22 Qs  -  40 Min'},
             {'label': 'Quantitative',     'value': '22 Qs  -  40 Min'},
         ],
         key_dates=[
             {'month': 'JUL', 'year': '2026', 'event': 'Official CAT 2026 Notification', 'desc': 'IIM releases the official bulletin with exam date, registration window, eligibility, and syllabus.'},
             {'month': 'AUG', 'year': '2026', 'event': 'CAT 2026 Registration Opens', 'desc': 'Apply at iimcat.ac.in. Application fee: Rs 1,200 (General), Rs 600 (SC/ST/PwD).'},
             {'month': 'SEP', 'year': '2026', 'event': 'Registration Closes', 'desc': 'Last date to submit application form and pay fees.'},
             {'month': 'OCT', 'year': '2026', 'event': 'Admit Card Released', 'desc': 'Download from iimcat.ac.in. Carry to exam centre.'},
             {'month': 'NOV', 'year': '2026', 'event': 'CAT 2026 Exam Day', 'desc': 'Conducted in 3 slots across multiple cities. Results expected in January 2027.'},
         ],
         stats=[
             ('30', 'Full-Length Mocks'),
             ('30', 'Sectional Tests'),
             ('400+', 'Hours Live Teaching'),
             ('27', 'Students per Cohort'),
         ]),
    dict(slug='xat', name='XAT 2027', short_name='XAT',
         tagline='Decision Making. Essay Writing. XAT-specific preparation.',
         category='mba_india', is_featured=True, sort_order=2,
         og_image_url='https://gradskool.in/assets/og-xat.jpg',
         conducting_body='XLRI Jamshedpur',
         score_range='Percentile-based',
         exam_overview=(
             'Xavier Aptitude Test (XAT) is conducted by XLRI Jamshedpur — one of India\'s most prestigious B-schools. '
             'Unlike CAT, XAT has a unique Decision Making section and is accepted by 150+ B-schools including XIMB, GIM, TAPMI, XIME and IMT. '
             'XAT is conducted once a year in January and is the second most important MBA entrance exam in India.'
         ),
         eligibility=(
             "A Bachelor's degree in any discipline from a recognised university\n"
             "Final-year students in the final year of graduation can apply\n"
             "No upper or lower age limit\n"
             "No attempt limit — exam conducted once every year in January\n"
             "Work experience not mandatory but valued by XLRI BM and HRM programmes"
         ),
         key_dates=[
             {'month':'AUG','year':'2026','event':'Registration Opens','detail':'XAT registration opens on xatonline.in. Registration fee: ~₹2,000. Apply to all target colleges at this stage.'},
             {'month':'NOV','year':'2026','event':'Registration Closes','detail':'Late registration typically allowed with a penalty fee. Admit card available for download after registration closes.'},
             {'month':'JAN','year':'2027','event':'XAT Exam Day','detail':'Held on the first Sunday of January. Computer-based test. Duration: 3 hours 35 minutes. No calculator permitted.'},
             {'month':'JAN','year':'2027','event':'XAT Results','detail':'Scorecard released on xatonline.in within 2-3 weeks. Sectional and overall percentiles available. Shortlists follow.'},
             {'month':'FEB','year':'2027','event':'GD-PI / WAT Rounds','detail':'XLRI conducts GD-PI-WAT for shortlisted candidates. Other XAT-accepting institutes have their own GD-PI schedules.'},
         ],
         exam_pattern=[
             {'label':'Conducted By','value':'XLRI Jamshedpur'},
             {'label':'Exam Month','value':'January'},
             {'label':'Duration','value':'3 Hours 35 Min'},
             {'label':'Part 1 Questions','value':'75 Questions'},
             {'label':'Part 2 (GK)','value':'25 Questions'},
             {'label':'Negative Marking','value':'-0.25 per wrong'},
             {'label':'Unattempted Penalty','value':'-0.10 (8+ skipped)'},
             {'label':'Mode','value':'Computer Based'},
         ],
         top_colleges=[
             {'name':'XLRI Jamshedpur — BM','city':'Jamshedpur, Jharkhand','cutoff':'95%+','avg':'INR 30-35 LPA','fee':'INR 24 L'},
             {'name':'XLRI Jamshedpur — HRM','city':'Jamshedpur, Jharkhand','cutoff':'90%+','avg':'INR 28-32 LPA','fee':'INR 24 L'},
             {'name':'SPJIMR Mumbai','city':'Mumbai, Maharashtra','cutoff':'90%+','avg':'INR 28-30 LPA','fee':'INR 22 L'},
             {'name':'IMT Ghaziabad','city':'Ghaziabad, UP','cutoff':'85%+','avg':'INR 14-17 LPA','fee':'INR 18 L'},
             {'name':'XIMB Bhubaneswar','city':'Bhubaneswar, Odisha','cutoff':'85%+','avg':'INR 14-18 LPA','fee':'INR 18 L'},
             {'name':'GIM Goa','city':'Goa','cutoff':'80%+','avg':'INR 12-14 LPA','fee':'INR 16 L'},
         ],
         stats=[('6','Full Length XAT Mocks'),('12','Sectional Tests'),('40','Area-wise Tests'),('27','Students Per Cohort')]),
    dict(slug='snap', name='SNAP 2026', short_name='SNAP',
         tagline='60 questions. 60 minutes. No sectional time limit. SIBM Pune strategy.',
         category='mba_india', is_featured=False, sort_order=3,
         og_image_url='https://gradskool.in/assets/og-snap.jpg',
         conducting_body='Symbiosis International University (SIU)',
         score_range='0-150 (scaled)',
         exam_overview=(
             'Symbiosis National Aptitude Test (SNAP) is conducted by Symbiosis International University (SIU) '
             'for admission to all 17 Symbiosis MBA institutes. It is one of India\'s most speed-intensive MBA entrance exams — '
             '60 questions in exactly 60 minutes, with no sectional time limits. SNAP is the gateway to SIBM Pune, SCMHRD, SIIB and 14 other SIU institutes.'
         ),
         eligibility=(
             "A Bachelor's degree in any discipline from a recognised university\n"
             "Minimum 50% marks in graduation required for most SIU institutes\n"
             "Final-year students can apply — degree must be completed before joining\n"
             "Up to 3 attempts allowed per year — conducted across 3 dates in December\n"
             "No age limit. No-shows do not count as attempts."
         ),
         key_dates=[
             {'month':'AUG','year':'2026','event':'SNAP Registration Opens','detail':'Registration opens at snaptest.org. Fee: ₹2,250 per attempt + ₹1,000 per Symbiosis college. Book all 3 test dates at once.'},
             {'month':'NOV','year':'2026','event':'Registration Closes','detail':'Last date to register for SNAP. Admit cards for each test date released 1-2 weeks before the exam.'},
             {'month':'DEC','year':'2026','event':'SNAP — Test 1','detail':'First of 3 SNAP test dates. 60 minutes, 60 questions. No sectional time limits. Conducted across 90+ cities.'},
             {'month':'DEC','year':'2026','event':'SNAP — Tests 2 & 3','detail':'Second and third SNAP test dates. All 3 attempts are optional. Best score used for all SIU admissions.'},
             {'month':'JAN','year':'2027','event':'SNAP Results & SIU Shortlists','detail':'Results announced second week of January. SIU institutes release individual PI shortlists.'},
             {'month':'FEB','year':'2027','event':'GE-PI & Final Offers','detail':'Group Exercise, WAT, and PI rounds. Final merit: SNAP 50% + GE-PI-WAT 30% + Academics 20%.'},
         ],
         exam_pattern=[
             {'label':'Conducted By','value':'SIU, Pune'},
             {'label':'Exam Month','value':'December (3 dates)'},
             {'label':'Duration','value':'60 Minutes'},
             {'label':'Total Questions','value':'60 Questions'},
             {'label':'Total Marks','value':'60 Marks'},
             {'label':'Max Attempts','value':'3 Per Cycle'},
             {'label':'Negative Marking','value':'-0.25 per wrong'},
             {'label':'Mode','value':'Computer Based'},
         ],
         top_colleges=[
             {'name':'SIBM Pune','city':'Pune, Maharashtra','cutoff':'98.5%+','avg':'INR 23.71 LPA','fee':'INR 21 L'},
             {'name':'SCMHRD Pune','city':'Pune, Maharashtra','cutoff':'97%+','avg':'INR 13.48 LPA','fee':'INR 18 L'},
             {'name':'SIIB Pune','city':'Pune, Maharashtra','cutoff':'95%+','avg':'INR 12-14 LPA','fee':'INR 16 L'},
             {'name':'SIBM Bengaluru','city':'Bengaluru, Karnataka','cutoff':'92-93%','avg':'INR 13.48 LPA','fee':'INR 16 L'},
             {'name':'SCIT Pune / SIMC Pune','city':'Pune, Maharashtra','cutoff':'83-87%','avg':'INR 11.5 LPA','fee':'INR 14-16 L'},
             {'name':'SIBM Nagpur / Hyderabad / Noida','city':'Various locations','cutoff':'60-83%','avg':'INR 5-10 LPA','fee':'INR 10-14 L'},
         ],
         stats=[('20','Full Length SNAP Mocks'),('12','Sectional Tests'),('60','Area-wise Tests'),('27','Students Per Cohort')]),
    dict(slug='nmat', name='NMAT 2026', short_name='NMAT',
         tagline='3 attempts. No negative marking. A 45-day window to get your best score.',
         category='mba_india', is_featured=False, sort_order=4,
         og_image_url='https://gradskool.in/assets/og-nmat.jpg',
         conducting_body='GMAC (Graduate Management Admission Council)',
         score_range='0 – 360',
         exam_overview=(
             'NMAT by GMAC is the primary entrance exam for NMIMS University — one of India\'s top private B-schools. '
             'Unlike CAT, NMAT has no negative marking, allows 3 attempts per cycle, and is conducted across a flexible 45-day window. '
             'NMAT is also accepted by XIMB, KJ Somaiya, TAPMI, SDA Bocconi and 50+ other colleges globally.'
         ),
         eligibility=(
             "A Bachelor's degree in any discipline from a recognised university\n"
             "Minimum 50% marks in graduation required for most participating colleges\n"
             "Final-year students can apply — degree must be completed before joining\n"
             "Up to 3 attempts allowed per cycle with minimum 15-day gap between attempts\n"
             "No age limit. No reservation policy from GMAC."
         ),
         key_dates=[
             {'month':'AUG','year':'2026','event':'Registration Opens','detail':'NMAT registration opens on mba.com/nmat. Register early — popular test centres fill up fast. Fee: ~₹2,300.'},
             {'month':'OCT','year':'2026','event':'Testing Window Opens','detail':'The NMAT testing window opens in mid-October. Choose your preferred date, time, and centre. Online proctored exams also available.'},
             {'month':'OCT','year':'2026','event':'Registration Closes','detail':'Late registration available at ₹2,800. Retake registration remains open for those who have taken first attempt.'},
             {'month':'OCT','year':'2026','event':'Full Testing Window','detail':'~45-day window running October to late December. Up to 3 attempts with 15-day gaps. Unofficial scores available immediately.'},
             {'month':'DEC','year':'2026','event':'Testing Window Closes','detail':'Final date to take NMAT 2026. Official scores within 48-72 hours of each attempt.'},
             {'month':'JAN','year':'2027','event':'NMIMS Shortlisting','detail':'NMIMS releases shortlists. Candidates called for Competency Test (aptitude + psychometric + writing) and Personal Interview.'},
         ],
         exam_pattern=[
             {'label':'Conducted By','value':'GMAC'},
             {'label':'Test Window','value':'~45 Days'},
             {'label':'Duration','value':'120 Minutes'},
             {'label':'Total Questions','value':'108 Questions'},
             {'label':'Score Range','value':'0 – 360'},
             {'label':'Max Attempts','value':'3 Per Cycle'},
             {'label':'Negative Marking','value':'None'},
             {'label':'Mode','value':'Computer Adaptive'},
         ],
         top_colleges=[
             {'name':'NMIMS Mumbai — MBA Core','city':'Mumbai, Maharashtra','cutoff':'232-240+','avg':'INR 25.13 LPA','fee':'INR 21-24 L'},
             {'name':'NMIMS Mumbai — MBA HR','city':'Mumbai, Maharashtra','cutoff':'220-235+','avg':'INR 25.02 LPA','fee':'INR 20-23 L'},
             {'name':'NMIMS Bangalore','city':'Bengaluru, Karnataka','cutoff':'209-224+','avg':'INR 14-18 LPA','fee':'INR 18-20 L'},
             {'name':'NMIMS Hyderabad / Indore','city':'Hyderabad & Indore','cutoff':'200-215+','avg':'INR 12-15 LPA','fee':'INR 15-18 L'},
             {'name':'XIMB Bhubaneswar','city':'Bhubaneswar, Odisha','cutoff':'215-225+','avg':'INR 14-18 LPA','fee':'INR 18 L'},
             {'name':'KJ Somaiya / TAPMI / SDA Bocconi','city':'Various locations','cutoff':'200-220+','avg':'INR 10-14 LPA','fee':'INR 14-20 L'},
         ],
         stats=[('10','Full Length NMAT Mocks'),('12','Sectional Tests'),('50','Area-wise Tests'),('27','Students Per Cohort')]),
    dict(slug='nmat-snap', name='SNAP + NMAT Bundle', short_name='SNAP+NMAT',
         tagline='One price, both exams. 30 full-length mocks, 21 sectional tests.',
         category='bundle', is_featured=False, sort_order=4,
         og_image_url='https://gradskool.in/assets/og-image.jpg',
         stats=[('30','Full-length mocks'),('21','Sectional tests'),('₹1,499','You save'),('2','Exams covered')]),
    dict(slug='cmat', name='CMAT 2026', short_name='CMAT',
         tagline='Innovation & Entrepreneurship. CMAT-specific strategy.',
         category='mba_india', is_featured=False, sort_order=5,
         og_image_url='https://gradskool.in/assets/og-cmat.jpg',
         stats=[('10', 'CMAT Mocks')]),
    dict(slug='mhcet', name='MH CET MBA 2026', short_name='MHCET',
         tagline='Maharashtra MBA entrance. 200 Qs, 150 mins.',
         category='mba_india', is_featured=False, sort_order=6,
         og_image_url='https://gradskool.in/assets/og-mhcet.jpg',
         stats=[('10', 'MH CET Mocks')]),

    # MBA Abroad
    dict(slug='gmat', name='GMAT Focus Edition', short_name='GMAT',
         tagline='Verbal, Quant, Data Insights. Global MBA admissions.',
         category='mba_abroad', is_featured=True, sort_order=7,
         og_image_url='https://gradskool.in/assets/og-gmat.jpg',
         stats=[('6', 'Full GMAT Mocks'), ('700+', 'Practice Questions')]),
    dict(slug='gre', name='GRE 2025', short_name='GRE',
         tagline='Verbal, Quant, AWA. Top international universities.',
         category='mba_abroad', is_featured=True, sort_order=8,
         og_image_url='https://gradskool.in/assets/og-gre.jpg',
         stats=[('6', 'GRE Full Mocks'), ('759', 'Vocabulary Words')]),

    # Undergraduate
    dict(slug='ipmat', name='IPMAT 2026', short_name='IPMAT',
         conducting_body='IIM Indore',
         score_range='+4 / -1 (MCQ)',
         exam_overview=(
             'IPMAT (Integrated Programme in Management Aptitude Test) is the entrance exam for '
             'the 5-year Integrated Programme in Management (IPM) at IIM Indore  -  India most '
             'prestigious undergraduate management programme. It is the only direct route to an '
             'IIM degree without appearing in CAT.'
         ),
         eligibility=(
             'Minimum 60% in Class X and Class XII (55% for SC/ST/PwD). '
             'Maximum age 20 years as on July 31 of the admission year (22 years for SC/ST/PwD). '
             'Indian nationals only. Appearing candidates in Class XII can also apply.'
         ),
         exam_pattern=[
             {'label': 'Duration',          'value': '180 Minutes'},
             {'label': 'Total Questions',   'value': '100 Questions'},
             {'label': 'Sections',          'value': '2 Sections'},
             {'label': 'MCQ Marking',       'value': '+4 / -1'},
             {'label': 'SA Marking',        'value': '+4 / No Negative'},
             {'label': 'Mode',              'value': 'Computer Based'},
             {'label': 'Quantitative',      'value': '60 Qs (MCQ + SA)'},
             {'label': 'Verbal Ability',    'value': '40 Qs (MCQ)'},
         ],
         tagline='IIM Indore & Rohtak integrated MBA. Maths + Verbal.',
         category='ug', is_featured=True, sort_order=9,
         og_image_url='https://gradskool.in/assets/og-ipmat.jpg',
         stats=[('10', 'IPMAT Mocks'), ('5', 'Sectional Tests')]),
    dict(slug='cuet', name='CUET UG 2026', short_name='CUET',
         tagline='Central University admissions. Domain + Language + GA.',
         category='ug', is_featured=False, sort_order=10,
         og_image_url='https://gradskool.in/assets/og-cuet.jpg',
         stats=[('8', 'CUET Mocks')]),
    dict(slug='law-ug', name='Law UG  -  CLAT / AILET', short_name='LAW',
         tagline='NLU admissions. Legal reasoning, GK, English.',
         category='ug', is_featured=False, sort_order=11,
         og_image_url='https://gradskool.in/assets/og-law-ug.jpg',
         stats=[('10', 'CLAT Mocks'), ('5', 'AILET Mocks')]),

    # Special
    dict(slug='pi-wat-gd', name='PI WAT GD Preparation', short_name='PI-WAT-GD',
         tagline='Mock PIs. Written Ability Test. Group Discussion.',
         category='interview', is_featured=False, sort_order=12,
         og_image_url='https://gradskool.in/assets/og-image.jpg',
         stats=[('5', 'Mock PI Rounds'), ('3', 'GD Simulations'), ('10', 'WAT Topics')]),
    dict(slug='complete-mba', name='Complete MBA Prep', short_name='COMPLETE-MBA',
         tagline='CAT + XAT + SNAP + NMAT + CMAT. One package.',
         category='bundle', is_featured=True, sort_order=13,
         og_image_url='https://gradskool.in/assets/og-image.jpg',
         stats=[
             ('89+', 'Total Mocks'), ('5', 'Exams Covered'),
             ('PI WAT GD', 'Included'),
         ]),
]

# ── PRICING PLANS DATA ────────────────────────────────────────────────────────

PLANS = {
    'cat': [
        dict(name='Live + CAT Mocks', slug='live-mocks',
             price_inr=Decimal('17999'), is_featured=True, badge_text='Most Popular', sort_order=1,
             includes_live=True, includes_mocks=True, mock_exams_covered=['CAT'],
             razorpay_sku='cat-live-mocks',
             features=[
                 ('Live sessions  -  27 students per cohort', True),
                 ('30 full-length CAT mocks', True),
                 ('30 sectional tests', True),
                 ('Session recordings', True),
                 ('Printed books (16-book set)', False),
                 ('GDPI preparation', False),
             ]),
        dict(name='Live + All MBA Mocks', slug='live-all-mba-mocks',
             price_inr=Decimal('19999'), is_featured=False, badge_text='Best Value',
             sort_order=2,
             includes_live=True, includes_mocks=True,
             mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
             razorpay_sku='cat-live-all-mba-mocks',
             features=[
                 ('Live sessions  -  27 students per cohort', True),
                 ('30 full-length CAT mocks + OMETs', True),
                 ('30 sectional tests', True),
                 ('Session recordings', True),
                 ('Printed books (16-book set)', False),
                 ('GDPI preparation', False),
             ]),
        dict(name='Live + CAT Mocks + Books', slug='live-cat-mocks-books',
             price_inr=Decimal('21999'), sort_order=3,
             includes_live=True, includes_mocks=True, includes_books=True,
             mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
             razorpay_sku='cat-live-all-mocks-books',
             features=[
                 ('Live sessions  -  27 students per cohort', True),
                 ('30 full-length CAT mocks + OMETs', True),
                 ('Printed 16-book set', True),
                 ('Session recordings', True),
                 ('GDPI preparation', False),
             ]),
        dict(name='Live + All MBA Mocks + Books', slug='live-all-mba-mocks-books',
             price_inr=Decimal('24999'), sort_order=4,
             includes_live=True, includes_mocks=True, includes_books=True, includes_gdpi=True,
             mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
             razorpay_sku='cat-live-all-mocks-books-gdpi',
             features=[
                 ('Live sessions  -  27 students per cohort', True),
                 ('All MBA mocks + CAT mocks', True),
                 ('Printed 16-book set', True),
                 ('GDPI  -  Mock PIs, GD, WAT', True),
                 ('Session recordings', True),
             ]),
        dict(name='CAT Mocks Only', slug='cat-mocks-only',
             price_inr=Decimal('2999'), sort_order=5,
             includes_mocks=True, mock_exams_covered=['CAT'],
             razorpay_sku='cat-mocks-only',
             features=[
                 ('30 full-length CAT mocks', True),
                 ('30 sectional tests', True),
                 ('Live sessions', False),
                 ('Printed books', False),
             ]),
        dict(name='LRDI Hub', slug='lrdi-hub',
             price_inr=Decimal('499'), sort_order=6,
             mock_exams_covered=['CAT'],
             razorpay_sku='cat-lrdi-hub',
             features=[
                 ('Comprehensive DILR practice — all pattern types', True),
                 ('Full FYQ access, filtered to LRDI', True),
                 ('Live sessions', False),
             ]),
        dict(name='VARC Hub', slug='varc-hub',
             price_inr=Decimal('499'), sort_order=7,
             mock_exams_covered=['CAT'],
             razorpay_sku='cat-varc-hub',
             features=[
                 ('RC passages, para-jumbles, para-summary', True),
                 ('Full FYQ access, filtered to VARC', True),
                 ('Live sessions', False),
             ]),
        dict(name='CAT Books', slug='cat-books',
             price_inr=Decimal('3999'), sort_order=8,
             includes_books=True, mock_exams_covered=['CAT'],
             razorpay_sku='cat-books',
             features=[
                 ('Curated physical books covering CAT\u2019s full syllabus', True),
                 ('ALP Sir\u2019s own notes and annotations', True),
                 ('Shipped to your address', True),
                 ('Live sessions', False),
             ]),
        dict(name='All MBA Mocks + Books', slug='all-mba-mocks-books',
             price_inr=Decimal('7999'), sort_order=6,
             includes_mocks=True, includes_books=True,
             mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
             razorpay_sku='cat-all-mba-mocks-books',
             features=[
                 ('30 full-length CAT + OMET mocks', True),
                 ('16-book printed set', True),
                 ('Live sessions', False),
             ]),
        dict(name='CAThlete — Without Mocks', slug='base',
             price_inr=Decimal('6999'), sort_order=9,
             includes_live=True, mock_exams_covered=['CAT'],
             razorpay_sku='cathlete-base',
             features=[
                 ('Structured rapid CAT preparation — VARC, DILR, QA', True),
                 ('Live sessions', True),
                 ('Session PDFs and cheat sheets', True),
                 ('30 CAT mocks', False),
             ]),
        dict(name='CAThlete + Mocks', slug='with-mocks',
             price_inr=Decimal('9999'), is_featured=True, badge_text='Recommended', sort_order=10,
             includes_live=True, includes_mocks=True, mock_exams_covered=['CAT'],
             razorpay_sku='cathlete-with-mocks',
             features=[
                 ('Structured rapid CAT preparation — VARC, DILR, QA', True),
                 ('Live sessions', True),
                 ('31 full-length CAT mocks + post-test analysis', True),
                 ('Session PDFs and cheat sheets', True),
             ]),
        dict(name='ALPgebra — 99 Theorems', slug='alpgebra',
             price_inr=Decimal('999'), badge_text='Early Bird', sort_order=11,
             mock_exams_covered=['CAT'],
             razorpay_sku='cat-alpgebra',
             features=[
                 ('19 complete Algebra chapters', True),
                 ('1,485 curated practice problems', True),
                 ('Downloadable notes and worked solutions', True),
                 ('Lifetime self-paced access', True),
             ]),
    ],
    'xat': [
        dict(name='XAT Full Course', slug='xat-full-course',
             price_inr=Decimal('5999'), is_featured=True, sort_order=1,
             includes_live=True, includes_mocks=True, mock_exams_covered=['XAT'],
             razorpay_sku='xat-full-course',
             features=[
                 ('100+ hours of live two-way sessions', True),
                 ('6 full-length XAT tests', True),
                 ('Post-test strategic analysis', True),
                 ('Decision Making special sessions', True),
                 ('Session PDFs + cheat sheets', True),
                 ('Doubt resolution sessions', True),
                 ('PI WAT GD prep for XLRI', True),
             ]),
        dict(name='XAT Mocks Only', slug='mocks',
             price_inr=Decimal('499'), sort_order=2,
             includes_mocks=True, mock_exams_covered=['XAT'],
             razorpay_sku='xat-mocks',
             features=[
                 ('6 full-length XAT tests', True),
                 ('Post-test strategic analysis', True),
                 ('Live sessions', False),
                 ('Decision Making special sessions', False),
             ]),
    ],
    'snap': [
        dict(name='SNAP Mocks', slug='snap-mocks',
             price_inr=Decimal('2999'), is_featured=True, sort_order=1,
             includes_mocks=True, mock_exams_covered=['SNAP'],
             razorpay_sku='snap-mocks',
             features=[
                 ('20 full-length SNAP mocks', True),
                 ('12 sectional tests', True),
                 ('60 area-wise tests', True),
                 ('Live sessions', False),
             ]),
    ],
    'nmat-snap': [
        dict(name='SNAP + NMAT Mocks Bundle', slug='nmat-snap-bundle',
             price_inr=Decimal('4499'), original_price=Decimal('5998'),
             is_featured=True, badge_text='Save ₹1,499', sort_order=1,
             includes_mocks=True, mock_exams_covered=['SNAP', 'NMAT'],
             razorpay_sku='nmat-snap-bundle',
             features=[
                 ('30 full-length mocks — 10 NMAT + 20 SNAP', True),
                 ('21 sectional tests', True),
                 ('Detailed post-test analysis', True),
                 ('Live sessions', False),
             ]),
    ],
    'nmat': [
        dict(name='NMAT Mocks', slug='nmat-mocks',
             price_inr=Decimal('2999'), is_featured=True, sort_order=1,
             includes_mocks=True, mock_exams_covered=['NMAT'],
             razorpay_sku='nmat-mocks',
             features=[
                 ('10 full-length NMAT mocks', True),
                 ('12 sectional tests', True),
                 ('50 area-wise tests', True),
                 ('Live sessions', False),
             ]),
    ],
    'gmat': [
        dict(name='Live Programme', slug='live',
             price_inr=Decimal('21999'), is_featured=True, sort_order=1,
             includes_live=True, includes_mocks=True, mock_exams_covered=['GMAT'],
             razorpay_sku='gmat-live',
             features=[
                 ('Live sessions with GMAT specialist', True),
                 ('6 full-length GMAT Focus mocks', True),
                 ('700+ practice questions', True),
                 ('Session recordings', True),
             ]),
        dict(name='Complete Self-Paced', slug='self-paced-complete',
             price_inr=Decimal('9999'), sort_order=2,
             includes_recordings=True, includes_mocks=True, mock_exams_covered=['GMAT'],
             razorpay_sku='gmat-self-paced-complete',
             features=[
                 ('Recorded video lectures', True),
                 ('6 GMAT Focus mocks', True),
                 ('700+ practice questions', True),
                 ('Live sessions', False),
             ]),
        dict(name='Verbal Self-Paced', slug='self-paced-verbal',
             price_inr=Decimal('7999'), sort_order=3,
             includes_recordings=True, mock_exams_covered=['GMAT'],
             razorpay_sku='gmat-self-paced-verbal',
             features=[
                 ('Verbal reasoning recorded lectures', True),
                 ('Verbal practice sets', True),
             ]),
        dict(name='Data Insights Self-Paced', slug='self-paced-di',
             price_inr=Decimal('7999'), sort_order=4,
             includes_recordings=True, mock_exams_covered=['GMAT'],
             razorpay_sku='gmat-self-paced-di',
             features=[
                 ('Data Insights recorded lectures', True),
                 ('DI practice sets', True),
             ]),
    ],
    'gre': [
        dict(name='Live + Mocks', slug='live-mocks',
             price_inr=Decimal('19999'), is_featured=True, sort_order=1,
             includes_live=True, includes_mocks=True, mock_exams_covered=['GRE'],
             razorpay_sku='gre-live-mocks',
             features=[
                 ('Live sessions  -  Verbal + Quant + AWA', True),
                 ('6 full-length GRE mocks', True),
                 ('759-word vocab builder', True),
                 ('Session recordings', True),
             ]),
        dict(name='Live + Mocks + Interview Prep', slug='live-mocks-interview',
             price_inr=Decimal('24999'), sort_order=2,
             includes_live=True, includes_mocks=True, includes_gdpi=True,
             mock_exams_covered=['GRE'],
             razorpay_sku='gre-live-mocks-interview',
             features=[
                 ('All Live + Mocks features', True),
                 ('University interview preparation', True),
                 ('Statement of Purpose guidance', True),
             ]),
    ],
    'complete-mba': [
        dict(name='Complete MBA Prep', slug='complete',
             price_inr=Decimal('34999'), is_featured=True, badge_text='Best Value',
             sort_order=1,
             includes_live=True, includes_mocks=True,
             mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
             razorpay_sku='complete-mba-full',
             features=[
                 ('Live sessions for all 5 exams', True),
                 ('89+ total mocks', True),
                 ('PI WAT GD preparation', True),
                 ('Session recordings', True),
                 ('Printed books', False),
             ]),
        dict(name='Complete MBA Prep + Books', slug='complete-books',
             price_inr=Decimal('39999'), sort_order=2,
             includes_live=True, includes_mocks=True, includes_books=True,
             mock_exams_covered=['CAT', 'XAT', 'SNAP', 'NMAT', 'CMAT'],
             razorpay_sku='complete-mba-books',
             features=[
                 ('All Complete MBA features', True),
                 ('16-book printed set', True),
             ]),
    ],
}

# Lead instructor
LEAD_INSTRUCTOR = dict(
    name='Abhishek Leela Pandey',
    slug='abhishek-leela-pandey',
    title='Founder & Lead Mentor',
    credentials='Amazon Published Author · 40 Under 40 Educator 2024',
    bio=(
        'Abhishek Leela Pandey is the founder of GRADSKOOL and has mentored over 100,000 '
        'students for CAT, GMAT, GRE, IPMAT, XAT and other major MBA entrance exams. '
        'He has helped 5,000+ students convert calls from IIMs and top B-schools. '
        'Known for his two-way teaching methodology  -  every session is a dialogue, '
        'not a lecture.'
    ),
    is_lead=True,
    sort_order=1,
    linkedin_url='https://www.linkedin.com/company/109993184/',
    youtube_url='https://www.youtube.com/@GRADSKOOLbyALP',
)


class Command(BaseCommand):
    help = 'Seed the database with all GRADSKOOL exam and pricing data.'

    def add_arguments(self, parser):
        parser.add_argument('--wipe', action='store_true', help='Wipe existing data first.')

    @transaction.atomic
    def handle(self, *args, **options):
        if options['wipe']:
            self.stdout.write('Wiping existing data…')
            PlanFeature.objects.all().delete()
            PricingPlan.objects.all().delete()
            ExamStat.objects.all().delete()
            Exam.objects.all().delete()
            Instructor.objects.all().delete()

        # Lead instructor
        instructor, created = Instructor.objects.update_or_create(
            slug=LEAD_INSTRUCTOR['slug'],
            defaults=LEAD_INSTRUCTOR,
        )
        self.stdout.write(f'  {"Created" if created else "Updated"} instructor: {instructor.name}')

        # Exams + stats + plans
        for exam_data in EXAMS:
            stats = exam_data.pop('stats', [])

            exam, created = Exam.objects.update_or_create(
                slug=exam_data['slug'],
                defaults=exam_data,
            )
            self.stdout.write(
                f'  {"Created" if created else "Updated"} exam: {exam.name}'
            )

            # Stats
            ExamStat.objects.filter(exam=exam).delete()
            for i, (value, label) in enumerate(stats):
                ExamStat.objects.create(exam=exam, value=value, label=label, sort_order=i)

            # Plans
            plans_data = PLANS.get(exam.slug, [])
            for plan_data in plans_data:
                features = plan_data.pop('features', [])
                plan, _ = PricingPlan.objects.update_or_create(
                    razorpay_sku=plan_data['razorpay_sku'],
                    defaults={'exam': exam, **plan_data},
                )
                PlanFeature.objects.filter(plan=plan).delete()
                for j, (text, is_included) in enumerate(features):
                    PlanFeature.objects.create(
                        plan=plan, text=text,
                        is_included=is_included, sort_order=j
                    )

        self.stdout.write(self.style.SUCCESS(
            f'\n✓ Seeded {len(EXAMS)} exams, {Instructor.objects.count()} instructors, '
            f'{PricingPlan.objects.count()} pricing plans.'
        ))