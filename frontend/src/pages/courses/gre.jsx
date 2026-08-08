import ExamPageTemplate from '../../components/exam/ExamPageTemplate'
import { GRE_DATA } from '../../data/examData'

export default function GrePage() {
  return <ExamPageTemplate data={GRE_DATA} meta={{ title:'GRE Coaching — Live Classes & Mocks | GRADSKOOL', desc:'Live GRE preparation — Verbal, Quantitative and AWA. 5,000-word vocabulary programme. Individual AWA essay feedback. Target MIT, Stanford, CMU, NUS.', canonical:'https://gradskool.in/courses/gre' }} />
}
