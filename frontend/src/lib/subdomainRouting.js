/**
 * GRADSKOOL — Subdomain routing rules
 *
 * Pure decision logic for the "everything of an exam lives under its own
 * subdomain" feature (e.g. snap.gradskool.in). Kept framework-free (no
 * next/server import here) so it can be unit-tested directly with plain
 * Node — the actual Next.js glue lives in src/middleware.js, which just
 * calls resolveSubdomainRouting() and turns the result into a
 * NextResponse.rewrite()/redirect().
 *
 * Two directions, one route table:
 *
 * 1. On an exam's subdomain (host = "<exam>.gradskool.in", or
 *    "<exam>.localhost" for local testing), a handful of bare top-level
 *    paths get quietly REWRITTEN to the real, exam-namespaced page — the
 *    URL bar keeps showing e.g. snap.gradskool.in/mocks, but the actual
 *    content served is /mocks/snap. Any other, deeper path (e.g.
 *    /mocks/attempt/123, /learn/some-topic, /courses/cat) is left
 *    completely untouched and just passes through as the same page it
 *    would be on the main site — nothing here blocks cross-exam browsing
 *    or the shared pages (auth, dashboard, blog, tools, admin-panel).
 *
 * 2. On the main site (gradskool.in / www.gradskool.in), hitting one of
 *    those exam-namespaced pages directly gets a 301 REDIRECT out to its
 *    short subdomain equivalent — e.g. gradskool.in/mocks/snap redirects
 *    to snap.gradskool.in/mocks. This is what makes the subdomain the one
 *    real (indexable, linkable) home for that content instead of leaving
 *    two live copies around.
 *
 * 3. A few more main-site paths don't have a matching page on the
 *    subdomain at all, but should still redirect there rather than stay
 *    reachable on the main site — see LEGACY_REDIRECTS below. Unlike
 *    SUBDOMAIN_ROUTES, these are one-way: they consolidate an old/
 *    secondary main-site URL into an EXISTING subdomain route, rather
 *    than defining a page that also exists in mirrored form on the
 *    subdomain itself. Right now that's /courses/snap/mocks (the old
 *    third-party Testfunda mocks page — folded into the real native
 *    /mocks hub, which now lives on the subdomain) and
 *    /courses/snap/pricing (not a real linked-to page, but redirected to
 *    the subdomain homepage just in case anything old points at it —
 *    pricing is shown inline on the course page).
 *
 * Not every route makes sense for every exam. /mocks only means something
 * for an exam with real native mock content authored (see NATIVE_MOCKS_EXAMS
 * in lib/nativeMocksExams.js), and /live only exists as a real page for a
 * couple of exams (courses/snap/live.jsx, courses/nmat/live.jsx — most
 * exams have no /courses/<exam>/live page at all, so rewriting to it would
 * just be a 404). Each route below can declare `exams: [...]` to gate
 * itself to only the exams that actually have that content — a route with
 * no `exams` key is assumed safe for any exam (true today for the
 * homepage and checkout, both backed by dynamic/fallback pages that
 * resolve for any slug). When adding a new exam's subdomain, check this
 * gating before assuming all 5 routes will work for it.
 *
 * NOT covered here: /courses/nmat-snap, the SNAP+NMAT bundle page. It's
 * genuinely mixed content (both exams, one bundle price) and there's no
 * established home for it on either exam's subdomain — left on the main
 * site deliberately rather than guessed at. Worth a real decision if you
 * want it moved too.
 */

// Exams that have their own dedicated subdomain live. Add a slug here only
// once DNS + the Railway custom domain for "<slug>.gradskool.in" are
// actually set up — see DEPLOYMENT.md at the repo root for that runbook.
export const SUBDOMAIN_EXAMS = ['snap']

// The apex domain every subdomain hangs off. Redirect targets are always
// built against this, never against whatever host the request actually
// arrived on (so a request to www.gradskool.in still redirects to
// snap.gradskool.in, not snap.www.gradskool.in).
export const APEX_DOMAIN = 'gradskool.in'

