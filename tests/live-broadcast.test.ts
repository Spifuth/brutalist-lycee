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
