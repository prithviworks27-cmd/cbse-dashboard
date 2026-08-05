import { describe, it, expect } from 'vitest'
import { worstQuestions } from './worstQuestions'
import type { Question } from '../types/dashboard'

function q(overrides: Partial<Question>): Question {
  return {
    test: 't1', topic: 'Topic', qno: '1', difficulty: 'Medium', typology: 'Applying',
    type: 'Theory', score: 1, marks: 1, accuracy: 100,
    ...overrides,
  }
}

describe('worstQuestions', () => {
  it('excludes unattempted questions (accuracy === null)', () => {
    const result = worstQuestions([q({ qno: '1', accuracy: null }), q({ qno: '2', accuracy: 50 })])
    expect(result.map((r) => r.qno)).toEqual(['2'])
  })

  it('sorts worst accuracy first', () => {
    const result = worstQuestions([
      q({ qno: '1', accuracy: 80 }),
      q({ qno: '2', accuracy: 20 }),
      q({ qno: '3', accuracy: 50 }),
    ])
    expect(result.map((r) => r.qno)).toEqual(['2', '3', '1'])
  })

  it('breaks accuracy ties by higher marks first', () => {
    const result = worstQuestions([
      q({ qno: '1', accuracy: 0, marks: 1 }),
      q({ qno: '2', accuracy: 0, marks: 5 }),
    ])
    expect(result.map((r) => r.qno)).toEqual(['2', '1'])
  })

  it('caps at the given limit', () => {
    const questions = Array.from({ length: 10 }, (_, i) => q({ qno: String(i), accuracy: i }))
    expect(worstQuestions(questions, 3)).toHaveLength(3)
    expect(worstQuestions(questions)).toHaveLength(6)
  })

  it('returns an empty array when nothing was attempted', () => {
    expect(worstQuestions([q({ accuracy: null })])).toEqual([])
  })
})
