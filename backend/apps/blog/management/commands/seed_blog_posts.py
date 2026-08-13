"""
GRADSKOOL — Seed real blog posts

Replaces the old, broken import_blog_posts command (it referenced
word_count/reading_mins fields that don't exist on the current BlogPost
model — only read_time_mins does — and never set the required excerpt
field, so it would have crashed with a FieldError if ever run). This
has the real, original article content baked in directly, extracted
from the actual site HTML — nothing invented.

Safe to run repeatedly — uses update_or_create by slug.

Usage:
    python manage.py seed_blog_posts
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone


POSTS = [
    {
        'slug': 'blog-cat-2026-syllabus',
        'title': 'CAT 2026 Syllabus — Complete Topic Breakdown',
        'excerpt': 'Complete CAT 2026 syllabus across VARC, DILR and QA. Section-wise topic breakdown, question count, marking scheme and what changed from CAT 2025.',
        'meta_desc': 'Complete CAT 2026 syllabus across VARC, DILR and QA. Section-wise topic breakdown, question count, marking scheme and what changed from CAT 2025.',
        'read_time_mins': 3,
        'tags': ['CAT', 'Strategy'],
        'body': """# CAT 2026 Syllabus — Complete Topic-wise Breakdown

CAT 2026 is expected on 29 November 2026. IIM Indore is conducting it. The exam has 68 questions across three sections, 120 minutes total, and 40 minutes per section. The syllabus has not changed materially from CAT 2025.


## Exam pattern at a glance

Section | Questions | Time | Weightage
Verbal Ability and Reading Comprehension | 24 | 40 min | 35%
Data Interpretation and Logical Reasoning | 22 | 40 min | 32%
Quantitative Aptitude | 22 | 40 min | 32%
Total | 68 | 120 min | 100%

Marking scheme is +3 for correct MCQ answers and -1 for wrong MCQ answers. TITA questions get +3 for correct and no penalty for wrong answers. Maximum marks are 198.


## VARC — Verbal Ability and Reading Comprehension

VARC has 24 questions. Roughly 16 questions come from Reading Comprehension across 4 passages of 4 questions each. The remaining 8 questions come from Verbal Ability.

Reading Comprehension passages in recent CATs have been drawn from philosophy, economics, science, psychology, history, literature and cultural studies. Passages range from 550 to 700 words. Question types include main idea, inference, author's tone, title selection, para-completion, and strengthening or weakening arguments.

Verbal Ability topics in CAT 2026 include para-jumbles (arranging 4 to 6 sentences in logical order), para-summary (identifying the best summary of a paragraph), and odd sentence identification (identifying the sentence that does not belong in a sequence). Most VA questions are TITA format with no negative marking.


## DILR — Data Interpretation and Logical Reasoning

DILR has 22 questions across 5 to 6 sets. Each set typically has 4 questions. The section tests your ability to read complex data and draw logical conclusions under time pressure.

Data Interpretation set types include tables, bar charts, line graphs, pie charts, caselets (text-based data), and network diagrams. The data is always internally consistent but often complex in structure.

Logical Reasoning set types include arrangements (linear, circular, floor-based), scheduling problems, binary logic (true/false teller puzzles), team selection, and constraint-based puzzles. Recent CATs have also included game-based sets where the logic is embedded in a game format.

DILR has seen increasing TITA questions in recent years. Roughly 4 to 6 questions per section are expected to be TITA in CAT 2026.


## QA — Quantitative Aptitude

QA has 22 questions covering the following topic areas.

Topic | Expected questions
Arithmetic (ratio, percentage, profit, time-speed-distance, time-work, averages, mixtures) | 7 to 9
Algebra (linear equations, quadratic equations, functions, inequalities, progressions) | 5 to 7
Geometry and Mensuration (triangles, circles, polygons, 3D geometry, coordinate geometry) | 4 to 5
Number System (divisibility, HCF LCM, remainders, factorials, surds) | 2 to 3
Modern Maths (permutation-combination, probability, set theory, logarithms) | 2 to 3

Arithmetic and Algebra together account for roughly 60% of the QA section. Geometry is consistently present. Number System and Modern Maths are high difficulty but lower weightage.


## What changed in CAT 2025 and what to expect in 2026

CAT 2025 saw a slight increase in DILR section difficulty compared to 2024. The VARC section had longer, denser passages. QA maintained its traditional distribution with slightly more geometry questions than the previous year.

For CAT 2026, no structural changes are expected. The 68-question format with three sections and 40 minutes per section has been stable for several years. IIM Indore, which is conducting CAT 2026, has historically set papers of moderate to high difficulty.


## Preparation priorities by section

For VARC, daily reading of long-form essays is the most important habit. RC accounts for two-thirds of the section and cannot be improved through question practice alone.

For DILR, set selection and setup skills matter more than raw reasoning speed. Practice building complete constraint tables before attempting questions.

For QA, Arithmetic and Algebra first. These two topics alone account for 60% of the section and have the best return on preparation time. Geometry second. Number System and Modern Maths can be studied selectively based on your existing comfort.

CATalysis covers every topic in the syllabus through 400 hours of live two-way sessions. 27 students per cohort.""",
    },
    {
        'slug': 'blog-cat-dilr-strategy',
        'title': 'CAT DILR Strategy — How to Attempt Sets',
        'excerpt': 'The biggest mistake in CAT DILR is attempting too many sets. The second is choosing the wrong ones. Here is the 90-second set selection method.',
        'meta_desc': 'The biggest mistake in CAT DILR is attempting too many sets. The second is choosing the wrong ones. Here is the 90-second set selection method.',
        'read_time_mins': 3,
        'tags': ['CAT', 'Strategy'],
        'body': """# CAT DILR Strategy — How to Attempt Sets

