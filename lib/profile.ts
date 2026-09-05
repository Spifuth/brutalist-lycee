"use client"

// Compatibility bridge. Historically this module was a localStorage stand-in;
// it is now a thin adapter over the real DB-backed session (AuthProvider +
// server actions). Existing components that call useProfile() keep working, but
// the data now comes from Postgres and is shared across devices.

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { getMySurveys, getMySecrets } from "@/app/actions/engage"

export type SurveyLevel = "court" | "moyen" | "complet"

export interface Profile {
  pseudo: string
  /** Only present right after signup (shown once). Empty otherwise. */
  passphrase: string
  createdAt: number
  completedSurveys: SurveyLevel[]
  unlockedSecret?: boolean
}

/**
 * Reactive profile derived from the DB session. `setProfile` triggers a refresh
 * of the underlying auth/session state (kept for call-site compatibility).
 */
export function useProfile() {
  const { user, ready, lastPassphrase, refresh } = useAuth()
  const [completedSurveys, setCompletedSurveys] = useState<SurveyLevel[]>([])
  const [unlockedSecret, setUnlockedSecret] = useState(false)

  useEffect(() => {
    let active = true
    if (!user) {
      setCompletedSurveys([])
      setUnlockedSecret(false)
      return
    }
    Promise.all([getMySurveys(), getMySecrets()]).then(([surveys, secrets]) => {
      if (!active) return
      setCompletedSurveys(surveys as SurveyLevel[])
      setUnlockedSecret(secrets.found > 0)
    })
    return () => {
      active = false
    }
  }, [user])

  const profile: Profile | null = user
    ? {
        pseudo: user.pseudo,
        passphrase: lastPassphrase ?? "",
        createdAt: new Date(user.createdAt).getTime(),
        completedSurveys,
        unlockedSecret,
      }
    : null

  // Kept for API compatibility: refresh the session instead of writing local state.
  const setProfile = () => {
    refresh()
  }

  return { profile, ready, setProfile }
}
