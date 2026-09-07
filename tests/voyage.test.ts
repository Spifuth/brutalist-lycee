import { test } from "node:test"
import assert from "node:assert/strict"
import { STEPS, OBSERVERS, type ObserverKey } from "../lib/voyage.ts"

const OBSERVER_KEYS = Object.keys(OBSERVERS) as ObserverKey[]

test("the journey has a stable, unique sequence of steps", () => {
  assert.ok(STEPS.length >= 6, "the journey is too short to show anything")
  const ids = STEPS.map((s) => s.id)
  assert.equal(new Set(ids).size, ids.length, "two steps share an id — the stepper would jump")
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/)
})

test("every step says what each observer sees — none is left blank", () => {
  // A missing row does not throw: the table just renders one line short, and
  // the reader concludes that observer sees nothing at that moment.
  for (const s of STEPS) {
    const keys = s.sees.map((v) => v.observer)
    assert.equal(new Set(keys).size, keys.length, `${s.id}: the same observer appears twice`)
    for (const k of OBSERVER_KEYS) {
      assert.ok(keys.includes(k), `${s.id}: nothing is said about "${k}"`)
    }
  }
})

test("once TLS is up, only the destination can read the content", () => {
  // This is the claim the page is built to make. If a step after the handshake
  // ever grants "contenu" to anyone else, the page teaches that HTTPS does not
  // work — quietly, in one table cell.
  const tlsIndex = STEPS.findIndex((s) => s.id === "tls")
  assert.ok(tlsIndex >= 0, "there is no TLS step")
  for (const s of STEPS.slice(tlsIndex + 1)) {
    for (const v of s.sees) {
      if (v.observer === "site") continue
      assert.notEqual(
        v.sees,
        "contenu",
        `${s.id}: "${v.observer}" is shown reading the content after TLS is established`,
      )
    }
  }
})

test("HTTPS hides the content, not the destination", () => {
  // The nuance that makes the VPN lesson land: after TLS your provider still
  // knows which site you opened. A page that omits it oversells encryption.
  const tlsIndex = STEPS.findIndex((s) => s.id === "tls")
  const after = STEPS.slice(tlsIndex)
  assert.ok(
    after.some((s) => s.sees.some((v) => v.observer === "fai" && (v.sees === "domaine" || v.sees === "ip"))),
    "after TLS, no step still shows the provider knowing where you went",
  )
})

test("the DNS step is where the name leaks", () => {
  const dns = STEPS.find((s) => s.id === "dns")
  assert.ok(dns, "there is no DNS step")
  const resolver = dns.sees.find((v) => v.observer === "dns")!
  assert.equal(resolver.sees, "domaine", "the resolver is not shown learning the domain — that is the whole point of the step")
  assert.equal(dns.encrypted, false, "a plain DNS query is not encrypted; say so")
})

test("every step shows something on the wire", () => {
  for (const s of STEPS) {
    assert.ok(s.wire.length > 0, `${s.id}: nothing is shown on the wire`)
    assert.ok(s.title.length > 0 && s.what.length > 0, `${s.id}: missing copy`)
  }
})
