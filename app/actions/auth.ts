"use server"

import { query, queryOne } from "@/lib/db"
import { hashPassphrase, verifyPassphrase, generatePassphrase } from "@/lib/crypto"
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

  const row = await queryOne<{ id: string; passphrase_hash: string; status: string }>(
    "SELECT id, passphrase_hash, status FROM users WHERE pseudo_lower = $1",
    [pseudoLower],
  )
  if (!row) return { ok: false, error: "Identifiants incorrects." }
  if (row.status === "suspended") return { ok: false, error: "Ce compte est suspendu." }

  const valid = await verifyPassphrase(passphrase, row.passphrase_hash)
  if (!valid) return { ok: false, error: "Identifiants incorrects." }

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
