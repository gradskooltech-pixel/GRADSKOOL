import Head from 'next/head'
import { LegalPage } from './privacy-policy'

const SECTIONS = [
  {
    title: '1. Digital Products — Courses, Test Series, Workshops',
    content: `a) Non-Refundable Once Accessed
All our online products — including video courses, live classes, test series, and workshop enrolments — are non-refundable once access credentials are shared or a session has begun. Access to course material constitutes consumption of service.

b) Refund Before Activation
If you make a payment but your course or test access has not yet been activated, you may request a full refund within 48 hours of payment. Refunds will be processed to your original payment method within 7–10 business days.

c) Duplicate Payments
In case of duplicate transactions due to technical errors, the extra amount will be refunded in full within 7 working days, after verification by our finance team.`,
  },
  {
    title: '2. Printed Books and Study Material',
    content: `a) Order Cancellations
Orders for printed materials can be cancelled before shipment. Once the shipment is dispatched, the order cannot be cancelled.

b) Damaged or Defective Products
If you receive a damaged or misprinted book, please share unboxing photos/videos at hello@gradskool.in within 48 hours of delivery. We will issue a free replacement or refund, depending on stock availability.

c) Return Shipping
In case of approved returns, shipping costs will be borne by GRADSKOOL unless otherwise stated.`,
  },
  {
    title: '3. Live Events and Workshops',
    content: `Tickets or registrations for live workshops or events (online/offline) are non-refundable once confirmed. If an event is postponed or cancelled by GRADSKOOL, participants will receive a 100% refund or credit towards future events.`,
  },
  {
    title: '4. Mode of Refund',
    content: `All eligible refunds are processed through the original mode of payment — UPI, credit/debit card, net banking, wallet, etc. Refund completion time may vary based on your payment gateway or bank policy.`,
  },
  {
    title: '5. How to Request a Refund',
    content: `To initiate a refund request, write to hello@gradskool.in with: Your registered email address · Order ID or payment reference number · Reason for the refund request. Our team will respond within 2 business days.`,
  },
  {
    title: 'Important Note',
    content: `By enrolling or purchasing any product from GRADSKOOL, you acknowledge that you have read, understood, and agreed to this Refund & Cancellation Policy. For refund requests, write to hello@gradskool.in.`,
  },
]

export default function RefundPage() {
  return (
    <>
      <Head>
        <title>Refund Policy — GRADSKOOL</title>
        <meta name="description" content="GRADSKOOL Refund & Cancellation Policy — digital products, printed books, and live events." />
        <link rel="canonical" href="https://gradskool.in/refund-policy" />
      </Head>
      <LegalPage
        title="Refund & Cancellation Policy"
        effective="November 2, 2025"
        sections={SECTIONS}
      />
    </>
  )
}
