// The load-bearing test here is "les id de query existent dans le template".
// GitHub silently ignores unknown query parameters on an issue form: rename a
// field id in .github/ISSUE_TEMPLATE and the prefill stops working with no
// error anywhere — the student just gets an empty form. This turns that mute
// failure into a red CI.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  KINDS,
  specFor,
  buildDiscordMessage,
  buildIssueUrl,
  titleTagFor,
  DISCORD_LIMIT,
  URL_BUDGET,
  TRUNCATION_MARK,
  URL_TRUNCATION_MARK,
} from "../lib/bug-report.ts"

const templateText = (file: string) => readFileSync(`.github/ISSUE_TEMPLATE/${file}`, "utf8")

test("chaque champ correspond à un id du template visé", () => {
  for (const spec of KINDS) {
    const raw = templateText(spec.template)
    for (const field of spec.fields) {
      const declared = new RegExp(`^\\s+id:\\s*${field.id}\\s*$`, "m").test(raw)
      assert.ok(declared, `${spec.template} n'a pas de champ \`id: ${field.id}\` — le pré-remplissage sera ignoré sans erreur`)
    }
  }
})

test("chaque option de liste correspond mot pour mot à une option du template", () => {
  for (const spec of KINDS) {
    const raw = templateText(spec.template)
    for (const field of spec.fields) {
      for (const option of field.options ?? []) {
        const present = raw.includes(`- ${option}`) || raw.includes(`- "${option}"`)
        assert.ok(present, `${spec.template} / ${field.id} : l'option « ${option} » n'existe pas telle quelle`)
      }
    }
  }
})

