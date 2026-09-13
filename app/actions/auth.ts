"use server"

// Sign up, log in, log out, edit your profile — the four actions that decide
// whose session cookie gets written. lib/auth.ts owns the cookie itself.
//
// `login` is the one to read closely, and mostly for what it refuses to say.
// An unknown pseudo and a wrong passphrase return the same message and both
// count as a failed attempt, because anything that separates them answers
// "does this account exist?" for free — the throttle included, which is why an
// unknown pseudo is recorded as a failure too. That gate is checked before the
// database lookup and before scrypt: scrypt is deliberately expensive
// (lib/crypto.ts), so an unthrottled login endpoint is a CPU-exhaustion vector
// as well as a guessing oracle, and refusing early closes both.
//
// The exception is deliberate and does cut the other way: a suspended account
// is told so by name, so that one reply does confirm the account exists. It
// was judged worth it — a suspension is a decision somebody made, and a
// student who cannot log in deserves to know which of the two it is.

import { query, queryOne } from "@/lib/db"
import { hashPassphrase, verifyPassphrase, generatePassphrase } from "@/lib/crypto"
import { checkLogin, recordFailure, clearFailures } from "@/lib/login-throttle"
import {
  createSession,
  destroySession,
  getSessionUser,
  requireUser,
  type SessionUser,
} from "@/lib/auth"
import { awardBadge } from "@/lib/awards"
import { revalidatePath } from "next/cache"

export type AuthResult =
  | { ok: true; user: SessionUser; passphrase?: string }
  | { ok: false; error: string }

const PSEUDO_RE = /^[a-zA-Z0-9._-]{2,24}$/

/** Returns the current session user (or null) for client hydration. */
export async function whoami(): Promise<SessionUser | null> {
  return getSessionUser()
}

/**
 * Creates an account. The passphrase is generated server-side (as before) and
 * returned ONCE so the student can save it — it is never stored in plaintext.
 */
export async function signUp(input: {
  pseudo: string
  avatarSeed?: string
  avatarVariant?: string
  accent?: string
  level?: string
}): Promise<AuthResult> {
  const pseudo = (input.pseudo || "").trim()
  if (!PSEUDO_RE.test(pseudo)) {
    return { ok: false, error: "Pseudo invalide (2 à 24 caractères : lettres, chiffres, . _ -)." }
  }
  const pseudoLower = pseudo.toLowerCase()

  const exists = await queryOne("SELECT 1 FROM users WHERE pseudo_lower = $1", [pseudoLower])
  if (exists) return { ok: false, error: "Ce pseudo est déjà pris." }

  const passphrase = generatePassphrase()
  const hash = await hashPassphrase(passphrase)

  const row = await queryOne<{ id: string }>(
    `INSERT INTO users (pseudo, pseudo_lower, passphrase_hash, avatar_seed, avatar_variant, accent, level)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      pseudo,
      pseudoLower,
      hash,
      input.avatarSeed || pseudo,
      input.avatarVariant || "grid",
      input.accent || "orange",
      input.level || "inconnu",
    ],
  )
  const userId = row!.id
  await awardBadge(userId, "first-login")
  await createSession(userId)
  const user = await getSessionUser()
  revalidatePath("/")
  return { ok: true, user: user!, passphrase }
}

/** Logs in with pseudo + passphrase. */
export async function login(input: { pseudo: string; passphrase: string }): Promise<AuthResult> {
  const pseudoLower = (input.pseudo || "").trim().toLowerCase()
  const passphrase = (input.passphrase || "").trim()
  if (!pseudoLower || !passphrase) return { ok: false, error: "Pseudo et phrase de passe requis." }

  // Checked BEFORE the lookup and before scrypt. Every guess costs the server
  // a full key derivation, so an unthrottled login endpoint is both a
  // guessing oracle and a CPU-exhaustion vector; refusing early closes both.
  const gate = checkLogin(pseudoLower)
  if (!gate.allowed) {
    const minutes = Math.max(1, Math.ceil(gate.retryAfterMs / 60_000))
    return {
      ok: false,
      error: `Trop d'essais sur ce pseudo. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`,
    }
  }

  const row = await queryOne<{ id: string; passphrase_hash: string; status: string }>(
    "SELECT id, passphrase_hash, status FROM users WHERE pseudo_lower = $1",
    [pseudoLower],
  )
  // An unknown pseudo counts as a failure exactly like a wrong passphrase.
  // Counting only real accounts would turn "you are being throttled" into an
  // answer to "does this pseudo exist?".
  if (!row) {
    recordFailure(pseudoLower)
    return { ok: false, error: "Identifiants incorrects." }
  }
  // A suspended account is a decision, not a guess — it does not count.
  if (row.status === "suspended") return { ok: false, error: "Ce compte est suspendu." }

  const valid = await verifyPassphrase(passphrase, row.passphrase_hash)
  if (!valid) {
    recordFailure(pseudoLower)
    return { ok: false, error: "Identifiants incorrects." }
  }

  clearFailures(pseudoLower)
  await createSession(row.id)
  const user = await getSessionUser()
  revalidatePath("/")
  return { ok: true, user: user! }
}

/** Logs out the current user. */
export async function logout(): Promise<void> {
  await destroySession()
  revalidatePath("/")
}

/** Updates the current user's avatar / accent / display pseudo casing. */
export async function updateProfile(input: {
  avatarSeed?: string
  avatarVariant?: string
  accent?: string
}): Promise<{ ok: boolean }> {
  const user = await requireUser()
  await query(
    `UPDATE users SET
       avatar_seed = COALESCE($1, avatar_seed),
       avatar_variant = COALESCE($2, avatar_variant),
       accent = COALESCE($3, accent)
     WHERE id = $4`,
    [input.avatarSeed ?? null, input.avatarVariant ?? null, input.accent ?? null, user.id],
  )
  revalidatePath("/profil")
  return { ok: true }
}
