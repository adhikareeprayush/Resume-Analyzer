import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import AnalyzePage from './pages/AnalyzePage'
import HomePage from './pages/HomePage'

const navItems = [
  { label: 'Overview', path: '/' },
  { label: 'Analyze', path: '/analyze' }
]

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-paper text-ink">
      <div className="grain-overlay pointer-events-none absolute inset-0" />
      <div className="grid-faint pointer-events-none absolute inset-0 opacity-45" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 rounded-2xl border border-slate/15 bg-paper/85 px-4 py-3 shadow-soft backdrop-blur md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-2xl leading-none">TalentLens Atlas</p>
              <p className="text-xs uppercase tracking-[0.14em] text-ink/55">
                Mock Product Experience - Phase 2
              </p>
            </div>

            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-ink text-paper'
                        : 'bg-white text-ink ring-1 ring-slate/20 hover:ring-ink/30'
                    }`
                  }
                  end={item.path === '/'}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="mt-6 flex-1 animate-fade-rise">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/pipeline" element={<Navigate to="/" replace />} />
            <Route path="/reports/:candidateId" element={<Navigate to="/" replace />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
