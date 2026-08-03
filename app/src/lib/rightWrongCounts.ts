import type { Question } from '../types/dashboard'

export interface RightWrongCounts {
  correct: number
  wrong: number
}

/**
 * Counts attempted questions (score !== null) as correct (full marks) or wrong (anything
 * less, including partial credit and zero). Unattempted questions are excluded entirely --
 * this is about how the student did on what they actually answered, not coverage.
 */
export function countRightWrong(questions: Question[]): RightWrongCounts {
  let correct = 0
  let wrong = 0
  for (const q of questions) {
    if (q.score === null) continue
    if (q.score === q.marks) correct++
    else wrong++
  }
  return { correct, wrong }
}
