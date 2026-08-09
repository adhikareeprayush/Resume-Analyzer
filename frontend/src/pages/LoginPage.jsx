import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DEMO_USER } from '../data/companyMockData'
import FocusField from '../components/brand/FocusField'
import { Alert, Button, Field, TextInput, Wordmark } from '../components/ui'

function LoginPage() {
  const { login, isAuthenticated, isCandidate } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo =
    location.state?.from || (isCandidate ? '/candidate' : '/dashboard')

  const [email, setEmail] = useState(DEMO_USER.email)
  const [password, setPassword] = useState(DEMO_USER.password)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    const dest = location.state?.from
      ? location.state.from
      : isCandidate
        ? '/candidate'
        : '/dashboard'
    navigate(dest, { replace: true })
  }, [isAuthenticated, isCandidate, navigate, location.state])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email.trim(), password)
      const dest =
        location.state?.from ||
        (data.user?.accountType === 'candidate' || data.user?.role === 'candidate'
          ? '/candidate'
          : '/dashboard')
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check your credentials or try the demo account.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_USER.email)
    setPassword(DEMO_USER.password)
    setError('')
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <aside className="plane-dark grain relative isolate hidden overflow-hidden lg:flex lg:w-[44%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <FocusField focus="center" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(13,17,16,0.94),rgba(13,17,16,0.55)_60%,rgba(13,17,16,0.2))]" />

        <div className="relative z-10">
          <Wordmark onDark />
        </div>

        <div className="relative z-10">
          <p className="brand-mark text-[clamp(2.75rem,5.5vw,4.5rem)] text-paper">TalentLens</p>
          <p className="mt-6 max-w-[34ch] text-base leading-[1.75] text-paper/55">
            Roles, application forms, and AI resume ranking in one workspace.
          </p>
        </div>

        <p className="relative z-10 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-paper/30">
          Company workspace
        </p>
      </aside>

      <div className="canvas-light flex flex-1 items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-[26rem]">
          <div className="mb-10 lg:hidden">
            <Wordmark />
          </div>

          <h1 className="display-title text-[1.75rem] text-ink">Sign in</h1>
          <p className="mt-2.5 text-sm leading-6 text-muted">
            Access your hiring workspace and resume rankings.
          </p>

          <form className="mt-9 grid gap-5" onSubmit={handleSubmit}>
            <Field label="Work email" required>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password" required>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>

            {error ? <Alert tone="error">{error}</Alert> : null}

            <Button type="submit" variant="primary" className="mt-1 w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 rounded-[0.625rem] border border-ink/10 bg-surface p-4">
            <p className="eyebrow">Demo account</p>
            <p className="readout mt-2.5 text-sm text-ink">{DEMO_USER.email}</p>
            <p className="readout text-sm text-muted">{DEMO_USER.password}</p>
            <Button variant="secondary" className="mt-4 w-full" type="button" onClick={fillDemo}>
              Fill demo credentials
            </Button>
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            Hiring?{' '}
            <Link to="/signup" className="link-quiet font-medium text-ink">
              Create a workspace
            </Link>
            <br />
            Job seeker?{' '}
            <Link to="/candidate/signup" className="link-quiet font-medium text-ink">
              Create a candidate account
            </Link>
            {' · '}
            <Link to="/" className="link-quiet">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
