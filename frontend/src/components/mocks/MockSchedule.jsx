/**
 * GRADSKOOL — Mock Schedule Component
 * Used on /courses/cat/mocks
 *
 * Auto-calculates live vs upcoming based on today's date.
 * MockScheduleCard → summary card like the screenshot
 * MockScheduleTable → full expandable table
 */
import { useState } from 'react'

const TESTFUNDA_URLS = {
  cat:    'https://gradskool.testfunda.com/TestCentre/full-length--tests/cat',
  xat:    'https://gradskool.testfunda.com/TestCentre/mba/xat',
  snap:   'https://gradskool.testfunda.com/TestCentre/mba/snap',
  nmat:   'https://gradskool.testfunda.com/TestCentre/mba/nmat',
  gmat:   'https://gradskool.testfunda.com/TestCentre/gmat/gmat-focus',
  gre:    'https://gradskool.testfunda.com/TestCentre/gre/gre-general',
  ipmat:  'https://gradskool.testfunda.com/TestCentre/ug/ipmat',
  cmat:   'https://gradskool.testfunda.com/TestCentre/mba/cmat',
  mhcet:  'https://gradskool.testfunda.com/TestCentre/mba/mhcet',
  clat:   'https://gradskool.testfunda.com/TestCentre/law/clat',
  cuet:   'https://gradskool.testfunda.com/TestCentre/cuet-aptitude/cuet-(general-test)',
}
const TESTFUNDA_SECTIONAL_URLS = {
  cat:    'https://gradskool.testfunda.com/TestCentre/sectional-tests/cat',
  xat:    'https://gradskool.testfunda.com/TestCentre/sectional-tests/xat',
  snap:   'https://gradskool.testfunda.com/TestCentre/sectional-tests/snap',
  nmat:   'https://gradskool.testfunda.com/TestCentre/sectional-tests/nmat',
  gmat:   'https://gradskool.testfunda.com/TestCentre/sectional-tests/gmat',
  gre:    'https://gradskool.testfunda.com/TestCentre/sectional-tests/gre',
  ipmat:  'https://gradskool.testfunda.com/TestCentre/sectional-tests/ipmat',
  cmat:   'https://gradskool.testfunda.com/TestCentre/sectional-tests/cmat',
  mhcet:  'https://gradskool.testfunda.com/TestCentre/sectional-tests/mhcet',
  clat:   'https://gradskool.testfunda.com/TestCentre/sectional-tests/clat',
  cuet:   'https://gradskool.testfunda.com/TestCentre/sectional-tests/cuet',
}
// Keep backward compat
const TESTFUNDA_URL           = TESTFUNDA_URLS.cat
const TESTFUNDA_SECTIONAL_URL = TESTFUNDA_SECTIONAL_URLS.cat

// ── MULTI-EXAM SCHEDULE DATA ─────────────────────────────────────────────────

const XAT_FULL_LENGTH = [
  { name:'Demo XAT Full Length Mock Test', date:null, free:true },
  { name:'XAT Mock 06', date:'2026-08-01T22:00:00+05:30' },
  { name:'XAT Mock 05', date:'2026-09-01T22:00:00+05:30' },
  { name:'XAT Mock 04', date:'2026-10-01T22:00:00+05:30' },
  { name:'XAT Mock 03', date:'2026-11-01T22:00:00+05:30' },
  { name:'XAT Mock 02', date:'2026-12-01T22:00:00+05:30' },
  { name:'XAT Mock 01', date:'2026-12-15T22:00:00+05:30' },
]
const XAT_SECTIONALS = [
  { name:'DM Set 04',   date:null },
  { name:'DM Set 03',   date:'2026-09-01T22:00:00+05:30' },
  { name:'VALR Set 04', date:'2026-10-01T22:00:00+05:30' },
  { name:'QADI Set 04', date:'2026-11-01T22:00:00+05:30' },
]

