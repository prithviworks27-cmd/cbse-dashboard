import { describe, it, expect } from 'vitest'
import { scoreColor } from './color'

describe('scoreColor', () => {
  it('returns pure rust at 0%', () => {
    expect(scoreColor(0)).toBe('rgb(184, 76, 62)')
  })

  it('returns pure amber at 50%', () => {
    expect(scoreColor(50)).toBe('rgb(180, 132, 42)')
  })

  it('returns pure teal at 100%', () => {
    expect(scoreColor(100)).toBe('rgb(47, 111, 98)')
  })

  it('interpolates smoothly rather than jumping at thresholds', () => {
    const colors = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(scoreColor)
    expect(new Set(colors).size).toBe(colors.length)
  })

  it('clamps out-of-range input', () => {
    expect(scoreColor(-20)).toBe(scoreColor(0))
    expect(scoreColor(150)).toBe(scoreColor(100))
  })
})
