/**
 * GRADSKOOL — Exam Course Page
 * Route: /courses/[slug]
 *
 * Rebuilt from static CAT HTML — exact design match.
 * Sections (in order):
 *   Breadcrumb
 *   Hero (headline + meta + enrol card)
 *   Stats bar
 *   What is [Exam]? (overview cards + section cards)
 *   Eligibility
 *   Important Dates (timeline)
 *   Curriculum (accordion modules)
 *   How cohort works (4-step grid)
 *   Plans & Pricing
 *   9-Stage Framework
 *   Top Colleges table (CAT only)
 *   Testimonials
 *   FAQs
 *   More Courses (also grid)
 *   CTA Banner
 */
import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// These exam slugs each have their own dedicated page file
// (pages/courses/<slug>.jsx) which Next.js treats as a separate,
// higher-priority route. This page's getStaticPaths must exclude them,
// or the build fails with "Conflicting paths returned from
// getStaticPaths" the moment the exam exists in the database.
const DEDICATED_PAGE_SLUGS = new Set([
  'cat', 'xat', 'snap', 'nmat', 'nmat-snap', 'cmat', 'mhcet',
  'gmat', 'gre', 'ipmat', 'cuet', 'pi-wat-gd', 'clat',
])

export async function getStaticPaths() {
  try {
    const res  = await fetch(`${API}/courses/exams/`)
    const data = await res.json()
    return {
      paths: (data.exams || [])
        .filter(e => !DEDICATED_PAGE_SLUGS.has(e.slug))
        .map(e => ({ params: { slug: e.slug } })),
      fallback: 'blocking',
    }
  } catch {
    return { paths: [], fallback: 'blocking' }
  }
}

export async function getStaticProps({ params }) {
  try {
    const [examRes, plansRes] = await Promise.all([
      fetch(`${API}/courses/${params.slug}/`),
      fetch(`${API}/courses/${params.slug}/plans/`),
    ])
    const exam  = await examRes.json()
    const plans = await plansRes.json()
    return { props: { exam, plans: plans.plans || [] }, revalidate: 300 }
  } catch {
    return { props: { exam: null, plans: [] }, revalidate: 60 }
  }
}

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────

const C = {
  red:     '#ff5e5f',
  redDark: '#cc3a3b',
  redLight:'#fff0f0',
  black:   '#0f0f0f',
  gray600: '#555',
  gray400: '#999',
  gray50:  '#fafaf9',
  border:  '#e8e8e6',
  white:   '#ffffff',
}

const sectionBase = {
  maxWidth: '1160px', margin: '0 auto', padding: '6rem 2rem',
}

// ── STATIC DATA (CAT) ─────────────────────────────────────────────────────────