const SNAP_FULL_LENGTH = [
  { name:'Demo SNAP Full Length Mock Test', date:null, free:true },
  { name:'SNAP Mock 20', date:'2026-06-01T22:00:00+05:30' },
  { name:'SNAP Mock 19', date:'2026-07-01T22:00:00+05:30' },
  { name:'SNAP Mock 18', date:'2026-07-15T22:00:00+05:30' },
  { name:'SNAP Mock 17', date:'2026-08-01T22:00:00+05:30' },
  { name:'SNAP Mock 16', date:'2026-08-15T22:00:00+05:30' },
  { name:'SNAP Mock 15', date:'2026-09-01T22:00:00+05:30' },
  { name:'SNAP Mock 14', date:'2026-09-15T22:00:00+05:30' },
  { name:'SNAP Mock 13', date:'2026-10-01T22:00:00+05:30' },
  { name:'SNAP Mock 12', date:'2026-10-15T22:00:00+05:30' },
  { name:'SNAP Mock 11', date:'2026-11-01T22:00:00+05:30' },
  { name:'SNAP Mock 10', date:'2026-11-10T22:00:00+05:30' },
  { name:'SNAP Mock 09', date:'2026-11-15T22:00:00+05:30' },
  { name:'SNAP Mock 08', date:'2026-11-20T22:00:00+05:30' },
  { name:'SNAP Mock 07', date:'2026-11-25T22:00:00+05:30' },
  { name:'SNAP Mock 06', date:'2026-12-01T22:00:00+05:30' },
  { name:'SNAP Mock 05', date:'2026-12-05T22:00:00+05:30' },
  { name:'SNAP Mock 04', date:'2026-12-10T22:00:00+05:30' },
  { name:'SNAP Mock 03', date:'2026-12-14T22:00:00+05:30' },
  { name:'SNAP Mock 02', date:'2026-12-17T22:00:00+05:30' },
  { name:'SNAP Mock 01', date:'2026-12-20T22:00:00+05:30' },
]
const SNAP_SECTIONALS = [
  { name:'Set 04 (English · LR · Quant)', date:null },
  { name:'Set 03 (English · LR · Quant)', date:'2026-09-01T22:00:00+05:30' },
  { name:'Set 02 (English · LR · Quant)', date:'2026-10-15T22:00:00+05:30' },
  { name:'Set 01 (English · LR · Quant)', date:'2026-11-15T22:00:00+05:30' },
]

const NMAT_FULL_LENGTH = [
  { name:'Demo NMAT Full Length Mock Test', date:null, free:true },
  { name:'NMAT Mock 10', date:'2026-08-15T22:00:00+05:30' },
  { name:'NMAT Mock 09', date:'2026-09-01T22:00:00+05:30' },
  { name:'NMAT Mock 08', date:'2026-09-15T22:00:00+05:30' },
  { name:'NMAT Mock 07', date:'2026-10-01T22:00:00+05:30' },
  { name:'NMAT Mock 06', date:'2026-10-15T22:00:00+05:30' },
  { name:'NMAT Mock 05', date:'2026-11-01T22:00:00+05:30' },
  { name:'NMAT Mock 04', date:'2026-11-10T22:00:00+05:30' },
  { name:'NMAT Mock 03', date:'2026-11-20T22:00:00+05:30' },
  { name:'NMAT Mock 02', date:'2026-12-01T22:00:00+05:30' },
  { name:'NMAT Mock 01', date:'2026-12-15T22:00:00+05:30' },
]
const NMAT_SECTIONALS = [
  { name:'Set 04 (Language · LR · QA)', date:null },
  { name:'Set 03 (Language · LR · QA)', date:'2026-09-15T22:00:00+05:30' },
  { name:'Set 02 (Language · LR · QA)', date:'2026-10-15T22:00:00+05:30' },
  { name:'Set 01 (Language · LR · QA)', date:'2026-11-15T22:00:00+05:30' },
]


