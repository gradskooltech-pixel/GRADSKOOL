// Old top-level stub — now redirects to the real dedicated page.
export async function getStaticProps() {
  return { redirect: { destination: '/courses/cat/varc-hub', permanent: true } }
}
export default function Redirect() { return null }
