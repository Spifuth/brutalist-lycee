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
  DISCORD_LIMIT,
  URL_BUDGET,
  TRUNCATION_MARK,
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
})

test("un type inconnu échoue fort", () => {
  // @ts-expect-error — on teste précisément le cas que TypeScript interdit
  assert.throws(() => specFor("chaussette"), /chaussette/)
})