const GMAT_FULL_LENGTH = [
  { name:'Demo GMAT Focus Mock Test',        date:null, free:true },
  { name:'GMAT Focus Mock 05',               date:'2026-09-01T22:00:00+05:30' },
  { name:'GMAT Focus Mock 04',               date:'2026-10-01T22:00:00+05:30' },
  { name:'GMAT Focus Mock 03',               date:'2026-10-15T22:00:00+05:30' },
  { name:'GMAT Focus Mock 02',               date:'2026-11-01T22:00:00+05:30' },
  { name:'GMAT Focus Mock 01',               date:'2026-12-01T22:00:00+05:30' },
]
const GMAT_SECTIONALS = [
  { name:'Quantitative Reasoning Set 03',    date:null },
  { name:'Verbal Reasoning Set 03',          date:'2026-10-01T22:00:00+05:30' },
  { name:'Data Insights Set 03',             date:'2026-11-01T22:00:00+05:30' },
  { name:'QR + VR + DI Combined Set',        date:'2026-12-01T22:00:00+05:30' },
]

const GRE_FULL_LENGTH = [
  { name:'Demo GRE General Test Mock',       date:null, free:true },
  { name:'GRE Mock 05',                      date:'2026-09-01T22:00:00+05:30' },
  { name:'GRE Mock 04',                      date:'2026-10-01T22:00:00+05:30' },
  { name:'GRE Mock 03',                      date:'2026-10-15T22:00:00+05:30' },
  { name:'GRE Mock 02',                      date:'2026-11-01T22:00:00+05:30' },
  { name:'GRE Mock 01',                      date:'2026-12-01T22:00:00+05:30' },
]
const GRE_SECTIONALS = [
  { name:'Verbal Reasoning Set 03',          date:null },
  { name:'Quantitative Reasoning Set 03',    date:'2026-10-01T22:00:00+05:30' },
  { name:'AWA Practice Set 02',              date:'2026-11-01T22:00:00+05:30' },
]

const IPMAT_FULL_LENGTH = [
  { name:'Demo IPMAT Full Length Mock',      date:null, free:true },
  { name:'IIM Indore Mock 15',               date:'2026-09-01T22:00:00+05:30' },
  { name:'IIM Indore Mock 14',               date:'2026-09-15T22:00:00+05:30' },
  { name:'IIM Rohtak Mock 09',               date:'2026-10-01T22:00:00+05:30' },
  { name:'JIPMAT Mock 09',                   date:'2026-10-15T22:00:00+05:30' },
  { name:'NPAT Mock 09',                     date:'2026-11-01T22:00:00+05:30' },
  { name:'IIM Indore Mock 13',               date:'2026-11-15T22:00:00+05:30' },
  { name:'IIM Rohtak Mock 08',               date:'2026-12-01T22:00:00+05:30' },
  { name:'JIPMAT Mock 08',                   date:'2026-12-15T22:00:00+05:30' },
  { name:'IIM Indore Mock 12',               date:'2027-01-01T22:00:00+05:30' },
]
const IPMAT_SECTIONALS = [
  { name:'QA — Arithmetic Set 04',           date:null },
  { name:'QA — Short Answer Practice 04',    date:'2026-10-01T22:00:00+05:30' },
  { name:'Verbal Ability Set 04',            date:'2026-11-01T22:00:00+05:30' },
  { name:'Logical Reasoning Set 04',         date:'2026-12-01T22:00:00+05:30' },
]

