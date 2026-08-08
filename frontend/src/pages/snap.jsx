// Old top-level stub — was a blank no-op page. Redirects to the real
// destination instead of rendering an empty page for anyone who lands
// here via an old bookmark, external link, or stale search result.
export async function getStaticProps() {
  return { redirect: { destination: '/courses/snap', permanent: true } }
}
export default function Redirect() { return null }
