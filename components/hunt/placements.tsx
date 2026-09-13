"use client"

// Three hiding places that exist only in the browser: a request made to be
// looked at, a key written into local storage, and a paragraph that renders
// only in a five-minute window after midnight.
//
// What they have in common is the point of the exercise -- each one is a
// surface any visitor can inspect and almost nobody thinks to open: the
// Network tab, the Application tab, the clock.
// /docs/ce-site/verifie-toi-meme walks a student through the first of them.
// Read as a game here, it is the cheap version of the lesson every web
// developer eventually learns expensively: everything handed to a browser
// belongs to whoever is holding the browser.

import { useEffect, useState } from "react"

/**
 * The three /chasse hiding places that need a browser.
 *
 * The codes arrive as props from the server component: they come from the
 * database and are written nowhere in the repository.
 */
export function HuntPlacements({ timing, storage }: { timing?: string; storage?: string }) {
  const [showTiming, setShowTiming] = useState(false)

  useEffect(() => {
    // SIN-NETWORK-SPY and SIN-HEADER-CUSTOM: a request whose only reason to
    // exist is to show up in the Network tab. The response is ignored on
    // purpose.
    fetch("/api/decoy").catch(() => {})
  }, [])

  useEffect(() => {
    // SIN-LOCALSTORAGE-HACK: the browser keeps data per site, and nobody
    // thinks to go and look at it.
    if (!storage) return
    try {
      window.localStorage.setItem("lycee.debug", storage)
    } catch {
      // Private browsing, or storage refused: the hiding place is lost, the
      // page is not.
    }
  }, [storage])

  useEffect(() => {
    // SIN-TIMING-TRAP: visible only between midnight and five past. Checked on
    // render and then every minute, otherwise a tab left open would sit
    // through the window without noticing it.
    const check = () => {
      const now = new Date()
      setShowTiming(now.getHours() === 0 && now.getMinutes() < 5)
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!showTiming || !timing) return null

  return (
    <p className="mt-6 border-2 border-accent px-4 py-3 font-mono text-xs uppercase tracking-widest text-accent">
      il est minuit passé de peu — {timing}
    </p>
  )
}