const CMAT_FULL_LENGTH = [
  { name:'Demo CMAT Full Length Mock',       date:null, free:true },
  { name:'CMAT Mock 12',                     date:'2026-09-01T22:00:00+05:30' },
  { name:'CMAT Mock 11',                     date:'2026-10-01T22:00:00+05:30' },
  { name:'CMAT Mock 10',                     date:'2026-10-15T22:00:00+05:30' },
  { name:'CMAT Mock 09',                     date:'2026-11-01T22:00:00+05:30' },
  { name:'CMAT Mock 08',                     date:'2026-11-10T22:00:00+05:30' },
  { name:'CMAT Mock 07',                     date:'2026-11-20T22:00:00+05:30' },
  { name:'CMAT Mock 06',                     date:'2026-12-01T22:00:00+05:30' },
  { name:'CMAT Mock 05',                     date:'2026-12-10T22:00:00+05:30' },
  { name:'CMAT Mock 04',                     date:'2026-12-20T22:00:00+05:30' },
  { name:'CMAT Mock 03',                     date:'2027-01-01T22:00:00+05:30' },
  { name:'CMAT Mock 02',                     date:'2027-01-08T22:00:00+05:30' },
  { name:'CMAT Mock 01',                     date:'2027-01-12T22:00:00+05:30' },
]
const CMAT_SECTIONALS = [
  { name:'Set 04 (QT · LR · Language · GA · IE)', date:null },
  { name:'Set 03 (QT · LR · Language · GA · IE)', date:'2026-10-15T22:00:00+05:30' },
  { name:'Set 02 (QT · LR · Language · GA · IE)', date:'2026-11-15T22:00:00+05:30' },
  { name:'Set 01 (QT · LR · Language · GA · IE)', date:'2027-01-05T22:00:00+05:30' },
]

const MHCET_FULL_LENGTH = [
  { name:'Demo MH CET MBA Full Length Mock', date:null, free:true },
  { name:'MH CET Mock 10',                   date:'2026-10-01T22:00:00+05:30' },
  { name:'MH CET Mock 09',                   date:'2026-11-01T22:00:00+05:30' },
  { name:'MH CET Mock 08',                   date:'2026-12-01T22:00:00+05:30' },
  { name:'MH CET Mock 07',                   date:'2027-01-01T22:00:00+05:30' },
  { name:'MH CET Mock 06',                   date:'2027-01-15T22:00:00+05:30' },
  { name:'MH CET Mock 05',                   date:'2027-02-01T22:00:00+05:30' },
  { name:'MH CET Mock 04',                   date:'2027-02-15T22:00:00+05:30' },
  { name:'MH CET Mock 03',                   date:'2027-03-01T22:00:00+05:30' },
  { name:'MH CET Mock 02',                   date:'2027-03-15T22:00:00+05:30' },
  { name:'MH CET Mock 01',                   date:'2027-04-01T22:00:00+05:30' },
]
const MHCET_SECTIONALS = [
  { name:'LR Set 04 (75 Questions)',          date:null },
  { name:'Abstract Reasoning Set 04',         date:'2026-12-01T22:00:00+05:30' },
  { name:'QA Set 04 (50 Questions)',           date:'2027-01-15T22:00:00+05:30' },
  { name:'VA + RC Set 04 (50 Questions)',      date:'2027-02-15T22:00:00+05:30' },
]

const CLAT_FULL_LENGTH = [
  { name:'Demo CLAT Full Length Mock',        date:null, free:true },
  { name:'CLAT Mock 10',                      date:'2026-06-01T22:00:00+05:30' },
  { name:'CLAT Mock 09',                      date:'2026-07-01T22:00:00+05:30' },
  { name:'CLAT Mock 08',                      date:'2026-08-01T22:00:00+05:30' },
  { name:'AILET Mock 05',                     date:'2026-09-01T22:00:00+05:30' },
  { name:'CLAT Mock 07',                      date:'2026-09-15T22:00:00+05:30' },
  { name:'CLAT Mock 06',                      date:'2026-10-01T22:00:00+05:30' },
  { name:'AILET Mock 04',                     date:'2026-10-15T22:00:00+05:30' },
  { name:'CLAT Mock 05',                      date:'2026-11-01T22:00:00+05:30' },
  { name:'CLAT Mock 04',                      date:'2026-11-10T22:00:00+05:30' },
  { name:'AILET Mock 03',                     date:'2026-11-15T22:00:00+05:30' },
  { name:'LNAT Mock 03',                      date:'2026-11-20T22:00:00+05:30' },
  { name:'CLAT Mock 03',                      date:'2026-11-25T22:00:00+05:30' },
  { name:'CLAT Mock 02',                      date:'2026-11-28T22:00:00+05:30' },
  { name:'CLAT Mock 01',                      date:'2026-12-01T22:00:00+05:30' },
]
const CLAT_SECTIONALS = [
  { name:'Legal Reasoning Set 05',            date:null },
  { name:'Current Affairs + GK Set 05',       date:'2026-08-01T22:00:00+05:30' },
  { name:'English Language Set 05',           date:'2026-09-15T22:00:00+05:30' },
  { name:'Logical Reasoning + QT Set 05',     date:'2026-10-15T22:00:00+05:30' },
]

