/**
 * GRADSKOOL — Subdomain Utility
 *
 * Reads NEXT_PUBLIC_EXAM environment variable to determine
 * if this deployment is a subdomain (e.g. cat.gradskool.in)
 * or the main site (gradskool.in).
 *
 * Usage:
 *   import { getSubdomain, isSubdomain, EXAM_SLUG } from '../lib/subdomain'
 *
 * Environment variables:
 *   NEXT_PUBLIC_EXAM=cat      → cat.gradskool.in
 *   NEXT_PUBLIC_EXAM=xat      → xat.gradskool.in
 *   NEXT_PUBLIC_EXAM=         → gradskool.in (main site)
 *   (not set)                 → gradskool.in (main site)
 *
 * Supported exam slugs:
 *   cat, xat, snap, nmat, gmat, gre, ipmat, cmat, mhcet, clat, cuet, pi-wat-gd
 */

const KNOWN_EXAMS = [
  'cat', 'xat', 'snap', 'nmat', 'gmat', 'gre',
  'ipmat', 'cmat', 'mhcet', 'clat', 'cuet', 'pi-wat-gd',
]

// The exam slug for this deployment. Empty string = main site.
export const EXAM_SLUG = (
  process.env.NEXT_PUBLIC_EXAM || ''
).toLowerCase().trim()

// True if this is a subdomain deployment (e.g. cat.gradskool.in)
export const IS_SUBDOMAIN = KNOWN_EXAMS.includes(EXAM_SLUG)

// Exam display names for nav + title
export const EXAM_NAMES = {
  cat:       'CAT 2026',
  xat:       'XAT 2027',
  snap:      'SNAP 2026',
  nmat:      'NMAT 2026',
  gmat:      'GMAT Focus',
  gre:       'GRE General',
  ipmat:     'IPMAT 2027',
  cmat:      'CMAT 2027',
  mhcet:     'MH CET MBA',
  clat:      'CLAT / AILET',
  cuet:      'CUET UG 2026',
  'pi-wat-gd': 'PI WAT GD',
}

// Short labels for navbar
export const EXAM_SHORT = {
  cat:'CAT', xat:'XAT', snap:'SNAP', nmat:'NMAT',
  gmat:'GMAT', gre:'GRE', ipmat:'IPMAT', cmat:'CMAT',
  mhcet:'MH CET', clat:'CLAT', cuet:'CUET', 'pi-wat-gd':'PI WAT GD',
}

// The main domain — used for cross-subdomain links
export const MAIN_DOMAIN =
  process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'https://gradskool.in'

/**
 * Build a URL that always points to the main site.
 * Used for links in subdomain nav that go to the main site.
 */
export function mainUrl(path) {
  if (process.env.NODE_ENV === 'development') return path
  return `${MAIN_DOMAIN}${path}`
}

/**
 * Build a URL for a specific exam subdomain.
 * Used for cross-subdomain links.
 */
export function examUrl(examSlug, path = '/') {
  if (process.env.NODE_ENV === 'development') {
    return `/courses/${examSlug}${path === '/' ? '' : path}`
  }
  const base = MAIN_DOMAIN.replace('://', `://${examSlug}.`)
  return `${base}${path}`
}

/**
 * Get the subdomain for the current deployment.
 * Returns null on main site.
 */
export function getSubdomain() {
  return IS_SUBDOMAIN ? EXAM_SLUG : null
}

/**
 * Nav items for subdomain deployments.
 * Replaces the main site nav.
 */
export function getSubdomainNav(examSlug) {
  const name = EXAM_SHORT[examSlug] || examSlug.toUpperCase()
  return [
    { href: '/',                              label: `${name} Home` },
    { href: `/courses/${examSlug}/mocks`,     label: 'Mock Tests' },
    { href: `/learn/${examSlug}`,             label: 'My Learning' },
    { href: mainUrl('/blog'),                 label: 'Blog', external: true },
    { href: mainUrl('/tools'),                label: 'Free Tools', external: true },
  ]
}

/**
 * Nav items for the main gradskool.in site.
 */
export const MAIN_NAV = [
  { href: '/courses',    label: 'Courses' },
  { href: '/tools',      label: 'Free Tools' },
  { href: '/blog',       label: 'Blog' },
]