In CAT 2025, many strong students scored below their ability in DILR. Not because they could not solve the sets. Because they chose the wrong sets to attempt and ran out of time before finishing the ones they should have started with.

DILR is a time management problem dressed as a reasoning problem.


## The structure of CAT DILR

The DILR section has 22 questions across roughly 5 to 6 sets. Each set has 4 questions. You have 40 minutes. The sets are not arranged in order of difficulty. A brutally hard set can appear first. An easy one can appear fourth. You have no way of knowing until you have read the set.

This is the core problem. You cannot attempt all sets in 40 minutes and solve them well. You need to choose which 3 or 4 sets to invest in and which to leave. Most students choose wrong. Not because they are bad at reasoning but because they do not have a set selection framework.


## How to select sets in 90 seconds

Spend the first 8 minutes of the section doing nothing but reading the opening lines of each set. Do not attempt any questions. Just read enough to understand what type of set it is and get a sense of the data volume.

As you read each set, rank it quickly. Mark it as green, yellow or red in your mind. Green means you recognise the structure and the data is manageable. Yellow means it looks doable but complex. Red means it is unfamiliar or the data volume is intimidating.

Attempt all green sets first. Then attempt yellow sets if time permits. Leave red sets entirely.


## What makes a set green, yellow or red

Green sets have clean, structured data. Tables with clear relationships, arrangements with a limited number of entities, binary logic puzzles where the constraints are explicit. Green sets also tend to have questions that follow directly from the data without requiring multiple inferential leaps.

Yellow sets have more data, more entities, or more ambiguous constraints. They are solvable but slower. You can recognise a yellow set when you need to re-read the setup more than once before you understand the structure.

Red sets are ones you have never seen a format like before, or sets with enormous data tables where you cannot see how to extract clean answers. These appear in every CAT paper. They are designed to trap students into investing time with no return. The correct response is to not attempt them.


## The most common DILR mistakes

The first mistake is sunk cost. A student spends 12 minutes on a set, gets stuck, and keeps pushing because they feel they cannot "waste" the time already spent. This is wrong. Twelve minutes wasted is not made worse by spending four more. Cut the loss and move.

The second mistake is attempting sets in the order they appear on screen. The order on screen is random from a difficulty standpoint. Scroll through all sets briefly before starting any.

The third mistake is incomplete setup. Students who do not build the full constraint table before attempting questions will often get the first question right by luck and then get the remaining three wrong because they have not mapped the full logic. Always complete your setup before answering.


## How to practice for DILR

Practice set selection as a separate skill. Take a DILR section and spend only the first 8 minutes selecting sets without attempting any questions. Then check how well your selection matches the actual difficulty. Do this ten times. Your ability to read set difficulty will become much sharper.

Practice completing setups before answering. This feels slower initially. It becomes faster within two weeks because you stop getting stuck mid-set.

Practice doing fewer sets more accurately. Attempt only 3 sets in a 40 minute session and aim for 11 out of 12 correct. This is more valuable than attempting 5 sets and getting 12 out of 20 correct.

Live two-way DILR sessions. 27 students per cohort. ALP Sir teaches every session personally.""",
    },
    {
        'slug': 'blog-cat-mock-strategy',
        'title': 'CAT Mock Strategy — Stop Wasting Your Mocks',
        'excerpt': 'Most students treat CAT mocks as practice tests. They are not. They are diagnostic tools. The 3 hours after the mock matter more than the mock itself.',
        'meta_desc': 'Most students treat CAT mocks as practice tests. They are not. They are diagnostic tools. The 3 hours after the mock matter more than the mock itself.',
        'read_time_mins': 3,
        'tags': ['CAT', 'Strategy'],
        'body': """# CAT Mock Strategy — Stop Wasting Your Mocks

There is a student who takes 40 mocks before CAT and scores 85 percentile on the actual exam. There is another student who takes 18 mocks and scores 99 percentile. The difference is not the number of mocks. The difference is what they did after each one.

A mock that is not analysed is not a mock. It is three hours of practice that produced no learning.


## What a mock is actually for

A mock tests three things simultaneously. It tests your knowledge. It tests your decision making under time pressure. And it tests your pattern of errors. The score tells you nothing you cannot already guess. The error analysis tells you everything.

After every mock, you should be able to answer these questions precisely. Which questions did you get wrong that you should have gotten right? Which questions did you attempt that you should have left? How much time did you spend per set in DILR and was that allocation correct? In VARC, which question type had the worst accuracy?

If you cannot answer these questions after a mock, you did not analyse it. You glanced at it.


## The three categories of wrong answers

Every wrong answer in a mock falls into one of three categories. Conceptual errors mean you did not know the underlying concept. These get fixed through study. Careless errors mean you knew the concept but made a calculation or reading mistake. These get fixed through slowing down slightly and checking work. Application errors mean you knew the concept and read carefully but applied the wrong approach. These get fixed through targeted practice of that specific question type.

Most students treat all wrong answers the same. They look at the solution, understand it, and move on. This is why they keep making the same mistakes across 30 mocks. The error category matters because the fix is different for each one.


## How to analyse a mock properly

Spend at least 3 hours on mock analysis for every CAT mock you take. This is not optional. For every question you got wrong, identify the category. For every question you left blank, decide whether you should have attempted it. For every section, calculate your time per question and identify where you spent time that produced no correct answer.

Keep a running error log. Every conceptual error gets noted with the topic and the specific mistake. Every careless error gets noted with the type of mistake. Review this log before every subsequent mock. Your preparation between mocks should be driven by this log, not by a generic schedule.


## How many mocks to take and when

