// Où les secrets du site sont réellement posés.
//
// Onze secrets de la chasse avaient un indice complet, des points, une
// difficulté… et rien à trouver : leur `location` disait encore « À
// IMPLÉMENTER ». Mesuré le 2026-09-08, ils valaient 285 points, un cinquième
// du barème, et un joueur en détenait dix — parce qu'ils n'étaient atteignables
// que par la feuille de réponses publiée avec le dépôt, jamais par le jeu.
//
// Ce module les pose. La règle qui le structure : ==le code ne s'écrit jamais
// dans le dépôt==. Une page demande « le secret posé à tel endroit » par un
// nom d'emplacement, et c'est la base qui répond. Publier le code dans le
// dépôt reviendrait à republier ce que le pipeline privé retire.
import { query } from "./db.ts"

/** Les emplacements que le site sait poser. Un secret par emplacement. */
export const PLACEMENT_SLUGS = [
  "hidden-css",     // texte masqué en CSS, ressort à la sélection
  "zero-width",     // caractères de largeur nulle dans un paragraphe
  "timing",         // affiché seulement quelques minutes après minuit
  "local-storage",  // clé leurre écrite par le navigateur
  "network",        // réponse d'une requête visible dans l'onglet Réseau
  "header",         // en-tête de réponse HTTP
  "backup-file",    // fichier de sauvegarde oublié à la racine
  "admin-path",     // chemin d'URL prévisible
  "base64",         // chaîne encodée, pas chiffrée
  "jwt",            // jeton dont la charge utile se lit sans clé
  "api-key",        // fausse clé laissée dans une configuration côté client
] as const

export type PlacementSlug = (typeof PLACEMENT_SLUGS)[number]

/**
 * Les codes posés, lus en base.
 *
 * Renvoie une entrée manquante plutôt qu'une erreur : un emplacement non
 * pourvu doit dégrader la page en silence, pas la faire tomber. Une chasse au
 * trésor n'est pas une dépendance critique.
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

// ── Les encodages, purs et testés ────────────────────────────────────────────

/** ZERO WIDTH SPACE et ZERO WIDTH NON-JOINER, écrits en échappement pour que
 * personne ne les « nettoie » par accident en relisant le fichier. */
const ZERO = "\u200B"
const ONE = "\u200C"

/** U+200B pour un 0, U+200C pour un 1 : invisible à l'œil, visible au copier-coller. */
export function encodeZeroWidth(code: string): string {
  return [...code]
    .map((c) => c.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("")
    .replace(/0/g, ZERO)
    .replace(/1/g, ONE)
}

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

/** Base64 : un encodage, pas un chiffrement — c'est tout ce que le secret enseigne. */
export function encodeBase64(code: string): string {
  return Buffer.from(code, "utf8").toString("base64")
}

/**
 * Un JWT de démonstration.
 *
 * ==La signature est un texte fixe, jamais une vraie signature== : rien ici ne
 * doit être vérifiable, et surtout pas avec une clé du site. Le secret enseigne
 * qu'une charge utile de JWT se lit sans aucune clé, pas qu'on peut en forger.
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

/** Une fausse clé d'API. Jamais une vraie : c'est la faille qu'on illustre. */
export function fakeApiKey(code: string): string {
  return `sk_demo_${code.toLowerCase().replace(/-/g, "_")}_cette_cle_ne_sert_a_rien`
}
