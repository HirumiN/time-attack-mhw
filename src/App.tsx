import { useTournamentApp } from './hooks/useTournamentApp'
import { ParticipantsView } from './components/ParticipantsView'
import { SetupView } from './components/SetupView'
import { TournamentView } from './components/TournamentView'
import { SaveView } from './components/SaveView'
import bgImage from './assets/mhw iceborne.webp'
import './App.css'

const views = [
  { id: 'participants', label: 'Participants' },
  { id: 'setup', label: 'Setup' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'save', label: 'Save / Load' },
]

export default function App() {
  const app = useTournamentApp()
  const { state, setView } = app

  return (
    <div className="app">
      <div className="bg-layer" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="bg-overlay" />
      <header className="hero">
        <h1>ICEBORNE TIME ATTACK</h1>
        <h2>SOLO DOUBLE ELIMINATION TOURNAMENT</h2>
        <p className="subtitle">HOARFROST REACH · SELIANA · VELKHANA</p>
      </header>

      <nav className="nav">
        {views.map((v) => (
          <button key={v.id} className={`nav-btn ${state.view === v.id ? 'active' : ''}`} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
      </nav>

      {app.error && <div className="banner error">{app.error}<button onClick={() => app.setError(null)}>×</button></div>}

      <main className="main">
        {state.view === 'participants' && <ParticipantsView app={app} />}
        {state.view === 'setup' && <SetupView app={app} />}
        {state.view === 'tournament' && <TournamentView app={app} />}
        {state.view === 'save' && <SaveView app={app} />}
      </main>
    </div>
  )
}