Start full-length mocks only after you have completed at least 70% of the syllabus. Taking mocks before you have covered the content is counterproductive. You will get poor scores for knowledge reasons, which tells you nothing useful about your strategy or decision-making.

From August onwards, take one mock per week. In September and October, take two per week. In the final two weeks before CAT, take one every three days. Space them out enough that you have time to analyse each one properly before taking the next.

Do not take mocks on consecutive days at any point in your preparation. Analysis requires time and requires sleep.


## What to do on the day before CAT

Take no mock on the day before CAT. Review your error log from the last three mocks. Revise your key formulas and shortcuts for QA. Sleep at least 8 hours. The students who perform below their ability on CAT day are usually the ones who attempted a mock on the day before and were mentally drained.

CATalysis includes structured post-mock analysis sessions after every mock. Not just a score report. A strategy session.""",
    },
    {
        'slug': 'blog-cat-percentile-vs-score',
        'title': 'CAT Percentile vs Score — How Normalisation Works',
        'excerpt': 'Your CAT raw score is not your percentile. Understanding how normalisation works across slots changes how you should think about your target score.',
        'meta_desc': 'Your CAT raw score is not your percentile. Understanding how normalisation works across slots changes how you should think about your target score.',
        'read_time_mins': 2,
        'tags': ['CAT'],
        'body': """# CAT Percentile vs Score — How Normalisation Actually Works

CAT 2026 will be conducted in three slots on 29 November 2026. The morning slot, the afternoon slot, and the evening slot will have different papers. These papers will have different difficulty levels. A student in the morning slot who scores 120 out of 198 is not automatically at the same percentile as a student in the evening slot who also scores 120.

This is why normalisation exists. Understanding how it works changes how you set your preparation targets.


## What normalisation is

Normalisation adjusts your raw score to account for the difficulty of the slot you appeared in. If the morning slot was harder than the evening slot, morning slot students get an upward adjustment. If the evening slot was easier, evening slot students get a downward adjustment.

The IIMs use a statistical process called equipercentile normalisation. The process maps the score distributions of all three slots onto a common scale. A student at the 90th percentile in the morning slot will end up at roughly the 90th percentile in the final normalised score, regardless of their raw marks.


## What this means for your preparation

It means your target should be a percentile, not a raw score. Targeting "150 marks" is less useful than targeting "99 percentile" because the raw marks required for any given percentile vary by slot difficulty.

It also means you should not panic if your raw score seems low after the exam. Students who appeared in difficult slots routinely end up with higher percentiles than their raw scores suggest.


## How percentile is calculated

Your percentile is calculated as follows. If you scored more than 95 out of every 100 students who took the exam, your percentile is 95. The formula is straightforward. Percentile equals 100 multiplied by the number of students who scored less than you, divided by the total number of students.

CAT 2025 had approximately 3.3 lakh candidates appear. A 99 percentile means roughly 3,300 students scored more than you. A 99.9 percentile means roughly 330 students scored more than you.


## Section-wise percentile vs overall percentile

IIMs use section-wise percentile cutoffs as well as overall percentile cutoffs for shortlisting. Being 99 overall but 85 in VARC will result in rejection at most IIMs despite the high overall score. Section-wise percentile cutoffs at the older IIMs typically range from 70 to 85 per section depending on the institute.

This means a student who is very strong in QA and weak in VARC needs to invest heavily in VARC, not because they need a high VARC percentile but because they need to cross the section-wise cutoff. A 75 VARC percentile with a 99.5 overall is worth more to an IIM shortlisting committee than a 99 VARC with a 97 overall.


## Scaled scores vs raw scores

After normalisation, the IIMs work with scaled scores rather than raw scores. The scaled score is the number you will see on your CAT scorecard. It will not match your raw marks from the exam. This is normal and expected. The scaled score is the meaningful number for admissions purposes.

CATalysis covers mock analysis, section-wise strategy, and percentile targeting as part of the structured preparation.""",
    },
    {
        'slug': 'blog-cat-varc-rc-strategy',
        'title': 'CAT VARC — RC Strategy That Works',
        'excerpt': 'Most CAT aspirants lose their percentile in VARC. Not because RC is hard but because they have never been taught to read strategically.',
        'meta_desc': 'Most CAT aspirants lose their percentile in VARC. Not because RC is hard but because they have never been taught to read strategically.',
        'read_time_mins': 3,
        'tags': ['CAT', 'Strategy'],
        'body': """# CAT VARC — RC Strategy That Actually Works

Most students who struggle in VARC are not bad readers. They are untrained readers. There is a difference. A bad reader lacks comprehension ability. An untrained reader has comprehension ability but applies it wrong to RC passages.

CAT RC is not testing whether you understood the passage. It is testing whether you understood the passage the way the question setter did. That distinction matters.


## Why RC feels difficult

The average CAT aspirant reads an RC passage the way they read a newspaper article. They read for information. They want to know what the passage is saying. When they finish, they feel like they understood it. Then they look at the questions and get confused.

That confusion happens because the questions are not asking what the passage said. They are asking why the author said it, what the author's attitude is, what would weaken the argument, what the tone implies. These are structural questions. Not informational ones.


## The right way to read a CAT passage

When you begin a passage, your first job is to identify what type of passage it is. CAT passages fall into recognisable categories. Argumentative passages present a thesis and defend it. Descriptive passages present a subject and explain it. Analytical passages present a problem and examine it from multiple angles.

The moment you identify the type, you know what to look for. In an argumentative passage, you are tracking the thesis, the evidence supporting it, and the counterarguments. In an analytical passage, you are tracking the different perspectives and whether the author endorses any of them.

