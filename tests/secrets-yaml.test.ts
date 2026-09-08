// The private-YAML pipeline, tested at its only interesting layer: the parser
// and its refusals.
//
// Why a parser at all rather than a YAML dependency: the file this reads is
// gitignored and edited by hand between two classes, so the failure that
// matters is a human one — a colon inside an unquoted French sentence, a
// duplicate code, a category nobody mapped. Every one of those has to come
// back as a line number and a sentence, not as a silent `undefined`.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { parseSecretsYaml, POINTS_BY_DIFFICULTY } from "../lib/secrets-yaml.ts"

const one = `secrets:
  - code: STUXNET
    name: "Le ver qui a détruit des machines réelles"
    hint: "En 2010, un programme a fait tourner des centrifugeuses trop vite."
    category: CYBERSECURITY-HISTORY
    difficulty: insane
`

test("un secret minimal est lu, et ses points viennent de sa difficulté", () => {
  const [s] = parseSecretsYaml(one)
  assert.equal(s.code, "STUXNET")
  assert.equal(s.category, "CYBERSECURITY-HISTORY")
  assert.equal(s.difficulty, "insane")
  assert.equal(s.points, POINTS_BY_DIFFICULTY.insane)
  assert.match(s.location, /Devinette/)
  assert.deepEqual(s.aliases, [])
})

test("les deux-points et les apostrophes d'une phrase française survivent aux guillemets", () => {
  const [s] = parseSecretsYaml(`secrets:
  - code: CESAR
    name: "Le chiffrement qui décale l'alphabet"
    hint: "Trois rangs suffisaient à un général : aujourd'hui on le casse de tête."
    category: ENCODING
    difficulty: easy
`)
  assert.equal(s.name, "Le chiffrement qui décale l'alphabet")
  assert.match(s.hint, /général : aujourd'hui/)
})

test("une valeur non quotée qui contient « : » est refusée avec son numéro de ligne", () => {
  assert.throws(
    () => parseSecretsYaml(`secrets:
  - code: CESAR
    name: Le chiffre : celui de Rome
    hint: "Trois rangs."
    category: ENCODING
    difficulty: easy
`),
    /ligne 3/,
  )
})

test("les alias sont lus et normalisés", () => {
  const [s] = parseSecretsYaml(`secrets:
  - code: RICKROLL
    name: "La chanson piège de 1987"
    hint: "Un lien qui promet autre chose."
    category: INTERNET-CULTURE
    difficulty: easy
    aliases: [NEVER-GONNA-GIVE, never-gonna-give-you-up]
`)
  assert.deepEqual(s.aliases, ["NEVER-GONNA-GIVE", "NEVER-GONNA-GIVE-YOU-UP"])
})

test("un code en double est refusé", () => {
  assert.throws(() => parseSecretsYaml(one + one.replace("secrets:\n", "")), /STUXNET/)
})

test("un alias qui collisionne avec un code est refusé", () => {
  assert.throws(
    () => parseSecretsYaml(`secrets:
  - code: TOR
    name: "Le réseau à trois couches"
    hint: "Comme un oignon."
    category: CYBERSECURITY
    difficulty: hard
    aliases: [TOR]
`),
    /TOR/,
  )
})

test("une catégorie inconnue est refusée — sinon elle tomberait dans AUTRE en silence", () => {
  assert.throws(
    () => parseSecretsYaml(`secrets:
  - code: TRUC
    name: "Un truc"
    hint: "Un indice."
    category: PATATE
    difficulty: easy
`),
    /PATATE/,
  )
})

test("une difficulté inconnue est refusée", () => {
  assert.throws(() => parseSecretsYaml(one.replace("insane", "impossible")), /impossible/)
})

test("un code non typable est refusé", () => {
  assert.throws(() => parseSecretsYaml(one.replace("STUXNET", "Stux net!")), /Stux net!/)
})

// La règle de l'audit du 2026-09-08, appliquée par la machine plutôt que par la
// bonne volonté : 38 des 160 premiers secrets avaient la réponse écrite dans
// leur propre nom, donc il n'y avait rien à chercher.
test("un nom qui contient la réponse est refusé", () => {
  assert.throws(
    () => parseSecretsYaml(`secrets:
  - code: HOLLOW-KNIGHT
    name: "Jeu Hollow Knight indie"
    hint: "Chevalier, royaume creux."
    category: GAMING
    difficulty: easy
`),
    /nom/i,
  )
})

test("un champ obligatoire manquant est signalé par son nom et sa ligne", () => {
  assert.throws(
    () => parseSecretsYaml(`secrets:
  - code: TRUC
    name: "Un truc"
    category: GAMING
    difficulty: easy
`),
    /hint/,
  )
})

test("les points explicites l'emportent sur le barème", () => {
  const [s] = parseSecretsYaml(one.replace("difficulty: insane", "difficulty: insane\n    points: 69"))
  assert.equal(s.points, 69)
})

// Le modèle versionné doit rester lisible par le parseur : c'est le seul
// fichier de cette famille que le dépôt voit, donc le seul qu'un test peut
// vérifier. S'il cesse d'être valide, la documentation ment.
test("db/secrets.example.yml est valide et sert d'exemple aux alias", () => {
  const parsed = parseSecretsYaml(readFileSync("db/secrets.example.yml", "utf8"))
  assert.ok(parsed.length >= 4, "le modèle doit montrer plusieurs cas")
  assert.ok(
    parsed.some((s) => s.aliases.length > 0),
    "le modèle doit montrer au moins un secret à plusieurs réponses acceptées",
  )
})

test("--lenient tolère un nom hérité qui contient sa réponse, et rien d'autre", () => {
  const legacy = `secrets:
  - code: HOLLOW-KNIGHT
    name: "Jeu Hollow Knight indie"
    hint: "Chevalier, royaume creux."
    category: GAMING
    difficulty: easy
`
  const [s] = parseSecretsYaml(legacy, { lenientNames: true })
  assert.equal(s.code, "HOLLOW-KNIGHT")
  // La tolérance ne s'étend pas aux autres refus : une catégorie inconnue
  // reste une erreur, sinon la porte de sortie deviendrait une porte d'entrée.
  assert.throws(() => parseSecretsYaml(legacy.replace("GAMING", "PATATE"), { lenientNames: true }), /PATATE/)
})
