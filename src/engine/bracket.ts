import type { Match, Participant, PlayerId, Route, Source } from '../types'

export function seeds(n: number): number[] {
  if (n === 2) return [1, 2]
  const prev = seeds(n / 2)
  const res: number[] = []
  for (const i of prev) { res.push(i); res.push(n + 1 - i) }
  return res
}

export function findMatch(matches: Match[], id: string): Match | undefined {
  return matches.find((m) => m.id === id)
}

export function refresh(matches: Match[], slotPlayers: (PlayerId | null)[]) {
  let changed = true
  let guard = 0
  while (changed && guard < 5000) {
    changed = false
    guard++
    for (const m of matches) {
      for (let slot = 0; slot < 2; slot++) {
        const key = slot === 0 ? 'p1' : 'p2'
        const src = slot === 0 ? m.source1 : m.source2
        if (m[key] === undefined) {
          if (src.type === 'seed') {
            m[key] = slotPlayers[src.seedIndex]
            changed = true
          } else if (src.type === 'match') {
            const srcMatch = findMatch(matches, src.matchId)
            if (srcMatch && (srcMatch.status === 'completed' || srcMatch.status === 'bye')) {
              m[key] = src.result === 'winner' ? srcMatch.winner : srcMatch.loser
              changed = true
            }
          } else if (src.type === 'none') {
            m[key] = null
            changed = true
          }
        }
      }
      if (m.p1 !== undefined && m.p2 !== undefined && (m.status === 'upcoming')) {
        if (m.p1 === null && m.p2 === null) {
          m.status = 'bye'
          m.winner = null
          m.loser = null
          changed = true
        } else if (m.p1 === null) {
          m.winner = m.p2
          m.loser = null
          m.status = 'completed'
          m.confirmed = true
          changed = true
        } else if (m.p2 === null) {
          m.winner = m.p1
          m.loser = null
          m.status = 'completed'
          m.confirmed = true
          changed = true
        } else {
          m.status = 'ready'
          changed = true
        }
      }
      if ((m.status === 'completed' || m.status === 'bye') && !m.propagated) {
        if (m.winnerTo) {
          const t = findMatch(matches, m.winnerTo.matchId)
          if (t) {
            const slotKey = m.winnerTo.slot === 0 ? 'p1' : 'p2'
            if (t[slotKey] === undefined) { t[slotKey] = m.winner; changed = true }
          }
        }
        if (m.loserTo) {
          const t = findMatch(matches, m.loserTo.matchId)
          if (t) {
            const slotKey = m.loserTo.slot === 0 ? 'p1' : 'p2'
            if (t[slotKey] === undefined) { t[slotKey] = m.loser; changed = true }
          }
        }
        m.propagated = true
      }
    }
  }
}