// Hosts on which the main-site → subdomain redirect (direction 2 above)
// applies. Deliberately does NOT include localhost/127.0.0.1 — so
// /courses/snap etc. keep working directly in local dev without a real
// snap.gradskool.in to redirect to.
export const MAIN_HOSTS = ['gradskool.in', 'www.gradskool.in']

// path: the bare subdomain path (no trailing slash, '' means the root "/").
// target(exam): the real, exam-namespaced page it maps to on the main
// site's page tree — same value used for both directions.
// exams (optional): if present, this route only applies to exams in this
// list — everywhere else it's assumed to work for any exam. Keep this
// list in sync with which exams actually have that page built; it's
// independent of SUBDOMAIN_EXAMS (an exam can be "live" here before it
// has its own subdomain, ready for whenever it does).
const SUBDOMAIN_ROUTES = [
  { path: '',          target: (exam) => `/courses/${exam}` },
  { path: '/mocks',    target: (exam) => `/mocks/${exam}`,        exams: ['snap'] },
  { path: '/learn',    target: (exam) => `/learn/${exam}` },
  { path: '/live',     target: (exam) => `/courses/${exam}/live`, exams: ['snap', 'nmat'] },
  { path: '/checkout', target: (exam) => `/checkout/${exam}` },
]

function routeAppliesTo(route, exam) {
  return !route.exams || route.exams.includes(exam)
}

// One-way consolidation redirects: an old/secondary main-site path that
// has no mirrored page on the subdomain, but should still send visitors
// there instead of staying reachable on the main site. mainPath(exam) is
// the main-site path being retired; subdomainPath is the (already
// existing, from SUBDOMAIN_ROUTES) short path on the subdomain it folds
// into. Only used for the main-site -> subdomain redirect direction —
// these deliberately do NOT get a matching subdomain-side rewrite.
const LEGACY_REDIRECTS = [
  { mainPath: (exam) => `/courses/${exam}/mocks`,   subdomainPath: '/mocks', exams: ['snap'] },
  { mainPath: (exam) => `/courses/${exam}/pricing`, subdomainPath: '' },
]

// Extracts the leading label of a hostname when it looks like a subdomain
// — "snap.gradskool.in" → "snap", "snap.localhost" → "snap" (for local
// testing via an /etc/hosts entry or a browser that resolves *.localhost
// on its own). Bare "gradskool.in" or "localhost" → null (main site).
export function getSubdomainLabel(hostname) {
  const labels = (hostname || '').toLowerCase().split(':')[0].split('.')
  if (labels.length > 2) return labels[0]
  if (labels.length === 2 && labels[1] === 'localhost') return labels[0]
  return null
}

function normalizePath(pathname) {
  if (pathname === '/') return ''
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
}

/**
 * @param {string} hostname - the request's Host header (port allowed)
 * @param {string} pathname - the request's pathname (no query string)
 * @returns {{action:'rewrite', pathname:string} | {action:'redirect', exam:string, pathname:string} | null}
 *   null means "do nothing, pass the request through unchanged."
 */
export function resolveSubdomainRouting(hostname, pathname) {
  const clean = normalizePath(pathname)
  const exam = getSubdomainLabel(hostname)

  if (exam && SUBDOMAIN_EXAMS.includes(exam)) {
    const route = SUBDOMAIN_ROUTES.find((r) => r.path === clean && routeAppliesTo(r, exam))
    if (!route) return null
    return { action: 'rewrite', pathname: route.target(exam) }
  }

  const hostLower = (hostname || '').toLowerCase().split(':')[0]
  if (MAIN_HOSTS.includes(hostLower)) {
    for (const e of SUBDOMAIN_EXAMS) {
      const route = SUBDOMAIN_ROUTES.find((r) => r.target(e) === clean && routeAppliesTo(r, e))
      if (route) {
        return { action: 'redirect', exam: e, pathname: route.path === '' ? '/' : route.path }
      }
      const legacy = LEGACY_REDIRECTS.find((r) => r.mainPath(e) === clean && routeAppliesTo(r, e))
      if (legacy) {
        return { action: 'redirect', exam: e, pathname: legacy.subdomainPath === '' ? '/' : legacy.subdomainPath }
      }
    }
  }

  return null
}
