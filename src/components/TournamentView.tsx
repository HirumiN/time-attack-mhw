import { useTournamentApp } from '../hooks/useTournamentApp'
import { useRef, useState, useEffect } from 'react'
import { MatchCard } from './MatchCard'
import { nameOf } from '../utils/tournament'
import { formatTime as fmt } from '../utils/time'
import questsData from '../../quests.json'
import type { Quest } from '../types'

const quests = questsData as Quest[]

export function TournamentView({ app }: { app: ReturnType<typeof useTournamentApp> }) {
  const {
    current, randomizing, selectedMatchId, setSelectedMatchId,
    runRandomizer, regenerate, confirmStart, newTournament,
    ubRounds, lbRounds, championParticipant,
    selectedMatch, timeAInput, setTimeAInput, timeBInput, setTimeBInput, dnfA, setDnfA, dnfB, setDnfB,
    saveTimes, confirmResult, overrideChoice, setOverrideChoice, overrideReason, setOverrideReason,
  } = app

  const startPerfRef = useRef<number | null>(null)
  const [timerStartEpoch, setTimerStartEpoch] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    setTimerStartEpoch(selectedMatch?.timerStart ?? null)
    startPerfRef.current = null
  }, [selectedMatchId])

  useEffect(() => {
    if (!timerStartEpoch) return
    const aDone = !!(selectedMatch && (selectedMatch.timeA !== null || selectedMatch.dnfA))
    const bDone = !!(selectedMatch && (selectedMatch.timeB !== null || selectedMatch.dnfB))
    if (aDone && bDone) return
    const id = setInterval(() => setNow(Date.now()), 50)
    return () => clearInterval(id)
  }, [timerStartEpoch, selectedMatch?.timeA, selectedMatch?.timeB, selectedMatch?.dnfA, selectedMatch?.dnfB])

  function startBoth() {
    if (!selectedMatch || selectedMatch.timerStart != null) return
    if (selectedMatch.status === 'completed') return
    if (selectedMatch.timeA !== null || selectedMatch.dnfA || selectedMatch.timeB !== null || selectedMatch.dnfB) return
    const epoch = Date.now()
    startPerfRef.current = performance.now()
    setTimerStartEpoch(epoch)
    setNow(Date.now())
    app.updateCurrent((t) => ({
      ...t,
      matches: t.matches.map((m) =>
        m.id === selectedMatchId ? { ...m, timerStart: epoch } : m
      ),
    }))
  }

  function finishParticipant(side: 'A' | 'B') {
    if (!selectedMatch || selectedMatch.timerStart == null) return
    const aDone = selectedMatch.timeA !== null || selectedMatch.dnfA
    const bDone = selectedMatch.timeB !== null || selectedMatch.dnfB
    if (side === 'A' && aDone) return
    if (side === 'B' && bDone) return
    const epoch = Date.now()
    const perf = performance.now()
    const elapsed = startPerfRef.current !== null
      ? Math.round(perf - startPerfRef.current)
      : Math.max(0, epoch - selectedMatch.timerStart)
    app.updateCurrent((t) => ({
      ...t,
      matches: t.matches.map((m) =>
        m.id === selectedMatchId
          ? side === 'A'
            ? { ...m, timeA: elapsed }
            : { ...m, timeB: elapsed }
          : m
      ),
    }))
  }

  if (!current) {
    return (
      <section className="panel">
        <h3 className="section-title">Tournament</h3>
        <p>Create a tournament first.</p>
        <button className="btn btn-primary" onClick={newTournament}>New Tournament</button>
      </section>
    )
  }

  return (
    <>
      <section className="panel">
      <h3 className="section-title">Tournament</h3>
      <div className="btnrow">
        <button className="btn btn-primary" onClick={runRandomizer} disabled={current.status !== 'setup' || current.participants.length < 2}>Generate Bracket (Random)</button>
        {current.status === 'ready' && <button className="btn btn-ghost" onClick={regenerate}>Regenerate</button>}
        {current.status === 'ready' && <button className="btn btn-primary" onClick={confirmStart}>Start Tournament</button>}
        <button className="btn btn-ghost" onClick={newTournament}>New Tournament</button>
      </div>
      <p className="muted">Participants: {current.participants.length} • Status: {current.status}</p>

      {randomizing && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="overlay-title">Randomizing Hunters…</div>
            <div className="roulette">
              {current.participants.map((p, i) => (
                <div key={p.id} className="roulette-item" style={{ animationDelay: `${i * 0.08}s` }}>{p.name}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {current.status === 'completed' && championParticipant && (
        <div className="champion">
          <span className="champ-label">CHAMPION</span>
          <span className="champ-name">{championParticipant.name}</span>
          <div className="champ-stats">Best Time: {fmt(championParticipant.bestTime)} • Wins: {championParticipant.wins}</div>
        </div>
      )}

      {current.matches.length > 0 && (
        <>
          <h4 className="subsection">Bracket</h4>
          <div className="bracket-layout">
            <div className="bracket-main">
              <div className="bracket-scroll">
                <div className="rounds">
                  {ubRounds.map((r) => (
                    <div className="round" key={`ub-${r}`}>
                      <div className="round-title">UB Round {r}</div>
                      {current.matches.filter((m) => m.bracket === 'UB' && m.round === r).map((m) => (
                        <MatchCard key={m.id} m={m} tourn={current} onSelect={() => setSelectedMatchId(m.id)} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {lbRounds.length > 0 && (
                <div className="bracket-scroll" style={{ marginTop: 16 }}>
                  <div className="rounds">
                    {lbRounds.map((r) => (
                      <div className="round" key={`lb-${r}`}>
                        <div className="round-title">LB Round {r}</div>
                        {current.matches.filter((m) => m.bracket === 'LB' && m.round === r).map((m) => (
                          <MatchCard key={m.id} m={m} tourn={current} onSelect={() => setSelectedMatchId(m.id)} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="gf-column">
              <div className="gf-wrap">
                {current.matches.filter((m) => m.bracket === 'GF').map((m) => (
                  <MatchCard key={m.id} m={m} tourn={current} grandFinal onSelect={() => setSelectedMatchId(m.id)} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

    </section>
    {selectedMatch && (
      <div className="overlay" onClick={() => setSelectedMatchId(null)}>
        <div className="match-modal" onClick={(e) => e.stopPropagation()}>
          <div className="match-modal-header">
            <div>
              <h4 className="match-modal-title">{selectedMatch.id}</h4>
              <div className="match-modal-round">{selectedMatch.bracket} · Round {selectedMatch.round}</div>
            </div>
            <button className="match-modal-close" onClick={() => setSelectedMatchId(null)} aria-label="Close">×</button>
          </div>
          <div className="match-quest">Quest: {selectedMatch.questId ? (quests.find((q: any) => q.id === selectedMatch.questId)?.name ?? selectedMatch.questId) : 'No quest assigned'}</div>
          <div className="shared-timer">
            <div className="shared-timer-label">Shared Timer</div>
            <div className="shared-timer-value">{fmt((selectedMatch.timeA !== null || selectedMatch.dnfA) && (selectedMatch.timeB !== null || selectedMatch.dnfB) ? Math.max(selectedMatch.timeA ?? 0, selectedMatch.timeB ?? 0) : (timerStartEpoch ? now - timerStartEpoch : 0))}</div>
            <button type="button" className="btn btn-confirm" onClick={startBoth} disabled={!!timerStartEpoch || selectedMatch.status === 'completed'}>Start Both</button>
          </div>
          <div className="match-participants">
            <div className={`participant-card ${(current.participants.find((p) => p.id === selectedMatch.p1)?.wins ?? 0) > (current.participants.find((p) => p.id === selectedMatch.p2)?.wins ?? 0) ? 'leading' : ''}`}>
              <div className="participant-name">{nameOf(current, selectedMatch.p1)}</div>
              <div className="participant-score">{current.participants.find((p) => p.id === selectedMatch.p1)?.wins ?? 0}</div>
              <div className="participant-time">Time: {fmt(selectedMatch.timeA)} {selectedMatch.dnfA ? '(DNF)' : ''}</div>
              <div className="participant-status">{selectedMatch.dnfA ? 'DNF' : selectedMatch.timeA !== null ? 'Finished' : timerStartEpoch ? 'Running' : 'Ready'}</div>
              {timerStartEpoch && selectedMatch.timeA === null && !selectedMatch.dnfA && (
                <button type="button" className="btn btn-confirm" style={{ height: 36, marginTop: 8 }} onClick={() => finishParticipant('A')}>Finish A</button>
              )}
            </div>
            <div className={`participant-card ${(current.participants.find((p) => p.id === selectedMatch.p2)?.wins ?? 0) > (current.participants.find((p) => p.id === selectedMatch.p1)?.wins ?? 0) ? 'leading' : ''}`}>
              <div className="participant-name">{nameOf(current, selectedMatch.p2)}</div>
              <div className="participant-score">{current.participants.find((p) => p.id === selectedMatch.p2)?.wins ?? 0}</div>
              <div className="participant-time">Time: {fmt(selectedMatch.timeB)} {selectedMatch.dnfB ? '(DNF)' : ''}</div>
              <div className="participant-status">{selectedMatch.dnfB ? 'DNF' : selectedMatch.timeB !== null ? 'Finished' : timerStartEpoch ? 'Running' : 'Ready'}</div>
              {timerStartEpoch && selectedMatch.timeB === null && !selectedMatch.dnfB && (
                <button type="button" className="btn btn-confirm" style={{ height: 36, marginTop: 8 }} onClick={() => finishParticipant('B')}>Finish B</button>
              )}
            </div>
          </div>
          {selectedMatch.status !== 'completed' && (
            <>
              <div className="time-section">
                <div className="time-field">
                  <label className="time-label">Participant A Time (MM:SS.mmm)</label>
                  <input className="input time-input" value={timeAInput} disabled={dnfA} onChange={(e) => setTimeAInput(e.target.value)} placeholder="04:32.150" />
                  <label className="dnf-row"><input type="checkbox" checked={dnfA} onChange={(e) => setDnfA(e.target.checked)} /> DNF A</label>
                </div>
                <div className="time-field">
                  <label className="time-label">Participant B Time (MM:SS.mmm)</label>
                  <input className="input time-input" value={timeBInput} disabled={dnfB} onChange={(e) => setTimeBInput(e.target.value)} placeholder="05:10.300" />
                  <label className="dnf-row"><input type="checkbox" checked={dnfB} onChange={(e) => setDnfB(e.target.checked)} /> DNF B</label>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-save" onClick={saveTimes}>Save Times</button>
                <button className="btn btn-confirm" onClick={() => confirmResult(null, '')} disabled={!((selectedMatch.timeA !== null || selectedMatch.dnfA) && (selectedMatch.timeB !== null || selectedMatch.dnfB))}>Confirm Result</button>
              </div>
              <details className="manual-override">
                <summary>Manual Override (Tie / DNF Adjudication)</summary>
                <div className="manual-fields">
                  <select className="input" value={overrideChoice ?? ''} onChange={(e) => setOverrideChoice(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">Select winner…</option>
                    <option value={selectedMatch.p1!}>{nameOf(current, selectedMatch.p1)}</option>
                    <option value={selectedMatch.p2!}>{nameOf(current, selectedMatch.p2)}</option>
                  </select>
                  <input className="input" placeholder="Reason" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                  <button className="btn btn-ghost" onClick={() => overrideChoice && confirmResult(overrideChoice, overrideReason)}>Override</button>
                </div>
              </details>
            </>
          )}
          {selectedMatch.status === 'completed' && (
            <div className="completed-box">
              <p>Winner: <strong>{nameOf(current, selectedMatch.winner)}</strong></p>
              <p className="muted">Times: {fmt(selectedMatch.timeA)} vs {fmt(selectedMatch.timeB)}</p>
              {selectedMatch.overrideReason && <p className="muted">Override: {selectedMatch.overrideReason}</p>}
            </div>
          )}
        </div>
      </div>
    )}
  </>
)
}
