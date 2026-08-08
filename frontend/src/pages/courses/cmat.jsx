import ExamPageTemplate from '../../components/exam/ExamPageTemplate'
import { CMAT_DATA } from '../../data/examData'

export default function CmatPage() {
  return <ExamPageTemplate data={CMAT_DATA} meta={{ title:'CMAT Coaching — Live Classes & Mocks | GRADSKOOL', desc:'Live CMAT preparation — all 5 sections including Innovation & Entrepreneurship. 12 full-length CMAT mocks. Target JBIMS, SIMSREE, PUMBA.', canonical:'https://gradskool.in/courses/cmat' }} />
}
