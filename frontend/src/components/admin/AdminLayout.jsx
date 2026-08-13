/**
 * GRADSKOOL — Admin Panel Layout
 * Shared shell for all /admin-panel/* pages.
 * Enforces IsAdmin role — redirects non-admins.
 */
/**
 * GRADSKOOL — Admin Panel Layout
 * Shared shell for all /admin-panel/* pages.
 * Enforces IsAdmin role — redirects non-admins.
 *
 * Groups are collapsible — click a group header to fold it. State persists
 * per-session (not saved across reloads) via component state; expand/collapse
 * preference isn't worth a backend round-trip.
 */
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../../hooks/useAuth'
import { useEffect, useState } from 'react'

// Every top-level admin page. Dynamic detail routes (course/[id], student/[id],
// cohorts/[slug]/page, pages/[slug], pdfs/new) are reached FROM their list page,
// not listed here directly — same reasoning you'd use for any master/detail UI.
const NAV_ITEMS = [
  // ── Overview ─────────────────────────────────────────────────────────────
  { href: '/admin-panel',                 label: 'Overview',         icon: '📊', group: 'Overview' },

  // ── Analytics ────────────────────────────────────────────────────────────
  { href: '/admin-panel/analytics',       label: 'Analytics',        icon: '📈', group: 'Analytics' },
  { href: '/admin-panel/revenue',         label: 'Revenue',          icon: '💰', group: 'Analytics' },
  { href: '/admin-panel/cohorts',         label: 'Cohorts',          icon: '👥', group: 'Analytics' },
  { href: '/admin-panel/content-performance', label: 'Content Performance', icon: '📉', group: 'Analytics' },
  { href: '/admin-panel/quiz-analytics',  label: 'Quiz Analytics',   icon: '🧮', group: 'Analytics' },
  { href: '/admin-panel/dropoff',         label: 'Drop-off',         icon: '⤵️', group: 'Analytics' },
  { href: '/admin-panel/batch-health',    label: 'Batch Health',     icon: '🩺', group: 'Analytics' },
  { href: '/admin-panel/leads',           label: 'Leads & Email',    icon: '📧', group: 'Analytics' },
  { href: '/admin-panel/tools',           label: 'Free Tools',       icon: '🛠', group: 'Analytics' },
  { href: '/admin-panel/notifications',   label: 'Notifications',    icon: '🔔', group: 'Analytics' },

  // ── Manage (people & operations) ─────────────────────────────────────────
  { href: '/admin-panel/students',        label: 'Students',         icon: '👤', group: 'Manage' },
  { href: '/admin-panel/enrollments',     label: 'Enrollments',      icon: '🎓', group: 'Manage' },
  { href: '/admin-panel/enroll',          label: 'Manual Enroll',    icon: '➕', group: 'Manage' },
  { href: '/admin-panel/bulk-enroll',     label: 'Bulk Enroll',      icon: '📦', group: 'Manage' },
  { href: '/admin-panel/orders',          label: 'Orders',           icon: '💳', group: 'Manage' },
  { href: '/admin-panel/coupons',         label: 'Coupons',          icon: '🏷️', group: 'Manage' },
  { href: '/admin-panel/programmes',      label: 'Programmes',       icon: '⚙️', group: 'Manage' },
  { href: '/admin-panel/cohorts-manage',  label: 'Cohorts',          icon: '🗓️', group: 'Manage' },
  { href: '/admin-panel/mock-credentials',label: 'Mock Access',      icon: '🔑', group: 'Manage' },
  { href: '/admin-panel/live-sessions',   label: 'Live Sessions',    icon: '🔴', group: 'Manage' },

  // ── Content (CMS) ────────────────────────────────────────────────────────
  { href: '/admin-panel/exams',           label: 'Exams',            icon: '📖', group: 'Content' },
  { href: '/admin-panel/courses',         label: 'Course Builder',   icon: '🏗️', group: 'Content' },
  { href: '/admin-panel/curriculum',      label: 'Curriculum',       icon: '📚', group: 'Content' },
  { href: '/admin-panel/video-library',   label: 'Video Library',    icon: '🎬', group: 'Content' },
  { href: '/admin-panel/question-bank',   label: 'Question Bank',    icon: '❔', group: 'Content' },
  { href: '/admin-panel/foundations',     label: 'Foundations',      icon: '🌱', group: 'Content' },
  { href: '/admin-panel/pdfs',            label: 'PDF Library',      icon: '📄', group: 'Content' },
  { href: '/admin-panel/blog-manage',     label: 'Blog CMS',         icon: '✍️', group: 'Content' },
  { href: '/admin-panel/testimonials',    label: 'Testimonials',     icon: '💬', group: 'Content' },
  { href: '/admin-panel/results-wall',    label: 'Results Wall',     icon: '🏆', group: 'Content' },
  { href: '/admin-panel/faqs-manage',     label: 'FAQs',             icon: '❓', group: 'Content' },
  { href: '/admin-panel/homepage',        label: 'Homepage',         icon: '🏠', group: 'Content' },
  { href: '/admin-panel/mock-schedule',   label: 'Mock Schedule',    icon: '📅', group: 'Content' },
  { href: '/admin-panel/pages',           label: 'Dynamic Pages',    icon: '📃', group: 'Content' },
  { href: '/admin-panel/tools-manage',    label: 'Tools',            icon: '🧰', group: 'Content' },

  // ── Config ───────────────────────────────────────────────────────────────
  { href: '/admin-panel/site-settings',   label: 'Site Settings',    icon: '⚙️', group: 'Config' },
  { href: '/admin-panel/announcement',    label: 'Announcement',     icon: '📢', group: 'Config' },
]

