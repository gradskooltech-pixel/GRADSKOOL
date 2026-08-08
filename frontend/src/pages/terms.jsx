import Head from 'next/head'
import { LegalPage } from './privacy-policy'

const SECTIONS = [
  {
    title: '1. Eligibility',
    content: `You must be at least 16 years of age to use our Services. By registering or purchasing, you confirm that you are legally capable of entering into binding contracts and that all information provided during registration is true and accurate.`,
  },
  {
    title: '2. Account Registration',
    content: `When you create an account on GRADSKOOL, you agree to provide accurate and updated information and are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately of any unauthorised access or misuse. GRADSKOOL reserves the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: '3. Use of Services',
    content: `You agree to use our Services only for lawful purposes. You must not: Share or distribute course materials without written permission · Record or redistribute live classes or video content · Engage in any activity that disrupts our platform or infringes on others' rights. All course materials, videos, books, and question sets are copyrighted intellectual property of GRADSKOOL and are meant for individual learning only.`,
  },
  {
    title: '4. Payments and Pricing',
    content: `All prices listed on our website are in Indian Rupees (INR) unless stated otherwise. We reserve the right to modify pricing, discounts, or offers at any time. Payment for online courses, test series, or printed books must be made in full before access or delivery. By completing a purchase, you authorise GRADSKOOL and its payment partners to process your transaction.`,
  },
  {
    title: '5. Refund & Cancellation',
    content: `Our refund policy is defined separately under our Refund & Cancellation Policy, available at gradskool.in/refund-policy. By making a purchase, you agree to that policy and understand that certain digital services may be non-refundable.`,
  },
  {
    title: '6. Intellectual Property Rights',
    content: `All course content, videos, PDFs, logos, designs, graphics, and text are the exclusive property of GRADSKOOL Learning Pvt. Ltd. Unauthorised copying, reproduction, or distribution of our content may result in legal action.`,
  },
  {
    title: '7. Limitation of Liability',
    content: `GRADSKOOL is not responsible for: Any loss or damage caused by your reliance on our educational content · Delays, interruptions, or system errors caused by third-party tools or your internet connection · Personal academic outcomes such as exam results, selection, or job offers. Our total liability in any case shall not exceed the amount paid by you for the specific service.`,
  },
  {
    title: '8. Third-Party Links and Services',
    content: `Our website may contain links to third-party tools or platforms (such as payment gateways, mock test platforms, or video streaming services). GRADSKOOL is not responsible for the practices or content of those platforms. Use of third-party services is governed by their respective terms and privacy policies.`,
  },
  {
    title: '9. Modifications to Services',
    content: `GRADSKOOL reserves the right to modify, suspend, or discontinue any part of its Services — including session schedules, content formats, pricing, or platform features — at any time, with or without notice. We will make reasonable efforts to inform enrolled students of significant changes.`,
  },
  {
    title: '10. Governing Law',
    content: `These Terms & Conditions are governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of courts in India.`,
  },
  {
    title: '11. Contact Us',
    content: `For any questions about these Terms, contact us at: Email: hello@gradskool.in · Website: www.gradskool.in`,
  },
]

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms & Conditions — GRADSKOOL</title>
        <meta name="description" content="GRADSKOOL Terms & Conditions — your agreement when using our courses, platform, and services." />
        <link rel="canonical" href="https://gradskool.in/terms" />
      </Head>
      <LegalPage
        title="Terms & Conditions"
        effective="November 2, 2025"
        sections={SECTIONS}
      />
    </>
  )
}
