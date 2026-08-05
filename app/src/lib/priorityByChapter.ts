import type { PriorityWeakness, Question } from '../types/dashboard'

// Topic labels in this dashboard follow the convention "<Chapter> — <Specific topic> (Paper N)"
// (e.g. "Chapter 1 — Balancing Equations (Paper 1)", "Light — Mirrors: Ray Diagrams & Numericals
// (Paper 4)"). Splitting on the em-dash recovers the chapter; a topic that doesn't follow this
// convention (no em-dash) falls back to using its full topic string as its own group, rather
// than erroring or dropping it.
export function chapterOfTopic(topic: string): string {
  const idx = topic.indexOf('—')
  if (idx === -1) return topic
  return topic.slice(0, idx).trim()
}

export interface ChapterGroup<T> {
  chapter: string
  items: T[]
}

/**
 * Groups already worst-first-sorted items by chapter (derived from each item's `topic`),
 * preserving that ordering within and across groups -- so the worst item overall still appears
 * first, just clustered with its chapter-mates.
 */
function groupByChapter<T extends { topic: string }>(items: T[]): ChapterGroup<T>[] {
  const order: string[] = []
  const map = new Map<string, T[]>()
  for (const item of items) {
    const chapter = chapterOfTopic(item.topic)
    if (!map.has(chapter)) {
      map.set(chapter, [])
      order.push(chapter)
    }
    map.get(chapter)!.push(item)
  }
  return order.map((chapter) => ({ chapter, items: map.get(chapter)! }))
}

export function groupPriorityByChapter(priority: PriorityWeakness[]): ChapterGroup<PriorityWeakness>[] {
  return groupByChapter(priority)
}

export function groupQuestionsByChapter<T extends Question>(questions: T[]): ChapterGroup<T>[] {
  return groupByChapter(questions)
}
