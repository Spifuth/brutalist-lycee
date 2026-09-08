// Le format des secrets privés — celui que le dépôt ne voit jamais.
//
// Pourquoi ce fichier existe : jusqu'ici tous les codes de la chasse vivaient
// dans `db/seeds/secrets.ts`, donc dans un dépôt public dont le guide de
// contribution donne lui-même l'adresse. La feuille de réponses était publiée
// avec le jeu. Les nouveaux secrets passent désormais par un YAML gitignoré,
// que ce module lit.
//
// Pourquoi un parseur maison plutôt qu'une dépendance : le fichier est édité à
// la main, entre deux cours, par quelqu'un qui n'écrit pas du YAML tous les
// jours. La panne à traiter n'est pas un cas tordu de la spécification YAML,
// c'est un deux-points dans une phrase française non quotée. On accepte donc
// un sous-ensemble volontairement étroit et on refuse tout le reste **avec un
// numéro de ligne**, ce qu'une bibliothèque généraliste ne fait pas mieux ici.

import { familyOf, type SecretDifficulty } from "./secret-taxonomy.ts"

export const POINTS_BY_DIFFICULTY: Record<SecretDifficulty, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
  insane: 50,
}

/** Ce que voit l'élève quand il a trouvé : la réponse était le code lui-même. */
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

/** Enlève les accents et la ponctuation pour comparer des mots, pas des octets. */
function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** `true` si la suite de mots `needle` apparaît telle quelle dans `haystack`. */
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
    // On lit jusqu'au guillemet fermant ; ce qui suit est un commentaire.
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
 * Lit le YAML privé et rend des secrets validés, ou jette.
 *
 * Les refus sont volontairement stricts : ce fichier alimente directement la
 * base de production d'un jeu joué en classe, et une erreur silencieuse y
 * coûte plus cher qu'un import qui s'arrête.
 */
export interface ParseOptions {
  /**
   * Tolère un nom qui contient sa réponse, en le signalant au lieu de refuser.
   *
   * N'existe que pour un cas : réimporter un export de la base d'avant la
   * règle. 38 des 160 premiers secrets ont la réponse écrite dans leur nom, et
   * `pnpm secrets:export` les ressort tels quels — sans cette porte, un
   * aller-retour export → import serait impossible tant qu'ils ne sont pas
   * réécrits. À ne jamais utiliser pour du contenu neuf.
   */
  lenientNames?: boolean
}

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

    // La règle que l'audit du 2026-09-08 a tirée des 160 premiers secrets :
    // 38 d'entre eux avaient la réponse écrite dans leur propre nom, donc il
    // n'y avait rien à chercher. L'indice, lui, n'est pas contrôlé : il a le
    // droit d'être proche, c'est son rôle.
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
