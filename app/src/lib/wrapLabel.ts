// Trend-chart x-axis labels must never rotate or overflow, regardless of how many tests
// exist on the chart. Instead we wrap each label into up to 3 centered lines and shrink
// font size / characters-per-line as the number of tests (and therefore column width) grows.

export interface WrappedLabel {
  lines: string[]
  fontSize: number
}

const MAX_LINES = 3

// Monospace (IBM Plex Mono) average advance width as a fraction of font size.
const MONO_CHAR_WIDTH_RATIO = 0.62

function bucket(testCount: number): { fontSize: number; charsPerLine: number } {
  if (testCount <= 6) return { fontSize: 11, charsPerLine: 14 }
  if (testCount <= 12) return { fontSize: 10, charsPerLine: 10 }
  if (testCount <= 20) return { fontSize: 9, charsPerLine: 8 }
  return { fontSize: 8, charsPerLine: 6 }
}

/**
 * Worst-case half-width (in px) of a wrapped label's column, for the given testCount.
 * A chart must inset its first/last data points by at least this much from its own edges,
 * or a centered label at the extremes will overflow past the chart boundary and get clipped
 * — the same failure mode label-wrapping is meant to prevent, just moved to the caller.
 */
export function labelColumnHalfWidth(testCount: number): number {
  const { fontSize, charsPerLine } = bucket(testCount)
  return (charsPerLine * fontSize * MONO_CHAR_WIDTH_RATIO) / 2
}

function splitLongWord(word: string, charsPerLine: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < word.length; i += charsPerLine) {
    chunks.push(word.slice(i, i + charsPerLine))
  }
  return chunks
}

function packWords(words: string[], charsPerLine: number): string[] {
  const tokens = words.flatMap((w) => (w.length > charsPerLine ? splitLongWord(w, charsPerLine) : [w]))
  const lines: string[] = []
  let current = ''
  for (const tok of tokens) {
    const candidate = current ? `${current} ${tok}` : tok
    if (candidate.length <= charsPerLine) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = tok
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Wraps a test label into at most MAX_LINES lines, each guaranteed to be no longer than
 * the computed charsPerLine for the given testCount — so the caller can render fixed-width
 * columns without ever measuring text or guessing at rotation angles.
 */
export function wrapChartLabel(label: string, testCount: number): WrappedLabel {
  const { fontSize, charsPerLine } = bucket(testCount)
  const words = label.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return { lines: [], fontSize }

  let lines = packWords(words, charsPerLine)

  if (lines.length > MAX_LINES) {
    const kept = lines.slice(0, MAX_LINES)
    const ellipsis = '…'
    let last = kept[MAX_LINES - 1]
    if (last.length + ellipsis.length > charsPerLine) {
      last = last.slice(0, Math.max(0, charsPerLine - ellipsis.length))
    }
    kept[MAX_LINES - 1] = last + ellipsis
    lines = kept
  }

  return { lines, fontSize }
}
