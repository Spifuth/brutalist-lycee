"use server"

import jwt from "jsonwebtoken"
import { requireUser } from "@/lib/auth"

// Ample to open a terminal; short enough that a leaked token dies fast.
// jsonwebtoken's `expiresIn` takes plain seconds when given a number.
const TOKEN_TTL_SECONDS = 5 * 60

/**
 * Issues a short-lived JWT the browser terminal presents to the gateway's
 * WebSocket auth gate (`?token=` / `Authorization: Bearer`, verified in
 * gateway/server.js).
 *
 * `requireUser()` runs first and throws for an anonymous caller — no secret
 * is even read until a session is confirmed. `sub` is the user id, so a
 * gateway log line traces back to an account.
 *
 * Signs with `TERMINAL_JWT_SECRET`, read from the server environment at
 * runtime (a plain env var, never `NEXT_PUBLIC_*` — that class of variable
 * is inlined at build time and can't be flipped by a compose change). There
 * is deliberately no default: a predictable secret would be worse than the
 * feature not existing, so an unset secret throws instead of signing with
 * one. Set it to the same value as the gateway's own `JWT_SECRET`.
 */
export async function issueTerminalToken(): Promise<{ token: string }> {
  const user = await requireUser()

  const secret = process.env.TERMINAL_JWT_SECRET
  if (!secret) {
    throw new Error(
      "TERMINAL_JWT_SECRET is not set — refusing to issue a terminal token. " +
        "Set it to the same value as the gateway's JWT_SECRET before enabling the terminal gateway.",
    )
  }

  const token = jwt.sign({ sub: user.id }, secret, { expiresIn: TOKEN_TTL_SECONDS })
  return { token }
}