const CAT_DATA = {
  overview_cards: [
    { label: 'Conducted By',    value: 'IIMs (rotating)' },
    { label: 'Exam Frequency',  value: 'Once a year' },
    { label: 'Exam Month',      value: 'November' },
    { label: 'Total Duration',  value: '2 Hours' },
    { label: 'Total Questions', value: '68 Questions' },
    { label: 'Total Marks',     value: '204 Marks' },
    { label: 'Marking Scheme',  value: '+3 / \u22121' },
    { label: 'Mode',            value: 'Computer Based' },
  ],
  cat_sections: [
    { num:'Section 01', name:'Verbal Ability & Reading Comprehension', pills:['24 Questions','40 Minutes'], types:['Reading Comprehension','Para-Jumbles','Para-Summary','Odd Sentence Out'] },
    { num:'Section 02', name:'Data Interpretation & Logical Reasoning', pills:['22 Questions','40 Minutes'], types:['Seating Arrangements','Grids & Networks','Games & Tournaments','Data Interpretation'] },
    { num:'Section 03', name:'Quantitative Ability',                    pills:['22 Questions','40 Minutes'], types:['Arithmetic','Algebra','Geometry','Modern Maths','Number Systems'] },
  ],
  eligibility: [
    'A Bachelor\u2019s degree in any discipline from a UGC/AICTE-recognised university',
    'Minimum 50% aggregate (45% for SC/ST/PwD categories)',
    'Final-year students appearing in their degree exam are also eligible',
    'No age limit. No restriction on number of attempts.',
  ],
  key_dates: [
    { month:'JUL', year:'2026', event:'Official CAT 2026 Notification', detail:'IIM releases the official bulletin with exam date, registration window, eligibility, and syllabus.' },
    { month:'AUG', year:'2026', event:'CAT 2026 Registration Opens', detail:'Application window opens on iimcat.ac.in. Registration fee: INR 2,400 (General/OBC) \xb7 INR 1,200 (SC/ST/PwD).' },
    { month:'SEP', year:'2026', event:'Registration Closes', detail:'Last date to submit application and pay fees. Admit card download follows shortly after.' },
    { month:'OCT', year:'2026', event:'Admit Card Released', detail:'Download from iimcat.ac.in. Carry to exam centre. Slot and city allotted at this stage.' },
    { month:'NOV', year:'2026', event:'CAT 2026 Exam Day', detail:'Conducted in 3 slots. Results expected in January 2027. IIM interviews follow from February.' },
  ],
  curriculum: [
    { num:'Module 01', title:'Verbal Ability & Reading Comprehension', topics:['Reading Comprehension \u2014 strategy & approach','RC 111 \u2014 111 RC passages','Para-jumbles & para-summary','Odd sentence out','Vocabulary & RC Lexicon','Grammar for CAT'] },
    { num:'Module 02', title:'Data Interpretation & Logical Reasoning',  topics:['CAT DILR Practice Tool \u2014 puzzle foundations','Seating arrangements & grids','Games & tournaments','Data interpretation \u2014 all formats','Caselets & mixed sets','Set selection strategy'] },
    { num:'Module 03', title:'Quantitative Ability',                      topics:['Arithmetic \u2014 ratios, percentages, time-work','Number systems & divisibility','Algebra \u2014 equations, functions, inequalities','Geometry & mensuration','Modern maths \u2014 P&C, probability','QA shortcut frameworks'] },
    { num:'Module 04', title:'Mock Tests & Strategic Analysis',           topics:['15+ full-length CAT-pattern mocks','30 sectional tests (VARC, DILR, QA)','140+ area-wise practice tests','Post-test strategic breakdown','Attempt vs accuracy mapping','Mock selection strategy'] },
    { num:'Module 05', title:'GDPI Preparation',                          topics:['Personal interview framework','Common PI questions & answers','WAT \u2014 Written Ability Test','Group discussion strategies','Profile-specific preparation','Mock PI sessions with ALP'] },
  ],
  how_steps: [
    { num:'01', title:'Live Session',       body:'Two-way live class where you articulate reasoning aloud. Every concept is built through structured questioning \u2014 not passive watching.' },
    { num:'02', title:'Daily Practice',     body:'Targeted practice sets assigned after each session. Questions chosen to reinforce specific thinking patterns \u2014 not random drilling.', link:{ href:'https://www.gradscale.in/', text:'Practice on GRADSCALE' } },
    { num:'03', title:'Mock Test',          body:'Full-length CAT-pattern mocks at regular intervals \u2014 designed to simulate exam pressure and surface your actual behavioural patterns.' },
    { num:'04', title:'Post-Test Analysis', body:'Detailed breakdown of every mock \u2014 time distribution, attempt vs accuracy, behavioural blind spots, and a personalised action plan.' },
  ],
  colleges: [
    { group:'IIM BLACKI \u2014 Old IIMs', rows:[
      { star:true,  name:'IIM Ahmedabad',   city:'Ahmedabad, Gujarat',   cutoff:'99.5%+', avg:'INR 30.08 LPA', high:'INR 1.10 Cr', fee:'INR 25.3 L' },
      { star:true,  name:'IIM Bangalore',   city:'Bengaluru, Karnataka', cutoff:'99%+',   avg:'INR 34.88 LPA', high:'INR 1.15 Cr', fee:'INR 26.3 L' },
      { star:true,  name:'IIM Calcutta',    city:'Kolkata, West Bengal', cutoff:'99%+',   avg:'INR 34.23 LPA', high:'INR 1.45 Cr', fee:'INR 27 L' },
      { star:true,  name:'IIM Lucknow',     city:'Lucknow, UP',          cutoff:'97\u201398%', avg:'INR 32.3 LPA',  high:'INR 75 L',    fee:'INR 20.75 L' },
      { star:true,  name:'IIM Kozhikode',   city:'Kozhikode, Kerala',    cutoff:'97\u201398%', avg:'INR 28.05 LPA', high:'INR 72 L',    fee:'INR 23.5 L' },
      { star:true,  name:'IIM Indore',      city:'Indore, MP',           cutoff:'96\u201398%', avg:'INR 29.57 LPA', high:'INR 70 L',    fee:'INR 22.5 L' },
    ]},
    { group:'Other Top Colleges', rows:[
      { star:false, name:'FMS Delhi',       city:'New Delhi',            cutoff:'99%+',   avg:'INR 32\u201334 LPA', high:'INR 60 L', fee:'INR 2 L' },
      { star:false, name:'SPJIMR Mumbai',   city:'Mumbai, Maharashtra',  cutoff:'95\u201397%', avg:'INR 28\u201330 LPA', high:'INR 55 L', fee:'INR 22 L' },
      { star:false, name:'MDI Gurgaon',     city:'Gurugram, Haryana',    cutoff:'94\u201396%', avg:'INR 24\u201326 LPA', high:'INR 48 L', fee:'INR 19.5 L' },
      { star:false, name:'XLRI Jamshedpur', city:'Jamshedpur, Jharkhand',cutoff:'XAT 95%',    avg:'INR 28\u201330 LPA', high:'INR 50 L', fee:'INR 24 L' },
    ]},
  ],
  testimonials: [
    { name:'Keshav Mundra',  detail:'GMAT Cohort',      text:'Learning from ALP sir is something special. He explains every topic from multiple perspectives and always focuses on the best approach. His teaching doesn\u2019t just solve questions \u2014 it builds the right way of thinking.' },
    { name:'Vanshaj Jaiman', detail:'CAT 2026 Cohort',  text:'Totally out of the box. The content and structure \u2014 how things are planned and executed \u2014 is remarkable. The two-way live communication platform is the most valuable thing. I am able to clear even my smallest doubts in the session itself.' },
    { name:'Sameer Ansari',  detail:'XAT 2026 Cohort', text:'From my CAT journey to XAT, you stood with us at every step. The GDPI preparation was fantabulous \u2014 NMIMS competency, personal interview, study material, all perfectly structured. Words cannot define how much you helped, sir.' },
  ],
  faqs: [
    { q:'When does the CAT 2026 cohort start?', a:'The CAT 2026 cohort starts in April 2026 and runs through November 2026. The full programme is 8 months long, covering VARC, DILR, and QA in depth with live sessions, mocks, and GDPI preparation.' },
    { q:'How many students are in a GRADSKOOL cohort?', a:'Every cohort is capped at 27 students. This is not a policy \u2014 it is a philosophy. Genuine mentorship requires knowing every student\u2019s strengths, blind spots, and thinking patterns by name.' },
    { q:'Are sessions recorded?', a:'Yes. All live sessions are recorded and available on the platform within a few hours of the class. However, attending live is strongly recommended \u2014 the two-way interaction cannot be replicated by passive watching.' },
    { q:'What mocks are included?', a:'The live plans include 30 full-length CAT mocks, 30 sectional mocks, and 140+ area-wise tests. The All MBA Mocks plans additionally include XAT, SNAP, NMAT, and CMAT mocks with 500 area-wise tests.' },
    { q:'Is GDPI preparation included?', a:'Yes. GDPI preparation (Personal Interview, Written Ability Test, and Group Discussion) is included in all live cohort plans. This covers IIM and top B-school specific preparation with mock PI sessions.' },
  ],
  also_courses: [
    { slug:'gmat',     tag:'MBA Abroad',   name:'GMAT',            desc:'GMAT Focus Edition \u2014 Quant, Verbal & Data Insights. Target ISB, INSEAD, LBS and top global MBA programmes.' },
    { slug:'gre',      tag:'Masters Abroad',name:'GRE',            desc:'GRE General Test \u2014 Verbal, Quant, AWA + 5,000-word vocabulary programme. Target MIT, Stanford, CMU, NUS.' },
    { slug:'xat',      tag:'MBA India',    name:'XAT',             desc:'Decision Making, Verbal Ability and Quantitative for XLRI Jamshedpur and top B-schools accepting XAT.' },
    { slug:'ipmat',    tag:'UG + MBA',     name:'IPMAT',           desc:'Integrated management programme for IIM Indore, IIM Rohtak and other IPMAT-accepting institutes.' },
    { slug:'clat',     tag:'Law Entrance', name:'CLAT / AILET',    desc:'Legal reasoning, GK, Reading Comprehension and Verbal Ability for National Law University admissions.' },
    { slug:'courses',  tag:'All Exams',    name:'View All Courses',desc:'GRADSKOOL prepares students for 13 exams including SNAP, NMAT, CMAT, MH CET, CUET and PI WAT GD.' },
  ],
  pricing_plans: [
    { featured:true,  badge:'Most Popular', badgeStyle:{}, name:'Live + CAT Mocks',          price:'17,999', note:'Live sessions + 30 CAT mocks + 30 sectional + 140 area-wise', features:[{t:'Live two-way CAT sessions with ALP',ok:true},{t:'Quizzes \u00b7 Micro Videos \u00b7 Cheat Sheets',ok:true},{t:'Doubt support every session',ok:true},{t:'30 Full-Length CAT Mocks',ok:true},{t:'30 Sectional Mocks + 140 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'All MBA Exam Mocks',ok:false},{t:'16 Printed Books',ok:false}] },
    { featured:false, badge:'Best Value',   badgeStyle:{}, name:'Live + All MBA Mocks',       price:'19,999', note:'CAT + XAT + SNAP + NMAT + CMAT \u2014 500 area-wise tests',     features:[{t:'Live two-way CAT sessions with ALP',ok:true},{t:'Quizzes \u00b7 Micro Videos \u00b7 Cheat Sheets',ok:true},{t:'Doubt support every session',ok:true},{t:'30 Full-Length CAT Mocks + XAT + SNAP + NMAT + CMAT',ok:true},{t:'30 Sectional Mocks + 500 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'16 Printed Books',ok:false}] },
    { featured:false, badge:'With Books',   badgeStyle:{background:'#e8f4e8',color:'#2d6a2d'}, name:'Live + CAT Mocks + Books', price:'21,999', note:'Live + 30 CAT mocks + 16 printed books', features:[{t:'Live two-way CAT sessions with ALP',ok:true},{t:'Quizzes \u00b7 Micro Videos \u00b7 Cheat Sheets',ok:true},{t:'30 Full-Length CAT Mocks',ok:true},{t:'30 Sectional Mocks + 140 Area-wise Tests',ok:true},{t:'16 Printed Books \u2014 2,236 pages',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'All MBA Exam Mocks',ok:false}] },
    { featured:false, badge:'Complete',     badgeStyle:{background:'#e8f4e8',color:'#2d6a2d'}, name:'Live + All MBA Mocks + Books', price:'24,999', note:'Everything \u2014 live, all mocks, 500 area-wise, books', features:[{t:'Live two-way CAT sessions with ALP',ok:true},{t:'Quizzes \u00b7 Micro Videos \u00b7 Cheat Sheets',ok:true},{t:'30 CAT Mocks + XAT + SNAP + NMAT + CMAT Mocks',ok:true},{t:'30 Sectional Mocks + 500 Area-wise Tests',ok:true},{t:'16 Printed Books \u2014 2,236 pages',ok:true},{t:'Post-test strategic analysis',ok:true}] },
    { featured:false, badge:'Section Only', badgeStyle:{}, name:'VA RC Only',                 price:'7,999',  note:'VARC live sessions + mocks + 140 area-wise', features:[{t:'VARC live sessions with ALP',ok:true},{t:'Quizzes \u00b7 Micro Videos \u00b7 Cheat Sheets',ok:true},{t:'30 CAT Mocks + 30 Sectional',ok:true},{t:'140 Area-wise Tests',ok:true},{t:'DILR & QA sessions',ok:false},{t:'Books',ok:false}] },
    { featured:false, badge:'Section Only', badgeStyle:{}, name:'Mocks Only',                 price:'2,999',  note:'30 CAT mocks + 30 sectional + 140 area-wise. No live sessions', features:[{t:'30 Full-Length CAT Mocks',ok:true},{t:'30 Sectional Mocks',ok:true},{t:'140 Area-wise Tests',ok:true},{t:'Post-test data (self-guided)',ok:true},{t:'Live sessions',ok:false},{t:'Coaching & support',ok:false}] },
  ],
}

// ── XAT DATA ─────────────────────────────────────────────────────────────────

const XAT_DATA = {
  overview_cards: [
    { label:'Conducted By',    value:'XLRI Jamshedpur' },
    { label:'Exam Month',      value:'January' },
    { label:'Duration',        value:'3 Hours 35 Min' },
    { label:'Part 1 Questions',value:'75 Questions' },
    { label:'Part 2 (GK)',     value:'25 Questions' },
    { label:'Negative Marking',value:'-0.25 per wrong' },
    { label:'Unattempted',     value:'-0.10 (8+ skipped)' },
    { label:'Mode',            value:'Computer Based' },
  ],
  cat_sections: [
    { num:'Section 01', name:'Decision Making', pills:['~21 Questions','Unique to XAT'], types:['Business situation analysis','Ethical dilemma reasoning','Trade-off evaluation','Multi-stakeholder scenarios'] },
    { num:'Section 02', name:'Verbal Ability & Logical Reasoning', pills:['~26 Questions','RC Heavy'], types:['Reading Comprehension','Critical reasoning','Para-jumbles','Vocabulary in context'] },
    { num:'Section 03', name:'Quantitative Aptitude & Data Interpretation', pills:['~28 Questions','Calculation Heavy'], types:['Arithmetic & Algebra','Geometry','Data Interpretation sets','Negative marking strategy'] },
    { num:'Section 04', name:'General Knowledge (Part 2)', pills:['25 Questions','Not for percentile'], types:['Business awareness','Current affairs','Static GK','International business'] },
  ],
  eligibility: [
    "A Bachelor's degree in any discipline from a recognised university",
    "Final-year students in the final year of graduation can apply",
    "No upper or lower age limit",
    "No attempt limit — exam conducted once every year in January",
    "Work experience not mandatory but valued by XLRI BM and HRM programmes",
  ],
  key_dates: [
    { month:'AUG', year:'2026', event:'Registration Opens', detail:'XAT registration opens on xatonline.in. Registration fee: ~₹2,000. Apply to all target colleges at this stage.' },
    { month:'NOV', year:'2026', event:'Registration Closes', detail:'Late registration typically allowed with a penalty fee. Admit card available for download after registration closes.' },
    { month:'JAN', year:'2027', event:'XAT Exam Day', detail:'Held on the first Sunday of January. Computer-based test. Duration: 3 hours 35 minutes. No calculator permitted.' },
    { month:'JAN', year:'2027', event:'XAT Results', detail:'Scorecard released on xatonline.in within 2–3 weeks. Sectional and overall percentiles available. Shortlists follow.' },
    { month:'FEB', year:'2027', event:'GD-PI / WAT Rounds', detail:'XLRI conducts GD-PI-WAT for shortlisted candidates. Other XAT-accepting institutes have their own GD-PI schedules.' },
  ],
  curriculum: [
    { num:'Module 01', title:'Decision Making — Foundations', topics:['Business situation analysis framework','Ethical dilemma reasoning','Trade-off evaluation methodology','Identifying the most defensible option','Module-specific DM practice sets'] },
    { num:'Module 02', title:'Decision Making — Advanced', topics:['Complex multi-stakeholder scenarios','DM passage-based question patterns','Time management in DM section','Common traps in DM answer options','XLRI-specific DM tendencies'] },
    { num:'Module 03', title:'Verbal Ability & Logical Reasoning', topics:['Dense RC passage strategy for XAT','Critical reasoning — argument structure','Para-jumbles and para-summary','Vocabulary in context','Logical reasoning — deductions and inferences'] },
    { num:'Module 04', title:'Quantitative Aptitude & Data Interpretation', topics:['Arithmetic — ratio, percentage, P&L, TSD','Algebra and number systems','Geometry and mensuration','DI sets — tables, charts, caselets','Attempt strategy and negative marking management'] },
    { num:'Module 05', title:'General Knowledge', topics:['Business awareness and corporate GK','Current affairs — monthly digest','Static GK — awards, appointments, summits','International business and economics','XAT-specific GK patterns'] },
    { num:'Module 06', title:'Mock Tests & XLRI Interview Prep', topics:['6 full-length XAT mocks — post-test analysis','12 sectional tests (DM, VALR, QADI)','40 area-wise topic tests','XLRI PI — panel format mock interviews','GD and essay preparation for XLRI process'] },
  ],
  how_steps: [
    { num:'01', title:'Live Session', body:'Two-way live class where you work through reasoning aloud — especially in Decision Making. Frameworks are built through structured questioning, not passive explanation.' },
    { num:'02', title:'Area-wise Tests', body:'40 area-wise tests targeting specific topics — Decision Making situations, Verbal patterns, and Quant topic clusters. Errors identified before they compound.' },
    { num:'03', title:'Sectional + Full Mocks', body:'12 sectional tests followed by 6 full-length XAT-pattern mocks. Each mock simulates actual XAT timing, negative marking, and section-switching pressure.' },
    { num:'04', title:'Post-Test Analysis', body:'Every mock followed by a detailed breakdown — DM accuracy, VALR time distribution, QADI attempt vs accuracy, GK gaps. Personalised action plan after each test.' },
  ],
  colleges: [
    { group:'XLRI Jamshedpur', rows:[
      { star:true, name:'XLRI Jamshedpur — BM', city:'Jamshedpur, Jharkhand', cutoff:'95%+', avg:'INR 30-35 LPA', fee:'INR 24 L' },
      { star:true, name:'XLRI Jamshedpur — HRM', city:'Jamshedpur, Jharkhand', cutoff:'90%+', avg:'INR 28-32 LPA', fee:'INR 24 L' },
    ]},
    { group:'Other Top XAT-Accepting Colleges', rows:[
      { star:false, name:'SPJIMR Mumbai',   city:'Mumbai, Maharashtra',       cutoff:'90%+', avg:'INR 28-30 LPA', fee:'INR 22 L' },
      { star:false, name:'IMT Ghaziabad',   city:'Ghaziabad, UP',             cutoff:'85%+', avg:'INR 14-17 LPA', fee:'INR 18 L' },
      { star:false, name:'XIMB Bhubaneswar',city:'Bhubaneswar, Odisha',       cutoff:'85%+', avg:'INR 14-18 LPA', fee:'INR 18 L' },
      { star:false, name:'GIM Goa',          city:'Goa',                       cutoff:'80%+', avg:'INR 12-14 LPA', fee:'INR 16 L' },
    ]},
  ],
  testimonials: CAT_DATA.testimonials,
  faqs: [
    { q:'What is the Decision Making section in XAT?', a:'Decision Making is the most distinctive and feared section of XAT. It tests your ability to evaluate business situations, identify the best course of action, weigh ethical trade-offs, and reason through complex scenarios. It cannot be cracked with CAT preparation alone — it requires dedicated frameworks which GRADSKOOL builds from the ground up.' },
    { q:'Does XAT preparation at GRADSKOOL include GK?', a:'Yes. GRADSKOOL\'s XAT programme includes a dedicated GK module covering business awareness, current affairs, static GK, and international business. While GK does not contribute to the XAT percentile, it is considered by XLRI and other colleges during shortlisting and final admission.' },
    { q:'How many mocks are included in the XAT programme?', a:'The XAT programme includes 6 full-length XAT-pattern mocks, 12 sectional tests (DM, VALR, QADI), and 40 area-wise topic tests. Every mock is followed by a detailed post-test analysis.' },
    { q:'Does GRADSKOOL prepare for XLRI interviews?', a:'Yes. GRADSKOOL\'s XAT programme includes XLRI PI preparation — panel format mock interviews, GD and essay preparation specifically for the XLRI process, and WAT preparation.' },
  ],
  also_courses: CAT_DATA.also_courses,
  pricing_plans: [
    { featured:true, badge:'Live Programme', badgeStyle:{}, name:'XAT Live + Mocks', price:'2,999', note:'Live sessions + 6 XAT mocks + 12 sectional + 40 area-wise', features:[{t:'Live two-way XAT sessions with ALP',ok:true},{t:'Decision Making — full module',ok:true},{t:'6 Full-Length XAT Mocks',ok:true},{t:'12 Sectional + 40 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'Recorded session access',ok:true},{t:'Interview Prep',ok:false}] },
    { featured:false, badge:'With Interview', badgeStyle:{}, name:'XAT Live + Mocks + Interview', price:'4,999', note:'Live + mocks + XLRI PI WAT GD prep', features:[{t:'Live two-way XAT sessions with ALP',ok:true},{t:'Decision Making — full module',ok:true},{t:'6 Full-Length XAT Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'XLRI PI mock interviews',ok:true},{t:'GD and WAT preparation',ok:true}] },
  ],
}

// ── SNAP DATA ─────────────────────────────────────────────────────────────────

const SNAP_DATA = {
  overview_cards: [
    { label:'Conducted By',    value:'SIU, Pune' },
    { label:'Exam Month',      value:'December (3 dates)' },
    { label:'Duration',        value:'60 Minutes' },
    { label:'Total Questions', value:'60 Questions' },
    { label:'Total Marks',     value:'60 Marks' },
    { label:'Max Attempts',    value:'3 Per Cycle' },
    { label:'Negative Marking',value:'-0.25 per wrong' },
    { label:'Mode',            value:'Computer Based' },
  ],
  cat_sections: [
    { num:'Section 01', name:'General English', pills:['15 Questions','15 Marks'], types:['Vocabulary — synonyms, antonyms, analogies','Grammar and fill in the blanks','Idioms and one-word substitution','Verbal reasoning'] },
    { num:'Section 02', name:'Analytical & Logical Reasoning', pills:['25 Questions','Highest Weightage'], types:['Blood relations, directions','Syllogisms, coding-decoding','Series and puzzles','Critical reasoning'] },
    { num:'Section 03', name:'Quantitative, DI & DS', pills:['20 Questions','20 Marks'], types:['Arithmetic and algebra','Geometry and number systems','Data interpretation','Data sufficiency'] },
  ],
  eligibility: [
    "A Bachelor's degree in any discipline from a recognised university",
    "Minimum 50% marks in graduation required for most SIU institutes",
    "Final-year students can apply — degree must be completed before joining",
    "Up to 3 attempts allowed per year — conducted across 3 dates in December",
    "No age limit. No-shows do not count as attempts.",
  ],
  key_dates: [
    { month:'AUG', year:'2026', event:'SNAP Registration Opens', detail:'Registration opens at snaptest.org. Fee: ₹2,250 per attempt + ₹1,000 per Symbiosis college. Book all 3 test dates at once.' },
    { month:'NOV', year:'2026', event:'Registration Closes', detail:'Last date to register for SNAP. Admit cards for each test date released 1-2 weeks before the exam.' },
    { month:'DEC', year:'2026', event:'SNAP — Test 1', detail:'First of 3 SNAP test dates. 60 minutes, 60 questions. No sectional time limits. Conducted across 90+ cities.' },
    { month:'DEC', year:'2026', event:'SNAP — Tests 2 & 3', detail:'Second and third SNAP test dates. All 3 attempts optional. Best score used for all SIU admissions.' },
    { month:'JAN', year:'2027', event:'Results & SIU Shortlists', detail:'Results announced second week of January. SIU institutes release PI shortlists based on SNAP cutoff + academics.' },
    { month:'FEB', year:'2027', event:'GE-PI & Final Offers', detail:'Group Exercise, WAT, PI rounds. Final merit: SNAP 50% + GE-PI-WAT 30% + Academics 20%.' },
  ],
  curriculum: [
    { num:'Module 01', title:'General English', topics:['Vocabulary — synonyms, antonyms, analogies, one-word substitution','Grammar — error identification, sentence correction','Fill in the blanks — grammar and vocabulary','Idioms, phrases and contextual usage','Verbal reasoning'] },
    { num:'Module 02', title:'Analytical & Logical Reasoning', topics:['Blood relations and directions','Syllogisms and coding-decoding','Clocks, calendars and series','Puzzles and seating arrangements','Critical reasoning and inferences'] },
    { num:'Module 03', title:'Quantitative, DI & DS', topics:['Arithmetic — percentages, ratios, profit and loss','Algebra and number systems','Data Interpretation — tables, charts, caselets','Data Sufficiency — two-statement problems','Speed management for 60-minute constraint'] },
    { num:'Module 04', title:'No-Sectional-Time-Limit Strategy', topics:['Section order strategy for maximum marks','Time banking techniques','Cross-section switching rules','Handling easy vs hard question decisions','Speed drills for 60-minute environment'] },
    { num:'Module 05', title:'Mock Tests & SIU Interview Prep', topics:['20 full-length SNAP mocks — post-test analysis','12 sectional tests','60 area-wise topic tests','SIBM Pune and SCMHRD GE-PI preparation','WAT essay writing for Symbiosis process'] },
  ],
  how_steps: [
    { num:'01', title:'Live Session', body:'Two-way live class covering all 3 SNAP sections with focus on speed strategy and the no-sectional-time-limit advantage.' },
    { num:'02', title:'Area-wise Tests', body:'60 area-wise tests targeting specific topics across English, LR, and Quant. Pattern familiarity builds speed.' },
    { num:'03', title:'Full SNAP Mocks', body:'20 full-length SNAP-pattern mocks with 60-minute constraint. Simulates exact exam pressure across 3 attempt attempts.' },
    { num:'04', title:'Post-Test Analysis', body:'Every mock broken down by section timing, attempt vs accuracy, and time management. Fix the pattern before the next mock.' },
  ],
  colleges: [
    { group:'Top Symbiosis Institutes (SIU)', rows:[
      { star:true,  name:'SIBM Pune',                    city:'Pune, Maharashtra',      cutoff:'98.5%+', avg:'INR 23.71 LPA', fee:'INR 21 L' },
      { star:true,  name:'SCMHRD Pune',                  city:'Pune, Maharashtra',      cutoff:'97%+',   avg:'INR 13.48 LPA', fee:'INR 18 L' },
      { star:true,  name:'SIIB Pune',                    city:'Pune, Maharashtra',      cutoff:'95%+',   avg:'INR 12-14 LPA', fee:'INR 16 L' },
      { star:false, name:'SIBM Bengaluru',               city:'Bengaluru, Karnataka',   cutoff:'92-93%', avg:'INR 13.48 LPA', fee:'INR 16 L' },
      { star:false, name:'SCIT Pune / SIMC Pune',        city:'Pune, Maharashtra',      cutoff:'83-87%', avg:'INR 11.5 LPA',  fee:'INR 14-16 L' },
      { star:false, name:'SIBM Nagpur / Hyderabad',      city:'Various locations',      cutoff:'60-83%', avg:'INR 5-10 LPA',  fee:'INR 10-14 L' },
    ]},
  ],
  testimonials: CAT_DATA.testimonials,
  faqs: [
    { q:'What is the no-sectional-time-limit advantage in SNAP?', a:'Unlike CAT, SNAP has no fixed section timings — you can move freely between all three sections within the 60-minute window. GRADSKOOL trains you to exploit this by starting with your strongest section, banking marks early, and managing time across all three for maximum score.' },
    { q:'Can I attempt SNAP multiple times?', a:'Yes. SNAP allows up to 3 attempts per year — conducted across 3 dates in December. No-shows do not count as attempts. Best score across attempts is used for all SIU admissions. This makes SNAP one of the most retake-friendly exams in India.' },
    { q:'Which colleges accept SNAP scores?', a:'SNAP scores are accepted exclusively by all 17 Symbiosis International University (SIU) institutes. The most targeted are SIBM Pune, SCMHRD Pune, SIIB Pune, SIBM Bengaluru and SCIT Pune.' },
    { q:'How many mocks are included in GRADSKOOL\'s SNAP programme?', a:'The SNAP programme includes 20 full-length SNAP-pattern mocks, 12 sectional tests, and 60 area-wise tests. Every mock is followed by section-wise post-test analysis.' },
  ],
  also_courses: CAT_DATA.also_courses,
  pricing_plans: [
    { featured:true, badge:'Live Programme', badgeStyle:{}, name:'SNAP Live + Mocks', price:'2,999', note:'Live sessions + 20 SNAP mocks + 12 sectional + 60 area-wise', features:[{t:'Live two-way SNAP sessions with ALP',ok:true},{t:'All 3 sections — full coverage',ok:true},{t:'20 Full-Length SNAP Mocks',ok:true},{t:'12 Sectional + 60 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'Recorded session access',ok:true},{t:'Interview Prep',ok:false}] },
    { featured:false, badge:'With Interview', badgeStyle:{}, name:'SNAP Live + Mocks + Interview', price:'4,999', note:'Live + mocks + SIBM Pune GE-PI-WAT prep', features:[{t:'Live two-way SNAP sessions',ok:true},{t:'20 Full-Length SNAP Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'SIBM Pune GE-PI preparation',ok:true},{t:'WAT essay writing',ok:true},{t:'Tools: Always Free',ok:true}] },
  ],
}

// ── NMAT DATA ─────────────────────────────────────────────────────────────────

const NMAT_DATA = {
  overview_cards: [
    { label:'Conducted By',    value:'GMAC' },
    { label:'Test Window',     value:'~45 Days' },
    { label:'Duration',        value:'120 Minutes' },
    { label:'Total Questions', value:'108 Questions' },
    { label:'Score Range',     value:'0 – 360' },
    { label:'Max Attempts',    value:'3 Per Cycle' },
    { label:'Negative Marking',value:'None' },
    { label:'Mode',            value:'Computer Adaptive' },
  ],
  cat_sections: [
    { num:'Section 01', name:'Language Skills', pills:['36 Questions','28 Minutes'], types:['Reading Comprehension and vocabulary','Grammar and para-jumbles','Synonyms, antonyms, fill in the blanks','Speed reading and fluency'] },
    { num:'Section 02', name:'Logical Reasoning', pills:['36 Questions','40 Minutes'], types:['Syllogisms and blood relations','Critical reasoning','Puzzles and arrangement sets','Courses of action'] },
    { num:'Section 03', name:'Quantitative Skills', pills:['36 Questions','52 Minutes'], types:['Arithmetic and algebra','Geometry and number systems','Data Interpretation','Data Sufficiency'] },
  ],
  eligibility: [
    "A Bachelor's degree in any discipline from a recognised university",
    "Minimum 50% marks in graduation required for most participating colleges",
    "Final-year students can apply — degree must be completed before joining",
    "Up to 3 attempts allowed per cycle with minimum 15-day gap between attempts",
    "No age limit. No reservation policy from GMAC.",
  ],
  key_dates: [
    { month:'AUG', year:'2026', event:'Registration Opens', detail:'NMAT registration opens on mba.com/nmat. Register early — popular test centres fill up fast. Fee: ~₹2,300.' },
    { month:'OCT', year:'2026', event:'Testing Window Opens', detail:'The NMAT testing window opens in mid-October. Choose your preferred date, time, and centre. Online proctored exams also available.' },
    { month:'OCT', year:'2026', event:'Registration Closes', detail:'Late registration available at ₹2,800. Retake registration remains open for those who have taken their first attempt.' },
    { month:'OCT', year:'2026', event:'Full Testing Window', detail:'~45-day window running October to late December. Up to 3 attempts with 15-day gaps. Unofficial scores available immediately.' },
    { month:'JAN', year:'2027', event:'NMIMS Shortlisting', detail:'NMIMS releases shortlists. Candidates called for Competency Test (aptitude + psychometric + writing) and Personal Interview.' },
    { month:'FEB', year:'2027', event:'GD-PI & Final Offers', detail:'NMIMS and other colleges conduct GD, PI, WAT rounds. Final offers typically by April-May 2027.' },
  ],
  curriculum: [
    { num:'Module 01', title:'Language Skills — Foundations', topics:['Reading Comprehension — speed reading and inference','Vocabulary — synonyms, antonyms, contextual usage','Grammar — error identification and sentence correction','Para-jumbles and fill in the blanks','Speed strategy for 28-minute constraint'] },
    { num:'Module 02', title:'Logical Reasoning', topics:['Syllogisms and blood relations','Critical reasoning — argument evaluation','Puzzles and arrangement sets','Courses of action and inferences','Pattern recognition for 40-minute section'] },
    { num:'Module 03', title:'Quantitative Skills', topics:['Arithmetic — percentages, ratios, profit and loss','Algebra, geometry, number systems','Data Interpretation — tables, charts, caselets','Data Sufficiency — two-statement problems','Accuracy focus for 52-minute section'] },
    { num:'Module 04', title:'Section Order Strategy', topics:['Why most NMAT toppers start with QA','Language Skills — managing the tightest section','LR — predictable patterns and speed','Cross-section time allocation','Retake strategy — when and how to reschedule'] },
    { num:'Module 05', title:'Mock Tests & NMIMS Interview Prep', topics:['10 full-length NMAT mocks — post-test analysis','12 sectional tests','50 area-wise topic tests','NMIMS Competency Test preparation','NMIMS PI and psychometric preparation'] },
  ],
  how_steps: [
    { num:'01', title:'Live Session', body:'Two-way live class covering all 3 NMAT sections with focus on section-order strategy and the no-negative-marking advantage.' },
    { num:'02', title:'Area-wise Tests', body:'50 area-wise tests targeting Language Skills, LR, and QA topics. Accuracy is the key differentiator in NMAT — not speed.' },
    { num:'03', title:'Full NMAT Mocks', body:'10 full-length NMAT-pattern mocks with section-order choice. Practice choosing the optimal order for your profile.' },
    { num:'04', title:'Post-Test Analysis', body:'Every mock broken down by section — language speed, LR pattern recognition, QA accuracy. 3-attempt strategy reviewed after each mock.' },
  ],
  colleges: [
    { group:'NMIMS Campuses', rows:[
      { star:true,  name:'NMIMS Mumbai — MBA Core', city:'Mumbai, Maharashtra',     cutoff:'232-240+', avg:'INR 25.13 LPA', fee:'INR 21-24 L' },
      { star:true,  name:'NMIMS Mumbai — MBA HR',   city:'Mumbai, Maharashtra',     cutoff:'220-235+', avg:'INR 25.02 LPA', fee:'INR 20-23 L' },
      { star:true,  name:'NMIMS Bangalore',          city:'Bengaluru, Karnataka',    cutoff:'209-224+', avg:'INR 14-18 LPA', fee:'INR 18-20 L' },
      { star:false, name:'NMIMS Hyderabad / Indore', city:'Hyderabad & Indore',      cutoff:'200-215+', avg:'INR 12-15 LPA', fee:'INR 15-18 L' },
      { star:false, name:'NMIMS Navi Mumbai',        city:'Navi Mumbai, Maharashtra', cutoff:'209-220+', avg:'INR 12.85 LPA', fee:'INR 14-17 L' },
    ]},
    { group:'Other Top NMAT-Accepting Colleges', rows:[
      { star:false, name:'XIMB Bhubaneswar',           city:'Bhubaneswar, Odisha',  cutoff:'215-225+', avg:'INR 14-18 LPA', fee:'INR 18 L' },
      { star:false, name:'KJ Somaiya / TAPMI / SDA', city:'Various locations',       cutoff:'200-220+', avg:'INR 10-14 LPA', fee:'INR 14-20 L' },
    ]},
  ],
  testimonials: CAT_DATA.testimonials,
  faqs: [
    { q:'What is the section order choice in NMAT?', a:'Unlike CAT, NMAT allows you to choose the order in which you attempt the three sections. This is a significant strategic advantage — most NMAT toppers recommend starting with Quantitative Skills (most time at 52 minutes), then LR, and finishing with Language Skills (tightest at 28 minutes). GRADSKOOL trains you to use this strategically.' },
    { q:'Does NMAT have negative marking?', a:'No. NMAT has zero negative marking — this is one of its biggest advantages. You should attempt every question, even if unsure. The strategy shifts from risk management (like in CAT/XAT) to pure accuracy maximisation.' },
    { q:'Can I retake NMAT if my score is low?', a:'Yes. NMAT allows up to 3 attempts per cycle with a minimum 15-day gap between attempts. NMIMS considers your best score across all attempts. GRADSKOOL\'s programme builds a 3-attempt strategy — knowing when to retake and how to improve each time.' },
    { q:'What colleges accept NMAT scores?', a:'NMAT is the primary exam for NMIMS Mumbai — one of India\'s top private B-schools with an average MBA package of ₹25+ LPA. It is also accepted by XIMB, KJ Somaiya, TAPMI, SDA Bocconi and 50+ other colleges globally.' },
  ],
  also_courses: CAT_DATA.also_courses,
  pricing_plans: [
    { featured:true, badge:'Live Programme', badgeStyle:{}, name:'NMAT Live + Mocks', price:'3,999', note:'Live sessions + 10 NMAT mocks + 12 sectional + 50 area-wise', features:[{t:'Live two-way NMAT sessions with ALP',ok:true},{t:'All 3 sections — full coverage',ok:true},{t:'Section order strategy',ok:true},{t:'10 Full-Length NMAT Mocks',ok:true},{t:'12 Sectional + 50 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true}] },
    { featured:false, badge:'With Interview', badgeStyle:{}, name:'NMAT Live + Mocks + Interview', price:'4,999', note:'Live + mocks + NMIMS Competency Test + PI prep', features:[{t:'Live two-way NMAT sessions',ok:true},{t:'10 Full-Length NMAT Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'NMIMS Competency Test prep',ok:true},{t:'NMIMS PI preparation',ok:true},{t:'Psychometric test preparation',ok:true}] },
  ],
}


const NINE_STAGES = [
  { n:'01', name:'Video Introduction (English)',  d:'Concept overview \u00b7 Exam relevance \u00b7 Mental priming' },
  { n:'02', name:'Video Introduction (Hindi)',    d:'Same concept \u00b7 Wider accessibility' },
  { n:'03', name:'Live Concept Session',          d:'First-principles teaching \u00b7 Logic before shortcuts' },
  { n:'04', name:'Cheat Sheet',                   d:'Key ideas \u00b7 Patterns & triggers \u00b7 Revision-ready' },
  { n:'05', name:'Basic Quiz',                    d:'Immediate application \u00b7 Concept validation' },
  { n:'06', name:'Practice Live Session',         d:'Dedicated problem-solving \u00b7 Speed + confidence' },
  { n:'07', name:'Advanced Quiz',                 d:'Exam-level difficulty \u00b7 Mixed application' },
  { n:'08', name:'Session PDFs',                  d:'Class notes \u00b7 Solved examples' },
  { n:'09', name:'Doubt Resolution',              d:'Dedicated support \u00b7 No gaps carried forward' },
]

// ── PAGE ──────────────────────────────────────────────────────────────────────


// ── MOBILE STICKY BOTTOM BAR ─────────────────────────────────────────────────

function MobileStickyBar({ slug, price }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Show after user scrolls past hero (~400px)
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        @media (min-width: 769px) { .gs-mobile-bar { display: none !important; } }
        @media (max-width: 768px) {
          .gs-mobile-bar {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 999;
            background: #0f0f0f;
            border-top: 3px solid #ff5e5f;
            padding: 0.875rem 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            transform: translateY(${visible ? '0' : '100%'});
            transition: transform 0.3s ease;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
          }
        }
      `}</style>
      <div className="gs-mobile-bar">
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.6rem', fontWeight:'600', letterSpacing:'0.1em', textTransform:'uppercase', color:'#999', marginBottom:'0.15rem' }}>
            Starting from
          </div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:'700', color:'#ffffff', lineHeight:'1' }}>
            ₹{price}
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'300', color:'#666', marginLeft:'0.3rem' }}>+ GST</span>
          </div>
        </div>
        <Link href={`/checkout/${slug}`} style={{
          background: '#ff5e5f',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          borderRadius: '3px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          fontWeight: '600',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}>
          Enrol / Enquire →
        </Link>
      </div>
    </>
  )
}

export default function ExamPage({ exam, plans, cohorts = [] }) {
  const [openFaq, setOpenFaq]   = useState(null)
  const [openMod, setOpenMod]   = useState(0)

  const e    = exam || {}
  const seatsRemaining = e.seats_available?.remaining ?? null
  const slug = e.slug || 'cat'
  const isCat  = slug === 'cat'
  const isXat  = slug === 'xat'
  const isSnap = slug === 'snap'
  const isNmat = slug === 'nmat'
  const hasStaticData = isCat || isXat || isSnap || isNmat

  const STATIC_DATA = isCat ? CAT_DATA : isXat ? XAT_DATA : isSnap ? SNAP_DATA : isNmat ? NMAT_DATA : null
  const d = STATIC_DATA || {
    overview_cards: e.exam_pattern || [],
    cat_sections:   [],
    eligibility:    e.eligibility ? [e.eligibility] : [],
    key_dates:      e.key_dates || [],
    curriculum:     [],
    how_steps:      CAT_DATA.how_steps,
    colleges:       [],
    testimonials:   CAT_DATA.testimonials,
    faqs:           [],
    also_courses:   CAT_DATA.also_courses,
    pricing_plans:  plans.length ? plans.map(p => ({
      featured: p.is_featured,
      badge:    p.badge_text || '',
      badgeStyle: {},
      name:     p.name,
      price:    Number(p.price_inr).toLocaleString('en-IN'),
      note:     p.description || '',
      features: (p.features || []).map(f => ({ t: f[0], ok: f[1] })),
    })) : CAT_DATA.pricing_plans,
  }

  const displayPlans = d.pricing_plans

  const title = e.name || 'CAT 2026'
  const metaDesc = e.meta_desc || `${title} preparation — GRADSKOOL. Live cohorts of 27 students. ${e.tagline || ''}`

  return (
    <>
      <Head>
        <title>{title} Preparation \u2014 GRADSKOOL</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://gradskool.in/courses/${slug}`} />
      </Head>

      {/* BREADCRUMB */}
      <div style={{ padding:'0.875rem 2rem', borderBottom:`1px solid ${C.border}`, background:C.white }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'flex', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400 }}>
          <Link href="/" style={{ color:C.gray400, textDecoration:'none' }}>Home</Link>
          <span>/</span>
          <Link href="/courses" style={{ color:C.gray400, textDecoration:'none' }}>Courses</Link>
          <span>/</span>
          <span style={{ color:C.black }}>{title}</span>
        </div>
      </div>

      {/* HERO */}
      <section style={{ background:C.white, padding:'7rem 2rem 5rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:'5rem', alignItems:'flex-start' }}>
          {/* Left */}
          <div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.75rem', alignItems:'flex-start' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'500', letterSpacing:'0.09em', textTransform:'uppercase', color:C.red, border:`1px solid #ffd0d0`, background:C.redLight, padding:'0.3rem 0.8rem', borderRadius:'2px' }}>
                <span style={{ width:'6px', height:'6px', background:C.red, borderRadius:'50%', animation:'pulse 2s infinite', flexShrink:0 }} />
                {e.badge_text || 'Cohort Now Open'}
              </div>
              {seatsRemaining !== null && (
                <div style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'600',
                  color: seatsRemaining <= 5 ? '#991b1b' : '#166534',
                  background: seatsRemaining <= 5 ? '#fff5f5' : '#f0fdf4',
                  border: `1px solid ${seatsRemaining <= 5 ? '#fca5a5' : '#86efac'}`,
                  padding:'0.2rem 0.7rem', borderRadius:'100px' }}>
                  <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: seatsRemaining <= 5 ? '#ef4444' : '#22c55e', flexShrink:0 }} />
                  {seatsRemaining === 0
                    ? 'Cohort Full — Join Waitlist'
                    : `${seatsRemaining} of ${e.seats_available?.cohort_size || 27} seats remaining`}
                </div>
              )}
            </div>
            <h1 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2.4rem,4.5vw,3.6rem)', lineHeight:'1.08', color:C.black, marginBottom:'1.25rem', fontWeight:'700' }}>
              Crack {e.short_name || 'CAT'} 2026<br />
              the <em style={{ fontStyle:'italic', color:C.red, fontWeight:'400' }}>Structured</em> Way.
            </h1>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1.05rem', color:C.gray600, lineHeight:'1.75', maxWidth:'480px', marginBottom:'2rem' }}>
              {e.tagline || 'Live two-way classes, daily practice, 15+ full-length mocks, and deep post-test analysis \u2014 all in a cohort of just 27 students. Founded and taught by Abhishek Leela Pandey.'}
            </p>

            {/* Hero meta pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'1.5rem', marginBottom:'2.5rem' }}>
              {[
                { label:'Cohort Size', value:'27 Students Only' },
                { label:'Format',      value:'Live Online' },
                { label:'Duration',    value:'8 Months' },
                { label:'Starts',      value:'April 2026' },
              ].map((m,i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column', gap:'0.2rem' }}>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'500', letterSpacing:'0.08em', textTransform:'uppercase', color:C.gray400 }}>{m.label}</span>
                  <span style={{ fontFamily:'Georgia,serif', fontSize:'0.92rem', color:C.black, fontWeight:'500' }}>{m.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', flexWrap:'wrap' }}>
              <a href="#pricing" style={{ background:C.black, color:'#fff', padding:'0.8rem 1.8rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.88rem', fontWeight:'500', letterSpacing:'0.03em', textDecoration:'none' }}>View Pricing →</a>
              <a href="#curriculum" style={{ fontFamily:'var(--font-sans)', color:C.black, fontSize:'0.88rem', borderBottom:`1px solid ${C.border}`, paddingBottom:'2px', textDecoration:'none' }}>View Curriculum ↓</a>
            </div>
          </div>

          {/* Enrol card — sticky */}
          <div style={{ position:'sticky', top:'82px', background:C.gray50, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
            {/* Black top */}
            <div style={{ background:C.black, padding:'2rem 2rem 1.75rem', position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, width:'3px', height:'100%', background:C.red }} />
              <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.5rem' }}>Live Cohort \u2014 Starting From</div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'500', letterSpacing:'0.08em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.3rem' }}>Starting from</div>
              <div style={{ fontFamily:'Georgia,serif', fontSize:'2.8rem', color:'#fff', fontWeight:'700', lineHeight:'1', marginBottom:'0.4rem' }}>
                ₹17,999 <sub style={{ fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'300', color:C.gray400, verticalAlign:'baseline', marginLeft:'0.25rem' }}>+ GST</sub>
              </div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'#555', lineHeight:'1.5' }}>
                Live plans <span style={{ color:'#777' }}>₹17,999 – ₹24,999</span>
                <span style={{ margin:'0 0.4rem', color:'#333' }}>·</span>
                Mocks only <span style={{ color:'#777' }}>from ₹2,999</span>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding:'1.75rem 2rem 2rem' }}>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.85rem', marginBottom:'1.75rem' }}>
                {[
                  'Live two-way sessions with ALP Sir',
                  'Daily structured practice sets',
                  '15+ full-length CAT mocks',
                  'Post-test strategic analysis',
                  'VARC, DILR & QA modules',
                  'GDPI preparation included',
                  'Recorded session access',
                  'Doubt resolution every session',
                ].map((f,i) => (
                  <li key={i} style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray600, display:'flex', alignItems:'flex-start', gap:'0.65rem', lineHeight:'1.5' }}>
                    <span style={{ color:C.red, fontFamily:'var(--font-sans)', fontWeight:'700', flexShrink:0 }}>\u2713</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={`/checkout/${slug}`} style={{ display:'block', width:'100%', textAlign:'center', background:C.red, color:'#fff', padding:'0.9rem 1rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'500', letterSpacing:'0.03em', textDecoration:'none', marginBottom:'1rem' }}>
                Enrol / Enquire \u2192
              </Link>
              <p style={{ fontFamily:'Georgia,serif', fontSize:'0.8rem', color:C.gray400, textAlign:'center', lineHeight:'1.5' }}>
                Seats are limited to 27 per cohort.<br />Enquire to confirm availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{ background:C.black, padding:'3rem 2rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'2rem' }}>
          {(e.stats?.length ? e.stats.map(([val,label]) => ({val,label})) : [
            { val: isCat?'30':isXat?'6':isSnap?'20':isNmat?'10':'—', label:'Full-Length Mocks' },
            { val: isCat||isXat||isSnap||isNmat?'12':'—', label:'Sectional Tests' },
            { val:'400+', label:'Hours of Live Teaching' },
            { val:'27', label:'Students Per Cohort' },
          ]).map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <span style={{ fontFamily:'Georgia,serif', fontSize:'2.8rem', color:'#fff', display:'block', lineHeight:'1', marginBottom:'0.5rem', fontWeight:'700' }}>{s.val}</span>
              <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, letterSpacing:'0.06em', textTransform:'uppercase' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* WHAT IS [EXAM] */}
      {(e.exam_overview || hasStaticData) && (
        <section style={{ ...sectionBase }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>About the Exam</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>What is {e.short_name || 'CAT'}?</h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'620px', lineHeight:'1.75', marginBottom:'2.5rem' }}>
            {e.exam_overview || 'The Common Admission Test (CAT) is India\u2019s most competitive MBA entrance exam \u2014 conducted annually by the IIMs. A strong CAT score is the gateway to IIMs, FMS, SPJIMR, MDI, IMI and hundreds of top B-schools across India.'}
          </p>

          {/* Overview cards */}
          {d.overview_cards.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden', marginBottom:'2rem' }}>
              {d.overview_cards.map((c,i) => (
                <OverviewCard key={i} label={c.label} value={c.value} />
              ))}
            </div>
          )}

          {/* 3 section cards (CAT only) */}
          {hasStaticData && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
              {d.cat_sections.map((s,i) => (
                <SectionCard key={i} s={s} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ELIGIBILITY */}
      {d.eligibility.length > 0 && (
        <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ ...sectionBase }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>Who Can Apply</div>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>{e.short_name || 'CAT'} 2026 Eligibility Criteria</h2>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'520px', lineHeight:'1.75', marginBottom:'2rem' }}>
              {e.short_name || 'CAT'} has straightforward eligibility requirements. No age limit, no attempt limit.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
              {(typeof d.eligibility === 'string' ? d.eligibility.split('\n').filter(Boolean) : d.eligibility).map((item,i) => (
                <div key={i} style={{ background:C.white, padding:'1.5rem 2rem', display:'flex', alignItems:'flex-start', gap:'0.875rem' }}>
                  <span style={{ color:C.red, fontFamily:'var(--font-sans)', fontWeight:'700', flexShrink:0, marginTop:'0.1rem' }}>\u2713</span>
                  <p style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', color:C.gray600, lineHeight:'1.7' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* IMPORTANT DATES */}
      {d.key_dates.length > 0 && (
        <section style={{ ...sectionBase }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>Plan Your Year</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>{e.short_name || 'CAT'} 2026 Important Dates</h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'520px', lineHeight:'1.75', marginBottom:'3rem' }}>
            All dates below are <strong>tentative</strong> based on previous year patterns. Official dates will be announced by the conducting IIM.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {d.key_dates.map((dt,i) => (
              <DateItem key={i} dt={dt} last={i===d.key_dates.length-1} />
            ))}
          </div>
        </section>
      )}

      {/* CURRICULUM */}
      {d.curriculum.length > 0 && (
        <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }} id="curriculum">
          <div style={{ ...sectionBase }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>What You'll Learn</div>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>Course Curriculum</h2>
            <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'520px', lineHeight:'1.75', marginBottom:'2.5rem' }}>
              Every module is sequenced to build from foundations to exam-day mastery \u2014 with no gaps and no filler.
            </p>
            <div style={{ display:'flex', flexDirection:'column', border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
              {d.curriculum.map((mod,i) => (
                <CurriculumModule key={i} mod={mod} open={openMod===i} onToggle={() => setOpenMod(openMod===i ? null : i)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW COHORT WORKS */}
      <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ ...sectionBase }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>The Process</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>How a GRADSKOOL Cohort Works</h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'520px', lineHeight:'1.75', marginBottom:'3rem' }}>
            Every week follows the same proven rhythm \u2014 so nothing falls through the cracks.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1.5rem' }}>
            {d.how_steps.map((step,i) => (
              <HowStep key={i} step={step} />
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ ...sectionBase }} id="pricing">
        <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>Plans & Pricing</div>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>{e.short_name || 'CAT'} 2026 \u2014 Plans & Pricing</h2>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'520px', lineHeight:'1.75', marginBottom:'0.75rem' }}>
          Twelve plans \u2014 from full live preparation to section-only coaching, standalone mocks, and books. Pick what fits.
        </p>

        {/* Free mock strip */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', padding:'0.875rem 1.25rem', background:C.black, borderRadius:'3px', marginBottom:'2.5rem', flexWrap:'wrap' }}>
          <span style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:'#ccc' }}>Try before you invest \u2192</span>
          <a href="https://gradskool.testfunda.com/TestCentre/full-length--tests/cat" target="_blank" rel="noreferrer" style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.red, fontWeight:'500' }}>Attempt a Free CAT Mock \u2197</a>
        </div>

        {/* Pricing grid — grouped */}
        {(() => {
          const live    = displayPlans.filter(p => !['Mocks Only','VA RC Only','LR DI Only','QA Only'].some(n => p.name.includes(n.split(' ')[0]) && p.name.includes('Only')))
          const section = displayPlans.filter(p => ['Mocks Only','VA RC Only','LR DI Only','QA Only'].some(n => p.name.includes(n.split(' ')[0]) && p.name.includes('Only')) || p.name === 'Mocks Only')
          // Simpler split: live plans have 'Live' in name or are featured; rest are section/mocks
          const livePlans    = displayPlans.filter(p => p.name.toLowerCase().includes('live') || p.featured)
          const sectionPlans = displayPlans.filter(p => !p.name.toLowerCase().includes('live') && !p.featured)
          return (
            <>
              {livePlans.length > 0 && (
                <div style={{ marginBottom: sectionPlans.length ? '3rem' : 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.black }}>Live Programmes</span>
                    <div style={{ flex:1, height:'1px', background:C.border }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem' }}>
                    {livePlans.map((plan,i) => (
                      <PricingCard key={i} plan={plan} slug={slug} />
                    ))}
                  </div>
                </div>
              )}
              {sectionPlans.length > 0 && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:C.black }}>Section Only &amp; Mocks</span>
                    <div style={{ flex:1, height:'1px', background:C.border }} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem' }}>
                    {sectionPlans.map((plan,i) => (
                      <PricingCard key={i} plan={plan} slug={slug} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </section>

      {/* 9-STAGE FRAMEWORK */}
      <section style={{ background:C.black, padding:'6rem 2rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>How We Teach</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:'#fff', lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>The 9-Stage Learning Framework</h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray400, maxWidth:'520px', lineHeight:'1.75', marginBottom:'3rem' }}>
            At GRADSKOOL, every topic follows a structured 9-stage loop \u2014 from first introduction to doubt-free mastery.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1px', background:'#1a1a1a', border:'1px solid #1a1a1a', borderRadius:'4px', overflow:'hidden' }}>
            {NINE_STAGES.map((s,i) => (
              <div key={i} style={{ background:C.black, padding:'1.75rem 1.5rem', borderBottom:'1px solid #1a1a1a' }}>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', color:C.red, marginBottom:'0.5rem' }}>{s.n}</div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:'0.92rem', color:'#ccc', lineHeight:'1.3', marginBottom:'0.25rem' }}>{s.name}</div>
                <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', color:'#555', lineHeight:'1.5' }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLLEGES (CAT only) */}
      {hasStaticData && (
        <section style={{ ...sectionBase }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>Where CAT Takes You</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'0.9rem', fontWeight:'700' }}>Top Colleges \u2014 Cutoff & Placements</h2>
          <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:C.gray600, maxWidth:'580px', lineHeight:'1.75', marginBottom:'1.5rem' }}>
            CAT scores are accepted by 1,200+ colleges across India. Below are the most targeted \u2014 with actual CAT 2025 cutoffs and latest placement data.
          </p>

          {/* Note box */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', background:C.redLight, border:`1px solid #ffd0d0`, borderRadius:'4px', padding:'1.25rem 1.5rem', marginBottom:'2rem' }}>
            <span style={{ fontSize:'1rem', flexShrink:0 }}>\ud83d\udccc</span>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'#3a3a3a', lineHeight:'1.6' }}>
              IIMs have two cutoffs \u2014 a low <strong>qualifying cutoff</strong> (official minimum) and a much higher <strong>actual call cutoff</strong> (what you realistically need). The table below shows the actual call cutoff. Cutoffs vary by category, gender, and academic profile every year.
            </p>
          </div>

          {/* Colleges table */}
          <div style={{ border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', background:C.black, padding:'0.9rem 1.25rem' }}>
              {['College','CAT Cutoff','Avg. Package','Fees'].map((h,i) => (
                <span key={i} style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'600', letterSpacing:'0.07em', textTransform:'uppercase', color:C.gray400 }}>{h}</span>
              ))}
            </div>
            {d.colleges.map((group,gi) => (
              <div key={gi}>
                <div style={{ padding:'0.6rem 1.25rem', background:C.gray50, borderTop:`1px solid ${C.border}`, fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'600', letterSpacing:'0.08em', textTransform:'uppercase', color:C.gray400 }}>{group.group}</div>
                {group.rows.map((row,ri) => (
                  <div key={ri} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', padding:'0.9rem 1.25rem', borderTop:`1px solid ${C.border}`, background: ri%2===0 ? C.white : C.gray50 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem' }}>
                      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.75rem', fontWeight:'700', color: row.star ? '#f59e0b' : C.gray400, flexShrink:0, marginTop:'0.1rem' }}>{row.star ? '\u2605' : '\u2014'}</span>
                      <div>
                        <div style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', fontWeight:'500', color:C.black }}>{row.name}</div>
                        <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400 }}>{row.city}</div>
                      </div>
                    </div>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.875rem', fontWeight:'700', color:C.black }}>{row.cutoff}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray600 }}>{row.avg}</span>
                    <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:C.gray600 }}>{row.fee}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, padding:'6rem 2rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>Student Voices</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', marginBottom:'3rem', fontWeight:'700' }}>What {e.short_name||'CAT'} Students Say</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.5rem' }}>
            {d.testimonials.map((t,i) => (
              <div key={i} style={{ border:`1px solid ${C.border}`, borderRadius:'4px', padding:'2rem', background:C.white, display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <div style={{ fontFamily:'Georgia,serif', fontSize:'2.5rem', color:C.red, lineHeight:'1', fontStyle:'italic' }}>"</div>
                <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:'#3a3a3a', lineHeight:'1.8', flex:1, fontStyle:'italic' }}>{t.text}</p>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:'1rem' }}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'500', color:C.black }}>{t.name || t.student_name}</div>
                  {(t.detail||t.cohort) && <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, marginTop:'0.2rem' }}>{t.detail||t.cohort}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      {d.faqs.length > 0 && (
        <section style={{ ...sectionBase, borderTop:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'3rem', gap:'2rem', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.6rem' }}>Common Questions</div>
              <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(1.9rem,3vw,2.6rem)', color:C.black, lineHeight:'1.15', fontWeight:'700' }}>{e.short_name||'CAT'} Course \u2014 FAQs</h2>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
            {d.faqs.map((faq,i) => (
              <div key={i} style={{ borderBottom: i<d.faqs.length-1 ? `1px solid ${C.border}` : 'none', background:C.white }}>
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)}
                  style={{ width:'100%', background:'none', border:'none', padding:'1.4rem 1.75rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem' }}>
                  <span style={{ fontFamily:'Georgia,serif', fontSize:'0.95rem', fontWeight:'500', color:C.black, lineHeight:'1.5' }}>{faq.q}</span>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'1.2rem', color:C.red, flexShrink:0, transition:'transform 0.25s', lineHeight:'1', transform: openFaq===i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq===i && (
                  <div style={{ padding:'0 1.75rem 1.5rem' }}>
                    <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.8' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* COHORTS */}
      {cohorts.length > 0 && (
        <section style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, padding:'5rem 2rem' }}>
          <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
            <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.5rem' }}>
              Available Cohorts
            </div>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.6rem', color:C.black, fontWeight:'700', marginBottom:'2rem' }}>
              {e.short_name || 'CAT'} 2026 — Cohorts
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'1px', background:C.border, border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
              {cohorts.map((cohort, i) => (
                <CohortListItem key={cohort.id} cohort={cohort} examSlug={slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MORE COURSES */}
      <div style={{ background:C.gray50, borderTop:`1px solid ${C.border}`, padding:'5rem 2rem' }}>
        <div style={{ maxWidth:'1160px', margin:'0 auto' }}>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', fontWeight:'500', letterSpacing:'0.1em', textTransform:'uppercase', color:C.red, marginBottom:'0.5rem' }}>Also Preparing For?</div>
          <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.6rem', color:C.black, fontWeight:'700', marginBottom:'2rem' }}>More Courses by GRADSKOOL</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
            {d.also_courses.map((c,i) => (
              <AlsoCard key={i} course={c} />
            ))}
          </div>
        </div>
      </div>

      {/* CTA BANNER */}
      <div style={{ background:C.red, padding:'5.5rem 2rem', textAlign:'center' }}>
        <h2 style={{ fontFamily:'Georgia,serif', fontSize:'clamp(2rem,3.5vw,3rem)', color:'#fff', marginBottom:'1rem', lineHeight:'1.15', fontWeight:'700' }}>
          Only 7 Seats Remaining.
        </h2>
        <p style={{ fontFamily:'Georgia,serif', fontSize:'1rem', color:'rgba(255,255,255,0.85)', marginBottom:'2.5rem', maxWidth:'460px', margin:'0 auto 2.5rem', lineHeight:'1.7' }}>
          Once the cohort of 27 is full, the next batch opens only after the current one completes. Don&apos;t wait until it&apos;s too late.
        </p>
        <Link href={`/checkout/${slug}`} style={{ background:'#fff', color:C.red, padding:'0.9rem 2.5rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'500', letterSpacing:'0.03em', display:'inline-block', textDecoration:'none' }}>
          Enrol / Enquire Now \u2192
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      <MobileStickyBar slug={slug} price="17,999" />
    </>
  )
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function OverviewCard({ label, value }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.gray50 : C.white, padding:'1.25rem 1rem', textAlign:'center', transition:'background 0.2s' }}>
      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'500', letterSpacing:'0.09em', textTransform:'uppercase', color:C.gray400, marginBottom:'0.5rem' }}>{label}</div>
      <div style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'700', color:C.black, lineHeight:'1.2' }}>{value}</div>
    </div>
  )
}

function SectionCard({ s }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.gray50 : C.white, padding:'2.25rem', transition:'background 0.2s' }}>
      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'500', letterSpacing:'0.09em', textTransform:'uppercase', color:C.red, marginBottom:'0.5rem' }}>{s.num}</div>
      <div style={{ fontFamily:'Georgia,serif', fontSize:'1.15rem', color:C.black, marginBottom:'0.75rem', fontWeight:'500', lineHeight:'1.25' }}>{s.name}</div>
      <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', marginBottom:'1rem' }}>
        {s.pills.map((p,i) => (
          <span key={i} style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.red, background:C.redLight, border:`1px solid #ffd0d0`, padding:'0.2rem 0.6rem', borderRadius:'2px' }}>{p}</span>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
        {s.types.map((t,i) => (
          <div key={i} style={{ fontFamily:'Georgia,serif', fontSize:'0.82rem', color:C.gray600, display:'flex', alignItems:'flex-start', gap:'0.5rem' }}>
            <span style={{ color:C.red, flexShrink:0, marginTop:'0.05rem' }}>\u2014</span>{t}
          </div>
        ))}
      </div>
    </div>
  )
}

function DateItem({ dt, last }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'auto auto 1fr', alignItems:'flex-start', marginBottom: last ? 0 : '0' }}>
      {/* Left — month/year */}
      <div style={{ padding:'0.25rem 0', textAlign:'right', paddingRight:'0' }}>
        <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.7rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:C.gray400, lineHeight:'1' }}>{dt.month}</div>
        <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400, lineHeight:'1.2' }}>{dt.year}</div>
      </div>
      {/* Connector */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'0.35rem' }}>
        <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:C.red, border:`2px solid ${C.red}`, flexShrink:0 }} />
        {!last && <div style={{ width:'1px', background:C.border, flex:1, minHeight:'40px' }} />}
      </div>
      {/* Right — event */}
      <div style={{ paddingLeft:'1.25rem', paddingBottom: last ? 0 : '2.5rem' }}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'500', color:C.black, marginBottom:'0.35rem' }}>{dt.event}</div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color:C.gray600, lineHeight:'1.65' }}>{dt.detail || dt.desc}</div>
      </div>
    </div>
  )
}

function CurriculumModule({ mod, open, onToggle }) {
  return (
    <div style={{ borderBottom:`1px solid ${C.border}`, background:C.white }}>
      <button onClick={onToggle}
        style={{ width:'100%', background: open ? C.black : C.white, border:'none', padding:'1.5rem 2rem', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', transition:'background 0.2s' }}>
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', color: open ? C.red : C.gray400, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.25rem' }}>{mod.num}</div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', fontWeight:'500', color: open ? '#fff' : C.black }}>{mod.title}</div>
        </div>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'1.2rem', color: open ? C.red : C.gray400, flexShrink:0, transition:'transform 0.25s', lineHeight:'1', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <div style={{ padding:'1.5rem 2rem 2rem', borderTop:`1px solid ${C.border}` }}>
          <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {mod.topics.map((t,i) => (
              <li key={i} style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray600, display:'flex', alignItems:'flex-start', gap:'0.6rem', lineHeight:'1.6' }}>
                <span style={{ color:C.red, flexShrink:0 }}>\u2014</span>{t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function HowStep({ step }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ padding:'2rem', background:C.white, border:`1px solid ${hov ? C.red : C.border}`, borderRadius:'4px', position:'relative', overflow:'hidden', transition:'border-color 0.25s' }}>
      <div style={{ fontFamily:'Georgia,serif', fontSize:'3.5rem', color:'#f0f0ee', position:'absolute', top:'0.5rem', right:'1rem', lineHeight:'1', fontWeight:'700', userSelect:'none' }}>{step.num}</div>
      <h3 style={{ fontFamily:'Georgia,serif', fontSize:'1.1rem', color:C.black, marginBottom:'0.6rem', fontWeight:'500' }}>{step.title}</h3>
      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.9rem', color:C.gray600, lineHeight:'1.75' }}>{step.body}</p>
      {step.link && (
        <a href={step.link.href} target="_blank" rel="noopener noreferrer"
          style={{ display:'inline-block', marginTop:'0.6rem', fontFamily:'var(--font-sans)', fontSize:'0.8rem', fontWeight:600, color:C.red }}>
          {step.link.text} →
        </a>
      )}
    </div>
  )
}

function PricingCard({ plan, slug }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{
      border:`1px solid ${plan.featured ? C.black : hov ? '#bbb' : C.border}`,
      borderRadius:'4px', overflow:'hidden', background:C.white,
      boxShadow: plan.featured ? '0 4px 24px rgba(0,0,0,0.1)' : hov ? '0 4px 24px rgba(0,0,0,0.07)' : 'none',
      transition:'box-shadow 0.25s, border-color 0.25s',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Top */}
      <div style={{ padding:'2rem 2rem 1.5rem', borderBottom:`1px solid ${C.border}`, background: plan.featured ? C.black : C.white }}>
        <div style={{ display:'inline-block', fontFamily:'var(--font-sans)', fontSize:'0.68rem', fontWeight:'500', letterSpacing:'0.07em', textTransform:'uppercase', padding:'0.2rem 0.55rem', borderRadius:'2px', marginBottom:'0.75rem', ...( plan.badgeStyle?.background ? plan.badgeStyle : { background: plan.featured ? 'rgba(255,94,95,0.2)' : C.redLight, color:C.red }) }}>
          {plan.badge}
        </div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1.3rem', color: plan.featured ? '#fff' : C.black, marginBottom:'1rem', fontWeight:'500' }}>{plan.name}</div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'2.8rem', color: plan.featured ? '#fff' : C.black, fontWeight:'700', lineHeight:'1' }}>
          <sup style={{ fontSize:'1.2rem', verticalAlign:'super' }}>\u20b9</sup>
          {plan.price}
          <sub style={{ fontFamily:'var(--font-sans)', fontSize:'0.85rem', fontWeight:'300', color:C.gray400, verticalAlign:'baseline', marginLeft:'0.2rem' }}>+ GST</sub>
        </div>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'0.82rem', color:C.gray400, marginTop:'0.3rem' }}>{plan.note}</div>
      </div>
      {/* Body */}
      <div style={{ padding:'1.75rem 2rem 2rem' }}>
        <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.75rem' }}>
          {plan.features.map((f,i) => (
            <li key={i} style={{ fontFamily:'Georgia,serif', fontSize:'0.875rem', color: f.ok ? C.gray600 : '#ccc', display:'flex', alignItems:'flex-start', gap:'0.65rem', lineHeight:'1.5' }}>
              <span style={{ color: f.ok ? C.red : '#ccc', fontFamily:'var(--font-sans)', fontWeight:'700', flexShrink:0 }}>{f.ok ? '\u2713' : '\u2715'}</span>
              {f.t}
            </li>
          ))}
        </ul>
        <Link href={`/checkout/${slug}`} style={{ display:'block', width:'100%', textAlign:'center', padding:'0.85rem 1rem', borderRadius:'3px', fontFamily:'var(--font-sans)', fontSize:'0.88rem', fontWeight:'500', letterSpacing:'0.03em', textDecoration:'none', ...(plan.featured ? { background:C.red, color:'#fff' } : { border:`1px solid ${C.black}`, color:C.black }) }}>
          Enrol Now \u2192
        </Link>
      </div>
    </div>
  )
}

function CohortListItem({ cohort, examSlug }) {
  const [hov, setHov] = useState(false)
  const href = `/courses/${examSlug}/cohorts/${cohort.slug}`

  const fmtDate = (d) => {
    if (!d) return null
    return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
  }

  return (
    <Link
      href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 1.75rem', background: hov ? C.gray50 : C.white, textDecoration:'none', transition:'background 0.15s', gap:'1.5rem' }}
    >
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.3rem', flexWrap:'wrap' }}>
          <span style={{ fontFamily:'Georgia,serif', fontSize:'1rem', fontWeight:'500', color:C.black }}>{cohort.cohort_label || cohort.title}</span>
          {cohort.is_open && (
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.62rem', fontWeight:'700', color:'#166534', background:'#f0fdf4', border:'1px solid #86efac', padding:'0.12rem 0.45rem', borderRadius:'100px', display:'inline-flex', alignItems:'center', gap:'0.3rem' }}>
              <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
              Open
            </span>
          )}
          <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', letterSpacing:'0.06em', textTransform:'uppercase',
            color: cohort.status === 'active' ? '#166534' : cohort.status === 'upcoming' ? '#92400e' : C.gray400,
            background: cohort.status === 'active' ? '#f0fdf4' : cohort.status === 'upcoming' ? '#fef9c3' : C.gray50,
            border: `1px solid ${cohort.status === 'active' ? '#86efac' : cohort.status === 'upcoming' ? '#fde68a' : C.border}`,
            padding:'0.12rem 0.45rem', borderRadius:'100px',
          }}>{cohort.status}</span>
        </div>
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400 }}>
          {cohort.start_date && <span>Starts {fmtDate(cohort.start_date)}</span>}
          {cohort.end_date   && <span>Ends {fmtDate(cohort.end_date)}</span>}
          <span style={{ color: cohort.remaining <= 5 ? '#991b1b' : C.gray400 }}>
            {cohort.remaining} / {cohort.batch_size} seats remaining
          </span>
        </div>
      </div>
      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', fontWeight:'500', color: hov ? C.red : C.gray400, transition:'color 0.15s', whiteSpace:'nowrap' }}>
        View Cohort →
      </span>
    </Link>
  )
}

function AlsoCard({ course }) {
  const [hov, setHov] = useState(false)
  const href = course.slug === 'courses' ? '/courses' : `/courses/${course.slug}`
  return (
    <Link href={href}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:C.white, border:`1px solid ${hov ? C.red : C.border}`, borderRadius:'4px', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'0.5rem', textDecoration:'none', boxShadow: hov ? '0 2px 16px rgba(255,94,95,0.07)' : 'none', transition:'border-color 0.2s, box-shadow 0.2s' }}>
      <div style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'600', letterSpacing:'0.09em', textTransform:'uppercase', color:C.red }}>{course.tag}</div>
      <div style={{ fontFamily:'Georgia,serif', fontSize:'1.15rem', color:C.black, fontWeight:'500', lineHeight:'1.2' }}>{course.name}</div>
      <p style={{ fontFamily:'Georgia,serif', fontSize:'0.85rem', color:C.gray600, lineHeight:'1.65', flex:1 }}>{course.desc}</p>
      <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.8rem', color:C.red, marginTop:'0.25rem' }}>View {course.name} Course \u2192</span>
    </Link>
  )
}