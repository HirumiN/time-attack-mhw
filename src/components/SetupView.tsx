import { useEffect, useRef, useState } from 'react'
import { useTournamentApp } from '../hooks/useTournamentApp'
import type { Quest } from '../types'
import questsData from '../../quests.json'
import { CustomSelect } from './CustomSelect'

const quests = questsData as Quest[]

export function SetupView({ app }: { app: ReturnType<typeof useTournamentApp> }) {
  const { current, updateConfig, updateCurrent, newTournament } = app
  const [search, setSearch] = useState('')
  const [selectedStage, setSelectedStage] = useState('Stage 1')
  const rightRef = useRef<HTMLDivElement>(null)
  const [rightHeight, setRightHeight] = useState<number | undefined>(undefined)

  if (!current) {
    return (
      <section className="panel">
        <h3 className="section-title">Tournament Setup</h3>
        <button className="btn btn-primary" onClick={newTournament}>New Tournament</button>
      </section>
    )
  }

  const stages = current.config.stages
  if (!stages.includes(selectedStage) && stages.length) setSelectedStage(stages[0])

  const assignments = current.config.questAssignments

  useEffect(() => {
    const el = rightRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      setRightHeight(el.getBoundingClientRect().height)
    })
    obs.observe(el)
    setRightHeight(el.getBoundingClientRect().height)
    return () => obs.disconnect()
  }, [current?.config.stages, current?.config.questAssignments])
  const locked = current.status !== 'setup'

  function assignQuest(qid: string) {
    updateCurrent((t) => {
      if (t.status !== 'setup') return t
      const stage = selectedStage
      const currentAssigned = t.config.questAssignments[stage] ?? []
      if (currentAssigned.includes(qid)) return t
      return {
        ...t,
        config: {
          ...t.config,
          questAssignments: {
            ...t.config.questAssignments,
            [stage]: [...currentAssigned, qid],
          },
        },
      }
    })
  }

  function removeQuest(stage: string, qid: string) {
    updateCurrent((t) => {
      if (t.status !== 'setup') return t
      const currentAssigned = t.config.questAssignments[stage] ?? []
      return {
        ...t,
        config: {
          ...t.config,
          questAssignments: {
            ...t.config.questAssignments,
            [stage]: currentAssigned.filter((id) => id !== qid),
          },
        },
      }
    })
  }

  function addStage() {
    const name = prompt('Stage name?')
    if (!name) return
    updateCurrent((t) => {
      if (t.status !== 'setup') return t
      if (t.config.stages.includes(name)) return t
      return { ...t, config: { ...t.config, stages: [...t.config.stages, name] } }
    })
  }

  const filtered = quests.filter((q) => {
    const term = search.toLowerCase()
    return q.name.toLowerCase().includes(term) || q.monster.toLowerCase().includes(term)
  })

  return (
    <section className="panel">
      <h3 className="section-title">Tournament Setup</h3>
      <div className="btnrow"><button className="btn btn-ghost" onClick={newTournament}>New Tournament</button></div>
      <div className="row">
        <label style={{ flex: 1 }}>Tournament Name<input className="input" value={current.config.name} disabled={locked} onChange={(e) => updateConfig('name', e.target.value)} /></label>
      </div>

      <h4 className="subsection">Quest Assignment</h4>
      <div className="btnrow">
        <CustomSelect
          value={selectedStage}
          options={stages.map((s) => ({ value: s, label: s }))}
          onChange={setSelectedStage}
          disabled={locked}
        />
        <CustomSelect
          value={current.config.randomizerMode}
          options={[
            { value: 'stage-based', label: 'Stage-Based' },
            { value: 'match-based', label: 'Match-Based' },
          ]}
          onChange={(v) => updateConfig('randomizerMode', v as any)}
          disabled={locked}
        />
        <button className="btn btn-primary" onClick={addStage} disabled={locked}>Add Stage</button>
      </div>

      <div className="quest-assignment">
        <div className="quest-column" style={{ maxHeight: rightHeight ? `${rightHeight}px` : undefined }}>
          <h5 className="panel-heading">Global Quest Library</h5>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="input search-input" placeholder="Search quests..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="quest-list">
            {filtered.map((q) => (
              <div key={q.id} className="quest-item">
                <div className="quest-info">
                  <div className="quest-name">{q.name}</div>
                  <div className="quest-monster">{q.monster}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => assignQuest(q.id)} disabled={locked}>Assign</button>
              </div>
            ))}
          </div>
        </div>
        <div className="quest-column" ref={rightRef}>
          <h5 className="panel-heading">Assigned by Stage</h5>
          {stages.map((st) => (
            <div key={st} className="stage-box">
              <div className="stage-header">
                <span className="stage-title">{st}</span>
                <span className="stage-count">{(assignments[st] ?? []).length} quests</span>
              </div>
              <ul className="stage-quests">
                {(assignments[st] ?? []).map((qid) => {
                  const q = quests.find((x) => x.id === qid)
                  return (
                    <li key={qid} className="assigned-quest">
                      <div className="quest-info">
                        <div className="quest-name">{q ? q.name : qid}</div>
                        <div className="quest-monster">{q ? q.monster : ''}</div>
                      </div>
                      {!locked && <button className="btn btn-danger btn-sm" onClick={() => removeQuest(st, qid)}>Remove</button>}
                    </li>
                  )
                })}
                {(assignments[st] ?? []).length === 0 && <li className="empty-state">No quests assigned.</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
