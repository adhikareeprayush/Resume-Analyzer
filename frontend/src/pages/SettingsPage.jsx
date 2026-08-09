import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert, Button, Card, DashboardPage, Field, TextInput } from '../components/ui'
import { updateCompany } from '../services/companyApi'

function SettingsPage() {
  const { company, user, updateCompanyInSession } = useAuth()
  const canEditCompany = ['admin', 'owner', 'talent lead'].includes(
    (user?.role || '').toLowerCase()
  )
  const [name, setName] = useState(company?.name || '')
  const [industry, setIndustry] = useState(company?.industry || '')
  const [size, setSize] = useState(company?.size || '')
  const [logoInitials, setLogoInitials] = useState(company?.logoInitials || '')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setName(company?.name || '')
    setIndustry(company?.industry || '')
    setSize(company?.size || '')
    setLogoInitials(company?.logoInitials || '')
  }, [company])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const updated = await updateCompany({
        name: name.trim(),
        industry: industry.trim(),
        size: size.trim(),
        logoInitials: logoInitials.trim()
      })
      updateCompanyInSession(updated)
      setNotice('Company profile saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardPage
      eyebrow="Workspace"
      title="Company settings"
      description="How your hiring workspace appears to your team."
      breadcrumbs={[{ label: 'Settings' }]}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Company profile" padding="sm">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            {error ? <Alert tone="error">{error}</Alert> : null}
            {notice ? (
              <Alert tone="success" onDismiss={() => setNotice('')}>
                {notice}
              </Alert>
            ) : null}

            <Field label="Company name" required>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Industry">
                <TextInput value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </Field>
              <Field label="Size">
                <TextInput value={size} onChange={(e) => setSize(e.target.value)} />
              </Field>
            </div>
            <Field label="Logo initials" hint="Up to 8 characters">
              <TextInput
                value={logoInitials}
                onChange={(e) => setLogoInitials(e.target.value.toUpperCase().slice(0, 8))}
              />
            </Field>

            <div className="flex justify-end border-t border-ink/10 pt-5">
              <Button type="submit" variant="primary" disabled={saving || !canEditCompany}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
            {!canEditCompany ? (
              <p className="text-xs text-faint">Only workspace admins can edit company settings.</p>
            ) : null}
          </form>
        </Card>

        <Card eyebrow="Account" title="Signed in as" padding="sm">
          <p className="text-sm font-medium text-ink">{user?.name}</p>
          <p className="mt-1 text-sm text-muted">{user?.email}</p>
          <p className="readout mt-4 text-xs uppercase tracking-[0.14em] text-faint">
            Role · {user?.role || 'member'}
          </p>
          <Button as={Link} to="/dashboard/jobs" variant="secondary" className="mt-6">
            Back to jobs
          </Button>
        </Card>
      </div>
    </DashboardPage>
  )
}

export default SettingsPage
