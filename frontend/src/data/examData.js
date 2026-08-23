/**
 * GRADSKOOL — Shared Exam Data
 * Static data for all exam course pages, sourced directly from static HTML files.
 */

const ALSO_EXAMS = [
  { slug:'gmat',       cat:'MBA Abroad',    short:'GMAT',     desc:'GMAT Focus Edition — ISB, INSEAD, LBS and top global MBA programmes.' },
  { slug:'gre',        cat:'Masters Abroad', short:'GRE',      desc:'GRE General Test — MIT, Stanford, CMU, NUS. Verbal, Quant, AWA.' },
  { slug:'xat',        cat:'MBA India',      short:'XAT',      desc:'Decision Making, Verbal and Quantitative. XLRI Jamshedpur and 150+ institutes.' },
  { slug:'snap',       cat:'MBA India',      short:'SNAP',     desc:'SIBM Pune, SCMHRD, SIIB. 60 questions in 60 minutes. No sectional time limit.' },
  { slug:'nmat',       cat:'MBA India',      short:'NMAT',     desc:'NMIMS Mumbai, Hyderabad, Bangalore. 3 attempts. No negative marking.' },
  { slug:'cat',        cat:'MBA India',      short:'CAT',      desc:'IIMs, FMS, SPJIMR and 1,200+ colleges. India\'s most competitive MBA entrance.' },
  { slug:'ipmat',      cat:'UG Management',  short:'IPMAT',    desc:'IIM Indore, Rohtak, JIPMAT — the only direct route to an IIM without CAT.' },
  { slug:'clat',       cat:'Law Entrance',   short:'CLAT',     desc:'24 NLUs, NLU Delhi, Oxford and UCL. 18 mocks + 21 printed books.' },
  { slug:'cuet',       cat:'University UG',  short:'CUET UG',  desc:'Delhi University, BHU, JNU and 250+ central universities.' },
  { slug:'cmat',       cat:'MBA India',      short:'CMAT',     desc:'JBIMS, SIMSREE, PUMBA and 1,000+ AICTE institutes.' },
  { slug:'mhcet',      cat:'MBA Maharashtra',short:'MH CET',   desc:'JBIMS, SIMSREE, KJ Somaiya. 200 questions, no negative marking.' },
  { slug:'pi-wat-gd',  cat:'Interview Prep', short:'PI WAT GD',desc:'Convert your B-school call. Mock PIs, GD rounds, WAT and AWT for IIM-A.' },
]

const TESTIMONIALS = [
  { name:'Keshav Mundra',  detail:'CAT 2025 · 99.1%ile',            text:'Learning from ALP sir is something special. He explains every topic from multiple perspectives and always focuses on the best approach. His teaching builds the right way of thinking.' },
  { name:'Vanshaj Jaiman', detail:'CAT 2025 · 98.4%ile',            text:'The structure and execution are unlike anything I\'ve experienced. The two-way live classes are what make GRADSKOOL stand apart. I could clear every doubt in the session itself.' },
  { name:'Sameer Ansari',  detail:'XAT 2025 → IIM Convert · 97.8%ile', text:'From my CAT journey to XAT, sir stood with us at every step. The GDPI prep — mock interviews, stress rounds, the material — all perfectly aligned. GRADSKOOL changed my trajectory completely.' },
]

const HOW_STEPS_DEFAULT = [
  { num:'01', title:'Live Session',       body:'Two-way live class where you articulate reasoning aloud. Every concept is built through structured questioning — not passive watching.' },
  { num:'02', title:'Daily Practice',     body:'Targeted practice sets assigned after each session. Questions chosen to reinforce specific thinking patterns — not random drilling.' },
  { num:'03', title:'Mock Test',          body:'Full-length mocks at regular intervals — designed to simulate exam pressure and surface your actual behavioural patterns.' },
  { num:'04', title:'Post-Test Analysis', body:'Detailed breakdown of every mock — time distribution, attempt vs accuracy, behavioural blind spots, and a personalised action plan.' },
]

// ── CAT DATA ─────────────────────────────────────────────────────────────────

