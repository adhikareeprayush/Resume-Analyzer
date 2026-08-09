import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Alert, Button, Field, TextArea, TextInput } from '../components/ui'
import { fetchCandidateProfile, updateCandidateProfile } from '../services/companyApi'

function listToText(values) {
  return (values || []).join(', ')
}

function textToList(value) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function CandidateProfilePage() {
  const { user, updateUserInSession } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [headline, setHeadline] = useState(user?.headline || '')
  const [preferredLocation, setPreferredLocation] = useState(user?.preferredLocation || '')
  const [skillsText, setSkillsText] = useState(listToText(user?.interestSkills))
  const [rolesText, setRolesText] = useState(listToText(user?.interestRoles))
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchCandidateProfile()
      .then((data) => {
        if (!active || !data.user) return
        updateUserInSession(data.user)
        setName(data.user.name || '')
        setHeadline(data.user.headline || '')
        setPreferredLocation(data.user.preferredLocation || '')
        setSkillsText(listToText(data.user.interestSkills))
        setRolesText(listToText(data.user.interestRoles))
      })
      .catch(() => {
        /* keep session values */
      })
    return () => {
      active = false
    }
  }, [updateUserInSession])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const data = await updateCandidateProfile({
        name: name.trim(),
        headline: headline.trim(),
        preferredLocation: preferredLocation.trim(),
        interestSkills: textToList(skillsText),
        interestRoles: textToList(rolesText)
      })
      updateUserInSession(data.user)
      setNotice('Interests saved. Suggestions will update on your home page.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      <header className="border-b border-ink/10 pb-6">
        <p className="eyebrow">Account</p>
        <h1 className="display-title mt-2.5 text-[1.75rem] text-ink">Profile & interests</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          Tell us what you want to work on. We suggest open TalentLens roles that fit — you still
          apply through each employer’s form.
        </p>
      </header>

      <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? (
          <Alert tone="success" onDismiss={() => setNotice('')}>
            {notice}
          </Alert>
        ) : null}

        <Field label="Full name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email" hint="Used to match applications you already submitted">
          <TextInput value={user?.email || ''} disabled />
        </Field>
        <Field label="Headline" hint="One line about you">
          <TextInput
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Frontend engineer · React & Next.js"
          />
        </Field>
        <Field label="Preferred location">
          <TextInput
            value={preferredLocation}
            onChange={(e) => setPreferredLocation(e.target.value)}
            placeholder="Remote — Nepal"
          />
        </Field>
        <Field label="Skills of interest" hint="Comma-separated">
          <TextArea
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="React, Next.js, TypeScript, Tailwind CSS"
          />
        </Field>
        <Field label="Roles you’re interested in" hint="Comma-separated titles or keywords">
          <TextArea
            value={rolesText}
            onChange={(e) => setRolesText(e.target.value)}
            placeholder="Junior Next.js Developer, Frontend Engineer"
          />
        </Field>

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save interests'}
        </Button>
      </form>
    </div>
  )
}

export default CandidateProfilePage