const CUET_FULL_LENGTH = [
  { name:'Demo CUET Paper III (General Test)', date:null, free:true },
  { name:'Paper I (English) Mock 10',          date:'2026-01-01T22:00:00+05:30' },
  { name:'Paper III (General Test) Mock 10',   date:'2026-01-15T22:00:00+05:30' },
  { name:'Accountancy Mock 05',                date:'2026-02-01T22:00:00+05:30' },
  { name:'Mathematics Mock 05',                date:'2026-02-15T22:00:00+05:30' },
  { name:'Economics Mock 05',                  date:'2026-03-01T22:00:00+05:30' },
  { name:'Business Studies Mock 05',           date:'2026-03-15T22:00:00+05:30' },
  { name:'Paper I (English) Mock 05',          date:'2026-03-20T22:00:00+05:30' },
  { name:'Paper III (General Test) Mock 05',   date:'2026-04-01T22:00:00+05:30' },
  { name:'Full Commerce Combo Mock',           date:'2026-04-15T22:00:00+05:30' },
]
const CUET_SECTIONALS = [
  { name:'GK + Current Affairs Set 05',        date:null },
  { name:'Quantitative Aptitude Set 05',        date:'2026-02-01T22:00:00+05:30' },
  { name:'Logical Reasoning Set 05',            date:'2026-03-01T22:00:00+05:30' },
]

const EXAM_SCHEDULES = {
  cat:    { full: null,               sectionals: null },              // Uses FULL_LENGTH and SECTIONALS below
  xat:    { full: XAT_FULL_LENGTH,    sectionals: XAT_SECTIONALS   },
  snap:   { full: SNAP_FULL_LENGTH,   sectionals: SNAP_SECTIONALS  },
  nmat:   { full: NMAT_FULL_LENGTH,   sectionals: NMAT_SECTIONALS  },
  gmat:   { full: GMAT_FULL_LENGTH,   sectionals: GMAT_SECTIONALS  },
  gre:    { full: GRE_FULL_LENGTH,    sectionals: GRE_SECTIONALS   },
  ipmat:  { full: IPMAT_FULL_LENGTH,  sectionals: IPMAT_SECTIONALS },
  cmat:   { full: CMAT_FULL_LENGTH,   sectionals: CMAT_SECTIONALS  },
  mhcet:  { full: MHCET_FULL_LENGTH,  sectionals: MHCET_SECTIONALS },
  clat:   { full: CLAT_FULL_LENGTH,   sectionals: CLAT_SECTIONALS  },
  cuet:   { full: CUET_FULL_LENGTH,   sectionals: CUET_SECTIONALS  },
}

// ── CAT SCHEDULE DATA ─────────────────────────────────────────────────────────

// ── DATA ─────────────────────────────────────────────────────────────────────

