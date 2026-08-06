// Trend-chart x-axis labels are full test titles (e.g. "Chemical Reactions & Equations
// Paper 1 - Balancing Equations"), which is illegible packed side-by-side across many tests.
// This extracts just the "Paper N" portion for the collapsed axis label, falling back to the
// test id if a label doesn't follow the "Paper <number>" convention.

import { MONO_CHAR_WIDTH_RATIO } from './wrapLabel'

export function paperShortLabel(testLabel: string, testId: string): string {
  const match = testLabel.match(/Paper\s+(\d+)/i)
  if (match) return `Paper ${match[1]}`
  return testId
}

// Topic strings in this dashboard carry a trailing "(Paper N)" or "(Paper N, Subjective)"
// annotation to keep same-topic tests on different papers/formats distinct everywhere else
// (heatmap, per-student breakdowns -- see priorityByChapter.ts). Some views need the bare
// topic name instead, with that annotation stripped.
export function stripPaperSuffix(topic: string): string {
  return topic.replace(/\s*\(Paper\b[^)]*\)\s*$/i, '').trim()
}

const MIN_FONT_SIZE = 6
const MAX_FONT_SIZE = 11
const LABEL_GAP_PX = 4

/**
 * Collapsed "Paper N" labels sit one per data point, spaced evenly across the plot width.
 * Unlike wrapChartLabel's bucket sizing (tuned for multi-line wrapped titles), this fits a
 * single font size to the narrowest gap between adjacent points so short labels never overlap.
 */
export function fitPaperLabelFontSize(labels: string[], spacingPx: number): number {
  const longest = Math.max(1, ...labels.map((l) => l.length))
  const available = Math.max(0, spacingPx - LABEL_GAP_PX)
  const fit = available / (longest * MONO_CHAR_WIDTH_RATIO)
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fit))
}
