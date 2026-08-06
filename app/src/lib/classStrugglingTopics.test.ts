import { describe, it, expect } from 'vitest'
import { classStrugglingTopics } from './classStrugglingTopics'

describe('classStrugglingTopics', () => {
  it('collapses same topic across different papers into one averaged entry', () => {
    const result = classStrugglingTopics({
      'Life Processes — Respiration (Paper 5)': 40,
      'Life Processes — Respiration (Paper 6)': 50,
    })
    expect(result).toEqual([{ topic: 'Life Processes — Respiration', accuracy: 45 }])
  })

  it('excludes topics at or above the struggling threshold', () => {
    const result = classStrugglingTopics({
      'Weak Topic (Paper 1)': 40,
      'Strong Topic (Paper 1)': 90,
    })
    expect(result.map((r) => r.topic)).toEqual(['Weak Topic'])
  })

  it('sorts worst accuracy first', () => {
    const result = classStrugglingTopics({
      'A (Paper 1)': 50,
      'B (Paper 1)': 10,
      'C (Paper 1)': 30,
    })
    expect(result.map((r) => r.topic)).toEqual(['B', 'C', 'A'])
  })

  it('never repeats a topic name in the output', () => {
    const result = classStrugglingTopics({
      'X (Paper 1)': 10,
      'X (Paper 2)': 20,
      'X (Paper 3, Subjective)': 30,
    })
    expect(result).toHaveLength(1)
    expect(result[0].topic).toBe('X')
  })

  it('returns an empty array when every topic is above threshold', () => {
    expect(classStrugglingTopics({ 'Fine (Paper 1)': 95 })).toEqual([])
  })

  it('leaves topics with no paper suffix as their own entry', () => {
    const result = classStrugglingTopics({ 'Nephron': 50 })
    expect(result).toEqual([{ topic: 'Nephron', accuracy: 50 }])
  })
})
