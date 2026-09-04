/**
 * GRADSKOOL — Edge middleware: exam subdomains
 *
 * Runs on every request (see matcher below) and hands host+path to
 * resolveSubdomainRouting() (lib/subdomainRouting.js — the actual rules
 * and their reasoning live there, kept framework-free so it's unit-
 * testable without spinning up Next.js). This file is just the glue that
 * turns its answer into a real NextResponse.
 *
 * One Next.js deployment serves every domain (gradskool.in AND every
 * exam subdomain) — there is no separate build or service per subdomain.
 */
import { NextResponse } from 'next/server'
import { resolveSubdomainRouting, APEX_DOMAIN } from './lib/subdomainRouting'

export function middleware(request) {
  const hostname = request.headers.get('host') || ''
  const { pathname, search } = request.nextUrl

  const result = resolveSubdomainRouting(hostname, pathname)
  if (!result) return NextResponse.next()

  if (result.action === 'rewrite') {
    const url = request.nextUrl.clone()
    url.pathname = result.pathname
    return NextResponse.rewrite(url)
  }

  // action === 'redirect'
  const target = `https://${result.exam}.${APEX_DOMAIN}${result.pathname}${search}`
  return NextResponse.redirect(target, 301)
}

export const config = {
  // Run on everything except Next internals, API routes, and requests for
  // a file with an extension (favicon.ico, images, etc).
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
