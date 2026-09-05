"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { SessionUser } from "@/lib/auth"
import {
  whoami,
  signUp as signUpAction,
  login as loginAction,
  logout as logoutAction,
  updateProfile as updateProfileAction,
  type AuthResult,
} from "@/app/actions/auth"

interface AuthContextValue {
  user: SessionUser | null
  ready: boolean
  /** Passphrase shown once right after signup (cleared on reload). */
  lastPassphrase: string | null
  refresh: () => Promise<void>
  signUp: (input: {
    pseudo: string
    avatarSeed?: string
    avatarVariant?: string
    accent?: string
    level?: string
  }) => Promise<AuthResult>
  login: (input: { pseudo: string; passphrase: string }) => Promise<AuthResult>
  logout: () => Promise<void>
  updateProfile: (input: { avatarSeed?: string; avatarVariant?: string; accent?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)
  const [lastPassphrase, setLastPassphrase] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const u = await whoami()
    setUser(u)
    setReady(true)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signUp: AuthContextValue["signUp"] = useCallback(async (input) => {
    const res = await signUpAction(input)
    if (res.ok) {
      setUser(res.user)
      if (res.passphrase) setLastPassphrase(res.passphrase)
    }
    return res
  }, [])

  const login: AuthContextValue["login"] = useCallback(async (input) => {
    const res = await loginAction(input)
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const logout = useCallback(async () => {
    await logoutAction()
    setUser(null)
    setLastPassphrase(null)
  }, [])

  const updateProfile: AuthContextValue["updateProfile"] = useCallback(
    async (input) => {
      await updateProfileAction(input)
      await refresh()
    },
    [refresh],
  )

  return (
    <AuthContext.Provider
      value={{ user, ready, lastPassphrase, refresh, signUp, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>")
  return ctx
}
