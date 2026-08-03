import { LeaderboardTable } from '../components/LeaderboardTable'
import { ProtractorRadar, type RadarPoint } from '../components/ProtractorRadar'
import { QuestionBreakdownTable } from '../components/QuestionBreakdownTable'
import { RightWrongBarChart } from '../components/RightWrongBarChart'
import { StrugglingTopics } from '../components/StrugglingTopics'
import { SubmissionGrid } from '../components/SubmissionGrid'
import { TopicDifficultyHeatmap } from '../components/TopicDifficultyHeatmap'
import { TrendChart } from '../components/TrendChart'
import { scoreColor } from '../lib/color'
import { enrolledStudents, subjectStatus } from '../lib/enrollment'
import { countRightWrong } from '../lib/rightWrongCounts'
import { studentTestCounts } from '../lib/testCounts'
import type { DashboardData } from '../types/dashboard'

interface SubjectPageProps {
  data: DashboardData
  subject: string
  student: string | null
}

function toRadarPoints(record: Record<string, number>, order: string[]): RadarPoint[] {
  return order.map((skill) => ({ skill, accuracy: record[skill] ?? 0 }))
}

export function SubjectPage({ data, subject, student }: SubjectPageProps) {
  const status = student ? subjectStatus(data, subject, student) : null

  if (student && status === 'not-enrolled') {
    return (
      <div className="page">
        <h2>{subject}</h2>
        <p className="mono soft">
          {student} is not enrolled in {subject}.
        </p>
      </div>
    )
  }

  const scored = data.scored[subject]
  const tracking = data.trackingOnly[subject]

  if (!scored && !tracking) {
    return (
      <div className="page">
        <h2>{subject}</h2>
        <p className="mono soft">No record updated yet for {subject}.</p>
      </div>
    )
  }

  if (!scored && tracking) {
    return (
      <div className="page">
        <h2>{subject}</h2>
        <p className="soft mono">Tests tracked as submitted / not submitted — no scores yet.</p>
        <SubmissionGrid
          students={enrolledStudents(data, subject)}
          testOrder={tracking.testOrder}
          testLabels={tracking.testLabels}
          submissions={tracking.submissions}
        />
      </div>
    )
  }

  const subj = scored!
  const entry = student ? subj.students[student] : null
  const difficultyOrder = Object.keys(subj.classAvg.byDifficulty)
  const typeOrder = Object.keys(subj.classAvg.byType)

  return (
    <div className="page">
      <h2>{subject}</h2>

      {student && entry ? (
        <>
          <div className="card-grid">
            <div className="card">
              <h3>Overall</h3>
              <p className="stat" style={{ color: entry.overall !== null ? scoreColor(entry.overall) : undefined }}>
                {entry.overall !== null ? `${Math.round(entry.overall)}%` : 'No submissions yet'}
              </p>
            </div>
            <div className="card">
              <h3>Tests taken / due</h3>
              <p className="stat mono">
                {studentTestCounts(data, student).taken.length} / {studentTestCounts(data, student).due.length}
              </p>
            </div>
          </div>

          <div className="radar-grid radar-grid-2x2">
            <div className="card">
              <h3>Cognitive Typology</h3>
              <ProtractorRadar
                data={toRadarPoints(entry.byTypology, subj.typologies)}
                compare={toRadarPoints(subj.classAvg.byTypology, subj.typologies)}
                title="Cognitive typology radar"
              />
            </div>
            <div className="card">
              <h3>Difficulty</h3>
              <ProtractorRadar
                data={toRadarPoints(entry.byDifficulty, difficultyOrder)}
                compare={toRadarPoints(subj.classAvg.byDifficulty, difficultyOrder)}
                title="Difficulty radar"
              />
            </div>
            <div className="card">
              <h3>Theory / Numerical</h3>
              <ProtractorRadar
                data={toRadarPoints(entry.byType, typeOrder)}
                compare={toRadarPoints(subj.classAvg.byType, typeOrder)}
                title="Theory vs numerical radar"
              />
            </div>
            <div className="card">
              <h3>Questions Attempted</h3>
              <RightWrongBarChart key={student} {...countRightWrong(entry.questions)} />
            </div>
          </div>

          <div className="card">
            <h3>Topic × Difficulty</h3>
            <TopicDifficultyHeatmap topics={subj.topics} difficulties={difficultyOrder} data={entry.byTopicDifficulty} />
          </div>

          <div className="card">
            <h3>Struggling Topics</h3>
            <StrugglingTopics priority={entry.priority} />
          </div>

          <div className="card">
            <h3>Score trend</h3>
            <TrendChart points={entry.trend} testLabels={subj.testLabels} />
          </div>

          <h3>Question breakdown</h3>
          <QuestionBreakdownTable questions={entry.questions} testOrder={subj.testOrder} testLabels={subj.testLabels} />
        </>
      ) : (
        <p className="mono soft select-prompt">Select a student to see radar charts, the heatmap, and question breakdown.</p>
      )}

      <h2>Leaderboard</h2>
      <LeaderboardTable entries={subj.leaderboard} />
    </div>
  )
}