export function generateTournament(participants: Participant[]): { M: number; slotPlayers: (PlayerId | null)[]; matches: Match[] } {
  const N = participants.length
  let M = 1
  while (M < N) M *= 2
  if (M < 2) M = 2

  const shuffledIndices = participants.map((_, i) => i).sort(() => Math.random() - 0.5)
  const seedToPlayer: (PlayerId | null)[] = new Array(M).fill(null)
  for (let i = 0; i < N; i++) seedToPlayer[i] = participants[shuffledIndices[i]].id
  const seedOrder = seeds(M)
  const slotPlayers = seedOrder.map((seed) => seedToPlayer[seed - 1])

  const k = Math.log2(M)
  const matches: Match[] = []

  for (let r = 1; r <= k; r++) {
    const count = M >> r
    for (let i = 0; i < count; i++) {
      const isLast = r === k
      let loserTo: Route | null
      if (k === 1) loserTo = isLast ? { matchId: 'GF-1', slot: 1 } : null
      else if (r === 1) loserTo = { matchId: `LB-1-${Math.floor(i / 2)}`, slot: (i % 2) as 0 | 1 }
      else if (isLast) loserTo = { matchId: `LB-${2 * k - 2}-0`, slot: 1 }
      else loserTo = { matchId: `LB-${2 * (r - 1)}-${i}`, slot: 1 }
      matches.push({
        id: `UB-${r}-${i}`, bracket: 'UB', round: r,
        source1: r === 1 ? { type: 'seed', seedIndex: 2 * i } : { type: 'match', matchId: `UB-${r - 1}-${2 * i}`, result: 'winner' },
        source2: r === 1 ? { type: 'seed', seedIndex: 2 * i + 1 } : { type: 'match', matchId: `UB-${r - 1}-${2 * i + 1}`, result: 'winner' },
        p1: undefined, p2: undefined, winner: null, loser: null, questId: null, status: 'upcoming',
        timeA: null, timeB: null, dnfA: false, dnfB: false, proofA: null, proofB: null, notes: '', confirmed: false, overrideReason: null,
        winnerTo: isLast ? { matchId: 'GF-1', slot: 0 } : { matchId: `UB-${r + 1}-${Math.floor(i / 2)}`, slot: (i % 2) as 0 | 1 },
        loserTo, propagated: false,
      })
    }
  }

  if (k >= 2) {
    const totalRounds = 2 * k - 2
    const lbSize: number[] = new Array(totalRounds + 1)
    lbSize[1] = M / 4
    for (let L = 2; L <= totalRounds; L++) {
      if (L % 2 === 0) lbSize[L] = M / Math.pow(2, L / 2 + 1)
      else lbSize[L] = lbSize[L - 1] / 2
    }
    for (let L = 1; L <= totalRounds; L++) {
      const count = lbSize[L]
      for (let i = 0; i < count; i++) {
        let source1: Source, source2: Source, winnerTo: Route | null
        if (L === 1) {
          source1 = { type: 'match', matchId: `UB-1-${2 * i}`, result: 'loser' }
          source2 = { type: 'match', matchId: `UB-1-${2 * i + 1}`, result: 'loser' }
          winnerTo = totalRounds > 1 ? { matchId: `LB-2-${i}`, slot: 0 } : { matchId: 'GF-1', slot: 1 }
        } else if (L % 2 === 0) {
          const r_ub = L / 2 + 1
          source1 = { type: 'match', matchId: `LB-${L - 1}-${i}`, result: 'winner' }
          source2 = { type: 'match', matchId: `UB-${r_ub}-${i}`, result: 'loser' }
          winnerTo = L === totalRounds ? { matchId: 'GF-1', slot: 1 } : { matchId: `LB-${L + 1}-${Math.floor(i / 2)}`, slot: (i % 2) as 0 | 1 }
        } else {
          source1 = { type: 'match', matchId: `LB-${L - 1}-${2 * i}`, result: 'winner' }
          source2 = { type: 'match', matchId: `LB-${L - 1}-${2 * i + 1}`, result: 'winner' }
          winnerTo = { matchId: `LB-${L + 1}-${i}`, slot: 0 }
        }
        matches.push({
          id: `LB-${L}-${i}`, bracket: 'LB', round: L, source1, source2,
          p1: undefined, p2: undefined, winner: null, loser: null, questId: null, status: 'upcoming',
          timeA: null, timeB: null, dnfA: false, dnfB: false, proofA: null, proofB: null, notes: '', confirmed: false, overrideReason: null,
          winnerTo, loserTo: null, propagated: false,
        })
      }
    }
  }

  const lastLbId = k >= 2 ? `LB-${2 * k - 2}-0` : null
  const gfSource2: Source = k >= 2 ? { type: 'match', matchId: lastLbId!, result: 'winner' } : { type: 'match', matchId: 'UB-1-0', result: 'loser' }
  matches.push({
    id: 'GF-1', bracket: 'GF', round: 1,
    source1: { type: 'match', matchId: `UB-${k}-0`, result: 'winner' },
    source2: gfSource2,
    p1: undefined, p2: undefined, winner: null, loser: null, questId: null, status: 'upcoming',
    timeA: null, timeB: null, dnfA: false, dnfB: false, proofA: null, proofB: null, notes: '', confirmed: false, overrideReason: null,
    winnerTo: null, loserTo: null, propagated: false,
  })

  refresh(matches, slotPlayers)
  return { M, slotPlayers, matches }
}