const FULL_LENGTH = [
  { name:'Demo iCAT Full Length Mock Test', date:null,                         free:true },
  { name:'iCAT 30', date:'2026-04-15T22:00:00+05:30' },
  { name:'iCAT 29', date:'2026-04-30T22:00:00+05:30' },
  { name:'iCAT 28', date:'2026-05-12T22:00:00+05:30' },
  { name:'iCAT 27', date:'2026-05-22T22:00:00+05:30' },
  { name:'iCAT 26', date:'2026-06-10T22:00:00+05:30' },
  { name:'iCAT 25', date:'2026-06-23T22:00:00+05:30' },
  { name:'iCAT 24', date:'2026-07-08T22:00:00+05:30' },
  { name:'iCAT 23', date:'2026-07-21T22:00:00+05:30' },
  { name:'iCAT 22', date:'2026-07-31T22:00:00+05:30' },
  { name:'iCAT 21', date:'2026-08-07T22:00:00+05:30' },
  { name:'iCAT 20', date:'2026-08-14T22:00:00+05:30' },
  { name:'iCAT 19', date:'2026-08-21T22:00:00+05:30' },
  { name:'iCAT 18', date:'2026-08-28T22:00:00+05:30' },
  { name:'iCAT 17', date:'2026-09-04T22:00:00+05:30' },
  { name:'iCAT 16', date:'2026-09-11T22:00:00+05:30' },
  { name:'iCAT 15', date:'2026-09-18T22:00:00+05:30' },
  { name:'iCAT 14', date:'2026-09-25T22:00:00+05:30' },
  { name:'iCAT 13', date:'2026-09-30T22:00:00+05:30' },
  { name:'iCAT 12', date:'2026-10-05T22:00:00+05:30' },
  { name:'iCAT 11', date:'2026-10-09T22:00:00+05:30' },
  { name:'iCAT 10', date:'2026-10-12T22:00:00+05:30' },
  { name:'iCAT 09', date:'2026-10-16T22:00:00+05:30' },
  { name:'iCAT 08', date:'2026-10-19T22:00:00+05:30' },
  { name:'iCAT 07', date:'2026-10-23T22:00:00+05:30' },
  { name:'iCAT 06', date:'2026-10-26T22:00:00+05:30' },
  { name:'iCAT 05', date:'2026-10-30T22:00:00+05:30' },
  { name:'iCAT 04', date:'2026-11-02T22:00:00+05:30' },
  { name:'iCAT 03', date:'2026-11-06T22:00:00+05:30' },
  { name:'iCAT 02', date:'2026-11-09T22:00:00+05:30' },
  { name:'iCAT 01', date:'2026-11-13T22:00:00+05:30' },
]

const SECTIONALS = [
  { name:'Set 10', date:null }, // Already live
  { name:'Set 09', date:'2026-05-12T22:00:00+05:30' },
  { name:'Set 08', date:'2026-06-02T22:00:00+05:30' },
  { name:'Set 07', date:'2026-06-23T22:00:00+05:30' },
  { name:'Set 06', date:'2026-07-07T22:00:00+05:30' },
  { name:'Set 05', date:'2026-07-21T22:00:00+05:30' },
  { name:'Set 04', date:'2026-08-04T22:00:00+05:30' },
  { name:'Set 03', date:'2026-08-11T22:00:00+05:30' },
  { name:'Set 02', date:'2026-08-18T22:00:00+05:30' },
  { name:'Set 01', date:'2026-08-25T22:00:00+05:30' },
]

// ── HELPERS ───────────────────────────────────────────────────────────────────

function isLive(item) {
  if (!item.date) return true
  return new Date(item.date) <= new Date()
}

function fmtDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) + ', 10:00 PM'
}

function fmtDateShort(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}

function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
}

// ── SCHEDULE SUMMARY CARD ─────────────────────────────────────────────────────

