import type { Match, Tournament, Quest } from '../types'
import { formatTime } from '../utils/time'
import { nameOf } from '../utils/tournament'
import questsData from '../../quests.json'

const quests = questsData as Quest[]

export function MatchCard({ m, tourn, onSelect, grandFinal }: { m: Match; tourn: Tournament; onSelect: () => void; grandFinal?: boolean }) {
  const done = m.status === 'completed' || m.status === 'bye'
  return (
    <div className={`match ${m.status} ${grandFinal ? 'grand-final-card' : ''}`} onClick={onSelect} style={{ cursor: 'pointer' }}>
      <div className="match-id">{m.id}</div>
      {m.questId && <div className="muted" style={{ padding: '2px 8px', fontSize: 11 }}>{quests.find((q) => q.id === m.questId)?.name ?? m.questId}</div>}
      <div className={`player-row ${done && m.winner === m.p1 ? 'winner' : ''} ${m.p1 === null ? 'bye' : ''}`}>
        <span className="pname">{nameOf(tourn, m.p1)}</span>
        {m.timeA !== null && <span className="mtime">{formatTime(m.timeA)}</span>}
        {done && m.winner === m.p1 && <span className="tag">WIN</span>}
      </div>
      <div className="vs">vs</div>
      <div className={`player-row ${done && m.winner === m.p2 ? 'winner' : ''} ${m.p2 === null ? 'bye' : ''}`}>
        <span className="pname">{nameOf(tourn, m.p2)}</span>
        {m.timeB !== null && <span className="mtime">{formatTime(m.timeB)}</span>}
        {done && m.winner === m.p2 && <span className="tag">WIN</span>}
      </div>
    </div>
  )
}
