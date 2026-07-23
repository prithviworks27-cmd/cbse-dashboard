// Smooth rust -> amber -> teal interpolation for score-based coloring (no hard thresholds).
const BAD = { r: 0xB8, g: 0x4C, b: 0x3E } // rust
const MID = { r: 0xB4, g: 0x84, b: 0x2A } // amber
const GOOD = { r: 0x2F, g: 0x6F, b: 0x62 } // teal

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t)
}

/** pct in [0, 100]. <=50 interpolates bad->mid, >=50 interpolates mid->good. */
export function scoreColor(pct: number): string {
  const clamped = Math.max(0, Math.min(100, pct))
  const from = clamped <= 50 ? BAD : MID
  const to = clamped <= 50 ? MID : GOOD
  const t = clamped <= 50 ? clamped / 50 : (clamped - 50) / 50
  const r = lerp(from.r, to.r, t)
  const g = lerp(from.g, to.g, t)
  const b = lerp(from.b, to.b, t)
  return `rgb(${r}, ${g}, ${b})`
}
