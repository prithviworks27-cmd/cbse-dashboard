import { describe, it, expect } from 'vitest'
import { wrapChartLabel, labelColumnHalfWidth } from './wrapLabel'

const REAL_LABELS = [
  "Coulomb's Law (Subjective)",
  'Comprehensive Chapter Test - Electrostatics and Magnetism',
  'Unit Test 1',
  'Half Yearly Examination 2024-25',
  'Periodic Test 3 (MCQ)',
  'Supercalifragilisticexpialidocious Topic Test',
  '',
  'Annual Examination',
]

describe('wrapChartLabel', () => {
  it('never produces more than 3 lines', () => {
    for (const testCount of [3, 6, 10, 15, 25, 40, 60]) {
      for (const label of REAL_LABELS) {
        const { lines } = wrapChartLabel(label, testCount)
        expect(lines.length).toBeLessThanOrEqual(3)
      }
    }
  })

  it('never produces a line longer than the bucketed charsPerLine, for any real label and test count', () => {
    const maxCharsForCount = (testCount: number) => {
      if (testCount <= 6) return 14
      if (testCount <= 12) return 10
      if (testCount <= 20) return 8
      return 6
    }
    for (const testCount of [3, 6, 10, 15, 25, 40, 60]) {
      const max = maxCharsForCount(testCount)
      for (const label of REAL_LABELS) {
        const { lines } = wrapChartLabel(label, testCount)
        for (const line of lines) {
          expect(line.length).toBeLessThanOrEqual(max)
        }
      }
    }
  })

  it('shrinks font size as test count grows', () => {
    const sizes = [3, 10, 15, 40].map((n) => wrapChartLabel('Unit Test 1', n).fontSize)
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1])
    }
  })

  it('handles an empty label', () => {
    expect(wrapChartLabel('', 10)).toEqual({ lines: [], fontSize: 10 })
  })

  it('hard-splits a single word longer than charsPerLine instead of overflowing', () => {
    const { lines } = wrapChartLabel('Supercalifragilisticexpialidocious', 40)
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(6)
    }
  })

  it('truncates with an ellipsis when content exceeds 3 lines, never dropping the line-length guarantee', () => {
    const { lines } = wrapChartLabel(
      'Comprehensive Combined Half Yearly Practical and Theory Examination',
      25,
    )
    expect(lines.length).toBe(3)
    expect(lines[2].endsWith('…')).toBe(true)
    expect(lines[2].length).toBeLessThanOrEqual(8)
  })

  it('preserves short labels on a single line at the largest bucket', () => {
    expect(wrapChartLabel('Test 1', 3)).toEqual({ lines: ['Test 1'], fontSize: 11 })
  })
})

describe('labelColumnHalfWidth', () => {
  // Regression test for a real bug: a centered label placed exactly at a chart's edge
  // point overflowed past the SVG viewBox and got clipped. A chart must inset its first/last
  // data points by at least this half-width so the widest possible wrapped line — one full
  // charsPerLine of monospace characters — fits entirely inside the chart bounds.
  it('is positive and shrinks (or stays roughly flat) as test count grows', () => {
    const widths = [3, 10, 20, 40].map(labelColumnHalfWidth)
    for (const w of widths) {
      expect(w).toBeGreaterThan(0)
    }
    expect(widths[3]).toBeLessThanOrEqual(widths[0])
  })

  it('leaves enough margin that the widest wrapped line of a real label fits within it', () => {
    for (const testCount of [3, 6, 10, 15, 25, 40]) {
      const halfWidth = labelColumnHalfWidth(testCount)
      for (const label of REAL_LABELS) {
        const { lines, fontSize } = wrapChartLabel(label, testCount)
        const longest = Math.max(0, ...lines.map((l) => l.length))
        // Same monospace char-width estimate the chart uses to size the inset.
        const estimatedHalfPixelWidth = (longest * fontSize * 0.62) / 2
        expect(estimatedHalfPixelWidth).toBeLessThanOrEqual(halfWidth + 0.01)
      }
    }
  })
})
