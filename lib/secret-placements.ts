// Where the site's secrets are actually planted.
//
// Eleven secrets in the hunt had a full hint, points, a difficulty… and
// nothing to find: their `location` still read "À IMPLÉMENTER". Measured on
// 2026-09-08, they were worth 285 points — a fifth of the total — and one
// player held ten of them, because the only way to reach them was the answer
// sheet published alongside the repository, never the game itself.
//
// This module plants them. The rule that shapes it, scoped the way
// lib/secrets-yaml.ts scopes it: ==no *new* code is written into the
// repository==. The 153 codes already in db/seeds/secrets.ts stay there — you
// do not unpublish what is already out, and comments in this repository name
// several of them — but every secret added after them goes through the
// gitignored `db/secrets.yml`, and nothing here hardcodes a code at all. A page
// asks for "the secret planted at such and such a spot" by placement name, and
// the database answers. Hardcoding one would republish exactly what the private
// pipeline takes out.
import { query } from "./db.ts"

/** The placements the site knows how to plant. One secret per placement. */
export const PLACEMENT_SLUGS = [
  "hidden-css",     // text hidden with CSS, resurfaces when selected
  "zero-width",     // zero-width characters inside a paragraph
  "timing",         // shown only for a few minutes after midnight
  "local-storage",  // decoy key written to the browser's storage
  "network",        // a request's response, visible in the Network tab
  "header",         // an HTTP response header
  "backup-file",    // backup file forgotten at the site root
  "admin-path",     // predictable URL path
  "base64",         // encoded string, not encrypted
  "jwt",            // token whose payload reads without a key
  "api-key",        // fake key left in a client-side config
] as const

export type PlacementSlug = (typeof PLACEMENT_SLUGS)[number]

/**
 * The planted codes, read from the database.
 *
 * Returns a missing entry rather than an error: an unfilled placement should
 * degrade the page quietly, not bring it down. A treasure hunt is not a
 * critical dependency.
 */
export async function getPlacedCodes(
  slugs: readonly PlacementSlug[],
): Promise<Partial<Record<PlacementSlug, string>>> {
  const rows = await query<{ placement: PlacementSlug; code: string }>(
    "SELECT placement, code FROM secrets WHERE active AND placement = ANY($1::text[])",
    [slugs as unknown as string[]],
  )
  return Object.fromEntries(rows.map((r) => [r.placement, r.code]))
}

// ── The encodings: pure, and covered by tests ───────────────────────────────

/** ZERO WIDTH SPACE and ZERO WIDTH NON-JOINER, written as escapes so that
 * nobody "cleans them up" by accident while reading through the file. */
const ZERO = "\u200B"
const ONE = "\u200C"

/** U+200B for a 0, U+200C for a 1: invisible to the eye, visible on copy-paste. */
export function encodeZeroWidth(code: string): string {
  return [...code]
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("")
    .replace(/0/g, ZERO)
    .replace(/1/g, ONE)
}

/** Inverse of encodeZeroWidth. Ignores everything that is not one of the two markers, so it survives being pasted with surrounding text. */
export function decodeZeroWidth(hidden: string): string {
  const bits = [...hidden]
    .filter((c) => c === ZERO || c === ONE)
    .map((c) => (c === ZERO ? "0" : "1"))
    .join("")
  let out = ""
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    out += String.fromCharCode(parseInt(bits.slice(i, i + 8), 2))
  }
  return out
}

/** Base64: an encoding, not encryption — which is the whole lesson of this secret. */
export function encodeBase64(code: string): string {
  return Buffer.from(code, "utf8").toString("base64")
}

/**
 * A demonstration JWT.
 *
 * ==The signature is a fixed string, never a real signature==: nothing here
 * should be verifiable, least of all with one of the site's keys. The secret
 * teaches that a JWT payload can be read with no key at all — not that one can
 * be forged.
 */
export function demoJwt(code: string): string {
  const b64 = (value: object) =>
    Buffer.from(JSON.stringify(value), "utf8").toString("base64url")
  const header = b64({ alg: "HS256", typ: "JWT" })
  const payload = b64({
    sub: "demo",
    note: "Un JWT n'est pas chiffré : cette partie se lit sans clé.",
    secret: code,
  })
  return `${header}.${payload}.signature-de-demonstration-sans-valeur`
}

/** A fake API key. Never a real one: the leak is the thing being illustrated. */
export function fakeApiKey(code: string): string {
  return `sk_demo_${code.toLowerCase().replace(/-/g, "_")}_cette_cle_ne_sert_a_rien`
}
