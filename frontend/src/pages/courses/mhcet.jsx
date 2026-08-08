import ExamPageTemplate from '../../components/exam/ExamPageTemplate'
import { MHCET_DATA } from '../../data/examData'

export default function MhcetPage() {
  return <ExamPageTemplate data={MHCET_DATA} meta={{ title:'MH CET MBA Coaching — Live Classes & Mocks | GRADSKOOL', desc:'Live MH CET MBA preparation — 200 questions, 150 minutes, no negative marking. Full LR, Abstract, QA, VA modules. Target JBIMS, SIMSREE, KJ Somaiya.', canonical:'https://gradskool.in/courses/mhcet' }} />
}
