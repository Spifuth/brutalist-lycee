// How long a password really holds, with no server involved.
//
// The honest part of this file is what it refuses to do: multiply the
// alphabet size by the length and call the result security. "P@ssw0rd!" has
// 9 characters over a 94-character alphabet — 5.7e17 combinations on paper,
// and about a hundred tries in practice, because every cracking tool starts
// from a wordlist and applies the obvious substitutions before it brute-forces
// anything. A page that shows the paper number teaches the opposite of the
// truth, so the model here always takes the CHEAPEST route an attacker has:
//
//     guesses = min(brute force, the patterns we recognise)
//
// Nothing here touches the network. `analyse()` runs in the browser and the
// password never leaves it.

export type WeaknessKind =
  | "commun"
  | "mot-du-dictionnaire"
  | "suite-clavier"
  | "suite"
  | "repetition"
  | "annee"
  | "substitution"
  | "court"

export interface Weakness {
  kind: WeaknessKind
  detail: string
}

export interface Analysis {
  length: number
  /** Size of the character alphabet the password draws from. */
  alphabet: number
  /** Naive strength: what length × alphabet claims. Shown to be contradicted. */
  entropyBits: number
  /** What the cheapest attack actually costs, in bits. */
  effectiveBits: number
  /** What the cheapest attack actually costs, in tries. */
  guesses: number
  weaknesses: Weakness[]
  verdict: "catastrophique" | "faible" | "moyen" | "solide" | "excellent"
}

export interface Attacker {
  key: string
  label: string
  detail: string
  guessesPerSecond: number
}

export const ATTACKERS: Attacker[] = [
  {
    key: "site",
    label: "Un site qui se défend",
    detail: "Essais un par un contre un serveur qui ralentit après quelques erreurs.",
    guessesPerSecond: 1e2,
  },
  {
    key: "gpu",
    label: "Une carte graphique de gamer",
    detail: "La base de mots de passe a fuité : l'attaquant essaie chez lui, hors ligne.",
    guessesPerSecond: 1e10,
  },
  {
    key: "ferme",
    label: "Une ferme de calcul louée",
    detail: "Quelques centaines d'euros de location dans le cloud.",
    guessesPerSecond: 1e12,
  },
]

/**
 * The dictionary size a real attacker is assumed to work from.
 *
 * NOT the length of FR_WORDS below: that list only has to be big enough to
 * *recognise* a word. Pricing four words at (our own short list)^4 would
 * invent a weakness that is an artefact of this file being small, and would
 * make passphrases look breakable when they are not.
 */
export const ASSUMED_DICTIONARY_SIZE = 30_000

/** Guesses above this are meaningless; the cap only keeps the maths finite. */
const MAX_BITS = 512

// The passwords that top every leaked-credential list, most common first.
const COMMON = [
  "123456", "password", "azerty", "123456789", "12345678", "motdepasse", "qwerty", "111111",
  "1234567", "azertyuiop", "000000", "iloveyou", "soleil", "1234", "12345", "loulou", "chouchou",
  "doudou", "bonjour", "coucou", "marseille", "nicolas", "camille", "jetaime", "administrateur",
  "admin", "root", "toor", "welcome", "monkey", "dragon", "football", "baseball", "abc123",
  "letmein", "master", "shadow", "superman", "batman", "trustno1", "sunshine", "princess",
  "chocolat", "liverpool", "chelsea", "arsenal", "psg", "juventus", "barcelona", "starwars",
  "pokemon", "minecraft", "fortnite", "naruto", "manchester", "michael", "jennifer", "thomas",
  "jessica", "charlie", "daniel", "hannah", "hunter", "ranger", "buster", "harley", "pepper",
  "maggie", "ginger", "cookie", "jordan", "tigger", "purple", "orange", "banana", "computer",
  "internet", "samsung", "google", "facebook", "instagram", "snapchat", "tiktok", "netflix",
  "portable", "ordinateur", "vacances", "anniversaire", "maison", "famille", "amour", "liberte",
  "bienvenue", "secret", "inconnu", "cheval", "chaton", "chien", "lapin", "papillon",
]