test("le message Discord contient les champs remplis et saute les vides", () => {
  const msg = buildDiscordMessage({
    kind: "bug",
    fields: { quoi: "Le bouton ne fait rien", reproduire: "1. aller sur /chasse", attendu: "un message", erreur: "", ou: "Sur le site en ligne" },
    pseudo: "Okadotwav",
  })
  assert.match(msg, /Le bouton ne fait rien/)
  assert.match(msg, /1\. aller sur \/chasse/)
  assert.match(msg, /Okadotwav/)
  assert.doesNotMatch(msg, /Message d'erreur/, "un champ vide ne doit pas laisser un titre orphelin")
})

test("le message Discord est coupé à la limite de Discord", () => {
  const msg = buildDiscordMessage({
    kind: "bug",
    fields: { quoi: "x".repeat(5000), reproduire: "1.", attendu: "rien", ou: "Sur le site en ligne" },
  })
  assert.ok(msg.length <= DISCORD_LIMIT, `${msg.length} caractères — Discord refuse au-delà de ${DISCORD_LIMIT}`)
  assert.ok(msg.includes(TRUNCATION_MARK), "une coupure silencieuse fait perdre du texte sans que personne le sache")
})

test("l'URL vise le bon template pour chaque type", () => {
  for (const spec of KINDS) {
    const url = buildIssueUrl({ kind: spec.kind, fields: { [spec.fields[0].id]: "test" } })
    assert.ok(url.includes(`template=${spec.template}`), `${spec.kind} ne vise pas ${spec.template}`)
  }
})

// GitHub always requires a title. Without one, the "already filled in" issue
// that /bug-report promises opens with an empty, mandatory title — the very
// first box the student sees is an error. This test fails if buildIssueUrl
// stops sending `title`, or if the tag no longer matches the type requested.
test("chaque URL porte un titre non vide qui commence par le tag du type", () => {
  for (const spec of KINDS) {
    const firstRequired = spec.fields.find((f) => f.required) ?? spec.fields[0]
    const url = buildIssueUrl({ kind: spec.kind, fields: { [firstRequired.id]: "un souci précis" } })
    const title = new URL(url).searchParams.get("title")
    assert.ok(title, `${spec.kind} : pas de titre — GitHub va bloquer sur une case vide et obligatoire`)
    assert.ok(
      title!.startsWith(titleTagFor(spec.kind)),
      `${spec.kind} : le titre « ${title} » ne commence pas par ${titleTagFor(spec.kind)}`,
    )
  }
})

test("le résumé du titre est coupé, pas l'URL entière", () => {
  const url = buildIssueUrl({ kind: "bug", fields: { quoi: "x".repeat(500) } })
  const title = new URL(url).searchParams.get("title")!
  // Tag + space + summary cut to ~60 characters: plenty of room under 500.
  assert.ok(title.length < 100, `titre de ${title.length} caractères — le résumé ne semble pas coupé`)
  assert.ok(title.startsWith(titleTagFor("bug")))
})

// Accented text: é, à, œ, —, « » weigh up to 3 bytes — so up to 9 characters
// once percent-encoded — unlike a pure-ASCII field, which never really puts
// the guarantee to the test.
const accents =
  "Erreur détectée à l'école : « le résultat n'est pas correct » — on réessaye, mais l'œuvre reste bloquée. ".repeat(
    200,
  )

test("l'URL respecte un budget minuscule, ou échoue fort — jamais un dépassement silencieux", () => {
  // At the production budget (6000) and with the current KINDS fields, no
  // black-box test can tell the fixed trimming loop from the old, broken one:
  // even the old version (which left the loop on the length of the remaining
  // field, not on the length of the URL actually rendered) never goes past
  // 6000 characters with today's fields — measured at 5952/6000. A tiny budget
  // forces the loop to actually trim and puts its exit condition to the test:
  // it is the only black-box way to tell the two implementations apart.
  const bugSpec = specFor("bug")
  const fields = Object.fromEntries(bugSpec.fields.map((field) => [field.id, accents]))
  const smallBudget = 400

  let url: string
  try {
    url = buildIssueUrl({ kind: "bug", fields }, smallBudget)
  } catch (err) {
    assert.match(
      (err as Error).message,
      /impossible de tenir sous/,
      "si buildIssueUrl échoue, ce doit être son erreur explicite, jamais un plantage inattendu",
    )
    return
  }
  assert.ok(
    url.length <= smallBudget,
    `${url.length} caractères pour un budget de ${smallBudget} — la garantie n'est pas tenue`,
  )
})

test("l'URL reste sous le budget de production, en tronquant le plus long champ", () => {
  const bugSpec = specFor("bug")
  const fields = Object.fromEntries(bugSpec.fields.map((field) => [field.id, accents]))
  fields.quoi = "court"

  // No second argument: checks that the `budget` parameter stays optional and
  // that the one-argument call (the one the /bug-report page makes) keeps
  // working unchanged.
  const url = buildIssueUrl({ kind: "bug", fields })
  assert.ok(url.length <= URL_BUDGET, `${url.length} caractères — au-delà, le navigateur ou GitHub coupe`)
  assert.ok(url.includes("quoi=court"), "le champ court ne doit pas être sacrifié")

  // A field trimmed here is trimmed *inside the issue URL*: it must carry
  // URL_TRUNCATION_MARK, never TRUNCATION_MARK — that one promises that « la
  // suite est dans l'issue », and here the issue is precisely what is being
  // built, so there is nowhere for the rest to exist.
  const truncatedFields = [...new URL(url).searchParams.entries()].filter(([, v]) =>
    v.includes(URL_TRUNCATION_MARK),
  )
  assert.ok(
    truncatedFields.length > 0,
    "ce test suppose qu'au moins un champ est effectivement rogné au budget de production — sinon il ne prouve rien",
  )
  for (const [, value] of new URL(url).searchParams.entries()) {
    assert.doesNotMatch(
      value,
      new RegExp(TRUNCATION_MARK.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      "le repère du message Discord n'a rien à faire dans un champ d'URL — il promet une suite qui n'existe pas ici",
    )
  }
})

test("un type inconnu échoue fort", () => {
  // @ts-expect-error — testing exactly the case TypeScript forbids
  assert.throws(() => specFor("chaussette"), /chaussette/)
})

// Extracts the field ids the YAML template marks `validations: required:
// true`. Splits on each top-level list item (`  - type: `) rather than pulling
// in a YAML parser: same regex approach as the tests above, no new dependency.
// Checkboxes (e.g. `verifs` in contenu.yml) carry no `validations:` block —
// their own `required: true` lives under `options:`, per item — so they never
// match here, which is intended: they are not prefillable fields.
function requiredFieldIds(raw: string): Set<string> {
  const ids = new Set<string>()
  for (const block of raw.split(/\n(?=  - type: )/)) {
    const idMatch = block.match(/^\s+id:\s*(\S+)\s*$/m)
    if (!idMatch) continue
    if (/validations:\s*\n\s*required:\s*true/.test(block)) ids.add(idMatch[1])
  }
  return ids
}

// The day a template gains a required field, the page goes on displaying
// « (facultatif) » unless KINDS is updated: the student skips the field, and
// GitHub blocks the submission on a box they were told to ignore. This test
// pins both directions — if a template becomes the source of truth and this
// test breaks, fix KINDS, not the templates.
test("le statut requis d'un champ est identique dans le template et dans KINDS", () => {
  for (const spec of KINDS) {
    const raw = templateText(spec.template)
    const templateRequired = requiredFieldIds(raw)
    const kindsRequired = new Set(spec.fields.filter((f) => f.required).map((f) => f.id))

    for (const id of templateRequired) {
      const field = spec.fields.find((f) => f.id === id)
      assert.ok(
        field,
        `${spec.template} : le champ requis \`${id}\` n'existe pas dans KINDS — la page ne le proposera jamais et GitHub bloquera la soumission dessus`,
      )
      assert.ok(
        field!.required,
        `${spec.template} / ${id} est requis dans le template mais marqué (facultatif) dans KINDS`,
      )
    }
    for (const id of kindsRequired) {
      assert.ok(
        templateRequired.has(id),
        `${spec.kind} / ${id} est marqué requis dans KINDS mais ${spec.template} ne l'exige plus`,
      )
    }
  }
})
