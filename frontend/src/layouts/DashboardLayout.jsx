import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Wordmark } from '../components/ui'

const NAV_ITEMS = [
  { label: 'Overview', short: 'Overview', path: '/dashboard', exact: true },
  { label: 'Jobs & forms', short: 'Jobs', path: '/dashboard/jobs' },
  { label: 'Resume analysis', short: 'Analyze', path: '/dashboard/analyze' },
  { label: 'Settings', short: 'Settings', path: '/dashboard/settings' }
]

function isNavActive(path, exact, pathname) {
  if (exact) return pathname === path
  return pathname === path || pathname.startsWith(`${path}/`)
}

function OrgIdentity({ company, user }) {
  return (
    <div className="flex items-center gap-3">
      <div className="readout flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-medium text-paper">
        {company?.logoInitials ?? 'TL'}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{company?.name ?? 'Workspace'}</p>
        <p className="truncate text-xs text-faint">{user?.name}</p>
      </div>
    </div>
  )
}

function NavList({ pathname, onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Workspace">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(item.path, item.exact, pathname)
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            onClick={onNavigate}
            className={`rail-link ${active ? 'rail-link-active' : ''}`.trim()}
          >
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function DashboardLayout() {
  const { user, company, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen w-full bg-paper">
      <aside className="rail sticky top-0 hidden h-screen lg:flex">
        <div className="flex flex-1 flex-col px-5 py-6">
          <Wordmark showMeta meta="Workspace" />

          <div className="mt-9 border-t border-ink/10 pt-5">
            <OrgIdentity company={company} user={user} />
          </div>

          <div className="mt-8 flex-1">
            <p className="eyebrow mb-3 pl-4">Navigate</p>
            <NavList pathname={location.pathname} />
          </div>

          <div className="border-t border-ink/10 pt-4">
            <button type="button" onClick={handleLogout} className="rail-link w-full text-left">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="sticky top-0 z-40 border-b border-ink/10 bg-surface/90 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5">
            <Wordmark />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="btn btn-secondary min-h-10 px-4"
              aria-expanded={menuOpen}
            >
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>

          {menuOpen ? (
            <div className="animate-fade-in border-t border-ink/10 px-5 pb-5 pt-4">
              <OrgIdentity company={company} user={user} />
              <div className="mt-5">
                <NavList pathname={location.pathname} onNavigate={() => setMenuOpen(false)} />
              </div>
              <Button variant="secondary" className="mt-5 w-full" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          ) : null}
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
