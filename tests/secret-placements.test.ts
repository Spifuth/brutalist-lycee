// Les onze secrets « À IMPLÉMENTER » sont désormais posés. Ce test tient les
// deux bouts : que chaque emplacement déclaré par le site existe une fois et
// une seule dans les seeds, et que les encodages qu'un élève devra défaire
// sont réversibles.
import { test } from "node:test"
import assert from "node:assert/strict"
import { SECRET_SEEDS } from "../db/seeds/secrets.ts"
import {
  PLACEMENT_SLUGS,
  encodeZeroWidth,
  decodeZeroWidth,
  encodeBase64,
  demoJwt,
  fakeApiKey,
} from "../lib/secret-placements.ts"

test("chaque emplacement du site est pourvu par exactement un secret", () => {
  for (const slug of PLACEMENT_SLUGS) {
    const holders = SECRET_SEEDS.filter((s) => s.placement === slug).map((s) => s.code)
    assert.equal(
      holders.length,
      1,
      `l'emplacement « ${slug} » est pourvu par ${holders.length} secrets (${holders.join(", ") || "aucun"}) — une page afficherait du vide ou deux codes`,
    )
  }
})

test("aucun secret ne revendique un emplacement que le site ne pose pas", () => {
  const known = new Set<string>(PLACEMENT_SLUGS)
  const orphans = SECRET_SEEDS.filter((s) => s.placement && !known.has(s.placement)).map((s) => s.code)
  assert.deepEqual(orphans, [], "emplacement inconnu : le code ne serait posé nulle part")
})

test("plus aucun secret seedé ne dit « À IMPLÉMENTER »", () => {
  const pending = SECRET_SEEDS.filter((s) => s.location.startsWith("À IMPLÉMENTER")).map((s) => s.code)
  assert.deepEqual(pending, [], "un indice promet quelque chose qui n'existe pas dans le site")
})

test("les caractères de largeur nulle se relisent", () => {
  const hidden = encodeZeroWidth("SIN-ZERO-WIDTH")
  assert.equal(decodeZeroWidth(hidden), "SIN-ZERO-WIDTH")
  // Invisible pour de vrai : rien de ce qui est écrit ne se voit à l'écran.
  assert.match(hidden, /^[\u200B\u200C]+$/)
})

test("le Base64 est un encodage, donc réversible", () => {
  assert.equal(Buffer.from(encodeBase64("SIN-BASE64-DECODE"), "base64").toString("utf8"), "SIN-BASE64-DECODE")
})

test("la charge utile du JWT de démonstration se lit sans clé, et sa signature n'en est pas une", () => {
  const [, payload, signature] = demoJwt("SIN-JWT-DECODE").split(".")
  assert.equal(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).secret, "SIN-JWT-DECODE")
  assert.match(signature, /demonstration/, "une signature qui ressemble à une vraie signature serait un mauvais exemple")
})

test("la fausse clé d'API porte le code sans ressembler à une vraie clé", () => {
  const key = fakeApiKey("SIN-API-KEY-HARDCODED")
  assert.match(key, /sin_api_key_hardcoded/)
  assert.match(key, /ne_sert_a_rien/)
})
