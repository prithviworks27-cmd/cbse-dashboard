import type { PriorityWeakness } from '../types/dashboard'

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

export interface ChapterGroup {
  chapter: string
  items: PriorityWeakness[]
}

/**
 * Groups a student's priority weaknesses (already sorted worst-first by the pipeline) by
 * chapter, preserving that ordering within and across groups -- so the worst weakness overall
 * still appears first, just clustered with its chapter-mates.
 */
export function groupPriorityByChapter(priority: PriorityWeakness[]): ChapterGroup[] {
  const order: string[] = []
  const map = new Map<string, PriorityWeakness[]>()
  for (const p of priority) {
    const chapter = chapterOfTopic(p.topic)
    if (!map.has(chapter)) {
      map.set(chapter, [])
      order.push(chapter)
    }
    map.get(chapter)!.push(p)
  }
  return order.map((chapter) => ({ chapter, items: map.get(chapter)! }))
}
