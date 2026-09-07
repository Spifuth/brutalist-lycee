import { randomBytes, randomInt, scrypt as _scrypt, timingSafeEqual } from "crypto"
import { WORDS_FR } from "./wordlist-fr.ts"
import { promisify } from "util"

const scrypt = promisify(_scrypt)

// scrypt-based hashing using Node's stdlib — no external bcrypt/argon dependency,
// which keeps the self-hosted Docker image small. Format: scrypt$<saltHex>$<hashHex>
export async function hashPassphrase(passphrase: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scrypt(passphrase.normalize("NFKC"), salt, 64)) as Buffer
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`
}

export async function verifyPassphrase(passphrase: string, stored: string): Promise<boolean> {
  const parts = stored.split("$")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false
  const salt = Buffer.from(parts[1], "hex")
  const expected = Buffer.from(parts[2], "hex")
  const derived = (await scrypt(passphrase.normalize("NFKC"), salt, 64)) as Buffer
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}

/** The list a passphrase is drawn from. Re-exported so tests can measure it. */
export const PASSPHRASE_WORDS = WORDS_FR

const PASSPHRASE_LENGTH = 4

/**
 * How much a generated passphrase is actually worth, from the real list size.
 *
 * Derived rather than written down, because the number that matters is a
 * property of the wordlist and a constant would go stale the moment the list
 * changes. tests/passphrase.test.ts asserts it stays above 40 bits.
 */
export function passphraseBits(): number {
  let combinations = 1
  for (let i = 0; i < PASSPHRASE_LENGTH; i++) combinations *= PASSPHRASE_WORDS.length - i
  return Math.log2(combinations)
}

/**
 * Generates a 4-word passphrase like "console-port-cache-jeton".
 *
 * Uses `randomInt` from node:crypto, NOT Math.random. Math.random is
 * xorshift128+: fast, seeded per context, and predictable from enough observed
 * output. That is fine for shuffling and wrong for minting a credential — and
 * this function mints every student's only credential.
 */
export function generatePassphrase(): string {
  const words: string[] = []
  while (words.length < PASSPHRASE_LENGTH) {
    const w = PASSPHRASE_WORDS[randomInt(PASSPHRASE_WORDS.length)]
    if (!words.includes(w)) words.push(w)
  }
  return words.join("-")
}

/** Opaque, URL-safe session token. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url")
}
