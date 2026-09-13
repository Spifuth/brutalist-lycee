// The private secrets format — the one the repository never sees.
//
// Why this file exists: until now every code in the hunt lived in
// `db/seeds/secrets.ts`, and therefore in a public repository whose own
// contributing guide gives out the address. The answer sheet was published
// together with the game. New secrets now go through a gitignored YAML file,
// which this module reads.
//
// Why a hand-written parser rather than a dependency: the file is edited by
// hand, between two lessons, by somebody who does not write YAML every day.
// The failure to handle is not some twisted corner of the YAML specification,
// it is a colon inside an unquoted French sentence. So this accepts a
// deliberately narrow subset and refuses everything else **with a line
// number**, which is the part a general-purpose library does no better here.

import { familyOf, type SecretDifficulty } from "./secret-taxonomy.ts"

export const POINTS_BY_DIFFICULTY: Record<SecretDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
  insane: 50,
}

/** What the student sees once found: the answer was the code itself. */
export const DEFAULT_LOCATION = "Devinette — la réponse est le code"

const CODE_RE = /^[A-Z0-9][A-Z0-9-]*$/
const REQUIRED = ["code", "name", "hint", "category", "difficulty"] as const

export interface SecretEntry {
  code: string
  name: string
  hint: string
  category: string
  difficulty: SecretDifficulty
  points: number
  location: string
  badgeSlug?: string
  aliases: string[]
}

class YamlError extends Error {
  constructor(line: number, message: string) {
    super(`ligne ${line} : ${message}`)
  }
}

/** Strips accents and punctuation so words get compared, not bytes. */
function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** `true` when the word sequence `needle` appears verbatim inside `haystack`. */
function containsSequence(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (needle.every((w, j) => haystack[i + j] === w)) return true
  }
  return false
}

function parseScalar(raw: string, line: number, key: string): string {
  const value = raw.trim()
  if (!value) throw new YamlError(line, `« ${key} » est vide.`)
  const quote = value[0]
  if (quote === '"' || quote === "'") {
    // Read up to the closing quote; whatever follows it is a comment.
    let out = ""
    let i = 1
    while (i < value.length) {
      const c = value[i]
      if (c === "\\" && quote === '"' && i + 1 < value.length) {
        out += value[i + 1]
        i += 2
        continue
      }
      if (c === quote) return out
      out += c
      i++
    }
    throw new YamlError(line, `guillemet non fermé sur « ${key} ».`)
  }
  if (value.includes(":")) {
    throw new YamlError(
      line,
      `« ${key} » contient un deux-points sans être entre guillemets. Écris : ${key}: "${value}"`,
    )
  }
  return value
}

