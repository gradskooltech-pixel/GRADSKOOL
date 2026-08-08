import ExamPageTemplate from '../../components/exam/ExamPageTemplate'
import { GMAT_DATA } from '../../data/examData'

export default function GmatPage() {
  return <ExamPageTemplate data={GMAT_DATA} meta={{ title:'GMAT Coaching — Focus Edition Live Classes | GRADSKOOL', desc:'Live GMAT Focus Edition preparation by Abhishek Leela Pandey. Quantitative, Verbal and Data Insights. Target ISB, INSEAD, LBS and top global MBA programmes.', canonical:'https://gradskool.in/courses/gmat' }} />
}
