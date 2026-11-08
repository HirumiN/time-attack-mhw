export type PlayerId = string

export type Source =
  | { type: 'seed'; seedIndex: number }
  | { type: 'match'; matchId: string; result: 'winner' | 'loser' }
  | { type: 'none' }

export interface Route { matchId: string; slot: 0 | 1 }

export interface Quest {
  id: string
  name: string
  monster: string
}

export interface Match {
  id: string
  bracket: 'UB' | 'LB' | 'GF'
  questId: string | null
  round: number
  source1: Source
  source2: Source
  p1: PlayerId | null | undefined
  p2: PlayerId | null | undefined
  winner: PlayerId | null
  loser: PlayerId | null
  winnerTo: Route | null
  loserTo: Route | null
  status: 'upcoming' | 'ready' | 'in_progress' | 'awaiting' | 'completed' | 'bye'
  timeA: number | null
  timeB: number | null
  dnfA: boolean
  dnfB: boolean
  proofA: string | null
  proofB: string | null
  notes: string
  confirmed: boolean
  overrideReason: string | null
  propagated: boolean
}

export interface Participant {
  id: string
  name: string
  wins: number
  losses: number
  bestTime: number | null
  eliminated: boolean
  champion: boolean
}

export interface TournamentConfig {
  name: string
  questName: string
  targetMonster: string
  questCategory: string
  rules: string
  weaponRestrictions: string
  timePrecision: 'ms'
  confirmMode: 'admin' | 'auto'
  stages: string[]
  questAssignments: Record<string, string[]>
  randomizerMode: 'stage-based' | 'match-based'
}

export interface Tournament {
  id: string
  config: TournamentConfig
  status: 'setup' | 'ready' | 'in_progress' | 'completed'
  participants: Participant[]
  matches: Match[]
  slotPlayers: (PlayerId | null)[]
  stageQuestSelection: Record<string, string>
  championId: string | null
  createdAt: number
  completedAt: number | null
}

export interface AppState {
  current: Tournament | null
  history: Tournament[]
  view: string
}
