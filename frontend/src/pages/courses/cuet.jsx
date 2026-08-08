import ExamPageTemplate from '../../components/exam/ExamPageTemplate'
import { CUET_DATA } from '../../data/examData'

export default function CuetPage() {
  return <ExamPageTemplate data={CUET_DATA} meta={{ title:'CUET UG 2026 — Mocks & Books | GRADSKOOL', desc:'CUET UG 2026 preparation — 40 online mocks across Paper I, Paper III and Commerce domain subjects. 8 printed books. DU, BHU, JNU and 250+ central universities.', canonical:'https://gradskool.in/courses/cuet' }} />
}
