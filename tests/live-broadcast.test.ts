// Guards the live quiz's broadcaster instance, and the two states that are
// easiest to get wrong at its edges: nobody subscribed, and no poller set.
//
// lib/live-broadcast.ts is now a single named instance of the factory in
// lib/broadcast.ts, so most of what is asserted below is also asserted in
// tests/broadcast.test.ts against the factory itself. That overlap is worth
// knowing about before editing either file; what is only pinned here is that
// this module's exports really are bound to one broadcaster.
//
// Two cases are genuinely specific to it. A publish with nobody listening must
// not poll the database, because the result would go nowhere. And a publish
// before setPoller() has ever run must not throw -- which is not hypothetical:
// server actions call publishNow() after a mutation, and they can run in a
// process where /api/live/stream has never been loaded, so the factory's
// default poller (which throws on purpose) is still installed. A rejected
// promise there is a 500 on a mutation that actually succeeded.
//
// Deleted, the live quiz keeps working. What goes is the guarantee that a
// classroom of thirty students still costs one database read per tick.
import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  subscribe,
  subscriberCount,
  setPoller,
  publishNow,
  setErrorHandler,
  droppedCount,
  _reset,
} from "../lib/live-broadcast.ts"

beforeEach(() => _reset())

test("no poll happens while nobody is subscribed", async () => {
  let polls = 0
  setPoller(async () => { polls++; return { state: "lobby" } as any }, 10)
  await new Promise((r) => setTimeout(r, 40))
  assert.equal(polls, 0)
})

test("one poll feeds every subscriber", async () => {
  let polls = 0
  setPoller(async () => { polls++; return { state: "question" } as any }, 1000)
  const seen: string[] = []
  const a = subscribe((s: any) => seen.push("a:" + s.state))
  const b = subscribe((s: any) => seen.push("b:" + s.state))
  await publishNow()
  assert.equal(polls, 1, "expected exactly one DB poll for two subscribers")
  assert.deepEqual(seen.sort(), ["a:question", "b:question"])
  a(); b()
})

test("unsubscribing removes the subscriber", () => {
  setPoller(async () => ({ state: "lobby" }) as any, 1000)
  const off = subscribe(() => {})
  assert.equal(subscriberCount(), 1)
  off()
  assert.equal(subscriberCount(), 0)
})

test("a throwing subscriber does not prevent the others from receiving, and the failure is reported", async () => {
  setPoller(async () => ({ state: "reveal" }) as any, 1000)
  const seen: string[] = []
  const reported: unknown[] = []
  setErrorHandler((err) => reported.push(err))
  subscribe(() => { throw new Error("boom") })
  subscribe((s: any) => seen.push(s.state))
  await publishNow()
  assert.deepEqual(seen, ["reveal"])
  assert.equal(reported.length, 1, "expected the thrown error to be reported, not swallowed")
  assert.equal((reported[0] as Error).message, "boom")
})

test("droppedCount tracks thrown subscriber errors and _reset zeroes it", async () => {
  setPoller(async () => ({ state: "reveal" }) as any, 1000)
  setErrorHandler(() => {}) // keep output pristine; isolation is asserted elsewhere
  subscribe(() => { throw new Error("boom") })
  await publishNow()
  await publishNow()
  assert.equal(droppedCount(), 2)
  _reset()
  assert.equal(droppedCount(), 0)
})

test("publishNow resolves without throwing when no poller has ever been set", async () => {
  // Mirrors a mutation firing before /api/live/stream has ever been loaded
  // in this process: setPoller() was never called, so the module's default
  // poller (which throws) is still installed. Publishing to nobody must be
  // a no-op, not a crash.
  await assert.doesNotReject(() => publishNow())
})

test("publishNow with a poller set but zero subscribers does not poll and does not throw", async () => {
  let polls = 0
  setPoller(async () => { polls++; return { state: "question" } as any }, 1000)
  assert.equal(subscriberCount(), 0)
  await assert.doesNotReject(() => publishNow())
  assert.equal(polls, 0, "nobody is subscribed, so the snapshot must not be fetched")
})