Your first read of any passage should take no more than three minutes. You are not reading for detail. You are reading for structure. Mark mentally where the thesis is, where the turn is, where the conclusion is. That is enough.


## The four question types you will always face

Main idea questions ask what the passage is primarily about. The answer is almost always a paraphrase of the thesis, not a detail from any paragraph. Students who read for information almost always pick an answer that is too narrow because they remember a specific part of the passage vividly.

Inference questions ask what can be concluded from the passage. The correct answer is always supported directly by what the author wrote. It never goes beyond the text. Students fail these questions by picking answers that are reasonable but not actually supported. Reasonable is not the same as supported.

Author's tone questions ask how the author feels about the subject. The correct answer is usually measured. CAT rarely has passages where the author is furious or ecstatic. Words like "cautiously optimistic", "critical", "sceptical", "sympathetic" tend to be correct. Words like "outraged" or "enthusiastic" almost never are.

Weakening and strengthening questions ask what new information would affect the argument. To answer these, you need to identify the assumption in the argument. The correct weakener attacks that assumption. Students who have not identified the assumption correctly will pick answers that seem related to the topic but do not actually touch the logic.


## What to do about Verbal Ability

Para-jumbles require you to identify the opening sentence, the closing sentence, and the logical connectors between the rest. The opening sentence is almost always the one that introduces the topic without reference to anything prior. The closing sentence often contains a conclusion or implication.

Para-summary questions are simpler than they look. The correct answer paraphrases the central idea of the paragraph. Not the most interesting idea. Not the most detailed idea. The central one. Students fail these by picking the most memorable line from the paragraph and paraphrasing that instead.

Odd sentence questions require you to find the sentence that does not fit. Usually the odd sentence shifts topic, shifts timeframe, or introduces a new entity that no other sentence references.


## The practice method that works

Read one long-form article every day. Not news articles. Long essays from places like GRADFLIX, The Atlantic, Aeon, or similar publications. Essays that develop an argument over 1500 words or more. As you read, practice identifying the thesis in the first two minutes.

Do not practice RC by doing RC questions alone. Most students spend 90% of their VARC prep time on questions and 10% on reading. It should be the other way around. The questions will not improve your comprehension. Reading will.

400 hours of live sessions including dedicated VARC preparation. 27 students per cohort. Two-way teaching where you actually have to think.""",
    },
    {
        'slug': 'blog-gmat-focus-edition',
        'title': 'GMAT Focus Edition — What Changed and How to Prepare',
        'excerpt': 'The GMAT Focus Edition is shorter, has no AWA, and adds Data Insights as a new section. Here is exactly what changed and what it means for you.',
        'meta_desc': 'The GMAT Focus Edition is shorter, has no AWA, and adds Data Insights as a new section. Here is exactly what changed and what it means for you.',
        'read_time_mins': 3,
        'tags': ['GMAT'],
        'body': """# GMAT Focus Edition — What Changed and How to Prepare

In 2023, GMAC replaced the classic GMAT with the GMAT Focus Edition. The old exam ran for 3 hours 30 minutes. The new one runs for 2 hours 15 minutes. The AWA essay section is gone entirely. A new section called Data Insights has replaced the Integrated Reasoning section and expanded it significantly.

If you are preparing for the GMAT in 2026, the Focus Edition is the only version available. Here is exactly what it contains and how preparation should be structured.


## GMAT Focus Edition structure

Section | Questions | Time | Score range
Quantitative Reasoning | 21 | 45 min | 60 to 90
Verbal Reasoning | 23 | 45 min | 60 to 90
Data Insights | 20 | 45 min | 60 to 90
Total | 64 | 135 min | 205 to 805

The total GMAT Focus Edition score ranges from 205 to 805. A score of 655 is approximately the 50th percentile. A score of 715 is approximately the 80th percentile. A score of 755 is approximately the 95th percentile.


## What changed in Quantitative Reasoning

The classic GMAT had two QA question types. Problem Solving and Data Sufficiency. The Focus Edition has only Problem Solving. Data Sufficiency has moved to the Data Insights section.

This means QA in the Focus Edition is more straightforward in format but the questions themselves have not gotten easier. The difficulty distribution has shifted upward. Topics remain the same including arithmetic, algebra, geometry, word problems and number properties.


## What changed in Verbal Reasoning

Sentence Correction has been removed entirely from the Focus Edition. The Verbal section now contains only Critical Reasoning and Reading Comprehension. This is a significant change for test takers who were strong in Sentence Correction.

Critical Reasoning tests your ability to analyse arguments. You will see questions asking you to strengthen an argument, weaken it, identify an assumption, identify a conclusion, evaluate a method of reasoning, or find a logical flaw.

Reading Comprehension passages are shorter on average in the Focus Edition compared to the classic GMAT. The question types remain consistent with the classic version.


## What is Data Insights

Data Insights is the genuinely new section in the Focus Edition. It tests your ability to work with complex, multi-format data. It contains five question types. Multi-Source Reasoning presents data across tabs that you must integrate. Table Analysis gives you a sortable table and asks you to draw conclusions. Graphics Interpretation shows a graph or chart and asks multiple questions. Two-Part Analysis presents a complex situation requiring two related answers. Data Sufficiency from the old QA section has also moved here.

Data Insights is widely considered the most challenging section for first-time GMAT takers. It tests skills that are not typically developed through traditional exam preparation. The ability to work with ambiguous, messy data and still draw defensible conclusions is what business schools most want to see.


## Score targets for top programmes

ISB Hyderabad average GMAT score for admitted students is approximately 720. For IIM executive programmes, a 700 or above is generally expected. For global top programmes such as Wharton, Harvard and INSEAD, the median score for admitted students is typically in the 730 to 740 range.

