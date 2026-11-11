import { useState } from 'react'
import { useTournamentApp } from '../hooks/useTournamentApp'

export function SaveView({ app }: { app: ReturnType<typeof useTournamentApp> }) {
  const { current, newTournament, getSaveCode, loadSaveCode, setInfo } = app
  const [code, setCode] = useState('')
  const [loadText, setLoadText] = useState('')
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  if (!current) {
    return (
      <section className="panel">
        <h3 className="section-title">Save / Load</h3>
        <p className="muted">Create a tournament first to generate a save code.</p>
        <button className="btn btn-primary" onClick={newTournament}>New Tournament</button>
      </section>
    )
  }

  const completedMatches = current.matches.filter((m) => m.status === 'completed').length

  async function generate() {
    try {
      const value = await getSaveCode()
      if (!value) {
        setIsError(true)
        setMessage('No tournament to save.')
        return
      }
      setCode(value)
      setCopied(false)
      setIsError(false)
      setMessage('Save code generated. Copy it and keep it somewhere safe.')
    } catch {
      setIsError(true)
      setMessage('Could not generate a save code.')
    }
  }

  async function copyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setIsError(false)
      setMessage('Save code copied to clipboard.')
      setInfo('Save code copied to clipboard.')
    } catch {
      setIsError(true)
      setMessage('Could not copy automatically. Select the code and copy it manually.')
    }
  }

  async function load() {
    if (!loadText.trim()) {
      setIsError(true)
      setMessage('Paste a save code first.')
      return
    }
    if (!window.confirm('Load this save code? The current tournament will be replaced.')) return
    try {
      await loadSaveCode(loadText)
      setMessage(null)
      setLoadText('')
      setCode('')
    } catch (err) {
      setIsError(true)
      setMessage(err instanceof Error ? err.message : 'Invalid save code.')
    }
  }

  return (
    <section className="panel">
      <h3 className="section-title">Save / Load</h3>
      <p className="muted">
        The tournament is saved automatically in this browser. Use a save code to back it up or continue
        the results on another device/browser.
      </p>

      <div className="save-summary">
        <div className="stat">
          <span className="stat-label">Tournament</span>
          <span className="stat-value save-summary-name">{current.config.name}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Status</span>
          <span className="stat-value">{current.status.replace('_', ' ')}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Participants</span>
          <span className="stat-value">{current.participants.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Matches Done</span>
          <span className="stat-value">{completedMatches} / {current.matches.length}</span>
        </div>
      </div>

      <div className="save-grid">
        <div className="save-block">
          <h4 className="subsection">Generate Save Code</h4>
          <p className="muted">Create a code containing the current bracket and all recorded results.</p>
          <div className="btnrow">
            <button className="btn btn-primary" onClick={generate}>Generate Save Code</button>
            {code && <button className="btn btn-ghost" onClick={copyCode}>{copied ? 'Copied!' : 'Copy Code'}</button>}
          </div>
          {code && (
            <textarea
              className="textarea save-code"
              value={code}
              readOnly
              rows={6}
              onFocus={(e) => e.currentTarget.select()}
            />
          )}
        </div>

        <div className="save-block">
          <h4 className="subsection">Load Save Code</h4>
          <p className="muted">Paste a save code to restore a tournament and continue from where it stopped.</p>
          <textarea
            className="textarea save-code"
            placeholder="MHW1-..."
            value={loadText}
            onChange={(e) => setLoadText(e.target.value)}
            rows={6}
          />
          <div className="btnrow">
            <button className="btn btn-primary" onClick={load}>Load Save Code</button>
            {loadText && (
              <button className="btn btn-ghost" onClick={() => { setLoadText(''); setMessage(null) }}>Clear</button>
            )}
          </div>
        </div>
      </div>

      {message && <p className={`save-message ${isError ? 'error' : 'muted'}`}>{message}</p>}
    </section>
  )
}
