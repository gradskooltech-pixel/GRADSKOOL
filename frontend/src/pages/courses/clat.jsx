import ExamPageTemplate from '../../components/exam/ExamPageTemplate'
import { CLAT_DATA } from '../../data/examData'

export default function ClatPage() {
  return <ExamPageTemplate data={CLAT_DATA} meta={{ title:'CLAT Coaching — AILET & LNAT | GRADSKOOL', desc:'CLAT, AILET and LNAT preparation — 18 full-length tests, 21 printed books. Legal Reasoning, Current Affairs, English, LR and Quantitative Techniques.', canonical:'https://gradskool.in/courses/clat' }} />
}
