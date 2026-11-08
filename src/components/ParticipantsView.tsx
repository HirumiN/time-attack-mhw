import { useTournamentApp } from '../hooks/useTournamentApp'

export function ParticipantsView({ app }: { app: ReturnType<typeof useTournamentApp> }) {
  const { current, newParticipantName, setNewParticipantName, importText, setImportText, editId, editName, setEditName, startEdit, saveEdit, setEditId, addParticipant, importParticipants, deleteParticipant, newTournament } = app
  if (!current) {
    return (
      <section className="panel">
        <h3 className="section-title">Participants</h3>
        <button className="btn btn-primary" onClick={newTournament}>New Tournament</button>
      </section>
    )
  }
  return (
    <section className="panel">
      <h3 className="section-title">Participants</h3>
      <div className="btnrow"><button className="btn btn-ghost" onClick={newTournament}>New Tournament</button></div>
      <div className="row">
        <input className="input" placeholder="Hunter name" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addParticipant()} />
        <button className="btn btn-primary" onClick={addParticipant} disabled={current.status !== 'setup'}>Add</button>
      </div>
      <textarea className="textarea" placeholder="Import multiple (one per line)" value={importText} onChange={(e) => setImportText(e.target.value)} rows={4} />
      <button className="btn btn-ghost" onClick={importParticipants} disabled={current.status !== 'setup'}>Import</button>
      <div className="list">
        {current.participants.map((p) => (
          <div key={p.id} className="list-item">
            {editId === p.id ? (
              <>
                <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <button className="btn btn-ghost" onClick={saveEdit}>Save</button>
                <button className="btn btn-ghost" onClick={() => setEditId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span>{p.name}</span>
                <span className="muted">W:{p.wins} L:{p.losses} {p.eliminated ? '(Eliminated)' : ''}</span>
                {current.status === 'setup' && (
                  <>
                    <button className="btn btn-ghost" onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn btn-ghost" onClick={() => deleteParticipant(p.id)}>Delete</button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {current.status !== 'setup' && <p className="muted">Tournament locked. Participant list read-only.</p>}
    </section>
  )
}
