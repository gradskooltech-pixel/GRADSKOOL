import Head from 'next/head'
import Link from 'next/link'

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `a) Personal Information
Name, email address, phone number, and billing details when you register, enrol, or make a purchase. Login credentials and account details. Address or delivery information for physical product shipments (printed books or merchandise).

b) Non-Personal Information
Browser type, device information, operating system, and IP address. Usage data such as time spent, pages visited, and actions taken on the site. Cookies and analytics data for improving user experience and performance tracking.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use your data to: Deliver course content, test series, and digital materials. Process transactions and send payment confirmations. Communicate updates, schedule notifications, and promotional offers. Improve course design, platform usability, and website functionality. Provide academic or technical support through chat, email, or phone. Ensure compliance with legal obligations and prevent misuse or fraud.`,
  },
  {
    title: '3. Sharing & Disclosure of Information',
    content: `We do not sell or rent your personal information. We may share limited data only with: Service Providers — payment gateways, delivery partners, analytics tools. Legal Authorities — if required by applicable law or regulation. Business Transfers — in case of mergers, acquisitions, or restructuring. All third-party vendors are contractually bound to maintain confidentiality and comply with data protection laws.`,
  },
  {
    title: '4. Data Retention',
    content: `We retain your data for as long as necessary to provide Services, comply with legal requirements, or resolve disputes. You may request deletion of your personal data by writing to hello@gradskool.in.`,
  },
  {
    title: '5. Cookies Policy',
    content: `Our website uses cookies to enhance your browsing experience. Cookies help us keep you signed in, understand how you interact with content, and optimise your learning experience. You can disable cookies in your browser settings, but some features may not function properly.`,
  },
  {
    title: '6. Data Security',
    content: `We use industry-standard measures including SSL encryption, secure servers, and limited database access, along with regular malware scanning and system monitoring. While we strive for complete security, no system can be 100% secure — users are encouraged to maintain the confidentiality of their login details.`,
  },
  {
    title: '7. Your Rights',
    content: `You have the right to: Access, update, or delete your personal information. Withdraw consent for marketing communications. Request a copy of the data we store about you. To exercise these rights, contact us at hello@gradskool.in.`,
  },
  {
    title: '8. Third-Party Links',
    content: `Our site may include links to external websites. GRADSKOOL is not responsible for the privacy practices or content of those sites. We recommend reviewing the privacy policies of any third-party platforms you visit.`,
  },
  {
    title: '9. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated effective date. Continued use of our Services after changes constitutes acceptance of the revised policy.`,
  },
  {
    title: '10. Contact Us',
    content: `For any privacy-related queries or requests, contact us at: Email: hello@gradskool.in · Website: www.gradskool.in`,
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy — GRADSKOOL</title>
        <meta name="description" content="GRADSKOOL Privacy Policy — how we collect, use, and protect your personal information." />
        <link rel="canonical" href="https://gradskool.in/privacy-policy" />
      </Head>
      <LegalPage
        title="Privacy Policy"
        effective="November 2, 2025"
        sections={SECTIONS}
      />
    </>
  )
}

export function LegalPage({ title, effective, sections }) {
  return (
    <div style={s.page}>
      <div style={s.container}>
        <p style={s.breadcrumb}>
          <Link href="/" style={s.breadLink}>Home</Link>
          <span style={s.sep}>/</span>
          <span style={s.breadCat}>Legal</span>
          <span style={s.sep}>/</span>
          <span>{title}</span>
        </p>

        <div style={s.header}>
          <p style={s.tag}>Legal</p>
          <h1 style={s.title}>{title}</h1>
          <p style={s.meta}>
            Effective Date: {effective} · Last Updated: {effective} · Questions:{' '}
            <a href="mailto:hello@gradskool.in" style={s.emailLink}>hello@gradskool.in</a>
          </p>
        </div>

        <div style={s.content}>
          {sections.map((sec, i) => (
            <div key={i} style={s.section}>
              <h2 style={s.sectionTitle}>{sec.title}</h2>
              {sec.content.split('\n\n').map((para, j) => (
                <p key={j} style={s.para}>{para}</p>
              ))}
            </div>
          ))}
        </div>

        <div style={s.footer}>
          <Link href="/" style={s.homeLink}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { background: 'var(--gray-50)', padding: '3rem 2rem', minHeight: '100vh' },
  container: { maxWidth: '720px', margin: '0 auto' },
  breadcrumb: { fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '2rem' },
  breadLink: { color: 'var(--gray-400)', textDecoration: 'none' },
  breadCat:  { color: 'var(--gray-400)' },
  sep: { margin: '0 0.4rem' },
  header: {
    background: 'var(--white)', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '2rem', marginBottom: '1.5rem',
  },
  tag: {
    fontFamily: 'var(--font-sans)', fontSize: '0.68rem', fontWeight: '700',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--red)', marginBottom: '0.5rem',
  },
  title: {
    fontFamily: 'var(--font-serif)', fontSize: '2rem',
    fontWeight: '700', color: 'var(--black)', marginBottom: '0.75rem',
  },
  meta: {
    fontFamily: 'var(--font-sans)', fontSize: '0.78rem',
    color: 'var(--gray-400)', lineHeight: '1.6',
  },
  emailLink: { color: 'var(--red)', textDecoration: 'none' },
  content: {
    background: 'var(--white)', border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius)', padding: '2rem',
    display: 'flex', flexDirection: 'column', gap: '2rem',
  },
  section: {},
  sectionTitle: {
    fontFamily: 'var(--font-serif)', fontSize: '1.1rem',
    fontWeight: '700', color: 'var(--black)', marginBottom: '0.75rem',
  },
  para: {
    fontFamily: 'var(--font-serif)', fontSize: '0.93rem',
    color: 'var(--gray-600)', lineHeight: '1.8', marginBottom: '0.5rem',
    whiteSpace: 'pre-line',
  },
  footer: { marginTop: '1.5rem' },
  homeLink: {
    fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
    color: 'var(--gray-400)', textDecoration: 'none',
  },
}
