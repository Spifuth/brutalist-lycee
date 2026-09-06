/**
 * Detects the error Next.js throws when a Server Action id in the browser's
 * bundle no longer exists on the server:
 *
 *   Failed to find Server Action "abc123". This request might be from an
 *   older or newer deployment.
 *
 * Action ids are content-hashed per build, so any redeploy invalidates every
 * tab that was already open. On a normal site that is a rare annoyance. Here
 * it is worse than that: the people holding stale tabs are a classroom, and
 * the teacher hits it on whichever control they press first — we saw it on
 * "Terminer" at the end of a live quiz, which surfaced a raw framework error
 * and a link to the Next.js docs in front of students.
 *
 * There is nothing to repair on the server; the page simply has to be
 * reloaded. This turns that into a one-line French message and a reload
 * rather than a stack trace.
 */
export function isStaleActionError(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : String(err ?? "")
  return (
    msg.includes("Failed to find Server Action") ||
    msg.includes("was not found on the server") ||
    msg.includes("failed-to-find-server-action")
  )
}

/** User-facing copy for the above. Kept here so every call site says the same thing. */
export const STALE_ACTION_MESSAGE =
  "L'application a été mise à jour. Rechargement en cours…"

/**
 * Reloads the page. Reloading is safe for every action in this app: all of
 * them read their state from the server, so nothing unsaved is held in the
 * browser. Delayed slightly so the message is readable rather than a flash.
 */
export function reloadForStaleAction(delayMs = 1200): void {
  if (typeof window === "undefined") return
  window.setTimeout(() => window.location.reload(), delayMs)
}
