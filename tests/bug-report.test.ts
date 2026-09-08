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

// GitHub exige toujours un titre. Sans lui, l'issue "déjà remplie" que promet
// la page /bug-report s'ouvre avec un titre vide et obligatoire — la toute
// première case que voit l'élève est une erreur. Ce test échoue si
// buildIssueUrl arrête d'envoyer `title`, ou si le tag ne correspond plus au
// type demandé.
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
  // Tag + espace + résumé coupé à ~60 caractères : large marge sous 500.
  assert.ok(title.length < 100, `titre de ${title.length} caractères — le résumé ne semble pas coupé`)
  assert.ok(title.startsWith(titleTagFor("bug")))
})

// Texte accentué : é, à, œ, —, « » pèsent jusqu'à 3 octets — donc jusqu'à 9
// caractères une fois encodés en % — contrairement à un champ pur ASCII qui
// ne met pas vraiment la garantie à l'épreuve.
const accents =
  "Erreur détectée à l'école : « le résultat n'est pas correct » — on réessaye, mais l'œuvre reste bloquée. ".repeat(
    200,
  )

test("l'URL respecte un budget minuscule, ou échoue fort — jamais un dépassement silencieux", () => {
  // À budget de production (6000) et avec les champs actuels de KINDS, aucun
  // test boîte noire ne peut distinguer la boucle de rognage corrigée de
  // l'ancienne, bogué : même l'ancienne version (qui sortait de boucle sur la
  // longueur du champ restant, pas sur celle de l'URL réellement rendue) ne
  // dépasse jamais 6000 caractères avec les champs d'aujourd'hui — mesuré à
  // 5952/6000. Un budget minuscule force la boucle à réellement rogner et
  // met sa condition de sortie à l'épreuve : c'est le seul moyen boîte noire
  // de faire la différence entre les deux implémentations.
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

  // Pas de deuxième argument : vérifie que le paramètre `budget` reste
  // optionnel et que l'appel à un seul argument (celui de la page
  // /bug-report) continue de fonctionner sans changement.
  const url = buildIssueUrl({ kind: "bug", fields })
  assert.ok(url.length <= URL_BUDGET, `${url.length} caractères — au-delà, le navigateur ou GitHub coupe`)
  assert.ok(url.includes("quoi=court"), "le champ court ne doit pas être sacrifié")

  // Un champ rogné ici l'est *dans l'URL de l'issue* : il doit porter
  // URL_TRUNCATION_MARK, jamais TRUNCATION_MARK — celui-ci promet que « la
  // suite est dans l'issue », or ici l'issue est justement ce qui est en
  // train d'être construit, il n'y a nulle part où la suite existerait.
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
  // @ts-expect-error — on teste précisément le cas que TypeScript interdit
  assert.throws(() => specFor("chaussette"), /chaussette/)
})

// Extrait les id de champ que le template YAML marque `validations: required:
// true`. Découpe sur chaque item de liste top-level (`  - type: `) plutôt que
// d'utiliser un parseur YAML : même approche regex que les tests ci-dessus,
// pas de nouvelle dépendance. Les checkboxes (ex. `verifs` dans contenu.yml)
// n'ont pas de bloc `validations:` — leurs `required: true` à eux vivent sous
// `options:`, par item — donc ils ne matchent jamais ici, ce qui est voulu :
// ce ne sont pas des champs pré-remplissables.
function requiredFieldIds(raw: string): Set<string> {
  const ids = new Set<string>()
  for (const block of raw.split(/\n(?=  - type: )/)) {
    const idMatch = block.match(/^\s+id:\s*(\S+)\s*$/m)
    if (!idMatch) continue
    if (/validations:\s*\n\s*required:\s*true/.test(block)) ids.add(idMatch[1])
  }
  return ids
}

// Le jour où un template gagne un champ obligatoire, la page continuera
// d'afficher « (facultatif) » si KINDS n'est pas mis à jour : l'élève saute
// le champ, et GitHub bloque la soumission sur une case qu'on lui a dit
// d'ignorer. Ce test pin les deux sens : si un template devient la source de
// vérité et que ce test casse, corrige KINDS — pas les templates.
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
