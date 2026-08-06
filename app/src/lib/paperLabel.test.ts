import { describe, it, expect } from 'vitest'
import { paperShortLabel, fitPaperLabelFontSize, stripPaperSuffix } from './paperLabel'

describe('paperShortLabel', () => {
  it('extracts "Paper N" from a real test label', () => {
    expect(paperShortLabel('Chemical Reactions & Equations Paper 1 - Balancing Equations', 'ch1_paper1')).toBe(
      'Paper 1',
    )
  })

  it('extracts "Paper N" regardless of case', () => {
    expect(paperShortLabel('light paper 4 - mirrors', 'light_paper4')).toBe('Paper 4')
  })

  it('extracts "Paper N" from a subjective-suffixed label', () => {
    expect(paperShortLabel('Life Processes Paper 2 - Plant Nutrition (Subjective)', 'lifeproc_subj_paper2')).toBe(
      'Paper 2',
    )
  })

  it('falls back to the test id when the label has no "Paper N"', () => {
    expect(paperShortLabel('Half Yearly Examination 2024-25', 'half_yearly')).toBe('half_yearly')
  })
})

describe('stripPaperSuffix', () => {
  it('strips a plain "(Paper N)" suffix', () => {
    expect(stripPaperSuffix('Chemical Reactions & Equations — Balancing Equations (Paper 1)')).toBe(
      'Chemical Reactions & Equations — Balancing Equations',
    )
  })

  it('strips a "(Paper N, Subjective)" suffix', () => {
    expect(stripPaperSuffix('Light — Mirrors: Ray Diagrams & Numericals (Paper 4, Subjective)')).toBe(
      'Light — Mirrors: Ray Diagrams & Numericals',
    )
  })

  it('leaves a topic with no paper suffix unchanged', () => {
    expect(stripPaperSuffix('Life Processes — Nephron')).toBe('Life Processes — Nephron')
  })

  it('makes same-topic-different-paper strings collide, which is the point', () => {
    const a = stripPaperSuffix('Life Processes — Respiration (Paper 5)')
    const b = stripPaperSuffix('Life Processes — Respiration (Paper 6)')
    expect(a).toBe(b)
  })
})

describe('fitPaperLabelFontSize', () => {
  it('never returns a size whose estimated label width exceeds the available spacing, once spacing is wide enough to clear the minimum legible size', () => {
    const labels = ['Paper 1', 'Paper 2', 'Paper 10', 'Paper 15']
    for (const spacing of [38, 60, 100]) {
      const fontSize = fitPaperLabelFontSize(labels, spacing)
      const longest = Math.max(...labels.map((l) => l.length))
      const estimatedWidth = longest * fontSize * 0.62
      expect(estimatedWidth).toBeLessThanOrEqual(spacing - 4 + 0.01)
    }
  })

  it('clamps to the minimum legible size (accepting some overlap) rather than shrinking further when spacing is extremely tight', () => {
    expect(fitPaperLabelFontSize(['Paper 1', 'Paper 10'], 15)).toBe(6)
  })

  it('never goes below the minimum legible size even when spacing is very tight', () => {
    expect(fitPaperLabelFontSize(['Paper 12'], 5)).toBe(6)
  })

  it('never exceeds the maximum size even when spacing is generous', () => {
    expect(fitPaperLabelFontSize(['Paper 1'], 500)).toBe(11)
  })
})