export function MockScheduleCard({ exam = 'cat' }) {
  const schedData = EXAM_SCHEDULES[exam]
  const fullData  = schedData?.full || FULL_LENGTH
  const sectData  = (schedData?.full ? EXAM_SCHEDULES[exam].sectionals : SECTIONALS) || SECTIONALS
  const liveMocks     = fullData.filter(m => isLive(m))
  const upcomingMocks = fullData.filter(m => !isLive(m))
  const liveSects     = sectData.filter(s => isLive(s))
  const upcomingSects = sectData.filter(s => !isLive(s))
  const nextMock      = upcomingMocks[0]
  const nextSect      = upcomingSects[0]

  const C = {
    red:'#ff5e5f', green:'#22c55e',
    greenBg:'#f0fdf4', greenBorder:'#86efac',
    redBg:'#fff5f5', redBorder:'#fca5a5',
    black:'#0f0f0f', white:'#fff',
    gray50:'#fafaf9', gray400:'#999', border:'#e8e8e6',
  }

  const rows = [
    {
      label:'Full-Length Live', dot:C.green,
      badge:`${liveMocks.length} Mock${liveMocks.length!==1?'s':''}`,
      badgeColor:C.green, badgeBg:C.greenBg, badgeBorder:C.greenBorder,
    },
    {
      label:'Sectionals Live', dot:C.green,
      badge:`${liveSects.length} Set${liveSects.length!==1?'s':''}`,
      badgeColor:C.green, badgeBg:C.greenBg, badgeBorder:C.greenBorder,
    },
    {
      label:'Upcoming Mocks', dot:C.red,
      badge:`${upcomingMocks.length} Mock${upcomingMocks.length!==1?'s':''}`,
      badgeColor:C.red, badgeBg:C.redBg, badgeBorder:C.redBorder,
    },
    {
      label:'Upcoming Sectionals', dot:C.red,
      badge:`${upcomingSects.length} Set${upcomingSects.length!==1?'s':''}`,
      badgeColor:C.red, badgeBg:C.redBg, badgeBorder:C.redBorder,
    },
    nextMock ? {
      label:'Next mock release', dot:C.red,
      value:`${nextMock.name}  ·  ${fmtDateShort(nextMock.date)}, 10:00 PM`,
    } : null,
    nextSect ? {
      label:'Next sectional release', dot:C.red,
      value:`${nextSect.name} (VARC · DILR · QA)  ·  ${fmtDateShort(nextSect.date)}, 10:00 PM`,
    } : null,
  ].filter(Boolean)

  return (
    <div style={{
      background:C.white, borderRadius:'12px', overflow:'hidden',
      boxShadow:'0 4px 32px rgba(0,0,0,0.1)', border:`1px solid ${C.border}`,
      maxWidth:'580px',
    }}>
      {/* Red header */}
      <div style={{ background:C.red, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
        <div style={{ width:'48px', height:'48px', background:'rgba(255,255,255,0.9)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>
          📅
        </div>
        <div>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'1.05rem', fontWeight:'800', color:'#fff', letterSpacing:'-0.01em', marginBottom:'0.15rem' }}>
            GRADSKOOL Complete Schedule
          </p>
          <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'rgba(255,255,255,0.75)' }}>
            CAT 2026 — Mocks &amp; Sectional Tests
          </p>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'1rem 1.5rem', gap:'1rem',
          borderBottom: i < rows.length-1 ? `1px solid ${C.border}` : 'none',
          background: C.white,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:row.dot, flexShrink:0, display:'inline-block' }} />
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.9rem', fontWeight:'500', color:C.black }}>
              {row.label}
            </span>
          </div>
          {row.badge ? (
            <span style={{
              fontFamily:'var(--font-sans)', fontSize:'0.8rem', fontWeight:'700',
              color:row.badgeColor, background:row.badgeBg, border:`1px solid ${row.badgeBorder}`,
              padding:'0.25rem 0.875rem', borderRadius:'100px', whiteSpace:'nowrap',
            }}>
              {row.badge}
            </span>
          ) : (
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:C.gray400, textAlign:'right', maxWidth:'280px' }}>
              {row.value}
            </span>
          )}
        </div>
      ))}

      {/* Footer */}
      <div style={{ padding:'0.75rem 1.5rem', borderTop:`1px solid ${C.border}`, background:C.gray50 }}>
        <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>
          Last checked: {nowTime()}
        </p>
      </div>
    </div>
  )
}

// ── FULL SCHEDULE TABLE (fixed height, internal scroll) ─────────────────────────

