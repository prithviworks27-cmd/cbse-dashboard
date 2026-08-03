import { describe, it, expect } from 'vitest'
import { countRightWrong } from './rightWrongCounts'
import type { Question } from '../types/dashboard'

function q(score: number | null, marks: number): Question {
  return { test: 't1', topic: 'Topic', qno: 'Q1', difficulty: 'Easy', typology: 'Applying', type: 'MCQ', score, marks, accuracy: null }
}

describe('countRightWrong', () => {
  it('counts full-marks questions as correct', () => {
    expect(countRightWrong([q(1, 1), q(2, 2)])).toEqual({ correct: 2, wrong: 0 })
  })

  it('counts zero and partial-credit scores as wrong', () => {
    expect(countRightWrong([q(0, 1), q(1, 2)])).toEqual({ correct: 0, wrong: 2 })
  })

  it('excludes unattempted questions (score: null) entirely', () => {
    expect(countRightWrong([q(1, 1), q(null, 1), q(0, 1)])).toEqual({ correct: 1, wrong: 1 })
  })

  it('returns zero counts for no questions', () => {
    expect(countRightWrong([])).toEqual({ correct: 0, wrong: 0 })
  })
})