const GROUPS = ['Overview', 'Analytics', 'Manage', 'Content', 'Config']

export function AdminLayout({ title, children }) {
  const { user, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  // Auto-expand whichever group contains the current page; rest default open too
  // on first load (nothing to guess wrong), then respects manual toggles after.
  const [collapsed, setCollapsed] = useState({})

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/')
    }
  }, [isLoading, isAdmin, router])

  if (isLoading || !isAdmin) return null

  const toggleGroup = (group) => {
    setCollapsed(prev => ({ ...prev, [group]: !prev[group] }))
  }

  return (
    <>
      <Head>
        <title>{title ? `${title} — Admin — GRADSKOOL` : 'Admin — GRADSKOOL'}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={s.root}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <Link href="/" style={s.logo}>
            GRAD<span style={{ color: 'var(--red)' }}>SKOOL</span>
          </Link>
          <p style={s.sidebarLabel}>Admin Panel</p>

          <nav style={s.nav}>
            {GROUPS.map(group => {
              const items = NAV_ITEMS.filter(i => i.group === group)
              if (items.length === 0) return null
              const isCollapsed = !!collapsed[group]
              const hasActiveChild = items.some(i => i.href === router.pathname)

              return (
                <div key={group}>
                  {group !== 'Overview' && (
                    <button
                      onClick={() => toggleGroup(group)}
                      style={s.navGroupBtn}
                      aria-expanded={!isCollapsed}
                    >
                      <span>{group}</span>
                      <span style={{ ...s.navGroupChevron, transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}>▾</span>
                    </button>
                  )}
                  {!isCollapsed && items.map(item => {
                    const isActive = router.pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={{ ...s.navItem, ...(isActive ? s.navItemActive : {}) }}
                      >
                        <span style={s.navIcon}>{item.icon}</span>
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          <div style={s.sidebarFooter}>
            <div style={s.userRow}>
              <span style={s.userDot} />
              <div>
                <p style={s.userName}>{user?.first_name} {user?.last_name}</p>
                <p style={s.userRole}>Administrator</p>
              </div>
            </div>
            <Link href="/dashboard" style={s.backLink}>← Student Dashboard</Link>
          </div>
        </aside>

        {/* Main content */}
        <main style={s.main}>
          <div style={s.mainInner}>
            {children}
          </div>
        </main>
      </div>
    </>
  )
}

const s = {
  root: {
    display: 'grid', gridTemplateColumns: '240px 1fr',
    minHeight: '100vh', background: 'var(--gray-50)',
  },
  sidebar: {
    background: 'var(--black)',
    padding: '1.75rem 1.25rem',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh', overflow: 'auto',
  },
  logo: {
    fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: '700',
    letterSpacing: '0.04em', color: 'var(--white)', textDecoration: 'none',
    marginBottom: '0.5rem', display: 'block',
  },
  sidebarLabel: {
    fontFamily: 'var(--font-sans)', fontSize: '0.62rem', fontWeight: '700',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-sans)', fontSize: '0.82rem',
    color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
    transition: 'background 0.15s, color 0.15s',
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.1)', color: 'var(--white)',
  },
  navGroupBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontSize: '0.6rem', fontWeight: '700',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.3)', padding: '1rem 0.5rem 0.4rem',
  },
  navGroupChevron: {
    fontSize: '0.65rem', transition: 'transform 0.15s', color: 'rgba(255,255,255,0.3)',
  },
  navIcon: { fontSize: '1rem', flexShrink: 0 },
  sidebarFooter: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '1.25rem',
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
  },
  userRow: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  userDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 },
  userName: { fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: '600', color: 'var(--white)' },
  userRole: { fontFamily: 'var(--font-sans)', fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' },
  backLink: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '1px', display: 'inline-block',
  },
  main: { overflow: 'auto', minHeight: '100vh' },
  mainInner: { padding: '2.5rem', maxWidth: '1200px' },
}