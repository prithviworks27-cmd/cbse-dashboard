import { stripPaperSuffix } from './paperLabel'

export interface ClassTopicWeakness {
  topic: string
  accuracy: number
}

// A topic below this class-wide average accuracy counts as "the class is struggling with it".
const STRUGGLING_THRESHOLD = 60

/**
 * Class-wide topics the whole class is struggling with, for the subject-level "Where the Class
 * Struggles" table. classAvg.byTopic keys carry a "(Paper N[, Subjective])" suffix so the same
 * topic tested on different papers/formats stays distinct everywhere else (heatmap, per-student
 * breakdowns) -- here that suffix is stripped and same-name topics are collapsed into one entry
 * (a plain average of their class accuracies), since this view is about the topic itself, not
 * which specific paper it showed up on. Only topics below STRUGGLING_THRESHOLD are returned,
 * worst first.
 */
export function classStrugglingTopics(byTopic: Record<string, number>): ClassTopicWeakness[] {
  const groups = new Map<string, number[]>()
  for (const [topic, accuracy] of Object.entries(byTopic)) {
    const cleaned = stripPaperSuffix(topic)
    if (!groups.has(cleaned)) groups.set(cleaned, [])
    groups.get(cleaned)!.push(accuracy)
  }

  const result: ClassTopicWeakness[] = []
  for (const [topic, accuracies] of groups) {
    const accuracy = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
    if (accuracy < STRUGGLING_THRESHOLD) {
      result.push({ topic, accuracy })
    }
  }

  return result.sort((a, b) => a.accuracy - b.accuracy)
}
