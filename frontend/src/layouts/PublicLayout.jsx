import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthOptional } from '../context/AuthContext'
import { Button, Wordmark } from '../components/ui'

const NAV_LINKS = [
  { href: '/#idea', label: 'The idea' },
  { href: '/#workflow', label: 'How it works' },
  { href: '/#ranking', label: 'Ranking' }
]

function PublicLayout({ children, tone = 'light', hideNav = false, minimal = false, darkNav = false }) {
  const auth = useAuthOptional()
  const onDark = darkNav || tone === 'dark'
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Over the hero the bar stays invisible so the first viewport reads as one plane.
  const barSurface = lifted
    ? onDark
      ? 'border-b border-white/10 bg-ink/85 backdrop-blur-xl'
      : 'border-b border-ink/10 bg-surface/85 backdrop-blur-xl'
    : 'border-b border-transparent'

  return (
    <div className={`app-shell flex min-h-screen w-full flex-col ${onDark ? 'bg-ink text-paper' : 'canvas-light text-ink'}`}>
      {!minimal ? (
        <header className={`sticky top-0 z-50 w-full transition-colors duration-300 ${barSurface}`}>
          <div className="gutter flex h-16 items-center justify-between gap-6 sm:h-[4.5rem]">
            <Wordmark onDark={onDark} />

            {!hideNav ? (
              <nav className="flex items-center gap-1 sm:gap-2">
                <div className="hidden items-center gap-1 md:flex">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`rounded-md px-3 py-2 text-sm transition ${
                        onDark
                          ? 'text-paper/65 hover:bg-white/[0.07] hover:text-paper'
                          : 'text-muted hover:bg-ink/[0.05] hover:text-ink'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
                {auth?.isAuthenticated ? (
                  <Button
                    as={Link}
                    to={auth.isCandidate ? '/candidate' : '/dashboard'}
                    variant={onDark ? 'onDark' : 'primary'}
                    className="ml-1"
                  >
                    {auth.isCandidate ? 'My applications' : 'Workspace'}
                  </Button>
                ) : (
                  <div className="ml-1 flex items-center gap-2">
                    <Button as={Link} to="/login" variant={onDark ? 'quietOnDark' : 'secondary'}>
                      Sign in
                    </Button>
                    <Button as={Link} to="/signup" variant={onDark ? 'onDark' : 'primary'}>
                      For employers
                    </Button>
                  </div>
                )}
              </nav>
            ) : null}
          </div>
        </header>
      ) : null}

      <main className="relative w-full flex-1">{children}</main>

      {!minimal ? (
        <footer className="w-full border-t border-white/10 bg-ink text-paper">
          <div className="gutter grid gap-12 py-16 md:grid-cols-[1.4fr_1fr] lg:gap-20">
            <div>
              <Wordmark onDark />
              <p className="mt-5 max-w-sm text-sm leading-7 text-paper/55">
                Resume ranking read through the lens of the role.
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <p className="eyebrow-on-dark">Product</p>
                <ul className="mt-5 space-y-3 text-sm text-paper/65">
                  <li>
                    <a href="/#idea" className="transition hover:text-paper">
                      The idea
                    </a>
                  </li>
                  <li>
                    <a href="/#workflow" className="transition hover:text-paper">
                      How it works
                    </a>
                  </li>
                  <li>
                    <Link to="/signup" className="transition hover:text-paper">
                      Create workspace
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="transition hover:text-paper">
                      Company sign in
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="eyebrow-on-dark">Candidates</p>
                <p className="mt-5 max-w-[28ch] text-sm leading-7 text-paper/55">
                  Apply with the link your employer shared. No account needed.
                </p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10">
            <p className="gutter py-6 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-paper/35">
              © 2026 TalentLens
            </p>
          </div>
        </footer>
      ) : null}
    </div>
  )
}

export default PublicLayout