A score of 700 or above is achievable for a well-prepared candidate in approximately 3 to 4 months of dedicated preparation. A score of 750 or above typically requires 5 to 6 months.


## How to prepare for the Focus Edition

Start with the Official GMAT Practice questions from GMAC. These are the closest to actual exam difficulty. Third-party materials vary significantly in quality and difficulty calibration.

For Quantitative Reasoning, the fundamentals of arithmetic and algebra need to be solid before attempting higher difficulty questions. Most GMAT prep errors in QA come from weak fundamentals, not from complex concepts.

For Verbal, focus more on Critical Reasoning than RC. CR questions reward structured thinking about arguments. This is a learnable skill that improves significantly with targeted practice.

For Data Insights, practice integrating information from multiple sources. The skill is not mathematical. It is analytical. Practice reading complex data displays and making precise, defensible statements about what they show.

100+ hours of live GMAT sessions. 9 mocks. 1,280 questions including 640 at the 750-plus difficulty level.""",
    },
    {
        'slug': 'blog-iim-ahmedabad-placements-2025',
        'title': 'IIM Ahmedabad Placements 2025 — Packages & Recruiters',
        'excerpt': 'IIM Ahmedabad placement report 2025. Average package Rs 35.22 LPA, highest Rs 1.10 Cr. Top recruiters BCG, Bain, McKinsey, Goldman Sachs.',
        'meta_desc': 'IIM Ahmedabad placement report 2025. Average package Rs 35.22 LPA, highest Rs 1.10 Cr. Top recruiters BCG, Bain, McKinsey, Goldman Sachs.',
        'read_time_mins': 1,
        'tags': ['CAT', 'IIM', 'Placements'],
        'body': """# IIM Ahmedabad Placements 2025 — Packages and Top Recruiters

IIM Ahmedabad completed its 2025 placement season with strong outcomes. The institute placed its full batch with participation from leading recruiters across consulting, finance and technology.


## Placement highlights 2025

Metric | 2025 Data
Average Package | Rs 35.22 LPA
Highest Package | Rs 1.10 Crore (domestic)
Median Package | Rs 34.53 LPA
Programme Fee | Rs 25 lakh (PGP)
Return on Investment | 1.38x
Batch Size | 406 students (PGP)


## Top recruiters

BCG was the top recruiter with the highest number of offers. Bain and Company, McKinsey and Company, Accenture Strategy and Goldman Sachs were among the other major recruiters. Adani Group, Aditya Birla Group and HSBC also made significant offers. A total of 178 companies participated in the PGP placement drive.


## Sector breakdown

Consulting was the largest sector with 156 offers to PGP students. Finance followed closely. The remaining offers were distributed across FMCG, technology, manufacturing and general management roles.


## What makes IIM Ahmedabad distinctive

IIM Ahmedabad is consistently ranked the top business school in India. Its placement outcomes reflect the quality of its alumni network and the consistent presence of the top global consulting and finance firms on campus. The highest package of Rs 1.10 Crore came from the finance domain. Consulting offers dominated the top tier with BCG, Bain and McKinsey each making multiple offers.


## CAT cutoff for IIM Ahmedabad

For general category candidates, IIM Ahmedabad typically requires an overall CAT percentile in the range mentioned in our IIM cutoffs article . Section-wise cutoffs apply. A balanced performance across VARC, DILR and QA is essential.

CATalysis covers every section, includes PI WAT GD preparation, and provides college counselling. ALP Sir has helped students convert top B-schools including IIM Kozhikode.""",
    },
    {
        'slug': 'blog-iim-bangalore-placements-2025',
        'title': 'IIM Bangalore Placements 2025 — Packages & Recruiters',
        'excerpt': 'IIM Bangalore placement report 2025. Average Rs 34.33 LPA, highest Rs 1.45 Cr. Best ROI among top IIMs. Top recruiters BCG, McKinsey, HUL.',
        'meta_desc': 'IIM Bangalore placement report 2025. Average Rs 34.33 LPA, highest Rs 1.45 Cr. Best ROI among top IIMs. Top recruiters BCG, McKinsey, HUL.',
        'read_time_mins': 1,
        'tags': ['CAT', 'IIM', 'Placements'],
        'body': """# IIM Bangalore Placements 2025 — Packages and Top Recruiters

IIM Bangalore completed its 2025 placement season with strong outcomes. The institute placed its full batch with participation from leading recruiters across consulting, finance and technology.


## Placement highlights 2025

Metric | 2025 Data
Average Package | Rs 34.33 LPA
Highest Package | Rs 1.45 Crore
Median Package | Rs 32.50 LPA
Programme Fee | Rs 24 lakh (PGP)
Return on Investment | 1.43x (best among old IIMs)
Batch Size | Approximately 420 students


## Top recruiters

BCG, McKinsey and Company, Bain and Company, HUL, Goldman Sachs, Kearney and EY were among the top recruiters. Technology companies including Amazon and Microsoft recruited for product and strategy roles. FMCG majors including Nestle and ITC also participated.


## Sector breakdown

Consulting and strategy roles attracted the largest number of students. FMCG was the second largest sector with HUL, ITC and Nestle making significant offers. Finance, technology and e-commerce made up the remaining placements.


## What makes IIM Bangalore distinctive

IIM Bangalore offered the best return on investment among the old IIMs in 2025, with a programme fee of Rs 24 lakh against an average package of Rs 34.33 LPA. The highest package of Rs 1.45 Crore was the highest among all IIMs in 2025. IIM B is also known for its strong technology and product management placements given its location in Bengaluru.


## CAT cutoff for IIM Bangalore

