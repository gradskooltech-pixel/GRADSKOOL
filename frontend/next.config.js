/** @type {import('next').NextConfig} */

const SUBDOMAIN = (process.env.NEXT_PUBLIC_SUBDOMAIN || '').trim().toLowerCase()
// NEXT_PUBLIC_SUBDOMAIN = 'cat' | 'omets' | '' (main site)

const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      'gradskool.in', 'cdn.gradskool.in',
      'vz-gradskool.b-cdn.net', 'lh3.googleusercontent.com',
      'res.cloudinary.com',
    ],
  },

  async redirects() {
    if (SUBDOMAIN === 'cat') {
      return [
        { source: '/',              destination: '/cat',         permanent: false },
        { source: '/courses/cat',   destination: '/cat',         permanent: false },
      ]
    }
    if (SUBDOMAIN === 'omets') {
      return [
        { source: '/',              destination: '/omets',       permanent: false },
        { source: '/courses',       destination: '/omets',       permanent: false },
      ]
    }
    return [
      // Short URLs → canonical course URLs
      { source: '/cat',            destination: '/courses/cat',            permanent: true },
      { source: '/xat',            destination: '/courses/xat',            permanent: true },
      { source: '/snap',           destination: '/courses/snap',           permanent: true },
      { source: '/nmat',           destination: '/courses/nmat',           permanent: true },
      { source: '/gmat',           destination: '/courses/gmat',           permanent: true },
      { source: '/mhcet',          destination: '/courses/mhcet',          permanent: true },
      { source: '/cmat',           destination: '/courses/cmat',           permanent: true },
      { source: '/cathlete',       destination: '/courses/cat#cathlete',   permanent: true },
      { source: '/courses/cat/cathlete', destination: '/courses/cat/cat-crash-course-2026', permanent: true },
      { source: '/nmat-snap',      destination: '/courses/nmat-snap',      permanent: true },
      { source: '/cat-mocks',      destination: '/courses/cat-mocks',      permanent: true },
      { source: '/cat-books',      destination: '/courses/cat-books',      permanent: true },
      { source: '/catalysis-2027', destination: '/courses/catalysis-2027', permanent: true },
      { source: '/pi-wat-gd',      destination: '/courses/pi-wat-gd',      permanent: true },
      { source: '/foundations',    destination: '/free',                   permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',       value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  productionBrowserSourceMaps: false,
}

module.exports = nextConfig