/**
 * GRADSKOOL — PageSEO Component
 *
 * Handles ALL per-page SEO:
 *  - Title, description, keywords
 *  - Canonical URL
 *  - OG tags (Facebook, WhatsApp, LinkedIn)
 *  - Twitter card tags
 *  - Robots directive
 *  - Breadcrumb schema
 *  - Page-specific schema (Course, FAQPage, BlogPosting, etc.)
 *  - AEO (Answer Engine Optimization) — speakable spec
 *  - GEO (Generative Engine Optimization) — structured data for AI engines
 *
 * Usage:
 *   <PageSEO
 *     title="CATalysis 2026 — GRADSKOOL"
 *     description="..."
 *     canonical="https://gradskool.in/cat"
 *     ogImage="/assets/og-cat.jpg"
 *     breadcrumbs={[{name:'Home',url:'/'},{name:'CAT',url:'/cat'}]}
 *     schema={[courseSchema, faqSchema]}
 *   />
 */
import Head from 'next/head'

const BASE_URL = 'https://gradskool.in'
const DEFAULT_OG = `${BASE_URL}/assets/og-image.jpg`
const TWITTER_HANDLE = '@gradskool_mba'

export default function PageSEO({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = 'website',
  twitterTitle,
  twitterDescription,
  noindex = false,
  breadcrumbs = [],   // [{name, url}]
  schema = [],        // additional schema blocks (array of plain objects)
  speakableSelectors, // for AEO — CSS selectors of key content
  dateModified,
  datePublished,
}) {
  const fullCanonical = canonical
    ? (canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`)
    : null

  const ogImageFull = ogImage
    ? (ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`)
    : DEFAULT_OG

  const robotsContent = noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'

  // Auto-build breadcrumb schema
  const breadcrumbSchema = breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((bc, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": bc.name,
      "item": bc.url.startsWith('http') ? bc.url : `${BASE_URL}${bc.url}`,
    }))
  } : null

  // WebPage schema with speakable spec for AEO/GEO
  const webPageSchema = fullCanonical ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${fullCanonical}#webpage`,
    "url": fullCanonical,
    "name": title,
    "description": description,
    "isPartOf": { "@id": `${BASE_URL}/#website` },
    "inLanguage": "en-IN",
    ...(dateModified ? { "dateModified": dateModified } : {}),
    ...(datePublished ? { "datePublished": datePublished } : {}),
    ...(breadcrumbs.length > 0 ? {
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((bc, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "name": bc.name,
          "item": bc.url.startsWith('http') ? bc.url : `${BASE_URL}${bc.url}`,
        }))
      }
    } : {}),
    ...(speakableSelectors ? {
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": speakableSelectors
      }
    } : {})
  } : null

  const allSchemas = [
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
    ...(webPageSchema ? [webPageSchema] : []),
    ...schema,
  ]

  return (
    <Head>
      {/* ── Core ── */}
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
      <meta name="robots" content={robotsContent} />

      {/* ── Open Graph ── */}
      <meta property="og:type" content={ogType} />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImageFull} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || 'GRADSKOOL'} />
      <meta property="og:site_name" content="GRADSKOOL" />
      <meta property="og:locale" content="en_IN" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={twitterTitle || title} />
      <meta name="twitter:description" content={twitterDescription || description} />
      <meta name="twitter:image" content={ogImageFull} />

      {/* ── Schema Blocks ── */}
      {allSchemas.map((s, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
    </Head>
  )
}

/* ─────────────────────────────────────────────────────────────
   Pre-built schema helpers — import and use in page files
───────────────────────────────────────────────────────────── */

export function courseSchema({ id, name, altName, description, url, price, startDate, endDate, mode = ['online','synchronous'] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${BASE_URL}${url}#course`,
    "name": name,
    ...(altName ? { "alternateName": altName } : {}),
    "description": description,
    "provider": { "@id": `${BASE_URL}/#organization` },
    "instructor": { "@id": `${BASE_URL}/#alp` },
    "url": `${BASE_URL}${url}`,
    "courseMode": mode,
    "inLanguage": ["en-IN", "hi-IN"],
    "educationalLevel": "Competitive Exam Preparation",
    ...(price ? {
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "INR",
        "availability": "https://schema.org/InStock",
        "url": `${BASE_URL}/checkout?course=${url.replace('/courses/','')}`,
      }
    } : {}),
    ...(startDate || endDate ? {
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "online",
        ...(startDate ? { "startDate": startDate } : {}),
        ...(endDate ? { "endDate": endDate } : {}),
      }
    } : {}),
  }
}

export function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  }
}

export function howToSchema({ name, description, steps }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map((s, i) => ({
      "@type": "HowToStep",
      "position": i + 1,
      "name": s.name,
      "text": s.text,
    }))
  }
}

export function blogSchema({ url, title, description, datePublished, dateModified, authorName = 'Abhishek Leela Pandey', ogImage }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${BASE_URL}${url}#article`,
    "headline": title,
    "description": description,
    "url": `${BASE_URL}${url}`,
    "datePublished": datePublished,
    "dateModified": dateModified || datePublished,
    "author": { "@id": `${BASE_URL}/#alp`, "name": authorName },
    "publisher": { "@id": `${BASE_URL}/#organization` },
    "inLanguage": "en-IN",
    ...(ogImage ? { "image": { "@type": "ImageObject", "url": ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}` } } : {}),
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${BASE_URL}${url}` }
  }
}

export function reviewsSchema(reviews) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${BASE_URL}/#organization`,
    "name": "GRADSKOOL",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9", "bestRating": "5", "ratingCount": "347"
    },
    "review": reviews.map(r => ({
      "@type": "Review",
      "author": { "@type": "Person", "name": r.name },
      "reviewBody": r.text,
      "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" }
    }))
  }
}

export function eventSchema({ name, description, url, startDate, endDate }) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": name,
    "description": description,
    "url": `${BASE_URL}${url}`,
    "startDate": startDate,
    ...(endDate ? { "endDate": endDate } : {}),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "organizer": { "@id": `${BASE_URL}/#organization` },
    "inLanguage": "en-IN",
  }
}

export function foundationClassSchema({ title, description, url, startDate, duration, ytUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": title,
    "description": description,
    "url": `${BASE_URL}${url}`,
    "provider": { "@id": `${BASE_URL}/#organization` },
    "instructor": { "@id": `${BASE_URL}/#alp` },
    "isAccessibleForFree": true,
    "courseMode": ["online", "synchronous"],
    "inLanguage": "en-IN",
    ...(startDate ? { "hasCourseInstance": { "@type": "CourseInstance", "startDate": startDate, "courseMode": "online" } } : {}),
    ...(ytUrl ? { "video": { "@type": "VideoObject", "contentUrl": ytUrl, "embedUrl": ytUrl } } : {}),
  }
}
