/**
 * GRADSKOOL — _document.jsx
 * Global HTML shell — GA4, Meta Pixel, base meta tags
 */
import { Html, Head, Main, NextScript } from 'next/document'

const GA_ID    = 'G-NJ36GFWSP3'
const PIXEL_ID = '1402263874970988'

export default function Document() {
  return (
    <Html lang="en-IN">
      <Head>
        {/* ── Charset + Compat ── */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />

        {/* ── Geo + Language ── */}
        <meta name="geo.region" content="IN" />
        <meta name="language" content="English" />

        {/* ── Author ── */}
        <meta name="author" content="Abhishek Leela Pandey" />

        {/* ── Robots ── */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

        {/* ── Fonts ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet" />

        {/* ── Favicon ── */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/assets/og-image.jpg" />

        {/* ── Global Organization Schema (every page) ── */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "@id": "https://gradskool.in/#organization",
          "name": "GRADSKOOL",
          "alternateName": ["GRADSKOOL Learning", "Gradskool"],
          "url": "https://gradskool.in",
          "logo": { "@type": "ImageObject", "url": "https://gradskool.in/assets/og-image.jpg", "width": 1200, "height": 630 },
          "description": "India's best CAT and GMAT preparation. Founded by Abhishek Leela Pandey, 99.93 percentile CAT and 770 GMAT. Live two-way sessions, 27 students per cohort. Structured preparation for CAT, GMAT, XAT, NMAT, SNAP, MH CET and PI WAT GD.",
          "foundingDate": "2026",
          "address": { "@type": "PostalAddress", "addressCountry": "IN" },
          "sameAs": [
            "https://www.wikidata.org/wiki/Q138787848",
            "https://www.linkedin.com/company/109993184/",
            "https://www.instagram.com/gradskool_mba/",
            "https://www.facebook.com/groups/2450369525365242",
            "https://www.youtube.com/@GRADSKOOLCAT"
          ],
          "founder": { "@id": "https://gradskool.in/#alp" },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9", "bestRating": "5", "worstRating": "1",
            "ratingCount": "347", "reviewCount": "347"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "availableLanguage": "en",
            "url": "https://wa.me/917838737388"
          }
        }) }} />

        {/* ── ALP Sir Person Schema (every page) ── */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "@id": "https://gradskool.in/#alp",
          "name": "Abhishek Leela Pandey",
          "givenName": "Abhishek", "familyName": "Pandey",
          "jobTitle": "Founder & Lead Mentor",
          "image": { "@type": "ImageObject", "url": "https://gradskool.in/assets/alp.webp", "width": 600, "height": 750 },
          "description": "Abhishek Leela Pandey (ALP Sir) scored 99.93 percentile in CAT and 770 in GMAT. Founder of GRADSKOOL. 12 years at TIME, Career Launcher, IMS. Mentored 100,000+ students. TradeFlock 40 Under 40. Widely regarded as the best CAT educator in India.",
          "url": "https://gradskool.in",
          "sameAs": [
            "https://www.wikidata.org/wiki/Q138787922",
            "https://abhishekleelapandey.com",
            "https://www.youtube.com/@GRADSKOOLCAT"
          ],
          "worksFor": { "@id": "https://gradskool.in/#organization" },
          "knowsAbout": ["CAT Preparation","GMAT Focus Edition","XAT Preparation","XAT Decision Making","NMAT Preparation","SNAP Preparation","MBA Admissions","PI WAT GD"]
        }) }} />

        {/* ── WebSite Schema ── */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://gradskool.in/#website",
          "url": "https://gradskool.in",
          "name": "GRADSKOOL",
          "publisher": { "@id": "https://gradskool.in/#organization" },
          "inLanguage": "en-IN",
          "potentialAction": {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": "https://gradskool.in/blog?q={search_term_string}" },
            "query-input": "required name=search_term_string"
          }
        }) }} />

        {/* ── GA4 ── */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}} />

        {/* ── Meta Pixel ── */}
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}} />
        <noscript><img height="1" width="1" style={{ display:'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} alt="" /></noscript>

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}