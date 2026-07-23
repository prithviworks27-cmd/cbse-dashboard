import { useState } from 'react'
import { Route, Routes, useParams } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { StudentPicker } from './components/StudentPicker'
import { Overview } from './pages/Overview'
import { SubjectPage } from './pages/SubjectPage'
import type { DashboardData } from './types/dashboard'

export function App({ data }: { data: DashboardData }) {
  const [student, setStudent] = useState<string | null>(null)

  return (
    <div className="app-shell">
      <NavBar data={data} />
      <div className="app-toolbar">
        <StudentPicker students={data.students} selected={student} onSelect={setStudent} />
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
