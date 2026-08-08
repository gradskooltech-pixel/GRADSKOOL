/**
 * GRADSKOOL — old hub URL, now redirects to /free.
 * See /free.jsx for why: "foundations" undersold the NMAT/SNAP complete
 * courses. XAT's own page keeps its accurate /foundations/xat URL — only
 * this bare hub route moved.
 */
export async function getStaticProps() {
  return { redirect: { destination: '/free', permanent: true } }
}
export default function R() { return null }