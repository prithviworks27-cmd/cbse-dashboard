import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SubjectPage } from './SubjectPage'
import { sampleDashboard } from '../data/sampleDashboard'
import { subjectStatus } from '../lib/enrollment'

const data = sampleDashboard

function assertNoLeakedPlaceholders(container: HTMLElement) {
  const text = container.textContent ?? ''
  expect(text).not.toMatch(/\bNaN\b/)
  expect(text).not.toMatch(/\bundefined\b/)
  expect(text).not.toMatch(/\bnull\b/)
}

describe('SubjectPage renders cleanly for every (subject, student) combination', () => {
  const studentsIncludingClassView: Array<string | null> = [...data.students, null]

  for (const subject of data.subjects) {
    for (const student of studentsIncludingClassView) {
      const label = student ?? 'All Students'
      it(`subject=${subject} student=${label} — no NaN/undefined/null leaks to output`, () => {
        const { container } = render(<SubjectPage data={data} subject={subject} student={student} />)
        assertNoLeakedPlaceholders(container)
      })
    }
  }
})

describe('SubjectPage — specific state assertions', () => {
  it('shows a distinct not-enrolled message for a student not on the subject roster', () => {
    // Karan Mehta is not enrolled in Physics in the sample fixture.
    expect(subjectStatus(data, 'Physics', 'Karan Mehta')).toBe('not-enrolled')
    const { getByText } = render(<SubjectPage data={data} subject="Physics" student="Karan Mehta" />)
    expect(getByText(/Karan Mehta is not enrolled in Physics/)).toBeTruthy()
  })

  it('shows "No submissions yet" (not a numeric overall) for an enrolled student with zero submissions', () => {
    // Priya Nair is enrolled in Physics but has overall: null in the fixture.
    expect(data.scored.Physics.students['Priya Nair'].overall).toBeNull()
    const { getByText } = render(<SubjectPage data={data} subject="Physics" student="Priya Nair" />)
    expect(getByText('No submissions yet')).toBeTruthy()
  })

  it('gives the zero-submission student rank: null rendered as an em dash, never 0 or NaN', () => {
    const { container } = render(<SubjectPage data={data} subject="Physics" student="Priya Nair" />)
    const rows = Array.from(container.querySelectorAll('table.leaderboard tbody tr'))
    const priyaRow = rows.find((r) => r.textContent?.includes('Priya Nair'))
    expect(priyaRow?.textContent).toContain('—')
  })

  it('prompts to select a student in the All Students class view, while still showing the leaderboard', () => {
    const { getByText, container } = render(<SubjectPage data={data} subject="Physics" student={null} />)
    expect(getByText(/Select a student/)).toBeTruthy()
    expect(container.querySelector('table.leaderboard')).toBeTruthy()
  })

  it('shows a submission grid (not scores) for a tracking-only subject', () => {
    const { container, getByText } = render(<SubjectPage data={data} subject="Chemistry" student="Asha Verma" />)
    expect(getByText(/no scores yet/)).toBeTruthy()
    expect(container.querySelector('table.submission-grid')).toBeTruthy()
  })

  it('shows "No record updated yet" for a subject with no data at all for an enrolled student', () => {
    const { getByText } = render(<SubjectPage data={data} subject="Maths" student="Asha Verma" />)
    expect(getByText(/No record updated yet/)).toBeTruthy()
  })
})
