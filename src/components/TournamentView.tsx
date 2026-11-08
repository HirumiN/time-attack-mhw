import { useTournamentApp } from '../hooks/useTournamentApp'
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
    selectedMatch, timeAInput, setTimeAInput, timeBInput, setTimeBInput, dnfA, setDnfA, dnfB, setDnfB, notesInput, setNotesInput,
    fileARef, fileBRef, handleFile, saveTimes, confirmResult, overrideChoice, setOverrideChoice, overrideReason, setOverrideReason,
  } = app

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
          <div className="gf-wrap" style={{ marginTop: 16 }}>
            {current.matches.filter((m) => m.bracket === 'GF').map((m) => (
              <MatchCard key={m.id} m={m} tourn={current} onSelect={() => setSelectedMatchId(m.id)} />
            ))}
          </div>
        </>
      )}

      <h4 className="subsection">Match Management</h4>
      <div className="match-list">
        {current.matches.filter((m) => m.status !== 'bye').map((m) => (
          <button key={m.id} className={`match-list-btn ${selectedMatchId === m.id ? 'active' : ''}`} onClick={() => setSelectedMatchId(m.id)}>
            {m.id} • {nameOf(current, m.p1)} vs {nameOf(current, m.p2)} • {m.status}
          </button>
        ))}
      </div>
      {selectedMatch && (
        <div className="match-detail">
          <h4>{selectedMatch.id} ({selectedMatch.bracket} R{selectedMatch.round})</h4>
          {selectedMatch.questId && <p className="muted">Quest: {quests.find((q: any) => q.id === selectedMatch.questId)?.name ?? selectedMatch.questId}</p>}
          <div className="match-players">
            <div className="mp">
              <strong>{nameOf(current, selectedMatch.p1)}</strong>
              <span className="muted">Time: {fmt(selectedMatch.timeA)} {selectedMatch.dnfA ? '(DNF)' : ''}</span>
            </div>
            <div className="mp">
              <strong>{nameOf(current, selectedMatch.p2)}</strong>
              <span className="muted">Time: {fmt(selectedMatch.timeB)} {selectedMatch.dnfB ? '(DNF)' : ''}</span>
            </div>
          </div>
          {selectedMatch.status !== 'completed' && (
            <>
              <div className="form-grid">
                <label>Participant A Time (MM:SS.mmm)
                  <input className="input" value={timeAInput} disabled={dnfA} onChange={(e) => setTimeAInput(e.target.value)} placeholder="04:32.150" />
                </label>
                <label><input type="checkbox" checked={dnfA} onChange={(e) => setDnfA(e.target.checked)} /> DNF A</label>
                <label>Participant B Time (MM:SS.mmm)
                  <input className="input" value={timeBInput} disabled={dnfB} onChange={(e) => setTimeBInput(e.target.value)} placeholder="05:10.300" />
                </label>
                <label><input type="checkbox" checked={dnfB} onChange={(e) => setDnfB(e.target.checked)} /> DNF B</label>
                <label>Notes<textarea className="textarea" value={notesInput} onChange={(e) => setNotesInput(e.target.value)} /></label>
                <label>Proof A<input type="file" ref={fileARef} accept="image/*" onChange={(e) => handleFile('A', e.target.files?.[0] ?? null)} /></label>
                <label>Proof B<input type="file" ref={fileBRef} accept="image/*" onChange={(e) => handleFile('B', e.target.files?.[0] ?? null)} /></label>
              </div>
              <div className="btnrow">
                <button className="btn btn-ghost" onClick={saveTimes}>Save Times</button>
                <button className="btn btn-primary" onClick={() => confirmResult(null, '')}>Confirm Result</button>
              </div>
              <div className="override-box">
                <p className="muted">Manual override (tie/DNF adjudication):</p>
                <select className="input" value={overrideChoice} onChange={(e) => setOverrideChoice(e.target.value)}>
                  <option value="">Select winner…</option>
                  <option value={selectedMatch.p1!}>{nameOf(current, selectedMatch.p1)}</option>
                  <option value={selectedMatch.p2!}>{nameOf(current, selectedMatch.p2)}</option>
                </select>
                <input className="input" placeholder="Reason" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                <button className="btn btn-ghost" onClick={() => overrideChoice && confirmResult(overrideChoice, overrideReason)}>Override</button>
              </div>
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
      )}
    </section>
  )
}
