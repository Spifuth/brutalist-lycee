"use client"

// Holds "who is signed in" for the whole client tree.
//
// A React *context* answers one specific problem: a value that many
// components need and that almost nobody wants to pass down. Without it the
// signed-in user would travel through every layout and every page as a prop,
// crossing components that do not care about it. The cost is that every
// consumer re-renders when the value changes -- fine for a session that
// changes twice a day, wrong for anything that changes per keystroke. That is
// the question to ask before reaching for a context: how often does this
// value move?
//
// The provider owns no rules of its own. It calls the server actions in
// app/actions/auth.ts and keeps what they return; the cookie, the passphrase
// and the login limits are all decided on the server. A client context is a
// cache of the server's answer, never the authority -- anything it stores can
// be edited from the browser console.
//
// `ready` is separate from `user` because "nobody is signed in" and "we have
// not asked yet" look identical in a nullable field, and a UI that cannot
// tell them apart flashes a signed-out screen at a signed-in visitor on every
// single page load.

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
