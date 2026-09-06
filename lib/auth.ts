import "server-only"
import { cookies } from "next/headers"
import { queryOne, query } from "@/lib/db"
import { generateSessionToken } from "@/lib/crypto"

export const SESSION_COOKIE = "lycee_session"
const SESSION_DAYS = 90

export interface SessionUser {
  id: string
  pseudo: string
  pseudoLower: string
  avatarSeed: string
  avatarVariant: string
  avatarFile: string | null
  avatarUploadedAt: string | null
  accent: string
  level: string
  status: string
  isAdmin: boolean
  points: number
  createdAt: string
  lastSeenAt: string
}

interface UserRow {
  id: string
  pseudo: string
  pseudo_lower: string
  avatar_seed: string
  avatar_variant: string
  avatar_file: string | null
  avatar_uploaded_at: string | null
  accent: string
  level: string
  status: string
  is_admin: boolean
  points: number
  created_at: string
  last_seen_at: string
}

function toSessionUser(r: UserRow): SessionUser {
  return {
    id: r.id,
    pseudo: r.pseudo,
    pseudoLower: r.pseudo_lower,
    avatarSeed: r.avatar_seed,
    avatarVariant: r.avatar_variant,
    avatarFile: r.avatar_file,
    avatarUploadedAt: r.avatar_uploaded_at,
    accent: r.accent,
    level: r.level,
    status: r.status,
    isAdmin: r.is_admin,
    points: r.points,
    createdAt: r.created_at,
    lastSeenAt: r.last_seen_at,
  }
}

/** Creates a session row and sets the httpOnly cookie. Call after signup/login. */
export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken()
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [
    token,
    userId,
    expires.toISOString(),
  ])
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // The v0 preview renders inside a cross-site iframe; without SameSite=None
    // the browser drops the cookie. Secure is required alongside None.
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "none",
    secure: true,
    path: "/",
    expires,
  })
}

/** Reads the current user from the session cookie, or null. Also refreshes last_seen. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  const row = await queryOne<UserRow>(
    `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = $1 AND s.expires_at > now()`,
    [token],
  )
  if (!row) return null
  if (row.status === "suspended") return null
  // fire-and-forget last_seen refresh
  query("UPDATE users SET last_seen_at = now() WHERE id = $1", [row.id]).catch(() => {})
  return toSessionUser(row)
}

/** Throws if not signed in. Use in server actions that require a user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("Non authentifié")
  return user
}

/** Throws unless the current user is an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (!user.isAdmin) throw new Error("Accès réservé aux administrateurs")
  return user
}

/** Destroys the current session (logout). */
export async function destroySession(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    await query("DELETE FROM sessions WHERE token = $1", [token]).catch(() => {})
  }
  jar.delete(SESSION_COOKIE)
}
