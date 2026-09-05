import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto"
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

const WORDS = [
  "console", "port", "cache", "jeton", "orage", "cobalt", "lynx", "ardoise",
  "script", "boucle", "cookie", "paquet", "noyau", "octet", "trame", "pixel",
  "vecteur", "matrice", "signal", "brume", "silex", "granit", "cyan", "ambre",
  "nord", "delta", "sigma", "zenith", "havre", "prisme", "quartz", "ecran",
  "modem", "relais", "tunnel", "phare", "socle", "rouage", "givre", "braise",
]

/** Generates a 4-word passphrase like "console-port-cache-jeton". */
export function generatePassphrase(): string {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)]
  const words: string[] = []
  while (words.length < 4) {
    const w = pick()
    if (!words.includes(w)) words.push(w)
  }
  return words.join("-")
}

/** Opaque, URL-safe session token. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url")
}