// Enough French to recognise a word. Includes the forty words this site's own
// generatePassphrase() draws from (lib/crypto.ts), so a student can paste the
// passphrase the site gave them and get a sensible reading.
const FR_WORDS = new Set([
  // lib/crypto.ts's generator
  "console", "port", "cache", "jeton", "orage", "cobalt", "lynx", "ardoise",
  "script", "boucle", "cookie", "paquet", "noyau", "octet", "trame", "pixel",
  "vecteur", "matrice", "signal", "brume", "silex", "granit", "cyan", "ambre",
  "nord", "delta", "sigma", "zenith", "havre", "prisme", "quartz", "ecran",
  "modem", "relais", "tunnel", "phare", "socle", "rouage", "givre", "braise",
  // ordinary vocabulary
  "chateau", "maison", "voiture", "soleil", "lune", "etoile", "montagne", "riviere",
  "arbre", "fleur", "jardin", "ecole", "college", "lycee", "cahier", "stylo",
  "table", "chaise", "fenetre", "porte", "clavier", "souris", "telephone", "musique",
  "guitare", "piano", "chanson", "cinema", "livre", "histoire", "science", "nombre",
  "chat", "chien", "cheval", "oiseau", "poisson", "renard", "loup", "ours",
  "orange", "citron", "fraise", "banane", "chocolat", "fromage", "baguette", "gateau",
  "rouge", "bleu", "vert", "jaune", "violet", "blanc", "noir", "gris",
  "hiver", "printemps", "automne", "vacances", "voyage", "avion", "train", "bateau",
  "amour", "amitie", "famille", "liberte", "courage", "silence", "lumiere", "ombre",
  "papillon", "abeille", "fourmi", "araignee", "dauphin", "baleine", "tortue", "serpent",
  "nuage", "pluie", "neige", "vent", "tempete", "foudre", "sable", "ocean",
])

// Split by kind: a hand walking across the keys is a different mistake from
// counting, and the page names them differently.
const LAYOUT_ROWS = ["azertyuiop", "qsdfghjklm", "wxcvbn", "qwertyuiop", "asdfghjkl", "zxcvbnm"]
const SEQUENCE_ROWS = ["1234567890", "0987654321", "abcdefghijklmnopqrstuvwxyz"]

const LEET: Record<string, string> = {
  "4": "a", "@": "a", "8": "b", "3": "e", "1": "l", "!": "i", "0": "o",
  "5": "s", "$": "s", "7": "t", "+": "t", "9": "g", "2": "z",
}

function deLeet(s: string): string {
  return [...s].map((c) => LEET[c] ?? c).join("")
}

/** Strip accents so "château" matches "chateau" in the word list. */
function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function alphabetSize(pw: string): number {
  let n = 0
  if (/[a-z]/.test(pw)) n += 26
  if (/[A-Z]/.test(pw)) n += 26
  if (/[0-9]/.test(pw)) n += 10
  if (/[^a-zA-Z0-9]/.test(pw)) n += 33
  // Anything outside ASCII (accents, emoji) opens a much wider space, but an
  // attacker who knows it is there only has to try that wider space.
  if (/[^\x00-\x7F]/.test(pw)) n += 100
  return Math.max(n, 1)
}

function bits(guesses: number): number {
  if (guesses <= 1) return 0
  return Math.min(Math.log2(guesses), MAX_BITS)
}

function fromBits(b: number): number {
  return Math.pow(2, Math.min(b, MAX_BITS))
}

/** What a trailing "2024" or "!" adds for an attacker who expects one. */
function suffixCost(suffix: string): { cost: number; year: boolean } {
  if (!suffix) return { cost: 1, year: false }
  if (/^(19|20)\d{2}$/.test(suffix)) return { cost: 100, year: true }
  if (/^\d+$/.test(suffix)) return { cost: Math.min(Math.pow(10, suffix.length), 1e4), year: false }
  return { cost: Math.min(Math.pow(33, suffix.length), 1e4), year: false }
}

function isRunOfOneChar(pw: string): boolean {
  return pw.length >= 4 && new Set([...pw]).size === 1
}

function keyboardRun(s: string): { run: string; kind: "suite-clavier" | "suite" } | null {
  if (s.length < 4) return null
  const groups: [string[], "suite-clavier" | "suite"][] = [
    [LAYOUT_ROWS, "suite-clavier"],
    [SEQUENCE_ROWS, "suite"],
  ]
  for (const [rows, kind] of groups) {
    for (const row of rows) {
      for (let i = 0; i + 4 <= row.length; i++) {
        for (let len = row.length - i; len >= 4; len--) {
          const run = row.slice(i, i + len)
          if (s.includes(run)) return { run, kind }
        }
      }
    }
  }
  return null
}

