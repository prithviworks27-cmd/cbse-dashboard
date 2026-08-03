import { describe, it, expect } from 'vitest'
import { chapterOfTopic, groupPriorityByChapter } from './priorityByChapter'
import type { PriorityWeakness } from '../types/dashboard'

describe('chapterOfTopic', () => {
  it('extracts the chapter prefix before the em-dash', () => {
    expect(chapterOfTopic('Chapter 1 — Balancing Equations (Paper 1)')).toBe('Chapter 1')
    expect(chapterOfTopic('Light — Mirrors: Ray Diagrams & Numericals (Paper 4)')).toBe('Light')
    expect(chapterOfTopic('Life Processes — Respiration (Paper 5)')).toBe('Life Processes')
  })

  it('falls back to the full topic string when there is no chapter prefix', () => {
    expect(chapterOfTopic("Coulomb's Law (Subjective)")).toBe("Coulomb's Law (Subjective)")
  })
})

describe('groupPriorityByChapter', () => {
  const priority: PriorityWeakness[] = [
    { topic: 'Chapter 1 — Redox Reactions & Applications (Paper 4)', typology: 'Analysing', difficulty: 'Hard', accuracy: 20, marks: 1 },
    { topic: 'Light — Mirrors: Ray Diagrams & Numericals (Paper 4)', typology: 'Analysing', difficulty: 'Hard', accuracy: 33, marks: 1 },
    { topic: 'Chapter 1 — Balancing Equations (Paper 1)', typology: 'Applying', difficulty: 'Medium', accuracy: 40, marks: 1 },
    { topic: 'Life Processes — Respiration (Paper 5)', typology: 'Analysing', difficulty: 'Medium', accuracy: 50, marks: 1 },
  ]

  it('groups items by chapter, preserving worst-first order within each group', () => {
    const groups = groupPriorityByChapter(priority)
    const ch1 = groups.find((g) => g.chapter === 'Chapter 1')!
    expect(ch1.items.map((i) => i.accuracy)).toEqual([20, 40])
  })

  it('preserves first-seen chapter order across groups (matches overall worst-first sort)', () => {
    const groups = groupPriorityByChapter(priority)
    expect(groups.map((g) => g.chapter)).toEqual(['Chapter 1', 'Light', 'Life Processes'])
  })

  it('returns an empty array for no weaknesses', () => {
    expect(groupPriorityByChapter([])).toEqual([])
  })

  it('groups topics without a chapter prefix under their own topic name', () => {
    const groups = groupPriorityByChapter([
      { topic: "Coulomb's Law (Subjective)", typology: 'Analysing', difficulty: 'Hard', accuracy: 40, marks: 5 },
    ])
    expect(groups).toEqual([{ chapter: "Coulomb's Law (Subjective)", items: [expect.any(Object)] }])
  })
})
