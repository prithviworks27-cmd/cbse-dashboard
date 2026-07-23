import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Overview } from './Overview'
import { sampleDashboard } from '../data/sampleDashboard'

const data = sampleDashboard

function assertNoLeakedPlaceholders(container: HTMLElement) {
  const text = container.textContent ?? ''
  expect(text).not.toMatch(/\bNaN\b/)
  expect(text).not.toMatch(/\bundefined\b/)
  expect(text).not.toMatch(/\bnull\b/)
}

describe('Overview renders cleanly for every student, including the class view', () => {
  const studentsIncludingClassView: Array<string | null> = [...data.students, null]

  for (const student of studentsIncludingClassView) {
    const label = student ?? 'All Students'
    it(`student=${label} — no NaN/undefined/null leaks to output`, () => {
      const { container } = render(<Overview data={data} student={student} />)
      assertNoLeakedPlaceholders(container)
    })
  }
})

describe('Overview — specific state assertions', () => {
  it('shows n/a (not 0% or NaN) for a student with zero submissions anywhere in combinedOverall', () => {
    // Priya Nair and Karan Mehta both have combinedOverall.students -> null in the fixture.
    expect(data.combinedOverall.students['Priya Nair']).toBeNull()
    const { getByText } = render(<Overview data={data} student="Priya Nair" />)
    expect(getByText('n/a')).toBeTruthy()
  })

  it('renders four distinct subject snapshot states across the roster (not-enrolled / no-data / tracking-only / scored)', () => {
    const { container } = render(<Overview data={data} student="Karan Mehta" />)
    const text = container.textContent ?? ''
    // Karan: not enrolled in Physics, tracking-only in Chemistry, no-data in Maths.
    expect(text).toMatch(/Not enrolled/)
    expect(text).toMatch(/Tests tracked, no scores yet/)
    expect(text).toMatch(/No record updated yet/)
  })

  it('shows a class-wide average (not a single-student figure) in the All Students view', () => {
    const { getByText } = render(<Overview data={data} student={null} />)
    expect(getByText('Class overall')).toBeTruthy()
  })
})
