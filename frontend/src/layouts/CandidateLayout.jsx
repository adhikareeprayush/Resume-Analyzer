import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Wordmark } from '../components/ui'

const NAV = [
  { label: 'For you', path: '/candidate', exact: true },
  { label: 'Profile & interests', path: '/candidate/profile' }
]

function CandidateLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="canvas-light flex min-h-screen w-full flex-col">
      <header className="border-b border-ink/10 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Wordmark showMeta meta="Candidate" />
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-muted sm:block">{user?.name}</p>
            <Button type="button" variant="secondary" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-5xl gap-1 px-5 pb-3 sm:px-8" aria-label="Candidate">
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition ${
                  isActive ? 'bg-ink/[0.06] font-medium text-ink' : 'text-muted hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export default CandidateLayout