For general category candidates, IIM Bangalore typically requires an overall CAT percentile in the range mentioned in our IIM cutoffs article . Section-wise cutoffs apply. A balanced performance across VARC, DILR and QA is essential.

CATalysis covers every section, includes PI WAT GD preparation, and provides college counselling. ALP Sir has helped students convert top B-schools including IIM Kozhikode.""",
    },
    {
        'slug': 'blog-iim-calcutta-placements-2025',
        'title': 'IIM Calcutta Placements 2025 — Packages & Recruiters',
        'excerpt': 'IIM Calcutta placement report 2025. Average Rs 34.23 LPA, highest Rs 1.45 Cr. Top recruiters BCG, ITC, P&G, Amazon and Flipkart.',
        'meta_desc': 'IIM Calcutta placement report 2025. Average Rs 34.23 LPA, highest Rs 1.45 Cr. Top recruiters BCG, ITC, P&G, Amazon and Flipkart.',
        'read_time_mins': 1,
        'tags': ['CAT', 'IIM', 'Placements'],
        'body': """# IIM Calcutta Placements 2025 — Packages and Top Recruiters

IIM Calcutta completed its 2025 placement season with strong outcomes. The institute placed its full batch with participation from leading recruiters across consulting, finance and technology.


## Placement highlights 2025

Metric | 2025 Data
Average Package | Rs 34.23 LPA
Highest Package | Rs 1.45 Crore
Median Package | Rs 33.67 LPA
Programme Fee | Rs 25 lakh (PGP)
Return on Investment | 1.36x
Batch Size | Approximately 490 students


## Top recruiters

BCG, ITC, P&G, Amazon and Flipkart were among the most prominent recruiters. Consulting dominated the highest offers. Finance roles from Goldman Sachs, Avendus and other investment banks were significant. Microsoft, Zomato and other technology firms also recruited.


## Sector breakdown

Consulting was the largest sector with 232 offers. Finance was second. The remaining placements were spread across FMCG, technology, e-commerce and analytics. IIM Calcutta is widely regarded as the strongest IIM for finance roles in particular.


## What makes IIM Calcutta distinctive

IIM Calcutta is often considered the premier IIM for finance careers. Its location in Kolkata, proximity to the finance sector, and strong alumni network in banking and investment management make it distinctly competitive for finance roles. The median package of Rs 33.67 LPA is among the highest of any IIM, reflecting a tight distribution with fewer low outliers.


## CAT cutoff for IIM Calcutta

For general category candidates, IIM Calcutta typically requires an overall CAT percentile in the range mentioned in our IIM cutoffs article . Section-wise cutoffs apply. A balanced performance across VARC, DILR and QA is essential.

CATalysis covers every section, includes PI WAT GD preparation, and provides college counselling. ALP Sir has helped students convert top B-schools including IIM Kozhikode.""",
    },
    {
        'slug': 'blog-iim-cutoffs-2025',
        'title': 'IIM Cutoffs 2025 — CAT Percentile for Every IIM',
        'excerpt': 'Section-wise and overall CAT percentile cutoffs for all major IIMs for 2025 admissions. Know exactly what you need before targeting a college.',
        'meta_desc': 'Section-wise and overall CAT percentile cutoffs for all major IIMs for 2025 admissions. Know exactly what you need before targeting a college.',
        'read_time_mins': 3,
        'tags': ['CAT', 'IIM'],
        'body': """# IIM Cutoffs 2025 — CAT Percentile Required for Every IIM

CAT cutoffs for IIM admissions operate at two levels. There is the written score cutoff that determines whether you get a call for the interview stage. And there is the final composite score cutoff that determines whether you convert the call into an admission offer. This article covers the written score cutoffs — what CAT percentile you need to receive an interview call from each IIM.

All cutoffs below are approximate figures for general category male candidates with no work experience. SC, ST, PWD, female and NC-OBC candidates typically have lower cutoffs. Candidates with strong work experience profiles may have slightly different treatment at the shortlisting stage.


## IIM A, B, C — The old IIMs

Institute | Overall | VARC | DILR | QA
IIM Ahmedabad | 99+ | 85 | 85 | 85
IIM Bangalore | 99+ | 85 | 85 | 85
IIM Calcutta | 99+ | 85 | 85 | 85

IIM A shortlists using a composite score that combines CAT percentile, Class 10 marks, Class 12 marks, graduation marks, work experience and gender diversity factor. The written shortlist is typically 7 to 8 times the batch size. IIM B uses a similar process but weights CAT score slightly higher relative to academic scores.


## IIM L, I, K — The second generation

Institute | Overall | VARC | DILR | QA
IIM Lucknow | 97 to 98 | 80 | 80 | 80
IIM Indore | 97 to 98 | 80 | 80 | 80
IIM Kozhikode | 90 to 95 | 70 | 70 | 70

IIM Kozhikode's cutoff is meaningfully lower than L and I, which makes it accessible to a wider range of candidates. GRADSKOOL's Sreeja Biswas converted IIM Kozhikode with preparation under ALP Sir.


## New IIMs

Institute | Overall | Section cutoffs
IIM Amritsar | 90 to 92 | 65 to 70 each
IIM Trichy | 90 to 92 | 65 to 70 each
IIM Ranchi | 90 to 92 | 65 to 70 each
IIM Udaipur | 88 to 90 | 60 to 65 each
IIM Rohtak | 85 to 88 | 60 to 65 each
IIM Raipur | 85 to 88 | 60 to 65 each
IIM Kashipur | 85 to 88 | 60 to 65 each
IIM Nagpur | 85 to 88 | 60 to 65 each
IIM Visakhapatnam | 85 to 88 | 60 to 65 each
IIM Bodhgaya | 80 to 85 | 55 to 60 each
IIM Sirmaur | 80 to 85 | 55 to 60 each
IIM Sambalpur | 80 to 85 | 55 to 60 each
IIM Jammu | 80 to 85 | 55 to 60 each


