import { describe, it, expect } from 'vitest'
import { classAttendance } from './attendance'
import type { DashboardData } from '../types/dashboard'

function makeData(attendance: DashboardData['attendance'], students: string[]): DashboardData {
  return {
    school: 'Test', className: 'X', subjects: [], subjectsWithScores: [], students,
    subjectEnrollment: {}, attendance, scored: {}, trackingOnly: {},
    combinedOverall: { classOverall: null, students: {} },
  } as unknown as DashboardData
}

describe('classAttendance', () => {
  it('averages each field across students who have an entry', () => {
    const data = makeData(
      {
        Amy: { attendancePct: 100, presentPct: 100, onlinePct: 0, absentPct: 0 },
        Zoe: { attendancePct: 0, presentPct: 0, onlinePct: 0, absentPct: 100 },
      },
      ['Amy', 'Zoe'],
    )
    expect(classAttendance(data)).toEqual({ attendancePct: 50, presentPct: 50, onlinePct: 0, absentPct: 50 })
  })

  it('excludes students with no entry from the average rather than counting them as 0', () => {
    const data = makeData(
      { Amy: { attendancePct: 80, presentPct: 80, onlinePct: 0, absentPct: 20 } },
      ['Amy', 'NoData'],
    )
    expect(classAttendance(data)).toEqual({ attendancePct: 80, presentPct: 80, onlinePct: 0, absentPct: 20 })
  })

  it('returns undefined when no student has attendance data', () => {
    expect(classAttendance(makeData(undefined, ['Amy']))).toBeUndefined()
    expect(classAttendance(makeData({}, ['Amy']))).toBeUndefined()
  })
})
