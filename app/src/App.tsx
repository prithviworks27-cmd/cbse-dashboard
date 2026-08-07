import { useEffect, useState } from 'react'
import { Route, Routes, useParams, useLocation, matchPath } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { StudentPicker } from './components/StudentPicker'
import { enrolledStudents } from './lib/enrollment'
import { Overview } from './pages/Overview'
import { SubjectPage } from './pages/SubjectPage'
import type { DashboardData } from './types/dashboard'

export function App({ data }: { data: DashboardData }) {
  const [student, setStudent] = useState<string | null>(null)
  const location = useLocation()

  // The Overview page spans every subject, so its picker lists the whole roster. A subject
  // page only makes sense for students actually enrolled in that subject, so its picker is
  // filtered accordingly -- and if the currently-selected student isn't enrolled here, fall
  // back to "All Students" rather than leaving the picker pointed at an option it no longer has.
  const subjectMatch = matchPath('/subject/:subject', location.pathname)
  const currentSubject = subjectMatch?.params.subject ? decodeURIComponent(subjectMatch.params.subject) : null
  const pickerStudents = currentSubject ? enrolledStudents(data, currentSubject) : data.students

  useEffect(() => {
    if (student && currentSubject && !enrolledStudents(data, currentSubject).includes(student)) {
      setStudent(null)
    }
  }, [currentSubject, student, data])

  return (
    <div className="app-shell">
      <NavBar data={data} />
      <div className="app-toolbar">
        <StudentPicker students={pickerStudents} selected={student} onSelect={setStudent} />
      </div>
      <main>
        <Routes>
          <Route path="/" element={<Overview data={data} student={student} />} />
          <Route path="/subject/:subject" element={<SubjectPageRoute data={data} student={student} />} />
        </Routes>
      </main>
    </div>
  )
}

function SubjectPageRoute({ data, student }: { data: DashboardData; student: string | null }) {
  const { subject } = useParams<{ subject: string }>()
  return <SubjectPage data={data} subject={decodeURIComponent(subject ?? '')} student={student} />
}

export default App
