import type { Match, Tournament, TournamentConfig } from '../types'

export function defaultConfig(): TournamentConfig {
  return {
    name: 'Iceborne Time Attack',
    questName: '',
    targetMonster: '',
    questCategory: 'Arena',
    rules: '',
    weaponRestrictions: '',
    timePrecision: 'ms',
    confirmMode: 'admin',
    stages: ['Stage 1', 'Stage 2', 'Stage 3', 'Grand Final'],
    questAssignments: {},
    randomizerMode: 'stage-based',
  }
}

export function createTournament(): Tournament {
  return {
    id: crypto.randomUUID(),
    config: defaultConfig(),
    status: 'setup',
    participants: [],
    matches: [],
    slotPlayers: [],
    stageQuestSelection: {},
    championId: null,
    createdAt: Date.now(),
    completedAt: null,
  }
}

export function nameOf(tourn: Tournament, id: string | null | undefined): string {
  if (id === undefined) return 'TBD'
  if (id === null) return 'BYE'
  const p = tourn.participants.find((x) => x.id === id)
  return p ? p.name : id
}

export function stageForMatch(m: Match, stages: string[]): string {
  if (m.bracket === 'GF') return stages.includes('Grand Final') ? 'Grand Final' : stages[stages.length - 1]
  if (m.round === 1) return stages[0] ?? 'Stage 1'
  if (m.round === 2) return stages[1] ?? stages[0] ?? 'Stage 2'
  return stages[2] ?? stages[stages.length - 1] ?? 'Stage 3'
}

export function assignQuestsToMatches(t: Tournament): Tournament {
  const matches = t.matches.map((m) => ({ ...m }))
  const stageQuestSelection = { ...t.stageQuestSelection }
  for (const m of matches) {
    const readyLike = m.status === 'ready' || m.status === 'awaiting' || m.status === 'in_progress' || m.status === 'completed'
    if (!readyLike || m.questId || !m.p1 || !m.p2) continue
    const stage = stageForMatch(m, t.config.stages)
    const assigned = t.config.questAssignments[stage] ?? []
    if (assigned.length === 0) continue
    let questId: string
    if (t.config.randomizerMode === 'stage-based' && stageQuestSelection[stage]) {
      questId = stageQuestSelection[stage]
    } else {
      questId = assigned[Math.floor(Math.random() * assigned.length)]
      if (t.config.randomizerMode === 'stage-based') stageQuestSelection[stage] = questId
    }
    m.questId = questId
  }
  return { ...t, matches, stageQuestSelection }
}