## Other top non-IIM colleges

Institute | Overall percentile
FMS Delhi | 98 to 99
SPJIMR Mumbai | 95 to 98
MDI Gurgaon | 95 to 97
IIFT Delhi | 95 to 97
IIT Bombay SJMSoM | 95 to 97
XLRI Jamshedpur (via XAT) | Separate exam
NMIMS Mumbai | Separate NMAT exam


## What to do with this information

Pick two target colleges. One stretch target and one realistic target. Build your preparation around reaching the section-wise cutoff for your stretch target. If you clear the section-wise cutoffs for the harder target, you will automatically clear them for the easier one.

Do not target just one college. The admissions process has too many variables beyond CAT percentile. PI performance, work experience weighting, academic profile and the composition of other applicants all affect your final outcome.

CATalysis 2026 is designed to get you past section-wise cutoffs across all three sections. 27 students. ALP Sir teaches every session.""",
    },
    {
        'slug': 'blog-iim-indore-placements-2025',
        'title': 'IIM Indore Placements 2025 — Packages & Recruiters',
        'excerpt': 'IIM Indore placement report 2025. Average Rs 29.57 LPA, 100% placements, 225 companies including 50 new recruiters. Consulting and finance led.',
        'meta_desc': 'IIM Indore placement report 2025. Average Rs 29.57 LPA, 100% placements, 225 companies including 50 new recruiters. Consulting and finance led.',
        'read_time_mins': 1,
        'tags': ['CAT', 'IIM', 'Placements'],
        'body': """# IIM Indore Placements 2025 — Packages and Top Recruiters

IIM Indore completed its 2025 placement season with strong outcomes. The institute placed its full batch with participation from leading recruiters across consulting, finance and technology.


## Placement highlights 2025

Metric | 2025 Data
Average Package | Rs 29.57 LPA
Highest Package | Rs 70 LPA
Median Package | Rs 27 LPA
Programme Fee | Rs 22 lakh (PGP)
Return on Investment | 1.34x
Batch Size | Approximately 550 students (PGP and IPM)


## Top recruiters

Deloitte, EY, Infosys Consulting and KPMG were among the prominent consulting and advisory recruiters. FMCG companies, technology firms and e-commerce platforms also participated. Over 225 companies recruited in 2025 including 50 new companies joining campus for the first time.


## Sector breakdown

Consulting and Finance together accounted for approximately 49% of the batch. IT and analytics was the next largest sector at approximately 25%. The remaining placements were in FMCG, sales and marketing, general management and operations.


## What makes IIM Indore distinctive

IIM Indore achieved 100% placements for its PGP and IPM batch in 2025. The addition of 50 new recruiting companies reflects the growing corporate recognition of IIM Indore as a talent source. The IPM programme, a 5-year integrated programme taken after Class 12, produces graduates who are identically placed to PGP students and follow the same placement process.


## CAT cutoff for IIM Indore

For general category candidates, IIM Indore typically requires an overall CAT percentile in the range mentioned in our IIM cutoffs article . Section-wise cutoffs apply. A balanced performance across VARC, DILR and QA is essential.

CATalysis covers every section, includes PI WAT GD preparation, and provides college counselling. ALP Sir has helped students convert top B-schools including IIM Kozhikode.""",
    },
    {
        'slug': 'blog-iim-lucknow-placements-2025',
        'title': 'IIM Lucknow Placements 2025 — Packages & Recruiters',
        'excerpt': 'IIM Lucknow placement report 2025. Average package Rs 32.30 LPA, highest Rs 75 LPA. Over 180 recruiters. Consulting, finance, product roles.',
        'meta_desc': 'IIM Lucknow placement report 2025. Average package Rs 32.30 LPA, highest Rs 75 LPA. Over 180 recruiters. Consulting, finance, product roles.',
        'read_time_mins': 1,
        'tags': ['CAT', 'IIM', 'Placements'],
        'body': """# IIM Lucknow Placements 2025 — Packages and Top Recruiters

IIM Lucknow completed its 2025 placement season with strong outcomes. The institute placed its full batch with participation from leading recruiters across consulting, finance and technology.


## Placement highlights 2025

Metric | 2025 Data
Average Package | Rs 32.30 LPA
Highest Package | Rs 75 LPA (domestic)
Median Package | Approximately Rs 28 to 30 LPA
Programme Fee | Rs 23.5 lakh (PGP)
Return on Investment | 1.37x
Batch Size | Approximately 470 students


## Top recruiters

Over 180 companies participated in IIM Lucknow placements 2025. Key recruiters included firms across consulting, banking, FMCG, technology and e-commerce. McKinsey, BCG and other consulting majors made offers. Finance firms including ICICI, Axis and HSBC recruited for multiple roles.


## Sector breakdown

Consulting received the highest number of offers from the top firms. Finance was the second major sector. Product management and general management roles from technology companies made up a significant portion of the remaining placements.


## What makes IIM Lucknow distinctive

IIM Lucknow had one of the highest domestic package offers across all IIMs in 2025 at Rs 75 LPA. The average of Rs 32.30 LPA reflects a strong overall batch performance. IIM Lucknow is known for its strong alumni network in the Delhi-NCR region and its Noida campus makes it accessible to multinational firms in that corridor.


## CAT cutoff for IIM Lucknow

For general category candidates, IIM Lucknow typically requires an overall CAT percentile in the range mentioned in our IIM cutoffs article . Section-wise cutoffs apply. A balanced performance across VARC, DILR and QA is essential.

