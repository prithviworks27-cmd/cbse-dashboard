import type { Question } from '../types/dashboard'

// Mirrors the pipeline's PRIORITY_MAX cap on the topic-level `priority` list, so "Fix It First"
// never overwhelms the student with more than a handful of questions to revisit.
const MAX_ITEMS = 6

/**
 * The worst-performing attempted questions (accuracy !== null), worst first. Ties broken by
 * higher marks first (getting a high-stakes question wrong matters more than a 1-mark one),
 * same tie-break the pipeline's topic-level `priority` list uses.
 */
export function worstQuestions(questions: Question[], limit = MAX_ITEMS): (Question & { accuracy: number })[] {
  return questions
    .filter((q): q is Question & { accuracy: number } => q.accuracy !== null)
    .sort((a, b) => a.accuracy - b.accuracy || b.marks - a.marks)
    .slice(0, limit)
}
