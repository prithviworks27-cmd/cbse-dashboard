import { AttendanceCard } from '../components/AttendanceCard'
import { CombinedOverallCard } from '../components/CombinedOverallCard'
import { SubjectSnapshotCard } from '../components/SubjectSnapshotCard'
import { SyllabusProgress } from '../components/SyllabusProgress'
import { TestsCountCard } from '../components/TestsCountCard'
import { classTestCounts, studentTestCounts } from '../lib/testCounts'
import type { DashboardData } from '../types/dashboard'

interface OverviewProps {
  data: DashboardData
  student: string | null
}

export function Overview({ data, student }: OverviewProps) {
  const isClassView = student === null

  const testsCard = isClassView
    ? (() => {
        const { avgTaken, avgDue } = classTestCounts(data)
        return { taken: avgTaken.toFixed(1), due: avgDue.toFixed(1), takenList: [], dueList: [], isAverage: true }
      })()
    : (() => {
        const { taken, due } = studentTestCounts(data, student)
        return { taken: taken.length, due: due.length, takenList: taken, dueList: due, isAverage: false }
      })()

  const combinedValue = isClassView ? data.combinedOverall.classOverall : data.combinedOverall.students[student] ?? null
  const attendanceEntry = isClassView ? undefined : data.attendance?.[student]

  return (
    <div className="page">
      <div className="card-grid">
        {!isClassView && <AttendanceCard entry={attendanceEntry} />}
        <CombinedOverallCard value={combinedValue} classAvg={data.combinedOverall.classOverall} isClassView={isClassView} />
        <TestsCountCard {...testsCard} />
      </div>

      <h2>Subjects</h2>
      <div className="card-grid">
        {data.subjects.map((subject) => (
          <SubjectSnapshotCard key={subject} data={data} subject={subject} student={student} />
        ))}
      </div>

      {data.syllabusProgress && <SyllabusProgress progress={data.syllabusProgress} />}
    </div>
  )
}