CATalysis covers every section, includes PI WAT GD preparation, and provides college counselling. ALP Sir has helped students convert top B-schools including IIM Kozhikode.""",
    },
    {
        'slug': 'blog-iim-placements-2025-overview',
        'title': 'IIM Placements 2025 — All IIMs Compared',
        'excerpt': 'A complete comparison of IIM placement data for 2025. Average packages, top recruiters and what the numbers mean for your college choice.',
        'meta_desc': 'A complete comparison of IIM placement data for 2025. Average packages, top recruiters and what the numbers mean for your college choice.',
        'read_time_mins': 3,
        'tags': ['CAT', 'IIM', 'Placements'],
        'body': """# IIM Placements 2025 — All IIMs Compared

IIM placement season 2025 saw strong outcomes across the board. The older IIMs maintained their position as the top destinations for consulting and finance recruiters. The newer IIMs showed continued improvement in average packages. Here is a complete comparison across all major IIMs.


## Old IIM placements 2025 — the top tier

Institute | Average Package | Highest Package | Top Recruiters
IIM Ahmedabad | Rs 35.22 LPA | Rs 1.10 Cr | BCG, Bain, McKinsey, Goldman Sachs
IIM Bangalore | Rs 34.33 LPA | Rs 1.45 Cr | BCG, McKinsey, HUL, Goldman Sachs
IIM Calcutta | Rs 34.23 LPA | Rs 1.45 Cr | BCG, ITC, P&G, Amazon, Flipkart
IIM Lucknow | Rs 32.30 LPA | Rs 75 LPA | Consulting, Finance, Product Management
IIM Indore | Rs 29.57 LPA | Rs 70 LPA | Deloitte, EY, Infosys Consulting
IIM Kozhikode | Rs 28.05 LPA | Not disclosed | Consulting, BFSI, FMCG

IIM Bangalore had the best return on investment among the top three, with a fee of Rs 24 lakh against an average package of Rs 34.33 LPA. IIM Ahmedabad and Calcutta had slightly higher fees at Rs 25 lakh each with comparable average packages.


## New IIM placements 2025

Institute | Average Package | Highest Package
IIM Trichy | Rs 20.50 LPA | Rs 46.50 LPA
IIM Amritsar | Rs 19.73 LPA | Not disclosed
IIM Ranchi | Rs 19 to 20 LPA | Not disclosed
IIM Raipur | Rs 18 to 19 LPA | Rs 25 to 31 LPA
IIM Udaipur | Rs 18 to 20 LPA | Not disclosed
IIM Kashipur | Rs 18 to 19 LPA | Not disclosed


## What the numbers actually mean

Average package numbers in India are widely misunderstood. The average is sensitive to outliers. A small number of very high consulting or finance offers pull the average up significantly. The median package is a more honest representation of what most students earn.

At IIM A, the median package is approximately Rs 34.53 LPA, very close to the average, suggesting a relatively tight distribution. At newer IIMs where a small number of very high offers inflate the average, the median will be notably lower.

The more useful number when evaluating colleges is the 25th percentile package — what the bottom quarter of the class earns. This tells you the floor of outcomes, not just the ceiling.


## Sector breakdown

Consulting is consistently the highest paying and highest volume sector across all old IIMs. BCG, Bain, McKinsey and Kearney recruit heavily from IIM A, B and C. Strategy consulting from these firms typically pays Rs 30 to 45 LPA at the starting level.

Finance roles including investment banking, private equity and asset management are the second largest sector. Goldman Sachs, Avendus, Kotak and ICICI Bank are among the regular recruiters.

FMCG and consumer goods is the third major sector. HUL, P&G, Nestle and ITC have historically been among the top recruiters by number of offers.

Technology companies including Amazon, Microsoft and Flipkart recruit primarily for product management and business roles at IIMs.


## Which IIM should you target

This is an individual calculation that depends on your CAT percentile, academic profile, work experience and the specific roles you want after your MBA. A 97 percentile student targeting a consulting career should aim for IIM Lucknow or Indore while using IIM Kozhikode as a backup. A 99 percentile student has IIM A, B and C as realistic targets.

Do not choose a college based only on average package. Choose based on the specific sectors and companies that recruit there and whether those align with what you want to do after the MBA.

CATalysis 2026 includes college counselling. ALP Sir has helped students convert IIM Kozhikode, IIM Amritsar and multiple top B-schools.""",
    },
]


class Command(BaseCommand):
    help = 'Seed real blog posts extracted from the original site HTML'

    def handle(self, *args, **options):
        from apps.blog.models import BlogPost, BlogTag

        # Ensure tags exist
        all_tag_names = set()
        for p in POSTS:
            all_tag_names.update(p['tags'])
        tags = {}
        for name in all_tag_names:
            tag, _ = BlogTag.objects.get_or_create(slug=slugify(name), defaults={"name": name})
            tags[name] = tag

        created, updated = 0, 0
        for p in POSTS:
            post, was_created = BlogPost.objects.update_or_create(
                slug=p['slug'],
                defaults={
                    'title': p['title'],
                    'excerpt': p['excerpt'],
                    'meta_desc': p['meta_desc'],
                    'body': p['body'],
                    'read_time_mins': p['read_time_mins'],
                    'status': 'published',
                    'published_at': timezone.now(),
                },
            )
            tag_objs = [tags[t] for t in p['tags'] if t in tags]
            if tag_objs:
                post.tags.set(tag_objs)
            if was_created:
                created += 1
                self.stdout.write(f'  ✓ Created: {p["title"][:60]}')
            else:
                updated += 1
                self.stdout.write(f'  ↻ Updated: {p["title"][:60]}')

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {created} created, {updated} updated.'
        ))