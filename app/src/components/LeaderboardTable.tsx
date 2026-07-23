import { scoreColor } from '../lib/color'
import type { LeaderboardEntry } from '../types/dashboard'

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="mono">No leaderboard data yet.</p>
  }
  return (
    <table className="leaderboard mono">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Student</th>
          <th>Tests taken</th>
          <th>Adjusted %</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.student}>
            <td>{e.rank === null ? '—' : e.rank}</td>
            <td>{e.student}</td>
            <td>{e.testsTaken}</td>
            <td style={{ color: scoreColor(e.adjustedPct) }}>{e.adjustedPct.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
