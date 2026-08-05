import { scoreColor } from '../lib/color'
import type { LeaderboardEntry } from '../types/dashboard'

const MEDAL_CLASS: Record<number, string> = {
  1: 'rank-medal-gold',
  2: 'rank-medal-silver',
  3: 'rank-medal-bronze',
}

function RankCell({ rank }: { rank: number | null }) {
  if (rank === null) return <>—</>
  const medalClass = MEDAL_CLASS[rank]
  if (medalClass) {
    return <span className={`rank-medal ${medalClass}`}>{rank}</span>
  }
  return <>{rank}</>
}

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
          <th>Score %</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.student}>
            <td>
              <RankCell rank={e.rank} />
            </td>
            <td>{e.student}</td>
            <td>{e.testsTaken}</td>
            <td style={{ color: scoreColor(e.adjustedPct) }}>{e.adjustedPct.toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