export function analyse(raw: string): Analysis {
  const pw = raw ?? ""
  const length = pw.length
  const alphabet = alphabetSize(pw)
  const bruteForceBits = length === 0 ? 0 : Math.min(length * Math.log2(alphabet), MAX_BITS)

  const folded = fold(pw.toLowerCase())
  // Split BEFORE de-leeting. Running the substitution first turns the "2024"
  // of "chateau2024" into "zoza" and the whole password stops looking like a
  // word plus a year — the two weaknesses that actually price it disappear,
  // and it gets rated as if it were random.
  const match = folded.match(/^(.*?)([\d\W_]*)$/)
  let core = match?.[1] ?? folded
  let suffix = match?.[2] ?? ""
  // An all-digit password has no "core" to strip a suffix from.
  if (!core) {
    core = folded
    suffix = ""
  }
  const coreDeLeet = deLeet(core)
  const { cost: suffixMultiplier, year } = suffixCost(suffix)

  const known = (w: string) => COMMON.indexOf(w) !== -1 || FR_WORDS.has(w)

  const weaknesses: Weakness[] = []
  const candidates: number[] = [fromBits(bruteForceBits)]

  if (length > 0 && length < 10) {
    weaknesses.push({ kind: "court", detail: `${length} caractères : la longueur est ce qui compte le plus.` })
  }
  // Only worth saying when the substitution failed to hide anything: telling
  // someone their random string "contains substitutions" is noise.
  if (coreDeLeet !== core && known(coreDeLeet)) {
    weaknesses.push({
      kind: "substitution",
      detail: `Remplacer des lettres par @, 0 ou 3 ne cache rien : sous « ${core} » il y a « ${coreDeLeet} », et les outils de cassage essaient ces substitutions d'office.`,
    })
  }
  if (year) {
    weaknesses.push({ kind: "annee", detail: `« ${suffix} » est une année : une centaine de possibilités, pas dix mille.` })
  }

  const commonIndex = COMMON.indexOf(core) !== -1 ? COMMON.indexOf(core) : COMMON.indexOf(coreDeLeet)
  if (commonIndex !== -1) {
    weaknesses.push({
      kind: "commun",
      detail: `« ${COMMON[commonIndex]} » fait partie des mots de passe les plus utilisés au monde.`,
    })
    candidates.push((commonIndex + 1) * suffixMultiplier)
  }

  if (isRunOfOneChar(pw)) {
    weaknesses.push({ kind: "repetition", detail: "Le même caractère répété ne fabrique aucune difficulté." })
    candidates.push(alphabet * length)
  }

  const run = keyboardRun(folded)
  if (run) {
    weaknesses.push({
      kind: run.kind,
      detail: `« ${run.run} » est une suite : elle se tape sans réfléchir, elle se devine pareil.`,
    })
    candidates.push(5000 * Math.max(length, 1))
  }

  // Words, either separated (the shape this site hands out: "orage-cobalt-…")
  // or a single word with a suffix.
  const tokens = folded.split(/[-_.\s,]+/).filter(Boolean)
  const isWord = (t: string) => {
    const bare = t.replace(/[\d\W_]+$/, "")
    return FR_WORDS.has(bare) || FR_WORDS.has(deLeet(bare))
  }
  const wordTokens = tokens.filter(isWord)
  if (tokens.length >= 2 && wordTokens.length === tokens.length) {
    weaknesses.push({
      kind: "mot-du-dictionnaire",
      detail: `${tokens.length} mots du dictionnaire — et c'est exactement ce qu'il faut faire : chaque mot ajouté multiplie le travail de l'attaquant.`,
    })
    candidates.push(Math.pow(ASSUMED_DICTIONARY_SIZE, tokens.length))
  } else if (tokens.length === 1 && (FR_WORDS.has(core) || FR_WORDS.has(coreDeLeet))) {
    weaknesses.push({
      kind: "mot-du-dictionnaire",
      detail: `« ${core} » est un mot du dictionnaire : un seul ne suffit jamais.`,
    })
    candidates.push(ASSUMED_DICTIONARY_SIZE * suffixMultiplier)
  }

  // The attacker takes the cheapest route available to them.
  const guesses = length === 0 ? 0 : Math.max(1, Math.min(...candidates))
  const effectiveBits = bits(guesses)

  let verdict: Analysis["verdict"] = "excellent"
  if (length === 0 || effectiveBits < 22) verdict = "catastrophique"
  else if (effectiveBits < 36) verdict = "faible"
  else if (effectiveBits < 50) verdict = "moyen"
  else if (effectiveBits < 70) verdict = "solide"

  return {
    length,
    alphabet,
    entropyBits: bruteForceBits,
    effectiveBits,
    guesses,
    weaknesses,
    verdict,
  }
}

export function crackSeconds(a: Analysis, guessesPerSecond: number): number {
  if (guessesPerSecond <= 0) return 0
  const s = a.guesses / guessesPerSecond
  return Number.isFinite(s) && s > 0 ? s : 0
}

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY
/** Roughly 13.8 billion years, in seconds. */
const UNIVERSE = 4.35e17

export function humaniseDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 1) return "instantané"
  if (seconds >= UNIVERSE) return "plus longtemps que l'âge de l'univers"
  const round = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n))
  const plural = (n: number, one: string, many: string) => `${round(n)} ${round(n) >= 2 ? many : one}`
  if (seconds < MINUTE) return plural(seconds, "seconde", "secondes")
  if (seconds < HOUR) return plural(seconds / MINUTE, "minute", "minutes")
  if (seconds < DAY) return plural(seconds / HOUR, "heure", "heures")
  if (seconds < MONTH) return plural(seconds / DAY, "jour", "jours")
  if (seconds < YEAR) return plural(seconds / MONTH, "mois", "mois")
  const years = seconds / YEAR
  if (years < 1e3) return plural(years, "an", "ans")
  if (years < 1e6) return `${Math.round(years / 1e3)} milliers d'années`
  if (years < 1e9) return `${Math.round(years / 1e6)} millions d'années`
  return `${(years / 1e9).toPrecision(2)} milliards d'années`
}
