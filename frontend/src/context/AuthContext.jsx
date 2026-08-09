import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  fetchMe,
  login as apiLogin,
  registerWorkspace as apiRegister,
  registerCandidate as apiRegisterCandidate
} from '../services/companyApi'
import { getToken, setToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      const token = getToken()
      if (!token) {
        if (active) setReady(true)
        return
      }

      try {
        const data = await fetchMe()
        if (!active) return
        setSession({ user: data.user, company: data.company })
      } catch {
        setToken(null)
        setSession(null)
      } finally {
        if (active) setReady(true)
      }
    }

    bootstrap()
    return () => {
      active = false
    }
  }, [])

  const applySession = (data) => {
    setToken(data.token)
    setSession({ user: data.user, company: data.company ?? null })
  }

  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    applySession(data)
    return data
  }

  const register = async (payload) => {
    const data = await apiRegister(payload)
    applySession(data)
    return data
  }

  const registerAsCandidate = async (payload) => {
    const data = await apiRegisterCandidate(payload)
    applySession(data)
    return data
  }

  const refreshSession = async () => {
    const data = await fetchMe()
    setSession({ user: data.user, company: data.company ?? null })
    return data
  }

  const updateCompanyInSession = (company) => {
    setSession((prev) => (prev ? { ...prev, company } : prev))
  }

  const updateUserInSession = (user) => {
    setSession((prev) => (prev ? { ...prev, user } : prev))
  }

  const logout = () => {
    setToken(null)
    setSession(null)
  }

  const accountType = session?.user?.accountType || (session?.user?.role === 'candidate' ? 'candidate' : 'company')
  const isCandidate = accountType === 'candidate'
  const isCompanyUser = accountType === 'company'

  const value = useMemo(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      company: session?.company ?? null,
      isAuthenticated: Boolean(session?.user),
      isCandidate,
      isCompanyUser,
      accountType,
      login,
      register,
      registerAsCandidate,
      logout,
      refreshSession,
      updateCompanyInSession,
      updateUserInSession
    }),
    [ready, session, isCandidate, isCompanyUser, accountType]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function useAuthOptional() {
  return useContext(AuthContext)
}
