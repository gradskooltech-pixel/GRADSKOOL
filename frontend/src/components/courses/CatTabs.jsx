/**
 * GRADSKOOL — Shared CAT product tab bar
 *
 * Used identically across every CAT-related page (main CAT page, CAThlete,
 * CATalysis, ALPgebra) so navigation and styling stay
 * consistent no matter which page you land on first.
 *
 * CAThlete leads (the near-term crash course), CATalysis follows.
 */
import Link from 'next/link'

// Same fallback pattern used throughout the CAT pages — computed, not
// hardcoded, so this doesn't quietly go stale next year the way a literal
// "2027" in a label would.
const FALLBACK_EXAM_DATE = '2026-11-29'
const catalysisYear = new Date(FALLBACK_EXAM_DATE).getFullYear() + 1

const TABS = [
  { href:'/courses/cat/cat-crash-course-2026',  label:'CAThlete — Crash Course',                  key:'cathlete' },
  { href:'/courses/cat/catalysis', label:`CATalysis ${catalysisYear} Flagship Cohort`, key:'catalysis' },
  { href:'/courses/cat/alpgebra',  label:'ALPgebra',                    key:'alpgebra' },
  { href:'/courses/cat/mocks',     label:'Mocks',                       key:'mocks' },
  { href:'/courses/cat/books',     label:'Books',                       key:'books' },
]

export default function CatTabs({ active }) {
  return (
    <>
      <style>{`
        .cat-tabs { display:flex; overflow-x:auto; border-bottom:var(--border); background:#fff; position:sticky; top:62px; z-index:90; }
        .cat-tab  { font-family:var(--font-sans); font-size:13px; font-weight:500; padding:14px 22px; border-bottom:2px solid transparent; color:var(--g500); cursor:pointer; transition:all var(--t); text-decoration:none; display:block; white-space:nowrap; }
        .cat-tab:hover { color:var(--black); }
        .cat-tab.active { color:var(--black); border-bottom-color:var(--red); font-weight:600; }
        @media(max-width:960px) { .cat-tab{padding:12px 16px;font-size:12px} }
      `}</style>
      <div className="cat-tabs">
        {TABS.map(t => (
          <Link key={t.key} href={t.href} className={`cat-tab${active === t.key ? ' active' : ''}`}>{t.label}</Link>
        ))}
      </div>
    </>
  )
}