import ExamPageTemplate from '../../components/exam/ExamPageTemplate'
import { IPMAT_DATA } from '../../data/examData'

export default function IpmatPage() {
  return <ExamPageTemplate data={IPMAT_DATA} meta={{ title:'IPMAT Coaching — 89 Mocks, IIM Indore | GRADSKOOL', desc:'89 full-length IPMAT mocks across 12 programmes — IIM Indore, Rohtak, JIPMAT, NPAT and more. 19 printed books. Live sessions + interview prep.', canonical:'https://gradskool.in/courses/ipmat' }} />
}