function parseList(raw: string, line: number, key: string): string[] {
  const value = raw.trim()
  if (!value.startsWith("[") || !value.endsWith("]")) {
    throw new YamlError(line, `« ${key} » doit être une liste entre crochets, par exemple [A, B].`)
  }
  return value
    .slice(1, -1)
    .split(",")
    .map((v) => v.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
}

/**
 * Reads the private YAML and returns validated secrets, or throws.
 *
 * The refusals are strict on purpose: this file feeds straight into the
 * production database of a game played in class, and a silent mistake costs
 * more there than an import that stops.
 */
export interface ParseOptions {
  /**
   * Tolerates a name that contains its own answer, reporting it instead of
   * refusing.
   *
   * Exists for exactly one case: re-importing an export taken from the
   * database from before the rule. 37 of the first 160 secrets have the answer
   * written into their name, and `pnpm secrets:export` hands them back as they
   * are — without this door, an export -> import round trip would be
   * impossible until every one of them is rewritten. Never to be used for new
   * content.
   */
  lenientNames?: boolean
}

/** Throws a YamlError carrying the offending line number on the first problem; never returns a partial list. */
export function parseSecretsYaml(text: string, options: ParseOptions = {}): SecretEntry[] {
  const lines = text.split(/\r?\n/)
  const items: { fields: Record<string, string>; lines: Record<string, number>; start: number }[] = []
  let seenHeader = false
  let current: (typeof items)[number] | null = null

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) return

    if (!seenHeader) {
      if (rawLine.trim() !== "secrets:") {
        throw new YamlError(lineNo, `le fichier doit commencer par « secrets: », pas par « ${rawLine.trim()} ».`)
      }
      seenHeader = true
      return
    }

    const item = rawLine.match(/^\s{2}-\s+(\w+):\s*(.*)$/)
    if (item) {
      if (item[1] !== "code") throw new YamlError(lineNo, `un secret commence par « - code: », pas par « ${item[1]} ».`)
      current = { fields: {}, lines: {}, start: lineNo }
      items.push(current)
      current.fields.code = parseScalar(item[2], lineNo, "code")
      current.lines.code = lineNo
      return
    }

    const field = rawLine.match(/^\s{4}(\w+):\s*(.*)$/)
    if (field && current) {
      const [, key, value] = field
      if (key in current.fields) throw new YamlError(lineNo, `« ${key} » est renseigné deux fois.`)
      current.fields[key] = key === "aliases" ? parseList(value, lineNo, key).join(",") : parseScalar(value, lineNo, key)
      current.lines[key] = lineNo
      return
    }

    throw new YamlError(lineNo, `ligne non reconnue : « ${rawLine.trim()} ». Indente de 2 espaces pour « - code: », de 4 pour les autres champs.`)
  })

  const seen = new Map<string, number>()
  const entries: SecretEntry[] = []
  const leniently: string[] = []

  for (const item of items) {
    const at = (key: string) => item.lines[key] ?? item.start
    for (const key of REQUIRED) {
      if (!item.fields[key]) throw new YamlError(item.start, `« ${key} » manque sur ce secret.`)
    }

    const code = item.fields.code.toUpperCase()
    if (!CODE_RE.test(code)) {
      throw new YamlError(at("code"), `« ${item.fields.code} » n'est pas un code typable (A-Z, 0-9 et tirets).`)
    }
    if (seen.has(code)) throw new YamlError(at("code"), `« ${code} » est déjà défini ligne ${seen.get(code)}.`)
    seen.set(code, at("code"))

    const difficulty = item.fields.difficulty as SecretDifficulty
    if (!(difficulty in POINTS_BY_DIFFICULTY)) {
      throw new YamlError(at("difficulty"), `difficulté « ${item.fields.difficulty} » inconnue (easy, medium, hard, insane).`)
    }

    const category = item.fields.category.toUpperCase()
    if (familyOf(category) === "AUTRE" && category !== "AUTRE") {
      throw new YamlError(
        at("category"),
        `catégorie « ${category} » inconnue de lib/secret-taxonomy.ts — elle tomberait dans « Autre » sans prévenir. Ajoute-la à BY_CATEGORY ou choisis-en une existante.`,
      )
    }

    // The rule the 2026-09-08 audit (bb9d250) drew out of the first 160
    // secrets: 37 of them had the answer written into their own name, so
    // there was nothing left to look for. The hint is deliberately not
    // checked — it is allowed to be close, that is its job.
    if (containsSequence(words(item.fields.name), words(code))) {
      const message = `le nom contient la réponse (« ${code} ») — il n'y aurait rien à chercher. Décris le secret sans le nommer.`
      if (!options.lenientNames) throw new YamlError(at("name"), message)
      leniently.push(code)
    }

    const aliases = (item.fields.aliases ? item.fields.aliases.split(",") : [])
      .map((a) => a.trim().toUpperCase())
      .filter(Boolean)
    for (const alias of aliases) {
      if (!CODE_RE.test(alias)) throw new YamlError(at("aliases"), `l'alias « ${alias} » n'est pas un code typable.`)
      if (alias === code) throw new YamlError(at("aliases"), `« ${alias} » est déjà le code du secret.`)
      if (seen.has(alias)) throw new YamlError(at("aliases"), `« ${alias} » est déjà utilisé ligne ${seen.get(alias)}.`)
      seen.set(alias, at("aliases"))
    }

    const points = item.fields.points ? Number(item.fields.points) : POINTS_BY_DIFFICULTY[difficulty]
    if (!Number.isInteger(points) || points <= 0) {
      throw new YamlError(at("points"), `« ${item.fields.points} » n'est pas un nombre de points valide.`)
    }

    entries.push({
      code,
      name: item.fields.name,
      hint: item.fields.hint,
      category,
      difficulty,
      points,
      location: item.fields.location ?? DEFAULT_LOCATION,
      badgeSlug: item.fields.badgeSlug,
      aliases,
    })
  }

  if (leniently.length > 0) {
    console.warn(
      `[secrets] ${leniently.length} nom(s) contiennent leur réponse et ont été tolérés : ${leniently.join(", ")}`,
    )
  }
  return entries
}