export const CAT_DATA = {
  slug: 'cat', name: 'CAT 2026', mocksSlug: 'cat',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline: 'Crack CAT 2026 the Structured Way.',
  description: 'Live two-way classes, daily practice, 30 full-length mocks, and deep post-test analysis — all in a cohort of just 27 students. Founded and taught by Abhishek Leela Pandey.',
  badge: 'Cohort Now Open',
  enrolPrice: '27,999',
  enrolNote: 'Mocks-only plans from ₹2,999',
  enrolFeatures: [
    'Live two-way sessions with ALP Sir',
    'Daily structured practice sets',
    '30 full-length CAT mocks',
    'Post-test strategic analysis',
    'VARC, DILR & QA modules',
    'GDPI preparation included',
    'Recorded session access',
    'Doubt resolution every session',
  ],
  heroStats: [
    ['30', 'Full-Length CAT Mocks'],
    ['30', 'Sectional Tests'],
    ['400+', 'Hours Live Teaching'],
    ['27', 'Students Per Cohort'],
  ],
  overview_cards: [
    { label:'Conducted By',    value:'IIMs (rotating)' },
    { label:'Exam Frequency',  value:'Once a year' },
    { label:'Exam Month',      value:'November' },
    { label:'Total Duration',  value:'2 Hours' },
    { label:'Total Questions', value:'68 Questions' },
    { label:'Total Marks',     value:'204 Marks' },
    { label:'Marking Scheme',  value:'+3 / −1' },
    { label:'Mode',            value:'Computer Based' },
  ],
  sections: [
    {
      num:'Section 01', name:'Verbal Ability & Reading Comprehension',
      badge:'24 Qs · 40 Min · 72 Marks',
      pills:['~16 RC Questions','~8 VA Questions'],
      topics:['Reading Comprehension — 4–5 passages','Para-jumbles (~3 Qs)','Para-summary (~3 Qs)','Odd Sentence Out (~2 Qs)','Vocabulary in context'],
    },
    {
      num:'Section 02', name:'Data Interpretation & Logical Reasoning',
      badge:'22 Qs · 40 Min · 66 Marks',
      pills:['Set-based','~10 LR + ~10 DI'],
      topics:['Logical Reasoning sets (~10 Qs)','Data Interpretation sets (~10 Qs)','Set selection strategy critical','4–5 sets of 4–5 questions each','No computation shortcuts'],
    },
    {
      num:'Section 03', name:'Quantitative Ability',
      badge:'22 Qs · 40 Min · 66 Marks',
      pills:['~30% TITA (no negative)','Arithmetic Heavy'],
      topics:['Arithmetic (~8 Qs)','Algebra (~5 Qs)','Geometry & Mensuration (~4 Qs)','Number Systems (~3 Qs)','Modern Maths (~2 Qs)'],
    },
  ],
  scoreTable: {
    label: 'Score to Percentile',
    title: 'CAT 2025 — Score vs Percentile',
    note: 'CAT uses a scaled scoring system — your raw marks are normalised across exam slots to account for difficulty variation.',
    headers: ['Percentile','Total Scaled Score','Typical Target Colleges'],
    rows: [
      ['99.99%','132.79','IIM Ahmedabad, IIM Bangalore'],
      ['99.95%','118.37','IIM A, B, C'],
      ['99.90%','111.48','IIM A, B, C, L, K'],
      ['99.50%','93','IIM A, B, C, L, K, I, S'],
      ['99.00%','84.8','IIM Lucknow, Kozhikode, FMS Delhi, SPJIMR'],
      ['98.00%','76','IIM Indore, Shillong, MDI Gurgaon, SPJIMR'],
      ['97.00%','70','IIM Udaipur, Trichy, Ranchi, MDI, IMT'],
      ['95.00%','62.3','IIM Nagpur, Bodhgaya, IMI Delhi, TAPMI'],
      ['90.00%','51.50','IIM Sambalpur, Sirmaur, FORE, GIM'],
      ['85.00%','44.2','LIBA, XIME, XIMB, Christ University'],
      ['80.00%','38','SDMIMD, BIMTECH, IPE Hyderabad'],
    ],
    footer: 'Source: CAT 2025 official data. Scaled scores normalised across slots. Cutoffs vary by category and change every year.',
  },
  eligibility: [
    { icon:'🎓', title:'Educational Qualification', body:"A Bachelor's degree in any discipline from a university recognised by UGC / AICTE / MHRD. Correspondence and distance degrees accepted." },
    { icon:'📊', title:'Minimum Percentage', body:'50% aggregate for General/EWS/NC-OBC. 45% for SC, ST and PwD candidates. CGPA converted using your university formula.' },
    { icon:'📅', title:'Final Year Students', body:'Students in final year of graduation can apply. Must submit degree proof and complete graduation by December 31, 2026.' },
    { icon:'🔁', title:'No Attempt Limit', body:'No limit on the number of times you can appear for CAT. Many students crack CAT in their second or third attempt.' },
    { icon:'🚫', title:'No Age Limit', body:'CAT has no upper or lower age limit. Working professionals, career gap candidates, and students of any age can apply.' },
    { icon:'💼', title:'Professional Degrees', body:'Holders of CA, CS, ICWA or FIAI qualifications with 50%/45% are also eligible without a traditional Bachelor\'s degree.' },
  ],
  key_dates: [
    { month:'JUL', year:'2026', event:'Official CAT 2026 Notification', detail:'IIM Kozhikode releases the official CAT 2026 bulletin with exam date, registration window, eligibility, and application fee details.' },
    { month:'AUG', year:'2026', event:'CAT 2026 Registration Opens', detail:'Application window opens on iimcat.ac.in. Fee: ₹2,400 for General/OBC · ₹1,200 for SC/ST/PwD.' },
    { month:'SEP', year:'2026', event:'Registration Closes', detail:'Last date to submit the CAT 2026 application. No extensions granted — don\'t wait till the last day.' },
    { month:'NOV', year:'2026', event:'CAT 2026 Exam Day', detail:'Computer-based test in 3 slots across 150+ cities. 2 hours, 3 sections: VARC (40 min), DILR (40 min), QA (40 min). No breaks.' },
    { month:'DEC', year:'2026', event:'CAT 2026 Results', detail:'Results declared in the last week of December on iimcat.ac.in. Valid for 1 year. IIM shortlisting calls follow shortly after.' },
    { month:'JAN', year:'2027', event:'IIM Shortlisting & GDPI', detail:'WAT-PI rounds conducted January to March 2027. Final admission offers by April 2027.' },
  ],
  curriculum: [
    { num:'Module 01', title:'Verbal Ability & Reading Comprehension', topics:['Reading Comprehension — strategy & approach','RC 111 — 111 RC passages','Para-jumbles & para-summary','Odd sentence out','Vocabulary & RC Lexicon','Grammar for CAT'] },
    { num:'Module 02', title:'Data Interpretation & Logical Reasoning', topics:['CAT DILR Practice Tool — puzzle foundations','Seating arrangements & grids','Games & tournaments','Data interpretation — all formats','Caselets & mixed sets','Set selection strategy'] },
    { num:'Module 03', title:'Quantitative Ability', topics:['Arithmetic — ratios, percentages, time-work','Number systems & divisibility','Algebra — equations, functions, inequalities','Geometry & mensuration','Modern maths — P&C, probability','QA shortcut frameworks'] },
    { num:'Module 04', title:'Mock Tests & Strategic Analysis', topics:['30 full-length CAT-pattern mocks','Post-test time distribution analysis','Attempt vs accuracy mapping','Negative marking & risk calibration','Section-wise improvement plans','Last-mile revision strategy'] },
    { num:'Module 05', title:'XAT / IIFT / SNAP Preparation', topics:['Decision making — XAT specific','GK & current affairs — IIFT & SNAP','Exam-specific mock tests','XAT essay writing'] },
    { num:'Module 06', title:'GDPI Preparation', topics:['Mock interviews — IIM & top B-school panels','Stress interviews & rapid-fire rounds','PI WAT preparation','Profile building & SOP guidance','GD topics & group discussion strategy'] },
  ],
  howSteps: HOW_STEPS_DEFAULT,
  plans: [
    { featured:true,  badge:'Most Popular', name:'Live + CAT Mocks',         price:'27,999', note:'Live sessions + 30 CAT mocks + 30 sectional + 140 area-wise', features:[{t:'Live two-way CAT sessions with ALP',ok:true},{t:'Quizzes · Micro Videos · Cheat Sheets',ok:true},{t:'Doubt support every session',ok:true},{t:'30 Full-Length CAT Mocks',ok:true},{t:'30 Sectional + 140 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'16 Printed Books',ok:false}] },
    { featured:false, badge:'Best Value',   name:'Live + All MBA Mocks',     price:'29,999', note:'CAT + XAT + SNAP + NMAT + CMAT — 500 area-wise tests', features:[{t:'Live two-way CAT sessions with ALP',ok:true},{t:'30 CAT Mocks + XAT + SNAP + NMAT + CMAT',ok:true},{t:'30 Sectional + 500 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'16 Printed Books',ok:false}] },
    { featured:false, badge:'With Books',   name:'Live + CAT Mocks + Books', price:'31,999', note:'Live + 30 CAT mocks + 16 printed books', features:[{t:'Live two-way CAT sessions with ALP',ok:true},{t:'30 Full-Length CAT Mocks',ok:true},{t:'30 Sectional + 140 Area-wise Tests',ok:true},{t:'16 Printed Books — 2,236 pages',ok:true}] },
    { featured:false, badge:'Self-Paced',   name:'CAT Mocks Only',           price:'2,999',  note:'30 CAT + 30 sectional + 140 area-wise tests', features:[{t:'30 Full-Length CAT Mocks',ok:true},{t:'30 Sectional Mocks',ok:true},{t:'140 Area-wise Tests',ok:true},{t:'Post-test score reports',ok:true},{t:'Live sessions',ok:false}] },
  ],
  colleges: [
    {
      label: 'IIM BLACKI — Old IIMs',
      headers: ['College','Location','CAT Cutoff (General)','Avg. Package','Fees'],
      rows: [
        ['★ IIM Ahmedabad','Ahmedabad, Gujarat','99.5%+','₹30.08 LPA','₹25.3 L'],
        ['★ IIM Bangalore','Bengaluru, Karnataka','99%+','₹34.88 LPA','₹26.3 L'],
        ['★ IIM Calcutta','Kolkata, West Bengal','99%+','₹34.23 LPA','₹27 L'],
        ['★ IIM Lucknow','Lucknow, UP','97–98%','₹32.3 LPA','₹20.75 L'],
        ['★ IIM Kozhikode','Kozhikode, Kerala','97–98%','₹28.05 LPA','₹23.5 L'],
        ['★ IIM Indore','Indore, MP','96–98%','₹29.57 LPA','₹22.5 L'],
      ],
    },
    {
      label: 'Top Non-IIM Colleges',
      headers: ['College','Location','CAT Cutoff','Avg. Package','Fees'],
      rows: [
        ['★ FMS Delhi','New Delhi','99%+','₹32–34 LPA','₹2 L'],
        ['★ SPJIMR Mumbai','Mumbai, Maharashtra','98%+','₹30–32 LPA','₹20 L'],
        ['★ MDI Gurgaon','Gurgaon, Haryana','95–97%','₹25–28 LPA','₹21 L'],
        ['★ IIFT Delhi / Kolkata','Delhi & Kolkata','95–97%','₹22–26 LPA','₹18 L'],
      ],
    },
  ],
  testimonials: TESTIMONIALS,
  faqs: [
    { q:'When does the CAT 2026 batch start and what is the schedule?', a:'The CAT 2026 cohort begins in April 2026, aligned with the CAT notification. Sessions run 4–5 times per week covering VARC, DILR and QA. The programme runs through November and continues with GDPI preparation through March 2027.' },
    { q:'Why is the batch size capped at 27 students?', a:'The 27-student cap is not a marketing choice — it is the maximum at which two-way teaching is genuinely possible. Beyond 27, students stop asking questions mid-session and the class becomes a lecture.' },
    { q:'Are CAT sessions live or can I access recordings?', a:'All sessions are live and two-way. Recorded access is provided for every session so you can revise at your own pace. There is no substitute for attending live, but no session is lost if you miss one.' },
    { q:'Is CAT GDPI preparation included in the course fee?', a:'GDPI preparation is included in the Live + CAT Mocks + GDPI plan. It is also available separately through the PI WAT GD programme at ₹5,999. If you are on a mocks-only plan, GDPI preparation can be added at any point.' },
    { q:'Can a working professional manage the GRADSKOOL CAT course?', a:'Yes — a significant portion of every CAT cohort is working professionals. Sessions are scheduled in evenings and weekends. Recorded access means you never fall behind if work demands increase around deadlines.' },
    { q:'What is the refund policy?', a:'Digital products — live sessions, mocks, tool access — are non-refundable once access is granted. Printed books can be returned within 7 days of delivery if unused and undamaged. WhatsApp us at +91 6360597966 for any queries.' },
  ],
  alsoExams: ALSO_EXAMS.filter(e => !['cat'].includes(e.slug)).slice(0,5),
}

// ── XAT DATA ─────────────────────────────────────────────────────────────────

export const XAT_DATA = {
  slug:'xat', name:'XAT 2027', mocksSlug:'xat',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'Decision Making. The section every student fears.',
  description:'Xavier Aptitude Test — conducted by XLRI Jamshedpur. Accepted by 150+ B-schools. Unique Decision Making section that cannot be cracked with CAT preparation alone.',
  badge:'Enrolments Open',
  enrolPrice:'2,999',
  enrolNote:'With Interview Prep: ₹4,999',
  enrolFeatures:['Live two-way XAT sessions','Decision Making — full module','6 Full-Length XAT Mocks','12 Sectional Tests','40 Area-wise Tests','Post-test analysis every mock','Recorded session access'],
  heroStats:[['6','Full-Length XAT Mocks'],['12','Sectional Tests'],['100+','Hours Live Teaching'],['27','Students Per Cohort']],
  overview_cards:[
    {label:'Conducted By',value:'XLRI Jamshedpur'},
    {label:'Exam Month',value:'January'},
    {label:'Duration',value:'3 Hours 35 Min'},
    {label:'Part 1 Questions',value:'75 Questions'},
    {label:'Part 2 (GK)',value:'25 Questions'},
    {label:'Negative Marking',value:'−0.25 per wrong'},
    {label:'Unattempted Penalty',value:'−0.10 (8+ skipped)'},
    {label:'Mode',value:'Computer Based'},
  ],
  sections:[
    {num:'Section 01',name:'Decision Making',badge:'Unique to XAT',pills:['~21 Questions','No other exam tests this'],topics:['Business situation analysis framework','Ethical dilemma reasoning','Trade-off evaluation methodology','Multi-stakeholder scenario problems','XLRI-specific DM tendencies']},
    {num:'Section 02',name:'Verbal Ability & Logical Reasoning',pills:['~26 Questions','RC Heavy'],topics:['Reading Comprehension — dense passages','Critical reasoning — argument structure','Para-jumbles and para-summary','Vocabulary in context','Logical reasoning inferences']},
    {num:'Section 03',name:'Quantitative Aptitude & DI',pills:['~28 Questions','Calculation Heavy'],topics:['Arithmetic & Algebra','Geometry and number systems','Data Interpretation sets','Negative marking management','No TITA questions in XAT']},
    {num:'Section 04',name:'General Knowledge (Part 2)',pills:['25 Questions','Not for percentile'],topics:['Business awareness and corporate GK','Current affairs','Static GK — awards, appointments','International business and economics','XAT-specific GK patterns']},
  ],
  eligibility:[
    {icon:'🎓',title:'Educational Qualification',body:"A Bachelor's degree in any discipline from a recognised university. Final-year students can apply."},
    {icon:'🚫',title:'No Age Limit',body:'XAT has no upper or lower age limit. Both fresh graduates and working professionals appear.'},
    {icon:'🔁',title:'No Attempt Limit',body:'XAT is conducted once a year in January. No limit on attempts.'},
    {icon:'💼',title:'Work Experience',body:'Not mandatory for XAT. However, valued by XLRI BM and HRM during GD-PI process.'},
  ],
  key_dates:[
    {month:'AUG',year:'2026',event:'Registration Opens',detail:'XAT registration opens on xatonline.in. Fee: ~₹2,000. Apply to all target colleges at this stage.'},
    {month:'NOV',year:'2026',event:'Registration Closes',detail:'Late registration typically allowed with penalty. Admit card available after registration closes.'},
    {month:'JAN',year:'2027',event:'XAT Exam Day',detail:'First Sunday of January. Computer-based. 3 hours 35 minutes. No calculator permitted.'},
    {month:'JAN',year:'2027',event:'XAT Results',detail:'Scorecard released within 2–3 weeks. Sectional and overall percentiles. Shortlists follow.'},
    {month:'FEB',year:'2027',event:'GD-PI / WAT Rounds',detail:'XLRI conducts GD-PI-WAT for shortlisted candidates. Other institutes have their own schedules.'},
  ],
  curriculum:[
    {num:'Module 01',title:'Decision Making — Foundations',topics:['Business situation analysis framework','Ethical dilemma reasoning','Trade-off evaluation methodology','Identifying the most defensible option','Module-specific DM practice sets']},
    {num:'Module 02',title:'Decision Making — Advanced',topics:['Complex multi-stakeholder scenarios','DM passage-based question patterns','Time management in DM section','Common traps in DM answer options','XLRI-specific DM tendencies']},
    {num:'Module 03',title:'Verbal Ability & Logical Reasoning',topics:['Dense RC passage strategy for XAT','Critical reasoning — argument structure','Para-jumbles and para-summary','Vocabulary in context','Logical reasoning deductions']},
    {num:'Module 04',title:'Quantitative Aptitude & DI',topics:['Arithmetic — ratio, percentage, P&L, TSD','Algebra and number systems','Geometry and mensuration','DI sets — tables, charts, caselets','Attempt strategy and negative marking']},
    {num:'Module 05',title:'General Knowledge',topics:['Business awareness and corporate GK','Current affairs — monthly digest','Static GK — awards, appointments, summits','International business and economics','XAT-specific GK patterns']},
    {num:'Module 06',title:'Mock Tests & XLRI Interview Prep',topics:['6 full-length XAT mocks — post-test analysis','12 sectional tests (DM, VALR, QADI)','40 area-wise topic tests','XLRI PI — panel format mock interviews','GD and essay preparation for XLRI process']},
  ],
  howSteps:HOW_STEPS_DEFAULT,
  plans:[
    {featured:true,badge:'Live Programme',name:'XAT Live + Mocks',price:'2,999',note:'Live sessions + 6 XAT mocks + 12 sectional + 40 area-wise',features:[{t:'Live two-way XAT sessions with ALP',ok:true},{t:'Decision Making — full module',ok:true},{t:'6 Full-Length XAT Mocks',ok:true},{t:'12 Sectional + 40 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'XLRI Interview Prep',ok:false}]},
    {featured:false,badge:'With Interview',name:'XAT Live + Mocks + Interview',price:'4,999',note:'Live + mocks + XLRI PI WAT GD prep',features:[{t:'Live two-way XAT sessions with ALP',ok:true},{t:'6 Full-Length XAT Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'XLRI PI mock interviews',ok:true},{t:'GD and WAT preparation',ok:true}]},
  ],
  colleges:[{
    label:'Top XAT-Accepting Colleges',
    headers:['College','Location','XAT Cutoff','Avg. Package','Fees'],
    rows:[
      ['★ XLRI Jamshedpur — BM','Jamshedpur, Jharkhand','95%+','₹30–35 LPA','₹24 L'],
      ['★ XLRI Jamshedpur — HRM','Jamshedpur, Jharkhand','90%+','₹28–32 LPA','₹24 L'],
      ['SPJIMR Mumbai','Mumbai, Maharashtra','90%+','₹28–30 LPA','₹22 L'],
      ['IMT Ghaziabad','Ghaziabad, UP','85%+','₹14–17 LPA','₹18 L'],
      ['XIMB Bhubaneswar','Bhubaneswar, Odisha','85%+','₹14–18 LPA','₹18 L'],
      ['GIM Goa','Goa','80%+','₹12–14 LPA','₹16 L'],
    ],
  }],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is the Decision Making section in XAT?',a:'Decision Making is the most distinctive and feared section of XAT. It tests your ability to evaluate business situations, identify the best course of action, weigh ethical trade-offs, and reason through complex scenarios. It cannot be cracked with CAT preparation alone — it requires dedicated frameworks which GRADSKOOL builds from the ground up.'},
    {q:'Does XAT preparation at GRADSKOOL include GK?',a:'Yes. GRADSKOOL\'s XAT programme includes a dedicated GK module covering business awareness, current affairs, static GK, and international business. While GK does not contribute to the XAT percentile, it is considered by XLRI and other colleges during shortlisting.'},
    {q:'How many mocks are included in the XAT programme?',a:'The XAT programme includes 6 full-length XAT-pattern mocks, 12 sectional tests (DM, VALR, QADI), and 40 area-wise topic tests. Every mock is followed by detailed post-test analysis.'},
    {q:'Does GRADSKOOL prepare for XLRI interviews?',a:'Yes. The XAT programme includes XLRI PI preparation — panel format mock interviews, GD and essay preparation specifically for the XLRI process, and WAT preparation.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['xat'].includes(e.slug)).slice(0,5),
}

// ── SNAP DATA ────────────────────────────────────────────────────────────────

export const SNAP_DATA = {
  slug:'snap', name:'SNAP 2026', mocksSlug:'snap',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'60 questions. 60 minutes. No sectional time limit.',
  description:'Symbiosis National Aptitude Test — conducted by SIU for all 17 Symbiosis MBA institutes. SIBM Pune, SCMHRD, SIIB and more. 3 attempts per year.',
  badge:'Enrolments Open',
  enrolPrice:'2,999',
  enrolNote:'With Interview Prep: ₹4,999',
  enrolFeatures:['Live two-way SNAP sessions','All 3 sections — full coverage','20 Full-Length SNAP Mocks','12 Sectional Tests','60 Area-wise Tests','Post-test analysis every mock','Recorded session access'],
  heroStats:[['20','Full-Length SNAP Mocks'],['12','Sectional Tests'],['100+','Hours Live Teaching'],['27','Students Per Cohort']],
  overview_cards:[
    {label:'Conducted By',value:'SIU, Pune'},
    {label:'Exam Month',value:'December (3 dates)'},
    {label:'Duration',value:'60 Minutes'},
    {label:'Total Questions',value:'60 Questions'},
    {label:'Total Marks',value:'60 Marks'},
    {label:'Max Attempts',value:'3 Per Cycle'},
    {label:'Negative Marking',value:'−0.25 per wrong'},
    {label:'Mode',value:'Computer Based'},
  ],
  sections:[
    {num:'Section 01',name:'General English',pills:['15 Questions','15 Marks'],topics:['Vocabulary — synonyms, antonyms, analogies','Grammar and fill in the blanks','Idioms and one-word substitution','No RC passages — vocabulary focused','Verbal reasoning']},
    {num:'Section 02',name:'Analytical & Logical Reasoning',badge:'Highest Weightage',pills:['25 Questions','25 Marks'],topics:['Blood relations, directions, syllogisms','Coding-decoding, clocks, series','Puzzles and seating arrangements','Critical reasoning and inferences','25 questions in 60-minute total']},
    {num:'Section 03',name:'Quantitative, DI & DS',pills:['20 Questions','20 Marks'],topics:['Arithmetic and algebra','Data Interpretation — tables, charts, caselets','Data Sufficiency — two-statement problems','Geometry and number systems','Speed management for 60-minute constraint']},
  ],
  eligibility:[
    {icon:'🎓',title:'Educational Qualification',body:"A Bachelor's degree from a recognised university. Minimum 50% marks for most SIU institutes."},
    {icon:'📅',title:'Final Year Students',body:'Students in final year can apply. Degree must be completed before joining.'},
    {icon:'🔁',title:'3 Attempts Per Year',body:'SNAP allows up to 3 attempts per year across 3 December dates. No-shows do not count as attempts. Best score used for all SIU admissions.'},
    {icon:'🚫',title:'No Age Limit',body:'SNAP has no upper or lower age limit.'},
  ],
  key_dates:[
    {month:'AUG',year:'2026',event:'SNAP Registration Opens',detail:'Registration at snaptest.org. Fee: ₹2,250 per attempt + ₹1,000 per Symbiosis college. Book all 3 test dates at once.'},
    {month:'NOV',year:'2026',event:'Registration Closes',detail:'Last date to register for SNAP. Admit cards for each test date released 1–2 weeks before the exam.'},
    {month:'DEC',year:'2026',event:'SNAP — Test 1',detail:'First of 3 SNAP test dates. 60 minutes, 60 questions. No sectional time limits.'},
    {month:'DEC',year:'2026',event:'SNAP — Tests 2 & 3',detail:'Second and third SNAP test dates. All 3 attempts optional. Best score used for all SIU admissions.'},
    {month:'JAN',year:'2027',event:'Results & SIU Shortlists',detail:'Results announced second week of January. SIU institutes release PI shortlists.'},
    {month:'FEB',year:'2027',event:'GE-PI & Final Offers',detail:'Group Exercise, WAT, PI rounds. Final merit: SNAP 50% + GE-PI-WAT 30% + Academics 20%.'},
  ],
  curriculum:[
    {num:'Module 01',title:'General English',topics:['Vocabulary — synonyms, antonyms, analogies, one-word substitution','Grammar — error identification, sentence correction','Fill in the blanks — grammar and vocabulary','Idioms, phrases and contextual usage','Verbal reasoning']},
    {num:'Module 02',title:'Analytical & Logical Reasoning',topics:['Blood relations and directions','Syllogisms and coding-decoding','Clocks, calendars and series','Puzzles and seating arrangements','Critical reasoning and inferences']},
    {num:'Module 03',title:'Quantitative, DI & DS',topics:['Arithmetic — percentages, ratios, profit and loss','Algebra and number systems','Data Interpretation — tables, charts, caselets','Data Sufficiency — two-statement problems','Speed management for 60-minute constraint']},
    {num:'Module 04',title:'No Sectional Time Limit Strategy',topics:['Section order strategy for maximum marks','Time banking techniques','Cross-section switching rules','Handling easy vs hard question decisions','Speed drills for 60-minute environment']},
    {num:'Module 05',title:'Mock Tests & SIU Interview Prep',topics:['20 full-length SNAP mocks — post-test analysis','12 sectional tests','60 area-wise topic tests','SIBM Pune and SCMHRD GE-PI preparation','WAT essay writing for Symbiosis process']},
  ],
  howSteps:HOW_STEPS_DEFAULT,
  plans:[
    {featured:true,badge:'Live Programme',name:'SNAP Live + Mocks',price:'2,999',note:'Live sessions + 20 SNAP mocks + 12 sectional + 60 area-wise',features:[{t:'Live two-way SNAP sessions with ALP',ok:true},{t:'All 3 sections — full coverage',ok:true},{t:'20 Full-Length SNAP Mocks',ok:true},{t:'12 Sectional + 60 Area-wise Tests',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'Interview Prep',ok:false}]},
    {featured:false,badge:'With Interview',name:'SNAP Live + Mocks + Interview',price:'4,999',note:'Live + mocks + SIBM Pune GE-PI-WAT prep',features:[{t:'Live two-way SNAP sessions',ok:true},{t:'20 Full-Length SNAP Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'SIBM Pune GE-PI preparation',ok:true},{t:'WAT essay writing',ok:true}]},
  ],
  colleges:[{
    label:'Top Symbiosis Institutes (SIU)',
    headers:['College','Location','SNAP Cutoff','Avg. Package','Fees'],
    rows:[
      ['★ SIBM Pune','Pune, Maharashtra','98.5%+','₹23.71 LPA','₹21 L'],
      ['★ SCMHRD Pune','Pune, Maharashtra','97%+','₹13.48 LPA','₹18 L'],
      ['★ SIIB Pune','Pune, Maharashtra','95%+','₹12–14 LPA','₹16 L'],
      ['SIBM Bengaluru','Bengaluru, Karnataka','92–93%','₹13.48 LPA','₹16 L'],
      ['SCIT / SIMC Pune','Pune, Maharashtra','83–87%','₹11.5 LPA','₹14–16 L'],
      ['SIBM Nagpur / Hyderabad','Various','60–83%','₹5–10 LPA','₹10–14 L'],
    ],
  }],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is the no-sectional-time-limit advantage in SNAP?',a:'Unlike CAT, SNAP has no fixed section timings — you can move freely between all three sections within the 60-minute window. GRADSKOOL trains you to exploit this by starting with your strongest section, banking marks early, and managing time across all three.'},
    {q:'Can I attempt SNAP multiple times?',a:'Yes. SNAP allows up to 3 attempts per year across 3 dates in December. No-shows do not count as attempts. Best score used for all SIU admissions.'},
    {q:'Which colleges accept SNAP scores?',a:'SNAP scores are accepted exclusively by all 17 Symbiosis International University institutes. The most targeted are SIBM Pune, SCMHRD Pune, SIIB Pune, SIBM Bengaluru and SCIT Pune.'},
    {q:'How many mocks are in the GRADSKOOL SNAP programme?',a:'The SNAP programme includes 20 full-length SNAP-pattern mocks, 12 sectional tests, and 60 area-wise tests. Every mock is followed by section-wise post-test analysis.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['snap'].includes(e.slug)).slice(0,5),
}

// ── NMAT DATA ────────────────────────────────────────────────────────────────

export const NMAT_DATA = {
  slug:'nmat', name:'NMAT 2026', mocksSlug:'nmat',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'3 attempts. No negative marking. Section order choice.',
  description:'NMAT by GMAC — the primary entrance for NMIMS University. No negative marking, 3 attempts per cycle, and a 45-day testing window. Also accepted by XIMB, KJ Somaiya, TAPMI and 50+ colleges globally.',
  badge:'Enrolments Open',
  enrolPrice:'3,999',
  enrolNote:'With Competency Test & Interviews: ₹4,999',
  enrolFeatures:['Live two-way NMAT sessions','All 3 sections — full coverage','10 Full-Length NMAT Mocks','12 Sectional Tests','50 Area-wise Tests','Post-test analysis every mock','Recorded session access'],
  heroStats:[['10','Full-Length NMAT Mocks'],['12','Sectional Tests'],['100+','Hours Live Teaching'],['27','Students Per Cohort']],
  overview_cards:[
    {label:'Conducted By',value:'GMAC'},
    {label:'Test Window',value:'~45 Days'},
    {label:'Duration',value:'120 Minutes'},
    {label:'Total Questions',value:'108 Questions'},
    {label:'Score Range',value:'0 – 360'},
    {label:'Max Attempts',value:'3 Per Cycle'},
    {label:'Negative Marking',value:'None'},
    {label:'Mode',value:'Computer Adaptive'},
  ],
  sections:[
    {num:'Section 01',name:'Language Skills',badge:'Tightest Section',pills:['36 Questions','28 Minutes'],topics:['Reading Comprehension and vocabulary','Grammar and para-jumbles','Synonyms, antonyms, fill in the blanks','Under 47 seconds per question','Speed and fluency critical']},
    {num:'Section 02',name:'Logical Reasoning',pills:['36 Questions','40 Minutes'],topics:['Syllogisms and blood relations','Critical reasoning','Puzzles and arrangement sets','Courses of action and inferences','More predictable than CAT DILR']},
    {num:'Section 03',name:'Quantitative Skills',badge:'Most Time',pills:['36 Questions','52 Minutes'],topics:['Arithmetic, algebra, geometry','Data Interpretation — tables, charts','Data Sufficiency — two-statement','Accuracy is key — not speed','Moderate difficulty vs CAT QA']},
  ],
  eligibility:[
    {icon:'🎓',title:'Educational Qualification',body:"A Bachelor's degree from a recognised university. Minimum 50% marks for most participating colleges."},
    {icon:'🔁',title:'3 Attempts Per Cycle',body:'Up to 3 attempts with minimum 15-day gap between attempts. NMIMS considers your best score. GRADSKOOL builds a 3-attempt strategy.'},
    {icon:'🚫',title:'No Age Limit',body:'No age limit. No reservation policy from GMAC.'},
    {icon:'📅',title:'45-Day Test Window',body:'Flexible testing window of ~45 days running October to December. Choose your preferred date, time and test centre.'},
  ],
  key_dates:[
    {month:'AUG',year:'2026',event:'Registration Opens',detail:'Registration on mba.com/nmat. Register early — popular test centres fill up fast. Fee: ~₹2,300.'},
    {month:'OCT',year:'2026',event:'Testing Window Opens',detail:'The NMAT testing window opens in mid-October. Online proctored exams also available.'},
    {month:'DEC',year:'2026',event:'Testing Window Closes',detail:'Final date to take NMAT 2026. Official scores within 48–72 hours of each attempt.'},
    {month:'JAN',year:'2027',event:'NMIMS Shortlisting',detail:'NMIMS releases shortlists. Candidates called for Competency Test (aptitude + psychometric + writing) and Personal Interview.'},
  ],
  curriculum:[
    {num:'Module 01',title:'Language Skills — Foundations',topics:['Reading Comprehension — speed reading and inference','Vocabulary — synonyms, antonyms, contextual usage','Grammar — error identification and sentence correction','Para-jumbles and fill in the blanks','Speed strategy for 28-minute constraint']},
    {num:'Module 02',title:'Logical Reasoning',topics:['Syllogisms and blood relations','Critical reasoning — argument evaluation','Puzzles and arrangement sets','Courses of action and inferences','Pattern recognition for 40-minute section']},
    {num:'Module 03',title:'Quantitative Skills',topics:['Arithmetic — percentages, ratios, profit and loss','Algebra, geometry, number systems','Data Interpretation — tables, charts, caselets','Data Sufficiency — two-statement problems','Accuracy focus for 52-minute section']},
    {num:'Module 04',title:'Section Order Strategy',topics:['Why most NMAT toppers start with QA','Language Skills — managing the tightest section','LR — predictable patterns and speed','Cross-section time allocation','Retake strategy — when and how to reschedule']},
    {num:'Module 05',title:'Mock Tests & NMIMS Interview Prep',topics:['10 full-length NMAT mocks — post-test analysis','12 sectional tests','50 area-wise topic tests','NMIMS Competency Test preparation','NMIMS PI and psychometric preparation']},
  ],
  howSteps:HOW_STEPS_DEFAULT,
  plans:[
    {featured:true,badge:'Live Programme',name:'NMAT Live + Mocks',price:'3,999',note:'Live sessions + 10 NMAT mocks + 12 sectional + 50 area-wise',features:[{t:'Live two-way NMAT sessions with ALP',ok:true},{t:'All 3 sections — full coverage',ok:true},{t:'Section order strategy',ok:true},{t:'10 Full-Length NMAT Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'NMIMS Interview Prep',ok:false}]},
    {featured:false,badge:'With Interview',name:'NMAT Live + Mocks + Interview',price:'4,999',note:'Live + mocks + NMIMS Competency Test + PI prep',features:[{t:'Live two-way NMAT sessions',ok:true},{t:'10 Full-Length NMAT Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'NMIMS Competency Test prep',ok:true},{t:'NMIMS PI preparation',ok:true},{t:'Psychometric test preparation',ok:true}]},
  ],
  colleges:[{
    label:'NMIMS Campuses',
    headers:['College','Location','NMAT Cutoff','Avg. Package','Fees'],
    rows:[
      ['★ NMIMS Mumbai — MBA Core','Mumbai, Maharashtra','232–240+','₹25.13 LPA','₹21–24 L'],
      ['★ NMIMS Mumbai — MBA HR','Mumbai, Maharashtra','220–235+','₹25.02 LPA','₹20–23 L'],
      ['NMIMS Bangalore','Bengaluru, Karnataka','209–224+','₹14–18 LPA','₹18–20 L'],
      ['NMIMS Hyderabad / Indore','Hyderabad & Indore','200–215+','₹12–15 LPA','₹15–18 L'],
      ['XIMB Bhubaneswar','Bhubaneswar, Odisha','215–225+','₹14–18 LPA','₹18 L'],
      ['KJ Somaiya / TAPMI / SDA','Various','200–220+','₹10–14 LPA','₹14–20 L'],
    ],
  }],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is the section order choice in NMAT?',a:'NMAT allows you to choose the order in which you attempt the three sections. Most NMAT toppers recommend starting with Quantitative Skills (most time at 52 minutes), then LR, and finishing with Language Skills (tightest at 28 minutes). GRADSKOOL trains you to use this strategically.'},
    {q:'Does NMAT have negative marking?',a:'No. NMAT has zero negative marking. You should attempt every question, even if unsure. The strategy shifts from risk management to pure accuracy maximisation.'},
    {q:'Can I retake NMAT if my score is low?',a:'Yes. NMAT allows up to 3 attempts per cycle with a minimum 15-day gap. NMIMS considers your best score. GRADSKOOL\'s programme builds a 3-attempt strategy — knowing when to retake and how to improve each time.'},
    {q:'What colleges accept NMAT scores?',a:'NMAT is the primary exam for NMIMS Mumbai. It is also accepted by XIMB, KJ Somaiya, TAPMI, SDA Bocconi and 50+ colleges globally.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['nmat'].includes(e.slug)).slice(0,5),
}

// ── IPMAT DATA ───────────────────────────────────────────────────────────────

export const IPMAT_DATA = {
  slug:'ipmat', name:'IPMAT 2027', mocksSlug:'ipmat',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'The only direct route to an IIM without CAT.',
  description:'IPMAT — the entrance for IIM Indore\'s 5-year IPM programme. 89 full-length mocks across 12 programmes — IIM Indore, Rohtak, JIPMAT, NPAT, SET, Xaviers, Christ, IIM B, IIMK and more.',
  badge:'Enrolments Open',
  enrolPrice:'11,999',
  enrolNote:'Mocks only: ₹2,499 · Complete with books: ₹19,999',
  enrolFeatures:['Live two-way sessions with ALP Sir','89 Full-Length Mocks — 12 programmes','IIM Indore, Rohtak, JIPMAT, NPAT covered','19 Printed Books (select plans)','Interview preparation included','Recorded session access'],
  heroStats:[['89','Full-Length Mocks'],['12','Programmes Covered'],['100+','Hours Live Teaching'],['27','Students Per Cohort']],
  overview_cards:[
    {label:'Conducted By',value:'IIM Indore'},
    {label:'Exam Month',value:'May (Typically)'},
    {label:'Duration',value:'180 Minutes'},
    {label:'Total Questions',value:'100 Questions'},
    {label:'Sections',value:'2 Sections'},
    {label:'MCQ Marking',value:'+4 / −1'},
    {label:'SA Marking',value:'+4 / No Negative'},
    {label:'Mode',value:'Computer Based'},
  ],
  sections:[
    {num:'Section 01',name:'Quantitative Ability',badge:'The Differentiator',pills:['60 Questions','90 Minutes','40 MCQ + 20 Short Answer'],topics:['Number Systems, Algebra, Geometry, Arithmetic','P&C, Probability, Data Interpretation','20 Short Answer questions — exact computation required','No options for SA — must compute answer','SA strategy: the section most coaching programmes skip']},
    {num:'Section 02',name:'Verbal Ability',pills:['40 Questions','40 MCQ','90 Minutes'],topics:['Reading Comprehension — moderate difficulty','Vocabulary — synonyms, antonyms, one-word substitution','Grammar — sentence correction, fill in the blanks','Para-jumbles and passage-based questions','Speed and vocabulary depth are key']},
    {num:'IIM Rohtak Variant',name:'Logical Reasoning (Rohtak)',pills:['40 Questions','40 Minutes'],topics:['Syllogisms, arrangements, coding-decoding','Blood relations, directions, analogies','Series — number, alphabetic, mixed','Statement-conclusion, cause and effect']},
  ],
  eligibility:[
    {icon:'🎓',title:'Class 12 Students',body:'Students who have passed or are appearing in Class 12 (10+2) from any recognised board can apply.'},
    {icon:'📊',title:'Minimum Percentage',body:'60% aggregate in Class 12 for General/OBC/EWS (55% for SC/ST/PwD). Varies slightly by IIM.'},
    {icon:'🎂',title:'Age Limit',body:'Below 20 years of age as of July 31 of the admission year. 25 years for SC/ST/PwD candidates.'},
    {icon:'📋',title:'12 Programmes Covered',body:'GRADSKOOL covers IIM Indore, Rohtak, JIPMAT, NPAT, IPU CET, SET, Xaviers, Christ, IIM B DBE/DSE, IIMK BMS and MH BBA/BMS.'},
  ],
  key_dates:[
    {month:'JAN',year:'2027',event:'Official Notification Released',detail:'IIM Indore releases the official IPMAT notification with exam schedule, eligibility, registration process, and fee structure.'},
    {month:'JAN',year:'2027',event:'Registration Window Opens',detail:'Online applications on IIM Indore IPM portal. Fee: ~₹4,130 (General/OBC/EWS), ₹2,065 (SC/ST/PwD). Apply early.'},
    {month:'APR',year:'2027',event:'Admit Card Download',detail:'Hall tickets available approximately 7–10 days before the exam. Download and carry a printed copy with valid photo ID.'},
    {month:'MAY',year:'2027',event:'IPMAT Exam Day',detail:'Computer-based test across India. QA section (60 Qs, 90 mins) followed by VA section (40 Qs, 90 mins). Sectional time limits strictly enforced.'},
    {month:'JUN',year:'2027',event:'Results and PI-WAT Shortlist',detail:'IIM Indore releases results and shortlists candidates. Both QA and VA must clear minimum sectional thresholds independently.'},
    {month:'JUL',year:'2027',event:'Final Merit List and Admissions',detail:'Final merit combines IPMAT score + Class 10 and 12 marks + PI-WAT. Programme begins July/August at IIM Indore.'},
  ],
  curriculum:[
    {num:'Module 01',title:'Quantitative Ability — Arithmetic',topics:['Percentages, profit and loss, discount','Simple and compound interest','Ratio, proportion, and mixtures','Time-speed-distance, time and work','Short Answer strategy — exact computation techniques']},
    {num:'Module 02',title:'Quantitative Ability — Algebra and Advanced',topics:['Linear and quadratic equations','Sequences, series, and progressions','Permutation, combination, and probability','Set theory and functions','Geometry — triangles, circles, mensuration']},
    {num:'Module 03',title:'Quantitative Ability — Number Systems and DI',topics:['Divisibility, HCF, LCM, remainders','Number properties and unit digit patterns','Data Interpretation — tables, bar graphs, line charts','Venn diagrams and set-based DI','Calculation speed — shortcuts for SA questions']},
    {num:'Module 04',title:'Verbal Ability — Foundation',topics:['Vocabulary — roots, synonyms, antonyms','One-word substitution and idioms','Grammar — subject-verb agreement, tenses, articles','Fill in the blanks — contextual and grammatical','Sentence correction and error spotting']},
    {num:'Module 05',title:'Verbal Ability — Reading and Reasoning',topics:['Reading Comprehension — inference, main idea, tone','Para-jumbles — logical sequencing approach','Para-summary and odd sentence out','Critical reasoning for IIM Rohtak pattern','Timed RC practice with IIM-level passages']},
    {num:'Module 06',title:'Logical Reasoning and Exam Strategy',topics:['Syllogisms, arrangements, coding-decoding','Blood relations, directions, analogies','Sectional time management — 90 mins per section','MCQ vs SA question prioritisation in QA','Full-length mocks with post-test analysis']},
  ],
  howSteps:[
    {num:'01',title:'Live Session',body:'Two-way live class building QA precision and VA speed — with special focus on the Short Answer questions that most coaching programmes skip.'},
    {num:'02',title:'89 Full-Length Mocks',body:'89 mocks across 12 programmes — IIM Indore (15), Rohtak (9), JIPMAT (9), NPAT (9), IPU CET (5), SET (6), Xaviers (4), Christ (4), IIM B DBE/DSE (10), IIMK BMS (4), MH BBA/BMS (4).'},
    {num:'03',title:'19 Printed Books',body:'Theory notes, solved examples, and exam-specific practice tests in print — delivered to your address. Each book designed for IIM Indore\'s difficulty level.'},
    {num:'04',title:'PI and WAT Preparation',body:'Shortlisted candidates appear for PI and WAT at IIM Indore. GRADSKOOL covers interview preparation, written ability test coaching, and profile-specific guidance.'},
  ],
  plans:[
    {featured:false,badge:'Mocks Only',name:'IPMAT Mocks',price:'2,499',note:'89 full-length mocks — 12 programmes. No live sessions.',features:[{t:'89 Full-Length Mocks — 12 programmes',ok:true},{t:'IIM Indore, Rohtak, JIPMAT, NPAT',ok:true},{t:'Live sessions',ok:false},{t:'Printed books',ok:false}]},
    {featured:true,badge:'Most Popular',name:'Live + Mocks',price:'11,999',note:'Live sessions + 89 mocks + interview prep',features:[{t:'Live two-way sessions with ALP',ok:true},{t:'89 Full-Length Mocks — 12 programmes',ok:true},{t:'Free IPMAT tools',ok:true},{t:'Interview preparation',ok:true},{t:'Printed books',ok:false}]},
    {featured:false,badge:'Complete',name:'Complete Package',price:'19,999',note:'Live + 89 mocks + 19 printed books + interview prep',features:[{t:'Live two-way sessions with ALP',ok:true},{t:'89 Full-Length Mocks — 12 programmes',ok:true},{t:'19 Printed Books — theory + practice',ok:true},{t:'PI and WAT preparation',ok:true},{t:'Profile-specific guidance',ok:true}]},
  ],
  colleges:[{
    label:'IIM IPM Programmes',
    headers:['College','Location','Cutoff','Avg. Placement','Reg. Fee'],
    rows:[
      ['★ IIM Indore — IPM','Indore, MP','QA 70%+ VA 70%+','IIM Indore PGP Placements','₹4,130'],
      ['★ IIM Rohtak — IPM','Rohtak, Haryana','QA 60%+ LR 60%+','IIM Rohtak PGP','₹2,065'],
      ['JIPMAT — IIM Jammu/Bodh Gaya','Jammu / Bodh Gaya','NTA score based','IIM JBG Placements','NTA fee'],
      ['NMIMS — NPAT','Mumbai, Maharashtra','Score based','NMIMS Placements','₹2,300'],
      ['Symbiosis — SET','Pune, Maharashtra','Score based','SIU Placements','₹1,750'],
      ['IP University — IPU CET','Delhi','Score based','IPU Placements','State fee'],
    ],
  }],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is IPMAT and why is it significant?',a:'IPMAT is the entrance exam for the 5-year IPM programme at IIM Indore — India\'s most prestigious undergraduate management programme. It is the only direct route to an IIM degree without appearing in CAT. Clearing IPMAT at 18 means you skip the need to compete in CAT later.'},
    {q:'What makes the Short Answer questions in IPMAT unique?',a:'The 20 Short Answer questions have no options — you must compute exact answers. There is no negative marking on SA, but wrong MCQs cost −1. Most coaching programmes do not prepare students for this format. GRADSKOOL dedicates an entire module specifically to SA strategy.'},
    {q:'How many programmes does GRADSKOOL cover for IPMAT?',a:'GRADSKOOL\'s IPMAT programme includes 89 full-length mocks across 12 programmes: IIM Indore (15), IIM Rohtak (9), JIPMAT (9), NPAT (9), IPU CET (5), SET (6), Xaviers (4), Christ (4), IIM B DBE/DSE (10), IIMK BMS (4), MH BBA/BMS (4).'},
    {q:'Does GRADSKOOL prepare for the PI-WAT round at IIM Indore?',a:'Yes. Shortlisted candidates appear for PI and WAT at IIM Indore. The final merit list combines IPMAT score + Class 10/12 marks + PI-WAT. GRADSKOOL covers PI preparation, WAT coaching, and profile-specific guidance in the complete package.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['ipmat'].includes(e.slug)).slice(0,5),
}

// ── GMAT DATA ────────────────────────────────────────────────────────────────

export const GMAT_DATA = {
  slug:'gmat', name:'GMAT Focus Edition', mocksSlug:'gmat',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'ISB, INSEAD, LBS, Wharton. Target 645–715+.',
  description:'The world\'s most widely used exam for MBA admissions — accepted by 7,700+ programs across 110+ countries. Conducted by GMAC. Current version: GMAT Focus Edition.',
  badge:'Enrolments Open',
  enrolPrice:'29,999',
  enrolNote:'With mocks: ₹34,999',
  enrolFeatures:['Live two-way sessions with ALP Sir','GMAT Focus Edition — full syllabus','Quant, Verbal & Data Insights modules','Official GMAT mock tests + analysis','Personalised score improvement plan','Application & school selection guidance','Recorded session access'],
  heroStats:[['205–805','Score Range'],['7,700+','Programs Accept GMAT'],['100+','Hours Live Teaching'],['27','Students Per Cohort']],
  overview_cards:[
    {label:'Conducted By',value:'GMAC'},
    {label:'Current Version',value:'Focus Edition'},
    {label:'Duration',value:'2 hrs 15 min'},
    {label:'Total Questions',value:'64 Questions'},
    {label:'Score Range',value:'205 – 805'},
    {label:'Sections',value:'3 Sections'},
    {label:'Negative Marking',value:'None'},
    {label:'Mode',value:'Online / Centre'},
  ],
  sections:[
    {num:'Section 01',name:'Quantitative Reasoning',pills:['21 Questions','45 Minutes'],topics:['Problem Solving — arithmetic, algebra, geometry','700–800 level problem solving','No Data Sufficiency in Focus Edition','Tricky word problem frameworks','Time management under pressure']},
    {num:'Section 02',name:'Verbal Reasoning',pills:['23 Questions','45 Minutes','RC + CR'],topics:['Reading Comprehension — passage analysis','Critical Reasoning — strengthen, weaken, assumption','Inference and bold-face questions','No Sentence Correction in Focus Edition','Eliminating trap answer choices']},
    {num:'Section 03',name:'Data Insights',badge:'New Section',pills:['20 Questions','45 Minutes'],topics:['Data Sufficiency — decision rules','Multi-Source Reasoning','Table Analysis and Graphics Interpretation','Two-Part Analysis','Time allocation across DI question types']},
  ],
  eligibility:[
    {icon:'🎂',title:'Age Requirement',body:'Minimum age 18 years. Candidates 13–17 can appear with parental consent. No upper age limit.'},
    {icon:'🎓',title:'Educational Qualification',body:'No specific academic qualification required to register. Individual business schools set their own admission requirements.'},
    {icon:'🔁',title:'Attempt Limit',body:'Up to 5 attempts in a rolling 12-month period with 16-day gaps. Lifetime limit of 8 attempts. Score valid for 5 years.'},
    {icon:'💼',title:'Work Experience',body:'Not mandatory for the GMAT. However, most top MBA programs (ISB, INSEAD, LBS) prefer 2–5 years of work experience.'},
  ],
  key_dates:[
    {month:'ANY',year:'TIME',event:'Register on mba.com/gmat',detail:'GMAT is available year-round. Book your preferred date — available up to 6 months in advance and as late as 24 hours before.'},
    {month:'SEP',year:'2026',event:'Peak Season Opens',detail:'Sep–Nov is the busiest period. Slots fill fast as students align with Round 1 MBA application deadlines. Book 6–8 weeks in advance.'},
    {month:'OCT',year:'2026',event:'Round 1 MBA Deadlines',detail:'Most top programs (ISB, INSEAD, LBS, Wharton, HBS) have Round 1 deadlines October–December. GMAT score must be ready 3 weeks before earliest deadline.'},
    {month:'JAN',year:'2027',event:'Round 2 MBA Deadlines',detail:'Round 2 deadlines fall January–March. Last realistic window for most programs. GMAT should ideally be completed by December 2026.'},
  ],
  curriculum:[
    {num:'Module 01',title:'Quantitative Reasoning — Foundations',topics:['Number properties and arithmetic','Algebra — equations, inequalities, functions','Ratios, percentages and word problems','Geometry — lines, triangles, circles','Coordinate geometry','Combinatorics and probability basics']},
    {num:'Module 02',title:'Quantitative Reasoning — Advanced',topics:['700–800 level problem solving','Tricky word problem frameworks','Shortcut and elimination strategies','Time management under pressure','Pattern recognition in hard QR']},
    {num:'Module 03',title:'Verbal Reasoning — Reading Comprehension',topics:['RC passage structure and main idea','Inference and application questions','Tone, purpose and author perspective','Eliminating trap answer choices','RC strategy under time pressure']},
    {num:'Module 04',title:'Verbal Reasoning — Critical Reasoning',topics:['Argument structure — premises and conclusions','Strengthen, weaken, assumption questions','Inference and bold-face questions','Flaw and evaluate questions','Trap answers in CR']},
    {num:'Module 05',title:'Data Insights — Full Module',topics:['Data Sufficiency — strategy and decision rules','Multi-Source Reasoning','Table Analysis and Graphics Interpretation','Two-Part Analysis','Time allocation across DI question types']},
    {num:'Module 06',title:'Mock Tests and Score Strategy',topics:['Official GMAT Focus mocks — full analysis','Section-order strategy','Score prediction and gap analysis','Retake strategy and score reporting','School selection by score range']},
  ],
  howSteps:HOW_STEPS_DEFAULT,
  plans:[
    {featured:true,badge:'Most Complete',name:'Live + Mocks',price:'34,999',note:'Live sessions + full-length GMAT Focus mocks',features:[{t:'Live two-way GMAT sessions with ALP',ok:true},{t:'Quantitative · Verbal · Data Insights',ok:true},{t:'Full-length GMAT Focus Edition mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'Doubt support every session',ok:true}]},
    {featured:false,badge:'Live Only',name:'Live Programme',price:'29,999',note:'Live sessions — no mocks',features:[{t:'Live two-way GMAT sessions with ALP',ok:true},{t:'Quantitative · Verbal · Data Insights',ok:true},{t:'Doubt support every session',ok:true},{t:'Full-length mocks',ok:false}]},
    {featured:false,badge:'Self-Paced',name:'Complete Self-Paced',price:'21,999',note:'Full self-paced — all three sections',features:[{t:'Quantitative Reasoning — self-paced',ok:true},{t:'Verbal Reasoning — self-paced',ok:true},{t:'Data Insights — self-paced',ok:true},{t:'Live sessions',ok:false}]},
  ],
  colleges:[
    {label:'Top Indian B-Schools Accepting GMAT',headers:['College','Location','GMAT Cutoff','Avg. Package','Fees'],rows:[
      ['★ ISB Hyderabad / Mohali','Hyderabad & Mohali','645–665+','₹34.07 LPA','₹42 L'],
      ['★ IIM Ahmedabad — PGPX','Ahmedabad, Gujarat','665–685+','₹37+ LPA','₹32 L'],
      ['★ IIM Bangalore — EPGP','Bengaluru, Karnataka','645–665+','₹35+ LPA','₹31 L'],
      ['IIM Calcutta — PGPEX','Kolkata, West Bengal','635–665+','₹32+ LPA','₹28 L'],
    ]},
    {label:'Top Global Programs',headers:['Program','Location','GMAT Cutoff','Avg. Package','Fees'],rows:[
      ['INSEAD (France / Singapore)','France / Singapore','655–675+','€113,000','€97,000'],
      ['London Business School','London, UK','645–665+','£85,000','£92,000'],
      ['NUS / NTU Singapore','Singapore','605–645+','SGD 95,000','SGD 70,000'],
      ['HBS / Wharton / Booth','USA — Top 5','675–705+','USD 175,000','USD 80,000'],
    ]},
  ],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is the GMAT Focus Edition and how is it scored?',a:'The GMAT Focus Edition has three sections: Quantitative Reasoning (21 Qs, 45 min), Verbal Reasoning (23 Qs, 45 min), and Data Insights (20 Qs, 45 min). Total score ranges from 205–805. AWA and Sentence Correction have been removed. Duration is 2 hours 15 minutes.'},
    {q:'Is the GMAT accepted in India for MBA admissions?',a:'Yes. ISB Hyderabad, IIM Ahmedabad PGPX, IIM Bangalore EPGP, and IIM Calcutta PGPEX all accept GMAT for their executive and 1-year MBA programmes. For 2-year MBA, GMAT is primarily for international programs like INSEAD, LBS, and HBS.'},
    {q:'How long does GMAT preparation take?',a:'Most students need 3–5 months to target 645–685+. The GRADSKOOL GMAT cohort runs 4–5 months covering all three sections with live sessions, daily practice, and mock analysis.'},
    {q:'What is the GMAT registration fee in India?',a:'The GMAT registration fee for Indian candidates is approximately ₹23,200 (USD 275) for test centre and ₹25,400 (USD 300) for online. 18% GST is added. Verify on mba.com before registering.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['gmat'].includes(e.slug)).slice(0,5),
}

// ── GRE DATA ─────────────────────────────────────────────────────────────────

export const GRE_DATA = {
  slug:'gre', name:'GRE General Test', mocksSlug:'gre',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'MIT, Stanford, CMU, NUS. Your 320+ score.',
  description:'GRE General Test by ETS — the primary exam for MS, PhD and Masters programmes worldwide. Verbal Reasoning, Quantitative Reasoning and Analytical Writing. 5,000-word vocabulary programme included.',
  badge:'Enrolments Open',
  enrolPrice:'19,999',
  enrolNote:'With mocks: ₹24,999',
  enrolFeatures:['Live two-way GRE sessions with ALP Sir','Verbal · Quantitative · AWA','5,000-word vocabulary programme','Full-length GRE mocks + AWA essay feedback','Doubt support every session','University shortlisting guidance'],
  heroStats:[['260–340','Verbal + Quant Score'],['5,000','Vocabulary Words'],['100+','Hours Live Teaching'],['27','Students Per Cohort']],
  overview_cards:[
    {label:'Conducted By',value:'ETS'},
    {label:'Frequency',value:'Year-round'},
    {label:'Total Duration',value:'1 hr 58 min'},
    {label:'Total Questions',value:'~54 Questions'},
    {label:'V+Q Score Range',value:'260 – 340'},
    {label:'AWA Score',value:'0 – 6'},
    {label:'Negative Marking',value:'No'},
    {label:'Mode',value:'Computer Adaptive'},
  ],
  sections:[
    {num:'Section 01',name:'Analytical Writing',pills:['1 Task','30 Minutes','Scored 0–6'],topics:['Analyse an Issue essay','Argument mapping and structure','Vocabulary for AWA — register and style','Essay templates and opening frameworks','Personalised essay feedback and scoring']},
    {num:'Section 02',name:'Verbal Reasoning',pills:['~27 Questions','~41 Minutes','Scored 130–170'],topics:['Reading Comprehension — inference, tone, purpose','Text Completion — 1, 2 and 3-blank questions','Sentence Equivalence strategy','5,000-word vocabulary programme','Short RC and paragraph argument questions']},
    {num:'Section 03',name:'Quantitative Reasoning',pills:['~27 Questions','~47 Minutes','Scored 130–170'],topics:['Quantitative Comparison — unique to GRE','Problem Solving — arithmetic, algebra, geometry','Data Interpretation sets','On-screen calculator provided','Overlapping sets and Venn diagrams']},
  ],
  eligibility:[
    {icon:'🎂',title:'No Age Limit',body:'No age limit. Students, working professionals, career-changers of any age can register.'},
    {icon:'🎓',title:'Educational Qualification',body:'No specific educational qualification required to take the GRE.'},
    {icon:'🔁',title:'Attempt Limit',body:'Up to 5 attempts in a rolling 12-month period (once every 21 days). Score valid for 5 years.'},
    {icon:'🪪',title:'Valid Passport Required',body:'Valid passport mandatory for Indian candidates. Aadhaar and PAN cards not accepted.'},
  ],
  key_dates:[
    {month:'ANY',year:'TIME',event:'Register on ets.org/gre',detail:'GRE is offered year-round. Book your preferred date and location. Popular centres fill up fast during Sep–Dec.'},
    {month:'JUL',year:'2026',event:'Ideal Test Window Opens',detail:'For Fall 2027 intake, taking GRE between July and September 2026 gives enough time for score reporting and a potential retake.'},
    {month:'SEP',year:'2026',event:'Peak Season — Book Early',detail:'Sep–Dec is the busiest period for GRE test centres in India. Slots fill weeks in advance.'},
    {month:'DEC',year:'2026',event:'Fall 2027 Application Deadlines',detail:'Most top MS programs (CMU, Purdue, Georgia Tech, NUS, TU Munich) have deadlines December 2026 – January 2027 for Fall 2027.'},
  ],
  curriculum:[
    {num:'Module 01',title:'Verbal Reasoning — Vocabulary',topics:['GRE high-frequency word list — 5,000 words','Vocabulary in context — not rote memorisation','Root words, prefixes and suffixes','Text Completion — 1, 2 and 3-blank questions','Sentence Equivalence strategy']},
    {num:'Module 02',title:'Verbal Reasoning — Reading Comprehension',topics:['GRE RC passage types and structures','Main idea, inference and application questions','Author\'s tone and purpose','Select-in-passage question type','Short RC and paragraph argument questions']},
    {num:'Module 03',title:'Quantitative Reasoning — Foundations',topics:['Arithmetic and number properties','Algebra — equations, inequalities, functions','Geometry — lines, triangles, circles, coordinate','Data analysis — statistics, probability','Quantitative Comparison strategy']},
    {num:'Module 04',title:'Quantitative Reasoning — 165+ Strategy',topics:['Hard QC questions — edge cases and traps','Plugging in and picking numbers efficiently','Geometry estimation techniques','Overlapping sets and Venn diagrams','Combinatorics and probability at 165+ level']},
    {num:'Module 05',title:'Analytical Writing Assessment',topics:['Analyse an Issue — structure and argument mapping','Analyse an Argument — flaw identification','Essay templates and opening frameworks','Vocabulary for AWA — register and style','Personalised essay feedback and scoring']},
    {num:'Module 06',title:'Mock Tests and Score Strategy',topics:['Official ETS PowerPrep mocks — full analysis','Section-adaptive test strategy','Score prediction and gap analysis','ScoreSelect strategy — which scores to send','University shortlisting by score and profile']},
  ],
  howSteps:[
    {num:'01',title:'Live Session',body:'Two-way live class where you work through reasoning aloud. Particularly important for GRE Verbal where logic matters more than memory.'},
    {num:'02',title:'Vocabulary Practice',body:'Daily structured vocabulary work — context-based, not flashcard memorisation. 15–20 words per day, built into passages and question sets for retention.'},
    {num:'03',title:'Mock Test',body:'Official ETS PowerPrep mocks at regular intervals under timed conditions. The adaptive nature of GRE means pacing and section-level strategy are practiced from day one.'},
    {num:'04',title:'AWA Feedback',body:'Written essay submissions reviewed with detailed feedback — argument structure, vocabulary range, coherence, scored against ETS rubric. Every student gets individual essay coaching.'},
  ],
  plans:[
    {featured:true,badge:'Most Complete',name:'Live + Mocks',price:'24,999',note:'Live sessions + full-length GRE mocks + AWA feedback',features:[{t:'Live two-way GRE sessions with ALP',ok:true},{t:'Verbal · Quantitative · AWA',ok:true},{t:'5,000-word vocabulary programme',ok:true},{t:'Full-length GRE mocks + AWA feedback',ok:true},{t:'Doubt support every session',ok:true}]},
    {featured:false,badge:'Live Only',name:'Live Programme',price:'19,999',note:'Live sessions + vocabulary — no mocks',features:[{t:'Live two-way GRE sessions with ALP',ok:true},{t:'Verbal · Quantitative · AWA',ok:true},{t:'5,000-word vocabulary programme',ok:true},{t:'Doubt support every session',ok:true},{t:'Full-length mocks',ok:false}]},
    {featured:false,badge:'Self-Paced',name:'Complete Self-Paced',price:'12,999',note:'GRE Verbal + Quantitative — full self-paced',features:[{t:'GRE Verbal — self-paced',ok:true},{t:'GRE Quantitative — self-paced',ok:true},{t:'Vocabulary programme included',ok:true},{t:'Live sessions',ok:false}]},
  ],
  colleges:[
    {label:'Top US Universities (MS / PhD)',headers:['University','Location','Typical GRE','Avg. Funding','Fees/yr'],rows:[
      ['★ MIT','Cambridge, Massachusetts','325–335+','USD 57,000+','USD 57,000+'],
      ['★ Stanford University','California','325–335+','USD 58,000+','USD 58,000+'],
      ['★ Carnegie Mellon University','Pittsburgh','320–335+','USD 52,000','USD 52,000'],
      ['Georgia Tech','Atlanta, GA','315–330+','USD 30,000','USD 30,000'],
      ['Purdue / UMich / UCSD','Various, USA','310–325+','USD 25,000','USD 25,000'],
    ]},
    {label:'Top International Universities',headers:['University','Location','Typical GRE','Fees/yr'],rows:[
      ['University of Toronto','Canada','315–325+','CAD 40,000'],
      ['NUS / NTU Singapore','Singapore','315–328+','SGD 40,000'],
      ['ETH Zurich','Switzerland','315–330+','CHF 730/sem'],
      ['Imperial College London','London, UK','315–328+','GBP 35,000'],
    ]},
  ],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is the GRE used for in India?',a:'The GRE is primarily used for MS, PhD and Masters programmes abroad — MIT, Stanford, CMU, Georgia Tech, University of Toronto, NUS, ETH Zurich, and Imperial College. It is also accepted for MBA admissions as an alternative to GMAT at some schools.'},
    {q:'How important is the GRE vocabulary section?',a:'GRE Verbal is heavily vocabulary-dependent. Text Completion and Sentence Equivalence together account for roughly half of Verbal questions. GRADSKOOL\'s 5,000-word vocabulary programme is built into the course — context-based, not rote.'},
    {q:'How long does GRE preparation take?',a:'Most students need 3–4 months to target 315–320+. The vocabulary programme alone needs 10–12 weeks. GRADSKOOL\'s GRE cohort runs 3–4 months with live sessions, daily vocabulary practice, AWA coaching, and mock analysis.'},
    {q:'What is the GRE registration fee in India?',a:'The GRE General Test fee in India is approximately ₹22,550 (USD 213). Rescheduling costs an additional ₹5,000. Verify on ets.org/gre before registering.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['gre'].includes(e.slug)).slice(0,5),
}

// ── CMAT DATA ────────────────────────────────────────────────────────────────

export const CMAT_DATA = {
  slug:'cmat', name:'CMAT 2027', mocksSlug:'cmat',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'Crack JBIMS. India\'s best value-for-money MBA.',
  description:'Common Management Admission Test — conducted by NTA for 1,000+ AICTE-approved MBA institutes. Primary gateway to JBIMS, SIMSREE, PUMBA — among India\'s best value-for-money MBA colleges.',
  badge:'Enrolments Open',
  enrolPrice:'4,999',
  enrolNote:'With Mocks: ₹6,999',
  enrolFeatures:['Live two-way CMAT sessions','All 5 sections — full coverage','12 Full-Length CMAT Mocks','15 Sectional Tests','60 Area-wise Tests','Post-test analysis every mock','Recorded session access'],
  heroStats:[['12','Full-Length CMAT Mocks'],['15','Sectional Tests'],['100+','Hours Live Teaching'],['27','Students Per Cohort']],
  overview_cards:[
    {label:'Conducted By',value:'NTA'},
    {label:'Exam Month',value:'January'},
    {label:'Duration',value:'3 Hours'},
    {label:'Total Questions',value:'100 Questions'},
    {label:'Total Marks',value:'400 Marks'},
    {label:'Marking Scheme',value:'+4 / −1'},
    {label:'Sections',value:'5 Sections'},
    {label:'Mode',value:'Computer Based'},
  ],
  sections:[
    {num:'Section 01',name:'Quantitative Techniques & DI',pills:['20 Questions','80 Marks'],topics:['Arithmetic, Algebra, Geometry, Number Systems','P&C, Probability and Data Interpretation','Easier than CAT QA — moderate difficulty','Accuracy and speed are key differentiators','Covers standard 10+2 level mathematics']},
    {num:'Section 02',name:'Logical Reasoning',pills:['20 Questions','80 Marks'],topics:['Syllogisms, blood relations, directions','Coding-decoding, number series, arrangements','Critical reasoning and analogy','More predictable than CAT DILR','Pattern familiarity is the most effective strategy']},
    {num:'Section 03',name:'Language Comprehension',pills:['20 Questions','80 Marks'],topics:['Reading Comprehension passages','Vocabulary — synonyms, antonyms, idioms','Grammar and fill in the blanks','Para-jumbles','More straightforward than CAT VARC']},
    {num:'Section 04',name:'General Awareness',pills:['20 Questions','80 Marks'],topics:['Current affairs and business awareness','Static GK and Indian history','Economics and world affairs','GA is the differentiating section at the top','Requires sustained monthly preparation']},
    {num:'Section 05',name:'Innovation & Entrepreneurship',badge:'Unique to CMAT',pills:['20 Questions','80 Marks'],topics:['Entrepreneurial thinking and startup ecosystems','Innovation frameworks and design thinking','Business creativity','JBIMS and select institutes consider this section','Dedicated module at GRADSKOOL']},
  ],
  eligibility:[
    {icon:'🎓',title:'Educational Qualification',body:"A Bachelor's degree in any discipline from an AICTE/UGC-recognised university. No minimum percentage to appear in CMAT."},
    {icon:'📅',title:'Final Year Students',body:'Students in final year are eligible. Provisional admission allowed — degree must be completed before joining.'},
    {icon:'🚫',title:'No Age Limit or Attempt Limit',body:'CMAT has no age limit. Conducted once a year in January with no attempt limit.'},
    {icon:'🏠',title:'Maharashtra Domicile',body:'Maharashtra domicile required for state quota seats at JBIMS and SIMSREE. Non-Maharashtra candidates can apply for All India quota seats.'},
  ],
  key_dates:[
    {month:'NOV',year:'2026',event:'CMAT Registration Opens',detail:'NTA opens CMAT registration at exams.nta.ac.in/CMAT. Fee: ~₹2,000 (General) / ₹1,000 (SC/ST/PwD).'},
    {month:'DEC',year:'2026',event:'Registration Closes',detail:'Admit card released 2–3 weeks before the exam on the NTA portal.'},
    {month:'JAN',year:'2027',event:'CMAT Exam Day',detail:'Computer-based test across 400+ centres. 3 hours, 5 sections, +4/−1 marking.'},
    {month:'FEB',year:'2027',event:'CMAT Results',detail:'Results within 3–4 weeks. Scorecard with percentile used by 1,000+ AICTE-approved colleges.'},
    {month:'MAR',year:'2027',event:'Maharashtra CET Cell Counselling',detail:'CET Cell, Maharashtra conducts centralised counselling for JBIMS, SIMSREE, PUMBA and 400+ Maharashtra colleges.'},
  ],
  curriculum:[
    {num:'Module 01',title:'Quantitative Techniques & DI',topics:['Arithmetic — percentages, ratio, profit/loss, TSD, SI/CI','Algebra — equations, progressions, functions','Geometry, mensuration and number systems','Data Interpretation — tables, charts, caselets','P&C, Probability and modern maths']},
    {num:'Module 02',title:'Logical Reasoning',topics:['Syllogisms — Venn diagram and rule-based methods','Arrangements — linear, circular, matrix','Blood relations, directions, coding-decoding','Critical reasoning — strengthening and weakening','Series completion — number and alphabetic']},
    {num:'Module 03',title:'Language Comprehension',topics:['RC passage strategy for CMAT difficulty','Vocabulary — synonyms, antonyms, analogies','Grammar — error identification, sentence correction','Para-jumbles and para-summary','Fill in the blanks — grammar and contextual']},
    {num:'Module 04',title:'General Awareness',topics:['Current affairs — monthly structured digest','Business and economic awareness','Static GK — India, world, science, culture','Legal and policy awareness for CMAT','GK test series — weekly practice']},
    {num:'Module 05',title:'Innovation & Entrepreneurship',topics:['Startup ecosystems and innovation frameworks','Entrepreneurial thinking and business creativity','Design thinking principles','JBIMS-specific GD-PI preparation','Innovation case studies']},
    {num:'Module 06',title:'Mocks and JBIMS Interview Prep',topics:['12 full-length CMAT mocks — post-test analysis','15 sectional tests (QT, LR, Language, GA, IE)','60 area-wise topic tests','JBIMS / SIMSREE GD-PI preparation','WAT essay writing for top Maharashtra colleges']},
  ],
  howSteps:HOW_STEPS_DEFAULT,
  plans:[
    {featured:true,badge:'Live Programme',name:'CMAT Live + Mocks',price:'4,999',note:'Live sessions + 12 CMAT mocks + 15 sectional + 60 area-wise',features:[{t:'Live two-way CMAT sessions with ALP',ok:true},{t:'All 5 sections — full coverage',ok:true},{t:'Innovation & Entrepreneurship module',ok:true},{t:'12 Full-Length CMAT Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'Interview Prep',ok:false}]},
    {featured:false,badge:'With Interview',name:'CMAT Live + Mocks + Interview',price:'6,999',note:'Live + 12 CMAT mocks + JBIMS / SIMSREE GD-PI preparation',features:[{t:'Live two-way CMAT sessions',ok:true},{t:'12 Full-Length CMAT Mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'JBIMS / SIMSREE GD-PI preparation',ok:true},{t:'WAT essay writing',ok:true}]},
  ],
  colleges:[{
    label:'Top CMAT-Accepting Colleges',
    headers:['College','Location','CMAT Cutoff','Avg. Package','Fees'],
    rows:[
      ['★ JBIMS Mumbai (MMS)','Mumbai, Maharashtra','99.9%+','₹30–33 LPA','₹4–5 L'],
      ['★ SIMSREE Mumbai (MMS)','Mumbai, Maharashtra','99%+','₹15–18 LPA','₹2.5 L'],
      ['★ PUMBA Pune (MBA)','Pune, Maharashtra','98%+','₹12–15 LPA','₹2.5 L'],
      ['K.J. Somaiya Mumbai','Mumbai, Maharashtra','95%+','₹12–14 LPA','₹14 L'],
      ['SIES Mumbai / N.L. Dalmia','Mumbai, Maharashtra','88–93%','₹8–12 LPA','₹8–12 L'],
      ['Welingkar / MET Mumbai','Mumbai, Maharashtra','80–90%','₹7–10 LPA','₹8–12 L'],
    ],
  }],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is CMAT and why is JBIMS important?',a:'CMAT is conducted by NTA for 1,000+ AICTE-approved MBA institutes. JBIMS Mumbai has placement packages of ₹30+ LPA and annual fees of just ₹4–5 L. The ROI is arguably the best of any MBA college in India.'},
    {q:'Does CMAT have a unique section not in other exams?',a:'Yes — Innovation & Entrepreneurship. This 20-question section tests entrepreneurial thinking, startup ecosystems, innovation frameworks and design thinking. Required by JBIMS and a few top institutes. GRADSKOOL covers this as a dedicated module.'},
    {q:'How important is Maharashtra domicile for CMAT?',a:'Very important for Maharashtra state quota seats at JBIMS and SIMSREE — far more competitive than All India seats. Non-Maharashtra students can apply for All India quota seats at the same colleges.'},
    {q:'How many mocks are in the GRADSKOOL CMAT programme?',a:'12 full-length CMAT mocks, 15 sectional tests (all 5 sections), and 60 area-wise tests. Every mock is followed by detailed post-test analysis targeting 99%ile for JBIMS.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['cmat'].includes(e.slug)).slice(0,5),
}

// ── MH CET MBA DATA ──────────────────────────────────────────────────────────

export const MHCET_DATA = {
  slug:'mhcet', name:'MH CET MBA 2027', mocksSlug:'mhcet',
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'The fastest route to JBIMS, SIMSREE and KJ Somaiya.',
  description:'Maharashtra MBA CET — conducted by State CET Cell. 200 questions, 150 minutes, no negative marking. Two attempts per year. The primary gateway to JBIMS (₹5 L fees, ₹30+ LPA placements).',
  badge:'Enrolments Open',
  enrolPrice:'7,999',
  enrolNote:'With GD-PI Prep: ₹11,999',
  enrolFeatures:['Live two-way MH CET sessions','All 4 sections — complete coverage','Full-length MH CET pattern mocks','Sectional & area-wise drills','Post-test strategic analysis','Speed-building for LR & Abstract','Recorded sessions for revision'],
  heroStats:[['200','Questions'],['150','Minutes'],['No','Negative Marking'],['27','Students Per Cohort']],
  overview_cards:[
    {label:'Conducted By',value:'State CET Cell, MH'},
    {label:'Exam Months',value:'April & May'},
    {label:'Duration',value:'150 Minutes'},
    {label:'Total Questions',value:'200 Questions'},
    {label:'Total Marks',value:'200 Marks'},
    {label:'Marking Scheme',value:'+1 / No Negative'},
    {label:'Sections',value:'4 Sections'},
    {label:'Mode',value:'Computer Based'},
  ],
  sections:[
    {num:'Section 01',name:'Logical Reasoning',badge:'Largest Section',pills:['75 Questions','~56 Minutes'],topics:['Syllogisms, arrangements, blood relations','Coding-decoding, critical reasoning','Statement-assumption and conclusion','Series and analogies','75 questions — the single biggest differentiator']},
    {num:'Section 02',name:'Abstract Reasoning',pills:['25 Questions','Non-verbal'],topics:['Matrix and series completion','Odd-figure-out using elimination','Shape analogies and transformations','Visual pattern identification strategies','High-accuracy section with right practice']},
    {num:'Section 03',name:'Quantitative Aptitude',pills:['50 Questions','50 Marks'],topics:['Arithmetic — percentages, profit/loss, interest','Data Interpretation — tables, charts','Number Systems, Algebra, Geometry','Easier than CAT QA — speed and accuracy matter','Quick calculations and avoiding silly errors']},
    {num:'Section 04',name:'Verbal Ability & Reading Comprehension',pills:['50 Questions','50 Marks'],topics:['Reading Comprehension — 3-4 moderate passages','Grammar and fill in the blanks','Vocabulary — synonyms, antonyms, idioms','Para-jumbles and idioms','Split equally between VA (25) and RC (25)']},
  ],
  eligibility:[
    {icon:'🎓',title:'Educational Qualification',body:"A Bachelor's degree from a UGC/AIU-recognised university. Minimum 50% aggregate for General (45% for Reserved)."},
    {icon:'🔁',title:'Two Attempts Per Year',body:'MH CET offers two attempts per cycle — April and May. Best score considered for CAP. Candidates can attempt every year.'},
    {icon:'🏠',title:'Maharashtra Domicile',body:'Maharashtra domicile required for state quota seats at JBIMS and SIMSREE. All India quota seats available to non-Maharashtra candidates.'},
    {icon:'📅',title:'Final Year Students',body:'Students in final year can appear provisionally. Admission confirmed only after submitting the final degree.'},
  ],
  key_dates:[
    {month:'NOV',year:'2026',event:'Official Notification Released',detail:'State CET Cell releases the official bulletin with exam schedule, eligibility, registration process, and fee structure.'},
    {month:'JAN',year:'2027',event:'Registration Window Opens',detail:'Online applications on cetcell.mahacet.org. Fee: ₹1,000 Open / ₹800 Reserved.'},
    {month:'APR',year:'2027',event:'MH CET MBA — Attempt 1',detail:'Computer-based test across Maharashtra. 200 questions, 150 minutes, no negative marking.'},
    {month:'MAY',year:'2027',event:'MH CET MBA — Attempt 2',detail:'Second attempt available. Best of two scores used for CAP registration.'},
    {month:'JUL',year:'2027',event:'CAP Rounds & Final Seat Allotment',detail:'DTE Maharashtra conducts CAP rounds for state quota seat allotment to JBIMS, SIMSREE, KJ Somaiya and 300+ colleges.'},
  ],
  curriculum:[
    {num:'Module 01',title:'Logical Reasoning — Foundation',topics:['Syllogisms — Venn diagram and rule-based methods','Linear and circular arrangements','Blood relations and direction sense','Coding-decoding patterns','Series completion — number and alphabetic']},
    {num:'Module 02',title:'Logical Reasoning — Advanced',topics:['Statement-assumption, conclusion, argument','Critical reasoning — strengthening and weakening','Cause and effect, course of action','Input-output and machine-based puzzles','Speed drills — 75 LR questions in 55 minutes']},
    {num:'Module 03',title:'Abstract Reasoning',topics:['Visual pattern identification strategies','Matrix and series completion techniques','Odd-figure-out using elimination','Shape analogies and transformations','Timed practice with speed benchmarks']},
    {num:'Module 04',title:'Quantitative Aptitude',topics:['Arithmetic — percentages, profit/loss, interest','Ratio, proportion, TSD, work','Data Interpretation — tables, bar charts, mixed sets','Number Systems, Algebra, Geometry','Speed calculation and accuracy under pressure']},
    {num:'Module 05',title:'Verbal Ability and RC',topics:['RC — MHCET passage types and strategy','Vocabulary — synonyms, antonyms, analogies','Grammar — error identification, sentence correction','Para-jumbles and idioms','Speed reading for 200-question volume']},
    {num:'Module 06',title:'Mocks and JBIMS Interview Prep',topics:['Full-length MH CET mocks — 200 questions in 150 mins','No negative marking strategy — attempt all questions','Score vs percentile mapping for JBIMS cutoffs','JBIMS / SIMSREE GD-PI preparation','WAT and GD for top Maharashtra colleges']},
  ],
  howSteps:[
    {num:'01',title:'Live Session',body:'Two-way live class covering all 4 sections — heavy emphasis on LR (75 questions) and Abstract Reasoning, which most coaching programmes ignore.'},
    {num:'02',title:'Speed Drills',body:'No negative marking means every unanswered question is a lost mark. Speed drills focus on 200 questions in 150 minutes — 45 seconds average with section-wise time allocation.'},
    {num:'03',title:'Full MH CET Mocks',body:'Full-length MH CET mocks — 200 questions, 150 minutes, no negative marking. Two attempts per year means you can iterate between Test 1 and Test 2.'},
    {num:'04',title:'Post-Test Analysis',body:'Score vs percentile mapping after every mock. Target: 188+ for JBIMS (99.9%ile), 182+ for SIMSREE (99%ile), 175+ for PUMBA (98%ile).'},
  ],
  plans:[
    {featured:false,badge:'Books Only',name:'MH CET Books',price:'2,999',note:'Printed books delivered to your address',features:[{t:'MH CET printed study material',ok:true},{t:'LR, Abstract, QA, VA, RC coverage',ok:true},{t:'Concept notes + solved examples',ok:true},{t:'Live sessions',ok:false},{t:'GD-PI preparation',ok:false}]},
    {featured:true,badge:'Most Popular',name:'Live + Mocks',price:'7,999',note:'Live programme with full mock access',features:[{t:'Live two-way MH CET sessions with ALP',ok:true},{t:'All 4 sections — LR, Abstract, QA, VA',ok:true},{t:'All full-length MH CET mocks',ok:true},{t:'Post-test strategic analysis',ok:true},{t:'Recorded session access',ok:true},{t:'GD-PI preparation',ok:false}]},
    {featured:false,badge:'Complete',name:'Live + Mocks + Books + GD-PI',price:'11,999',note:'Complete package — live, mocks, books, GD-PI',features:[{t:'Live two-way MH CET sessions with ALP',ok:true},{t:'All modules — full coverage',ok:true},{t:'All full-length MH CET mocks',ok:true},{t:'MH CET printed study material',ok:true},{t:'Group Discussion preparation',ok:true},{t:'Personal Interview mock sessions',ok:true},{t:'WAT / essay preparation',ok:true}]},
  ],
  colleges:[{
    label:'Top MH CET MBA Accepting Colleges',
    headers:['College','Location','MH CET Score (Approx.)','Percentile','Avg. Package','Fees'],
    rows:[
      ['★ JBIMS Mumbai (MMS)','Mumbai, Maharashtra','196–200','99.99%','₹30–33 LPA','₹4–5 L'],
      ['★ SIMSREE Mumbai (MMS)','Mumbai, Maharashtra','188–195','99.90%','₹15–18 LPA','₹2.5 L'],
      ['★ PUMBA Pune (MBA)','Pune, Maharashtra','182–187','99.50%','₹12–15 LPA','₹2.5 L'],
      ['K.J. Somaiya Mumbai','Mumbai, Maharashtra','175–181','99%','₹12–14 LPA','₹14 L'],
      ['SIES / N.L. Dalmia Mumbai','Mumbai, Maharashtra','165–174','97%','₹8–12 LPA','₹8–12 L'],
      ['Welingkar / BIMM / Indira','Pune / Mumbai','158–164','95%','₹7–10 LPA','₹8–12 L'],
    ],
  }],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is MH CET MBA and how is it different from CMAT?',a:'MH CET MBA is conducted by the Maharashtra State CET Cell specifically for MBA admissions in Maharashtra. Unlike CMAT (national), MH CET is a state exam but is the primary qualifier for JBIMS, SIMSREE, and PUMBA. No negative marking and two attempts per year make it highly candidate-friendly.'},
    {q:'What is JBIMS and why is it a target college?',a:'JBIMS is one of India\'s most prestigious government MBA colleges with placement packages of ₹30+ LPA and annual fees of just ₹4–5 L. Getting into JBIMS requires scoring 196–200 out of 200 (99.99%ile).'},
    {q:'How important is the Abstract Reasoning section?',a:'Abstract Reasoning (25 questions, non-verbal) is the section most coaching institutes ignore. With the right pattern practice, it is a high-accuracy, fast-scoring section. GRADSKOOL dedicates a dedicated module to it.'},
    {q:'How many attempts are available for MH CET MBA?',a:'MH CET offers two attempts per cycle — held in April and May. The best score across both attempts is considered for CAP. This gives you a significant strategic advantage — attempt Test 1 in April, analyse performance, and improve for Test 2 in May.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['mhcet'].includes(e.slug)).slice(0,5),
}

// ── CLAT DATA ────────────────────────────────────────────────────────────────

export const CLAT_DATA = {
  slug:'clat', name:'CLAT / AILET / LNAT', mocksSlug:null,
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'24 NLUs. NLU Delhi. Oxford and UCL.',
  description:'CLAT opens 24 NLUs. AILET opens NLU Delhi — the most competitive law seat in India. LNAT opens Oxford, UCL, and UK law schools. GRADSKOOL covers all three simultaneously.',
  badge:'Enrolments Open',
  enrolPrice:'1,999',
  enrolNote:'Books only: ₹5,999 · Mocks + Books: ₹6,999',
  enrolFeatures:['10 Full-Length CLAT Mocks','5 Full-Length AILET Mocks','3 LNAT Practice Tests','21 Printed Books (select plans)','Detailed solutions for every mock','Free law tools — always available'],
  heroStats:[['18','Online Mocks — CLAT · AILET · LNAT'],['21','Printed Books (Select Plans)'],['24+','NLUs Accept CLAT'],['100K+','Students Mentored by ALP']],
  overview_cards:[
    {label:'CLAT Conducted By',value:'Consortium of NLUs'},
    {label:'AILET Conducted By',value:'NLU Delhi'},
    {label:'LNAT Conducted By',value:'LNAT Consortium (UK)'},
    {label:'CLAT Questions',value:'120 Qs / 120 Mins'},
    {label:'AILET Questions',value:'100 Qs / 90 Mins'},
    {label:'LNAT Format',value:'42 MCQ + Essay'},
    {label:'CLAT Marking',value:'+1 / −0.25'},
    {label:'Exam Month',value:'December'},
  ],
  sections:[
    {num:'CLAT Section 01',name:'English Language',pills:['22–26 Questions','Passage-based'],topics:['RC testing inference, vocabulary in context, grammar','Passages — literary, journalistic, argumentative','Reading speed and accuracy critical','Strong English supports Legal Reasoning performance']},
    {num:'CLAT Section 02',name:'Current Affairs & GK',pills:['28–32 Questions','Passage-based'],topics:['Contemporary events in India and internationally','Politics, economics, law, science, environment','Questions are passage-based — not direct recall','Daily reading is the only reliable preparation strategy']},
    {num:'CLAT Section 03',name:'Legal Reasoning',badge:'Most Weightage',pills:['35–39 Questions','No Prior Law Required'],topics:['Passages present a legal principle','Apply rule to factual scenarios','No prior law knowledge required','Most learnable section — where ranks are won','Principle-fact-conclusion framework']},
    {num:'CLAT Section 04',name:'Logical Reasoning',pills:['28–32 Questions','Argument-based'],topics:['Passage-based critical reasoning','Identifying arguments, assumptions, inferences','Evaluating argument strength and logical flaws','Closer to CR than pattern-based LR']},
    {num:'CLAT Section 05 / LNAT',name:'Quantitative Techniques & LNAT',pills:['13–17 QT Questions','42 LNAT MCQ + Essay'],topics:['Class 10 arithmetic, DI, basic statistics','LNAT Section A — 42 MCQ on argumentative passages (95 min)','LNAT Essay — persuasive writing for Oxford / UCL (40 min)','Easiest CLAT section — maximise accuracy']},
  ],
  eligibility:[
    {icon:'🎓',title:'Class 12 Students',body:'Passed or appearing in Class 12 (10+2) from any recognised board. Graduates can also appear.'},
    {icon:'📊',title:'Minimum Percentage',body:'45% aggregate in Class 12 for General/OBC/EWS (40% for SC/ST/PwD).'},
    {icon:'🎂',title:'No Upper Age Limit',body:'CLAT has no upper age limit as of recent updates. Verify on the official consortium website.'},
    {icon:'🌍',title:'LNAT Eligibility',body:'For Oxford, UCL, Glasgow and King\'s College London. Any nationality, any background. Separate LNAT registration required.'},
  ],
  key_dates:[
    {month:'JAN',year:'2026',event:'CLAT Registration Opens',detail:'Consortium of NLUs opens CLAT registration. Apply early — the online application window is usually open for 4–6 weeks.'},
    {month:'MAR',year:'2026',event:'Registration Closes',detail:'Admit cards released 2 weeks before the exam on the official consortium portal.'},
    {month:'DEC',year:'2026',event:'CLAT Exam Day',detail:'Computer-based test across India. 120 questions in 120 minutes. +1/−0.25 marking. All 5 sections are passage-based.'},
    {month:'DEC',year:'2026',event:'AILET Exam Day',detail:'NLU Delhi conducts AILET separately. 100 questions in 90 minutes. Same day or close to CLAT.'},
    {month:'JAN',year:'2027',event:'Results and NLU Counselling',detail:'Consortium of NLUs conducts centralised counselling for all 24 NLUs based on CLAT score + preference form.'},
  ],
  curriculum:[
    {num:'Module 01',title:'Legal Reasoning — Full Module',topics:['Principle-fact-conclusion framework','How to apply any legal rule to factual scenarios','Torts, contracts, criminal law — applied in context','Constitutional law and property law in passages','High-difficulty legal reasoning at CLAT and AILET level']},
    {num:'Module 02',title:'Current Affairs and GK',topics:['Structured current affairs digest — monthly','National and international events for CLAT passages','Static GK — Indian history, polity, geography, environment','Legal current affairs — landmark judgements, new legislation','Business and economic affairs for CLAT RC']},
    {num:'Module 03',title:'English Language',topics:['RC passage strategy for CLAT difficulty','Vocabulary in context — synonyms, antonyms, usage','Grammar — sentence correction and error identification','Para-jumbles and summary writing','Timed practice at CLAT and AILET difficulty']},
    {num:'Module 04',title:'Logical Reasoning',topics:['Critical reasoning — arguments, assumptions, conclusions','Strengthening and weakening arguments','Cause and effect, course of action','Statement-inference passage-based LR','LNAT-specific argumentative passage practice']},
    {num:'Module 05',title:'Quantitative Techniques',topics:['Class 10 arithmetic — percentages, ratios, profit/loss, interest','Data interpretation — tables, bar charts, line graphs','Elementary statistics — mean, median, mode','CLAT QT is the easiest section — maximise accuracy']},
    {num:'Module 06',title:'LNAT and Interview Prep',topics:['LNAT Section A — 42 MCQ on argumentative passages (95 min)','LNAT Essay — persuasive writing for Oxford and UCL','Essay topics, structure, evaluation criteria','AILET vs CLAT difficulty comparison and strategy','NLU interview and PI preparation']},
  ],
  howSteps:[
    {num:'01',title:'Live Session',body:'Two-way live class with special emphasis on Legal Reasoning — the largest and most consequential CLAT section. Built around the principle-fact-conclusion framework from day one.'},
    {num:'02',title:'Daily Current Affairs',body:'Structured daily current affairs habit — the only reliable strategy for the GK section. Monthly digest provided in CLAT passage format.'},
    {num:'03',title:'18 Full-Length Mocks',body:'10 CLAT + 5 AILET + 3 LNAT mocks. Every test replicates exact pattern, time limit, marking scheme, and question distribution. Performance analytics after every test.'},
    {num:'04',title:'21 Printed Books',body:'Theory, solved examples, and exam-specific practice tests in print. Delivered to your address. CLAT, AILET, and LNAT — all 5 sections in structured sequence.'},
  ],
  plans:[
    {featured:false,badge:'Mocks Only',name:'CLAT Mocks',price:'1,999',note:'18 full-length tests — CLAT, AILET, LNAT. No books.',features:[{t:'10 Full-Length CLAT Mocks',ok:true},{t:'5 Full-Length AILET Mocks',ok:true},{t:'3 LNAT Practice Tests',ok:true},{t:'Detailed solutions for every question',ok:true},{t:'Printed books',ok:false}]},
    {featured:false,badge:'Books Only',name:'CLAT Books',price:'5,999',note:'21 printed books — theory and practice tests.',features:[{t:'21 Printed Books — theory and practice',ok:true},{t:'CLAT, AILET and LNAT covered',ok:true},{t:'Delivered to your address',ok:true},{t:'Online mocks',ok:false}]},
    {featured:true,badge:'Most Complete',name:'Mocks + Books',price:'6,999',note:'18 online mocks + 21 printed books',features:[{t:'10 CLAT + 5 AILET + 3 LNAT mocks',ok:true},{t:'21 Printed Books — all 5 sections',ok:true},{t:'Detailed solutions + performance analytics',ok:true},{t:'Delivered to your address',ok:true}]},
  ],
  colleges:[
    {label:'Top NLUs (CLAT)',headers:['College','Location','Typical CLAT Score','Placement'],rows:[
      ['★ NLU Delhi — via AILET','New Delhi','AILET ~95+/100','NLU Delhi Placements'],
      ['★ NLSIU Bangalore','Bengaluru, Karnataka','CLAT ~115+','NLS Placements'],
      ['★ NALSAR Hyderabad','Hyderabad, Telangana','CLAT ~108+','NALSAR Placements'],
      ['NUJS Kolkata','Kolkata, West Bengal','CLAT ~105+','NUJS Placements'],
      ['NLU Jodhpur — MNLU','Jodhpur, Rajasthan','CLAT ~110+','MNLU Placements'],
    ]},
    {label:'UK Law Schools (LNAT)',headers:['University','Location','LNAT Score','Fees/yr'],rows:[
      ['Oxford University','Oxford, UK','Score 28+','GBP 30,000+'],
      ['University College London (UCL)','London, UK','Score 25+','GBP 25,000+'],
      ["King's College London / Glasgow",'London / Glasgow','Score 22+','GBP 20,000+'],
    ]},
  ],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is the difference between CLAT and AILET?',a:'CLAT gives you access to 24 NLUs across India. AILET is conducted separately by NLU Delhi — the most competitive single law seat in India. AILET is slightly shorter (100 Qs in 90 mins vs 120 Qs in 120 mins). GRADSKOOL prepares for both simultaneously.'},
    {q:'What is the Legal Reasoning section and does it need prior law knowledge?',a:'Legal Reasoning (35–39 questions) presents a legal principle in a passage — you apply it to factual scenarios. No prior law knowledge is required. This is the most learnable section and where CLAT ranks are won or lost.'},
    {q:'What is LNAT and who needs it?',a:'LNAT (Law National Aptitude Test) is required for Oxford, UCL, Glasgow, King\'s College London and other top UK law schools. It has two parts: Section A (42 MCQ, 95 mins) and Section B (one essay, 40 mins). GRADSKOOL covers LNAT as part of the complete CLAT programme.'},
    {q:'How many mocks are included in GRADSKOOL\'s CLAT programme?',a:'18 full-length tests: 10 CLAT mocks + 5 AILET mocks + 3 LNAT tests. Plus 21 printed books in select plans covering all 5 sections.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['clat'].includes(e.slug)).slice(0,5),
}

// ── CUET DATA ────────────────────────────────────────────────────────────────

export const CUET_DATA = {
  slug:'cuet', name:'CUET UG 2026', mocksSlug:null,
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'Replaced boards. Now the only thing that matters for DU.',
  description:'CUET UG — conducted by NTA for undergraduate admissions to all 45 central universities including Delhi University, BHU, JNU, Jamia Millia Islamia and the University of Hyderabad.',
  badge:'Instant Access',
  enrolPrice:'999',
  enrolNote:'Mocks + 8 Books: ₹3,499 · Free tools always available',
  enrolFeatures:['10 Paper I (Language) mocks — online','10 Paper III (General Test) mocks — online','5 Accountancy mocks','5 Mathematics mocks','5 Economics mocks','5 Business Studies mocks','Detailed solutions for every question'],
  heroStats:[['40','Online Mocks Included'],['8','Printed Books (Select Plans)'],['250+','Universities Accept CUET'],['100K+','Students Mentored by ALP']],
  overview_cards:[
    {label:'Conducted By',value:'NTA'},
    {label:'Exam Month',value:'May–June'},
    {label:'Qs per Section',value:'40–60 Questions'},
    {label:'Time per Section',value:'45–60 Minutes'},
    {label:'Marking Scheme',value:'+5 / −1'},
    {label:'Mode',value:'Computer Based'},
    {label:'Languages',value:'13 Languages'},
    {label:'Universities',value:'250+ Accept CUET'},
  ],
  sections:[
    {num:'Section IA',name:'Language (13 Languages)',pills:['40 Questions','45 Minutes'],topics:['Reading comprehension in chosen language','Vocabulary, grammar, verbal reasoning','Available in English, Hindi, Tamil, Telugu, Kannada, Marathi and 7 more','Required by most DU programmes']},
    {num:'Section IB',name:'Additional Languages (19)',pills:['40 Questions','Optional'],topics:['19 additional languages for specific programmes','Sanskrit, Kashmiri, Sindhi, Konkani and others','Required only for language-specific programmes']},
    {num:'Section II',name:'Domain Subjects (27 available)',badge:'Most Critical',pills:['40 Questions','Up to 6 subjects'],topics:['Accountancy, Economics, Business Studies, Mathematics','Physics, Chemistry, Biology, History, Political Science','Choose up to 6 domain subjects from 27 options','Universities specify which domain subjects are required']},
    {num:'Section III',name:'General Test',pills:['60 Questions','75 to Attempt'],topics:['General Knowledge and current affairs','General mental ability and quantitative reasoning','Numerical aptitude and logical reasoning','Required by DU B.Com, BMS, BBA and interdisciplinary programmes']},
  ],
  eligibility:[
    {icon:'🎓',title:'Class 12 Students',body:'Passed or appearing in Class 12 from any recognised board. Graduates can also apply for certain programmes.'},
    {icon:'📊',title:'No Minimum Percentage',body:'No minimum percentage required to appear in CUET UG. Individual universities set their own academic eligibility.'},
    {icon:'🎂',title:'No Age Limit',body:'No upper age limit for CUET UG. Candidates can appear every year as long as they meet the educational qualification.'},
    {icon:'📋',title:'Section Selection',body:'Choose sections based on target universities. Up to 6 domain subjects in Section II. Always check which sections your target university requires.'},
  ],
  key_dates:[
    {month:'FEB',year:'2026',event:'NTA Notification & Registration Opens',detail:'NTA releases the official CUET UG information bulletin and opens registration. Fee varies by number of subjects and category.'},
    {month:'APR',year:'2026',event:'Registration Closes',detail:'NTA opens a correction window after registration for a limited period. No changes allowed after this window.'},
    {month:'MAY',year:'2026',event:'CUET UG Exam',detail:'Computer-based test across hundreds of centres. Different subjects scheduled across multiple dates. Strict section-wise time limits.'},
    {month:'JUN',year:'2026',event:'Results & Scorecards',detail:'NTA releases provisional answer keys — candidates can raise objections. Final scorecards released after key finalisation.'},
    {month:'JUL',year:'2026',event:'University Admissions & Cutoffs',detail:'Individual universities release merit lists and cutoffs based on CUET scores. DU admissions handled separately via the CSAS portal.'},
  ],
  curriculum:[
    {num:'Module 01',title:'General Test — Foundation',topics:['Current affairs — last 12 months structured coverage','General Knowledge — India, world, science, culture','General mental ability — patterns, series, analogies','Quantitative aptitude — arithmetic and data','Logical reasoning — comprehensive coverage']},
    {num:'Module 02',title:'Language Section — English',topics:['Reading Comprehension at CUET difficulty level','Vocabulary — synonyms, antonyms, contextual usage','Grammar — sentence correction, fill in the blanks','Para-jumbles and verbal reasoning','Speed reading for 45-minute section constraint']},
    {num:'Module 03',title:'Domain — Accountancy',topics:['Financial Statements — trading, P&L, balance sheet','Accounting for Partnership and Companies','Cash Flow Statements','NCERT Class 11 and 12 Accountancy complete coverage']},
    {num:'Module 04',title:'Domain — Economics',topics:['Microeconomics — demand, supply, market structures','Macroeconomics — national income, banking, fiscal policy','Indian Economy — planning, poverty, development','NCERT Class 11 and 12 Economics complete coverage']},
    {num:'Module 05',title:'Domain — Business Studies',topics:['Management, finance, marketing, HRM','Business environment and entrepreneurship','NCERT Class 11 and 12 Business Studies','CUET-pattern practice sets']},
    {num:'Module 06',title:'Mocks and Performance Analytics',topics:['10 Paper I Language mocks','10 Paper III General Test mocks','5 each: Accountancy, Mathematics, Economics, Business Studies mocks','Section-wise score breakdown and accuracy tracking','Weakest topic identification by performance data']},
  ],
  howSteps:[
    {num:'01',title:'Free Tools First',body:'Start with GRADSKOOL\'s free tools — GK tool, vocabulary builder, and RC Lexicon. All free, no sign-up required. Build a foundation before committing.'},
    {num:'02',title:'Domain Subject Mocks',body:'5 mocks each for Accountancy, Mathematics, Economics, and Business Studies — NCERT-aligned, CUET-pattern. Domain subjects are where DU aspirants win or lose their target programme.'},
    {num:'03',title:'General Test Mocks',body:'10 General Test mocks covering GK, current affairs, quantitative aptitude, and logical reasoning. Required by DU B.Com, BMS, BBA and interdisciplinary programmes.'},
    {num:'04',title:'Performance Analytics',body:'Section-wise score breakdown, accuracy vs attempt rate, time-per-question analysis, and weakest topic identification after every mock.'},
  ],
  plans:[
    {featured:true,badge:'CUET UG 2026',name:'CUET UG Mocks',price:'999',note:'40 online mocks — Paper I, Paper III, 4 Commerce subjects',features:[{t:'10 Paper I (Language) mocks',ok:true},{t:'10 Paper III (General Test) mocks',ok:true},{t:'5 each: Accountancy, Maths, Economics, Business Studies',ok:true},{t:'Detailed solutions for every question',ok:true},{t:'Performance analytics',ok:true}]},
    {featured:false,badge:'With Books',name:'CUET Mocks + Books',price:'3,499',note:'40 online mocks + 8 printed books',features:[{t:'40 Online Mocks — all sections',ok:true},{t:'8 Printed Books — theory and practice',ok:true},{t:'NCERT-aligned content',ok:true},{t:'Delivered to your address',ok:true}]},
  ],
  colleges:[
    {label:'Top DU Colleges (CUET)',headers:['College','Programme','Fees/yr'],rows:[
      ['★ SRCC Delhi','B.Com (Hons)','₹20,000'],
      ['★ Lady Shri Ram College','B.Com (Hons) / BA Eco','₹20,000'],
      ['★ Hindu College','BA Economics','₹15,000'],
      ["St. Stephen's / Miranda House",'Various','₹15,000'],
    ]},
    {label:'Other Central Universities',headers:['University','Location','Fees/yr'],rows:[
      ['BHU — Banaras Hindu University','Varanasi, UP','₹10,000'],
      ['JNU — Jawaharlal Nehru University','New Delhi','₹15,000'],
      ['Jamia Millia Islamia','New Delhi','₹15,000'],
      ['University of Hyderabad','Hyderabad, Telangana','₹15,000'],
    ]},
  ],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'What is CUET UG and why does it matter?',a:'CUET UG is conducted by NTA for undergraduate admissions to all 45 central universities including Delhi University, BHU, JNU, and Jamia. It has replaced Class 12 board percentage as the primary admissions criterion. Scoring high in CUET is now the single most important factor for getting into DU.'},
    {q:'Which sections should I choose in CUET UG?',a:'It depends on your target university and programme. Most DU programmes require Section IA (English), specific domain subjects in Section II, and Section III (General Test) for B.Com/BMS/BBA. Always check which sections each target university requires before registering.'},
    {q:'How is CUET different from board exams?',a:'CUET is a speed and accuracy test, not a knowledge test. Questions are NCERT-based but the pace required (40–60 questions in 45–60 minutes) means students who haven\'t practised in timed conditions consistently underperform. Full-length mocks are the most effective preparation tool.'},
    {q:'What is included in GRADSKOOL\'s CUET programme?',a:'40 online mocks (10 Paper I Language + 10 Paper III General Test + 5 each for Accountancy, Mathematics, Economics, Business Studies), plus 8 printed books in the complete plan.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['cuet'].includes(e.slug)).slice(0,5),
}

// ── PI WAT GD DATA ───────────────────────────────────────────────────────────

export const PIWATGD_DATA = {
  slug:'pi-wat-gd', name:'PI WAT GD', mocksSlug:null,
  heroVideo: '', // Add YouTube or Bunny Stream embed URL — e.g. 'https://www.youtube.com/embed/VIDEO_ID'
  tagline:'Convert your call. The interview room is a different exam.',
  description:'Getting a B-school interview call is half the battle. The other half is the room. GRADSKOOL\'s PI WAT GD programme covers mock PIs, GD simulation, WAT essays, and AWT for IIM-A.',
  badge:'Enrolments Open',
  enrolPrice:'5,999',
  enrolNote:'Free GK Tool always available',
  enrolFeatures:['Mock Personal Interviews — panel format','Group Discussion rounds','WAT essay preparation','AWT for IIM-Ahmedabad','GK PDFs — current season','Graduation Subject PDFs','1-on-1 support sessions','Detailed feedback after every mock'],
  heroStats:[['100K+','Students Mentored'],['5K+','IIM & Top B-School Converts'],['27','Students Per Cohort'],['10+','B-School Formats Covered']],
  overview_cards:[
    {label:'Programme',value:'PI WAT GD'},
    {label:'Format',value:'Live + Mock Sessions'},
    {label:'Mock PIs',value:'Full Panel Format'},
    {label:'B-School Formats',value:'10+ Covered'},
    {label:'AWT',value:'IIM-A Specific'},
    {label:'GD Formats',value:'Topic, Case, Abstract'},
    {label:'Support',value:'1-on-1 with ALP Sir'},
    {label:'Cohort Size',value:'27 Students'},
  ],
  sections:[
    {num:'Component 01',name:'Personal Interview — Mock PIs',pills:['Panel Format','IIM + XLRI + NMIMS'],topics:['Full panel-format mock interviews','IIM, XLRI, FMS, SPJIMR, NMIMS formats','Stress round simulation','Competency-based question preparation','Detailed written feedback after every mock']},
    {num:'Component 02',name:'Group Discussion Rounds',pills:['Live GD Simulation','Multiple Formats'],topics:['Topic-based Group Discussions','Case-based GDs','Abstract GD topics','Entry points, structuring arguments, summarising','Evaluated and debriefed after every round']},
    {num:'Component 03',name:'Written Ability Test (WAT) + AWT',pills:['All Major B-Schools','IIM-A Specific'],topics:['WAT preparation for all major B-schools','AWT — Analytical Writing Task specific to IIM Ahmedabad','Structured analytical argumentation in 15 minutes','Essay structure, position-taking, argumentation','Timed essay practice with detailed written feedback']},
    {num:'Component 04',name:'GK PDFs + Subject Preparation',pills:['Current Season GK','Graduation Background'],topics:['Curated GK PDFs — economy, business, policy, world affairs','Updated for current interview season','Engineering, commerce, arts, science graduation subject PDFs','Panels always probe academic foundation — be ready']},
  ],
  eligibility:[
    {icon:'📋',title:'B-School Call Holders',body:'Open to all students who have received a call from any B-school — IIM, XLRI, NMIMS, FMS, SPJIMR, SIBM, SCMHRD and more.'},
    {icon:'💼',title:'Fresh Graduates and Professionals',body:'Both fresh graduates and working professionals benefit. The PI WAT GD programme runs parallel to mock interview season (Jan–Apr typically).'},
    {icon:'⏰',title:'Start Early',body:'Do not wait until you have interview dates. IIM shortlists start releasing from December. Start preparation immediately after shortlist.'},
    {icon:'🌍',title:'10+ B-School Formats',body:'Covers IIM (AWT + GD + PI), XLRI (GD + PI + WAT), NMIMS (Competency Test + PI), FMS, SPJIMR, MDI and others.'},
  ],
  key_dates:[
    {month:'DEC',year:'2026',event:'CAT Results + IIM Shortlists Begin',detail:'IIM shortlists start releasing from December. Start PI WAT GD preparation immediately — do not wait for the actual interview date.'},
    {month:'JAN',year:'2027',event:'XAT / SNAP / NMAT Shortlists',detail:'XAT, SNAP, NMAT, and CMAT shortlists from XLRI, NMIMS, SIBM, SCMHRD. PI WAT GD preparation should be in full swing.'},
    {month:'FEB',year:'2027',event:'IIM GD-PI-WAT Season',detail:'Most IIM GD-PI-WAT rounds conducted February–March. AWT for IIM Ahmedabad, case GDs for IIM Bangalore, WAT for IIM Calcutta.'},
    {month:'FEB',year:'2027',event:'XLRI / FMS / SPJIMR PIs',detail:'XLRI, FMS, SPJIMR, MDI and other top non-IIM institutes conduct PI rounds. Each institute has a distinct format.'},
    {month:'APR',year:'2027',event:'Final Admission Offers',detail:'Most top B-schools release final admission offers by April. PI WAT GD is the last gate before the MBA.'},
  ],
  curriculum:[
    {num:'01',title:'Profile Mapping',topics:['Academic background, work experience, achievements','Gap analysis — identifying and framing gaps positively','Building a clear, coherent PI narrative','Strengths, weaknesses, and situational framing','Profile-specific question preparation']},
    {num:'02',title:'GK and Current Affairs',topics:['Structured GK PDFs — economy, business, policy, world','Updated for the current interview season','Indian economy, budget, corporate events, global affairs','Monthly current affairs in interview-question format']},
    {num:'03',title:'Graduation Subject Preparation',topics:['Engineering — core subject PDFs (Mech, CS, ECE, Civil)','Commerce — accounting, economics, finance fundamentals','Arts and Social Sciences — key concepts and applications','Panels always probe academic background']},
    {num:'04',title:'WAT and AWT Writing',topics:['WAT — topic practice with evaluation criteria','AWT for IIM Ahmedabad — analytical argumentation format','Taking a clear position and defending it in 15 minutes','Essay structure, logical flow, vocabulary','Timed essay practice with detailed written feedback']},
    {num:'05',title:'GD Simulation',topics:['Topic GDs — current affairs, business, opinion topics','Case GDs — business situations, problem-solving','Abstract GDs — creative and philosophical topics','Entry techniques, content contribution, conflict management','Evaluated and debriefed after every round']},
    {num:'06',title:'Mock Personal Interviews',topics:['First mock — identify specific gaps','Subsequent mocks — close the identified gaps','Stress rounds — pressure under tough questioning','Competency-based questions — STAR format answers','Detailed written feedback and improvement plan']},
  ],
  howSteps:[
    {num:'01',title:'Profile Mapping',body:'Every PI begins with your story. ALP Sir maps your profile and builds a clear, consistent narrative before any mock interview begins.'},
    {num:'02',title:'GK and Subject Prep',body:'GK PDFs for the current interview season plus graduation subject preparation cover 80% of what panels ask. The remaining 20% is handled by the mock PI itself.'},
    {num:'03',title:'Mock Interviews and GD Rounds',body:'Full panel-format mock PIs — first mock identifies gaps, subsequent mocks close them. Live GD simulation in cohort format. WAT and AWT practice with detailed written feedback.'},
    {num:'04',title:'Iterate Until Converted',body:'Detailed written feedback after every mock — specific points to improve, not generic advice. 1-on-1 sessions with ALP Sir for profile-specific guidance.'},
  ],
  plans:[
    {featured:true,badge:'Full Programme',name:'PI WAT GD Programme',price:'5,999',note:'Complete interview preparation — all B-school formats',features:[{t:'Mock Personal Interviews — panel format',ok:true},{t:'Stress round simulation',ok:true},{t:'Group Discussion rounds — 3 formats',ok:true},{t:'WAT essay preparation',ok:true},{t:'AWT for IIM Ahmedabad',ok:true},{t:'GK PDFs — current season',ok:true},{t:'Graduation subject PDFs',ok:true},{t:'1-on-1 sessions and detailed feedback',ok:true}]},
  ],
  colleges:[
    {label:'B-School Formats Covered',headers:['B-School','Process','Avg. Package','Fees'],rows:[
      ['★ IIM Ahmedabad','AWT + GD + PI','₹37+ LPA','₹32 L'],
      ['★ IIM Bangalore','GD + PI','₹35+ LPA','₹31 L'],
      ['★ IIM Calcutta','WAT + PI','₹34+ LPA','₹27 L'],
      ['XLRI Jamshedpur','GD + PI + WAT','₹30–35 LPA','₹24 L'],
      ['NMIMS Mumbai','Competency Test + PI','₹25+ LPA','₹21 L'],
      ['FMS Delhi','PI Only','₹30+ LPA','₹3 L'],
    ]},
  ],
  testimonials:TESTIMONIALS,
  faqs:[
    {q:'When should I start PI WAT GD preparation?',a:'As soon as the written exam is over — do not wait for your interview call. IIM shortlists start releasing in December. Starting in December gives you 6–8 weeks before the first IIM interview rounds in February.'},
    {q:'What is the AWT at IIM Ahmedabad?',a:'AWT (Analytical Writing Task) is IIM Ahmedabad\'s specific writing component — structured analytical argumentation on a given topic in 15 minutes. Unlike WAT at other IIMs, AWT requires you to take a clear position and defend it analytically. GRADSKOOL covers AWT as a separate dedicated module.'},
    {q:'How many mock interviews are included?',a:'The programme includes multiple mock PI sessions — the first mock identifies specific gaps. Subsequent mocks close those gaps. Every mock is followed by detailed written feedback. 1-on-1 sessions with ALP Sir are part of the programme.'},
    {q:'Does GRADSKOOL cover non-IIM institutes like XLRI, NMIMS, FMS?',a:'Yes. GRADSKOOL\'s PI WAT GD programme covers 10+ B-school formats including XLRI (GD + PI + WAT), NMIMS (Competency Test + PI), FMS Delhi (PI), SPJIMR, MDI, SIBM and SCMHRD.'},
  ],
  alsoExams:ALSO_EXAMS.filter(e=>!['pi-wat-gd'].includes(e.slug)).slice(0,5),
}