import { useState, useEffect, useRef } from 'react'
import type { AppState, Match, Participant, Tournament } from '../types'
import { formatTime, parseTime } from '../utils/time'
import { createTournament, nameOf, assignQuestsToMatches } from '../utils/tournament'
import questsData from '../../quests.json'
import type { Quest } from '../types'
import { generateTournament, refresh } from '../engine/bracket'
import bgImage from '../assets/mhw iceborne.webp'

export { bgImage, formatTime, nameOf }

export function useTournamentApp() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem('mhw_state')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') return parsed as AppState
      }
    } catch {}
    return { current: null, history: [], view: 'participants' }
  })
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [randomizing, setRandomizing] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [importText, setImportText] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [overrideChoice, setOverrideChoice] = useState<number | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [timeAInput, setTimeAInput] = useState('')
  const [timeBInput, setTimeBInput] = useState('')
  const [dnfA, setDnfA] = useState(false)
  const [dnfB, setDnfB] = useState(false)
  const [notesInput, setNotesInput] = useState('')
  const fileARef = useRef<HTMLInputElement>(null)
  const fileBRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { localStorage.setItem('mhw_state', JSON.stringify(state)) } catch {}
  }, [state])

  useEffect(() => {
    if (state.current && state.current.status === 'completed' && !state.history.find((h) => h.id === state.current!.id)) {
      setState((p) => (p.current && p.current.status === 'completed' && !p.history.find((h) => h.id === p.current!.id) ? { ...p, history: [...p.history, p.current] } : p))
    }
  }, [state.current?.status, state.current?.id])

  const quests = questsData as Quest[]
  const current = state.current

  useEffect(() => {
    if (!state.current) return
    const t = state.current
    let changed = false
    const cfg = { ...t.config }
    if (!cfg.stages) { cfg.stages = ['Stage 1', 'Stage 2', 'Stage 3', 'Grand Final']; changed = true }
    if (!cfg.questAssignments) { cfg.questAssignments = {}; changed = true }
    if (!cfg.randomizerMode) { cfg.randomizerMode = 'stage-based'; changed = true }
    const sqs = t.stageQuestSelection ?? {}
    if (t.stageQuestSelection === undefined) changed = true
    const matches = t.matches.map((m) => (m.questId === undefined ? { ...m, questId: null } : m))
    if (matches.some((m, i) => m !== t.matches[i])) changed = true
    if (changed) {
      setState((p) => (p.current ? { ...p, current: { ...p.current, config: cfg, stageQuestSelection: sqs, matches } } : p))
    }
  }, [state.current?.id])

  useEffect(() => {
    const sm = current ? current.matches.find((m) => m.id === selectedMatchId) ?? null : null
    if (!sm) return
    setTimeAInput(sm.timeA !== null ? formatTime(sm.timeA) : '')
    setTimeBInput(sm.timeB !== null ? formatTime(sm.timeB) : '')
    setDnfA(sm.dnfA)
    setDnfB(sm.dnfB)
    setNotesInput(sm.notes)
    setOverrideChoice(null)
    setOverrideReason('')
  }, [selectedMatchId, current])

  function setView(v: string) { setState((p) => ({ ...p, view: v })) }

  function updateCurrent(updater: (t: Tournament) => Tournament) {
    setState((p) => {
      if (!p.current) return p
      return { ...p, current: updater(p.current) }
    })
  }

  /* participants */
  function addParticipant() {
    const name = newParticipantName.trim()
    if (!name) return
    let t = current
    if (!t) t = createTournament()
    if (t.status !== 'setup') { setError('Tournament locked. Cannot add participants.'); return }
    if (t.participants.some((p) => p.name.toLowerCase() === name.toLowerCase())) { setError('Duplicate name.'); return }
    const p: Participant = { id: Date.now() + Math.floor(Math.random() * 1000), name, wins: 0, losses: 0, bestTime: null, eliminated: false, champion: false }
    const updated = { ...t, participants: [...t.participants, p] }
    setState((prev) => ({ ...prev, current: updated }))
    setNewParticipantName('')
    setError(null)
  }

  function importParticipants() {
    const lines = importText.split('\n').map((s) => s.trim()).filter(Boolean)
    if (lines.length === 0) return
    let t = current
    if (!t) t = createTournament()
    if (t.status !== 'setup') { setError('Tournament locked.'); return }
    const existing = new Set(t.participants.map((p) => p.name.toLowerCase()))
    const added: Participant[] = []
    for (const ln of lines) {
      if (existing.has(ln.toLowerCase())) continue
      existing.add(ln.toLowerCase())
      added.push({ id: Date.now() + Math.floor(Math.random() * 1000) + added.length, name: ln, wins: 0, losses: 0, bestTime: null, eliminated: false, champion: false })
    }
    const updated = { ...t, participants: [...t.participants, ...added] }
    setState((prev) => ({ ...prev, current: updated }))
    setImportText('')
    setError(null)
  }

  function deleteParticipant(id: number) {
    updateCurrent((t) => {
      if (t.status !== 'setup') return t
      return { ...t, participants: t.participants.filter((p) => p.id !== id) }
    })
  }

  function startEdit(p: Participant) { setEditId(p.id); setEditName(p.name) }
  function saveEdit() {
    if (!editId) return
    const name = editName.trim()
    if (!name) return
    updateCurrent((t) => {
      if (t.status !== 'setup') return t
      if (t.participants.some((p) => p.id !== editId && p.name.toLowerCase() === name.toLowerCase())) return t
      return { ...t, participants: t.participants.map((p) => (p.id === editId ? { ...p, name } : p)) }
    })
    setEditId(null); setEditName('')
  }

  /* config */
  function updateConfig<K extends keyof Tournament['config']>(key: K, value: Tournament['config'][K]) {
    updateCurrent((t) => {
      if (t.status !== 'setup') return t
      return { ...t, config: { ...t.config, [key]: value } }
    })
  }

  /* randomizer */
  function runRandomizer() {
    if (!current || current.participants.length < 2) { setError('Need at least 2 participants.'); return }
    if (current.status !== 'setup') { setError('Tournament already generated.'); return }
    setRandomizing(true)
    setError(null)
    setTimeout(() => {
      const { M, slotPlayers, matches } = generateTournament(current.participants)
      updateCurrent((t) => ({ ...t, status: 'ready', matches, slotPlayers, M } as any))
      setRandomizing(false)
      }, 1800)
  }

  function confirmStart() {
    updateCurrent((t) => (t.status === 'ready' ? { ...t, status: 'in_progress' } : t))
  }

  function regenerate() {
    updateCurrent((t) => {
      if (t.status !== 'ready') return t
      return { ...t, status: 'setup', matches: [], slotPlayers: [] }
    })
  }

  function newTournament() {
    setState((p) => {
      const hist = p.current && p.current.status === 'completed' && !p.history.find((h) => h.id === p.current!.id)
        ? [...p.history, p.current]
        : p.history
      return { ...p, current: createTournament(), history: hist, view: 'setup' }
    })
  }

  /* match center */
  const selectedMatch = current ? current.matches.find((m) => m.id === selectedMatchId) ?? null : null

  function saveTimes() {
    if (!selectedMatchId || !current) return
    const ta = dnfA ? null : parseTime(timeAInput)
    const tb = dnfB ? null : parseTime(timeBInput)
    if (!dnfA && timeAInput.trim() && ta === null) { setError('Invalid time A format (MM:SS.mmm).'); return }
    if (!dnfB && timeBInput.trim() && tb === null) { setError('Invalid time B format (MM:SS.mmm).'); return }
    updateCurrent((t) => ({
      ...t,
      matches: t.matches.map((m) =>
        m.id === selectedMatchId ? { ...m, timeA: ta, timeB: tb, dnfA, dnfB, notes: notesInput, status: (m.status === 'completed' ? m.status : 'awaiting') } : m
      ),
    }))
    setError(null)
  }

  function handleFile(side: 'A' | 'B', file: File | null) {
    if (!file || !selectedMatchId) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      updateCurrent((t) => ({
        ...t,
        matches: t.matches.map((m) =>
          m.id === selectedMatchId ? (side === 'A' ? { ...m, proofA: data } : { ...m, proofB: data }) : m
        ),
      }))
    }
    reader.readAsDataURL(file)
  }

  function determineWinner(m: Match): number | null {
    const aValid = !m.dnfA && m.timeA !== null
    const bValid = !m.dnfB && m.timeB !== null
    if (aValid && bValid) {
      if (m.timeA! < m.timeB!) return m.p1 as number
      if (m.timeB! < m.timeA!) return m.p2 as number
      return null
    }
    if (aValid && !bValid) return m.p1 as number
    if (!aValid && bValid) return m.p2 as number
    return null
  }

  function confirmResult(manualWinner: number | null, reason: string) {
    if (!selectedMatchId || !current) return
    const m = current.matches.find((x) => x.id === selectedMatchId)
    if (!m) return
    if (m.p1 == null || m.p2 == null) { setError('Match not ready.'); return }
    const auto = determineWinner({ ...m, timeA: m.timeA, timeB: m.timeB, dnfA: m.dnfA, dnfB: m.dnfB })
    const winner = manualWinner ?? auto
    if (!winner) { setError('Cannot determine winner. Provide manual override.'); return }
    if (winner !== m.p1 && winner !== m.p2) { setError('Invalid winner.'); return }
    if (manualWinner && !reason.trim()) { setError('Override reason required.'); return }
    const loser = winner === m.p1 ? m.p2! : m.p1!

    updateCurrent((t) => {
      const matches = t.matches.map((x) => ({ ...x }))
      const mm = matches.find((x) => x.id === selectedMatchId)!
      const participants = t.participants.map((p) => ({ ...p }))
      if (mm.confirmed && mm.winner) {
        const ow = participants.find((p) => p.id === mm.winner)
        const ol = participants.find((p) => p.id === mm.loser)
        if (ow) ow.wins = Math.max(0, ow.wins - 1)
        if (ol) ol.losses = Math.max(0, ol.losses - 1)
      }
      const w = participants.find((p) => p.id === winner)!
      const l = participants.find((p) => p.id === loser)!
      w.wins += 1
      l.losses += 1
      l.eliminated = l.losses >= 2
      if (l.losses < 2) l.eliminated = false
      mm.winner = winner
      mm.loser = loser
      mm.status = 'completed'
      mm.confirmed = true
      mm.overrideReason = manualWinner ? reason.trim() : null
      const recomputeBest = (pid: number) => {
        const times = matches
          .filter((mt) => mt.status === 'completed' || mt.id === mm.id)
          .flatMap((mt) => {
            const res: number[] = []
            if (mt.p1 === pid && mt.timeA !== null && !mt.dnfA) res.push(mt.timeA)
            if (mt.p2 === pid && mt.timeB !== null && !mt.dnfB) res.push(mt.timeB)
            return res
          })
        const p = participants.find((x) => x.id === pid)
        if (p) p.bestTime = times.length ? Math.min(...times) : p.bestTime
      }
      recomputeBest(winner)
      recomputeBest(loser)

      refresh(matches, t.slotPlayers)

      const gf1 = matches.find((x) => x.id === 'GF-1')
      if (gf1 && gf1.id === selectedMatchId && gf1.status === 'completed' && gf1.winner === gf1.p2 && !matches.find((x) => x.id === 'GF-2')) {
        matches.push({
          id: 'GF-2', bracket: 'GF', round: 2,
          source1: { type: 'none' }, source2: { type: 'none' },
          p1: gf1.p1 ?? null, p2: gf1.p2 ?? null, winner: null, loser: null, questId: null, status: 'ready',
          timeA: null, timeB: null, dnfA: false, dnfB: false, proofA: null, proofB: null, notes: '', confirmed: false, overrideReason: null,
          winnerTo: null, loserTo: null, propagated: true,
        })
      }

      let championId = t.championId
      let status = t.status
      let completedAt = t.completedAt
      const gf2 = matches.find((x) => x.id === 'GF-2')
      if (gf2 && gf2.status === 'completed') { championId = gf2.winner; status = 'completed'; completedAt = Date.now() }
      else if (gf1 && gf1.id !== 'GF-2' && gf1.status === 'completed' && gf1.winner === gf1.p1 && !gf2) { championId = gf1.winner; status = 'completed'; completedAt = Date.now() }

      if (championId) {
        const cp = participants.find((p) => p.id === championId)
        if (cp) cp.champion = true
      }

      return { ...t, participants, matches, championId, status, completedAt }
    })

    setSelectedMatchId(null)
    setError(null)
  }

  /* derived */
  useEffect(() => {
    if (!current) return
    const needs = current.matches.some((m) => (m.status === 'ready' || m.status === 'awaiting' || m.status === 'in_progress' || m.status === 'completed') && !m.questId && m.p1 && m.p2)
    if (!needs) return
    const updated = assignQuestsToMatches(current)
    setState((p) => (p.current ? { ...p, current: updated } : p))
  }, [current?.matches])

  const ubRounds = current ? Array.from(new Set(current.matches.filter((m) => m.bracket === 'UB').map((m) => m.round))).sort((a, b) => a - b) : []
  const lbRounds = current ? Array.from(new Set(current.matches.filter((m) => m.bracket === 'LB').map((m) => m.round))).sort((a, b) => a - b) : []
  const championParticipant = current && current.championId ? current.participants.find((p) => p.id === current.championId) : null

  return {
    state, current, error, info, randomizing, selectedMatchId, setSelectedMatchId,
    newParticipantName, setNewParticipantName, importText, setImportText,
    editId, editName, setEditName, setEditId, startEdit, saveEdit,
    overrideChoice, setOverrideChoice, overrideReason, setOverrideReason,
    timeAInput, setTimeAInput, timeBInput, setTimeBInput, dnfA, setDnfA, dnfB, setDnfB, notesInput, setNotesInput,
    fileARef, fileBRef,
    setView, updateCurrent, addParticipant, importParticipants, deleteParticipant,
    updateConfig, runRandomizer, confirmStart, regenerate, newTournament,
    saveTimes, handleFile, confirmResult,
    ubRounds, lbRounds, championParticipant, selectedMatch, quests,
    setError, setInfo,
  }
}