export function MockScheduleTable({ type = 'full', exam = 'cat' }) {
  const schedData = EXAM_SCHEDULES[exam]
  const fullData  = schedData?.full || FULL_LENGTH
  const sectData  = (schedData?.full ? EXAM_SCHEDULES[exam].sectionals : SECTIONALS) || SECTIONALS
  const data = type === 'full' ? fullData : sectData

  const C = {
    red:'#ff5e5f', black:'#0f0f0f', white:'#fff',
    gray50:'#fafaf9', gray400:'#999', gray500:'#666', border:'#e8e8e6',
  }

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:'4px', overflow:'hidden' }}>
      {/* Header — sticky */}
      <div style={{
        display:'grid',
        gridTemplateColumns: type==='full' ? '2.5fr 80px 2fr 100px' : '2fr 100px 2fr 100px',
        background:'#2d4a2d', padding:'0.75rem 1.25rem', gap:'1rem',
        position:'sticky', top:0, zIndex:1,
      }}>
        {['Test Name','Duration','Status','Action'].map(h => (
          <span key={h} style={{ fontFamily:'var(--font-sans)', fontSize:'0.65rem', fontWeight:'700', letterSpacing:'0.08em', textTransform:'uppercase', color:'#c8e6c8' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Scrollable body */}
      <div style={{ maxHeight: type==='full' ? '380px' : '280px', overflowY:'auto' }}>
      {data.map((mock, i) => {
        const live  = isLive(mock)
        const isFree = mock.free
        const displayName = type === 'sectional'
          ? `${mock.name} (VARC · DILR · QA)`
          : mock.name

        return (
          <div key={i} style={{
            display:'grid',
            gridTemplateColumns: type==='full' ? '2.5fr 80px 2fr 100px' : '2fr 100px 2fr 100px',
            padding:'0.875rem 1.25rem', gap:'1rem',
            borderTop:`1px solid ${C.border}`,
            background: isFree ? '#fffdf5' : C.white,
            alignItems:'center',
            opacity: !live && !isFree ? 0.6 : 1,
          }}>
            {/* Name + badges */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', minWidth:0 }}>
              <span style={{
                fontFamily:'var(--font-sans)', fontSize:'0.875rem',
                fontWeight: live||isFree ? '500' : '400',
                color: live||isFree ? C.black : C.gray400,
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {displayName}
              </span>
              {isFree && (
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.58rem', fontWeight:'800', letterSpacing:'0.06em', color:'#166534', background:'#dcfce7', border:'1px solid #86efac', padding:'0.1rem 0.4rem', borderRadius:'2px', flexShrink:0 }}>
                  FREE
                </span>
              )}
              {live && !isFree && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', fontFamily:'var(--font-sans)', fontSize:'0.58rem', fontWeight:'800', color:'#166534', background:'#f0fdf4', border:'1px solid #86efac', padding:'0.1rem 0.4rem', borderRadius:'2px', flexShrink:0 }}>
                  <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                  LIVE
                </span>
              )}
            </div>

            {/* Duration */}
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:live||isFree?C.gray500:C.gray400 }}>
              {type==='full' ? '2h' : '40m × 3'}
            </span>

            {/* Status */}
            <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:live||isFree?C.gray500:C.gray400 }}>
              {isFree ? 'Available — Free'
                : live ? 'Available Now'
                : `Available on ${fmtDate(mock.date)}`}
            </span>

            {/* Action */}
            <div>
              {(live || isFree) ? (
                <a href={type==='full' ? (TESTFUNDA_URLS[exam]||TESTFUNDA_URL) : (TESTFUNDA_SECTIONAL_URLS[exam]||TESTFUNDA_SECTIONAL_URL)}
                  target="_blank" rel="noreferrer"
                  style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', fontWeight:'700', color:C.red, textDecoration:'none' }}>
                  Attempt ↗
                </a>
              ) : (
                <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.72rem', color:C.gray400 }}>
                  Upcoming
                </span>
              )}
            </div>
          </div>
        )
      })}
      </div>

      {/* Footer — count */}
      <div style={{ padding:'0.5rem 1.25rem', borderTop:`1px solid ${C.border}`, background:C.gray50, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>
          {data.filter(m => isLive(m)).length} live · {data.filter(m => !isLive(m)).length} upcoming · {data.length} total
        </span>
        <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.68rem', color:C.gray400 }}>
          Scroll to see all ↕
        </span>
      </div>
    </div>
  )
}
