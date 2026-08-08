// Old top-level stub — now redirects to the real dedicated CAT Books
// page (a genuine physical-books product, distinct from the PDF Library).
export async function getStaticProps() {
  return { redirect: { destination: '/courses/cat/books', permanent: true } }
}
export default function Redirect() { return null }