"use client"

import { useEffect, useState } from "react"
import { isStaleActionError, STALE_ACTION_MESSAGE, reloadForStaleAction } from "@/lib/stale-action"

/**
 * Catches "Failed to find Server Action" globally and turns it into a reload.
 *
 * Mounted once in the root layout rather than wired into each of the ten
 * components that call server actions. Those that let the rejection escape
 * (most of them) are covered here; the admin Live tab catches its own errors
 * and handles this case itself, because a teacher mid-session should see the
 * message on the control they pressed.
 */
export function StaleActionGuard() {
  const [stale, setStale] = useState(false)

  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      if (!isStaleActionError(e.reason)) return
      e.preventDefault()
      setStale(true)
      reloadForStaleAction()
    }
    const onError = (e: ErrorEvent) => {
      if (!isStaleActionError(e.error ?? e.message)) return
      e.preventDefault()
      setStale(true)
      reloadForStaleAction()
    }
    window.addEventListener("unhandledrejection", onRejection)
    window.addEventListener("error", onError)
    return () => {
      window.removeEventListener("unhandledrejection", onRejection)
      window.removeEventListener("error", onError)
    }
  }, [])

  if (!stale) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-foreground bg-foreground text-background px-4 py-3 flex items-center gap-3"
    >
      <span className="h-1.5 w-1.5 bg-accent animate-blink" />
      <span className="text-[10px] font-mono uppercase tracking-widest">
        {STALE_ACTION_MESSAGE}
      </span>
    </div>
  )
}
