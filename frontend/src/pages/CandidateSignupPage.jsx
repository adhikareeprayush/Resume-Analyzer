import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FocusField from '../components/brand/FocusField'
import { Alert, Button, Field, TextInput, Wordmark } from '../components/ui'

function CandidateSignupPage() {
  const { registerAsCandidate, isAuthenticated, isCandidate } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isCandidate ? '/candidate' : '/dashboard', { replace: true })
    }
  }, [isAuthenticated, isCandidate, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerAsCandidate({
        name: name.trim(),
        email: email.trim(),
        password
      })
      navigate('/candidate', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create account.')
    } finally {
      setLoading(false)
    }
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
          <p className="brand-mark text-[clamp(2.5rem,5vw,4rem)] text-paper">For candidates</p>
          <p className="mt-6 max-w-[34ch] text-base leading-[1.75] text-paper/55">
            Keep a receipt of every TalentLens application and see when employers move your status.
          </p>
        </div>
        <p className="relative z-10 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-paper/30">
          Apply via employer links · Track here
        </p>
      </aside>

      <div className="canvas-light flex flex-1 items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-[26rem]">
          <div className="mb-10 lg:hidden">
            <Wordmark />
          </div>
          <h1 className="display-title text-[1.75rem] text-ink">Create candidate account</h1>
          <p className="mt-2.5 text-sm leading-6 text-muted">
            Free account to track applications submitted through employer apply links.
          </p>

          <form className="mt-9 grid gap-5" onSubmit={handleSubmit}>
            <Field label="Full name" required>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Email" required>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password" required hint="At least 8 characters">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </Field>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Hiring team?{' '}
            <Link to="/signup" className="link-quiet font-medium text-ink">
              Create a company workspace
            </Link>
            {' · '}
            <Link to="/login" className="link-quiet">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default CandidateSignupPage
