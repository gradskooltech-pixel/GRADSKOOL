/**
 * GRADSKOOL — old URL, now redirects to the real bundle page.
 */
export async function getServerSideProps() {
  return { redirect: { destination: '/courses/nmat-snap', permanent: true } }
}
export default function R() { return null }