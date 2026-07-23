import { describe, it, expect } from 'vitest'
import { combinedOverallForStudent, classCombinedOverall } from './combinedOverall'

describe('combinedOverallForStudent', () => {
  it('divides only by marks possible in attempted tests, not the full subject-wide pool', () => {
    // Student attempted 3 of 43 possible tests across subjects, scoring well on those 3.
    const result = combinedOverallForStudent([
      { marksScored: 27, marksPossible: 30 },
      { marksScored: 18, marksPossible: 20 },
      { marksScored: 45, marksPossible: 50 },
    ])
    expect(result).toBeCloseTo((27 + 18 + 45) / (30 + 20 + 50) * 100, 5)
    // Sanity: should NOT look artificially terrible against some much larger subject-wide pool.
    expect(result).toBeGreaterThan(80)
  })

  it('returns null for a student with zero attempts anywhere', () => {
    expect(combinedOverallForStudent([])).toBeNull()
  })
})

describe('classCombinedOverall', () => {
  it('averages only students who have a non-null value', () => {
    const result = classCombinedOverall([80, null, 60, null])
    expect(result).toBeCloseTo(70, 5)
  })

  it('returns null when no student has any data', () => {
    expect(classCombinedOverall([null, null])).toBeNull()
  })
})
