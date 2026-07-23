interface SubmissionGridProps {
  students: string[]
  testOrder: string[]
  testLabels: Record<string, string>
  submissions: Record<string, string[]>
}

export function SubmissionGrid({ students, testOrder, testLabels, submissions }: SubmissionGridProps) {
  if (testOrder.length === 0) {
    return <p className="mono">No tests tracked yet.</p>
  }
  return (
    <table className="submission-grid mono">
      <thead>
        <tr>
          <th>Student</th>
          {testOrder.map((t) => (
            <th key={t}>{testLabels[t] ?? t}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student}>
            <td>{student}</td>
            {testOrder.map((t) => {
              const submitted = submissions[student]?.includes(t) ?? false
              return (
                <td key={t} className={submitted ? 'submitted' : 'not-submitted'}>
                  {submitted ? 'Submitted' : 'Not submitted'}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
