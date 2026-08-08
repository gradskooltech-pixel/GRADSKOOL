import ExamPageTemplate from '../../components/exam/ExamPageTemplate'
import { PIWATGD_DATA } from '../../data/examData'

export default function PiwatgdPage() {
  return <ExamPageTemplate data={PIWATGD_DATA} meta={{ title:'PI WAT GD Coaching — Mock Interviews | GRADSKOOL', desc:'Personal Interview, WAT and GD preparation for IIM and top B-school calls. Mock PIs, GD simulation, WAT essays, AWT for IIM-A. 10+ B-school formats.', canonical:'https://gradskool.in/courses/pi-wat-gd' }} />
}
