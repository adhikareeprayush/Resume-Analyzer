import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import FocusField from '../components/brand/FocusField'
import { Alert, Button, Field, SelectInput, TextInput, Wordmark } from '../components/ui'

function SignupPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('Technology')
  const [size, setSize] = useState('11–50')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({
        companyName: companyName.trim(),
        industry,
        size,
        name: name.trim(),
        email: email.trim(),
        password
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Could not create workspace.')
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
          <p className="brand-mark text-[clamp(2.75rem,5.5vw,4.5rem)] text-paper">TalentLens</p>
          <p className="mt-6 max-w-[34ch] text-base leading-[1.75] text-paper/55">
            Create a company workspace, publish application forms, and rank every applicant.
          </p>
        </div>

        <p className="relative z-10 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-paper/30">
          Start free · Admin account
        </p>
      </aside>

      <div className="canvas-light flex flex-1 items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-[28rem]">
          <div className="mb-10 lg:hidden">
            <Wordmark />
          </div>

          <h1 className="display-title text-[1.75rem] text-ink">Create workspace</h1>
          <p className="mt-2.5 text-sm leading-6 text-muted">
            Register your company and admin account in one step.
          </p>

          <form className="mt-9 grid gap-5" onSubmit={handleSubmit}>
            <Field label="Company name" required>
              <TextInput
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Hiring"
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Industry">
                <SelectInput value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Education</option>
                  <option>Retail</option>
                  <option>Other</option>
                </SelectInput>
              </Field>
              <Field label="Company size">
                <SelectInput value={size} onChange={(e) => setSize(e.target.value)}>
                  <option>1–10</option>
                  <option>11–50</option>
                  <option>51–200</option>
                  <option>201–1000</option>
                  <option>1000+</option>
                </SelectInput>
              </Field>
            </div>

            <Field label="Your name" required>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anisha Shrestha"
                autoComplete="name"
                required
              />
            </Field>

            <Field label="Work email" required>
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
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>

            {error ? <Alert tone="error">{error}</Alert> : null}

            <Button type="submit" variant="primary" className="mt-1 w-full" disabled={loading}>
              {loading ? 'Creating workspace…' : 'Create workspace'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="link-quiet font-medium text-ink">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
