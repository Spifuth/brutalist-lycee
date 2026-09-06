"use server"

import { requireUser } from "@/lib/auth"
import { awardBadge } from "@/lib/awards"

/**
 * Awards `terminal-init` the first time a student actually runs something in
 * the terminal. Called by components/terminal/terminal-playground.tsx on the
 * first submitted command, in either mode — the in-browser sandbox counts,
 * because from the student's side it is the same exercise.
 *
 * The badge's kind has said `auto:terminal` since the app was generated, but
 * nothing ever awarded it, so it was advertised on the badge wall and could
 * never be earned. `awardBadge` is idempotent, so calling this on every
 * command is harmless — but the client only calls it once per session.
 */
export async function markTerminalUsed(): Promise<void> {
  const user = await requireUser()
  await awardBadge(user.id, "terminal-init")
}
