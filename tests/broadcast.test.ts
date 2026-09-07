import { test } from "node:test"
import assert from "node:assert/strict"
import { createBroadcaster } from "../lib/broadcast.ts"

test("two broadcasters do not share subscribers, pollers or timers", () => {
  // The reason this factory exists. lib/live-broadcast.ts held its subscriber
  // set, its poller and its interval handle at module scope — one set, one
  // timer, for the whole process. A second consumer (the pixel canvas) would
  // not have been added alongside the live quiz, it would have fought it for
  // the same interval and received its snapshots.
  const quiz = createBroadcaster<string>("quiz")
  const pixels = createBroadcaster<string>("pixels")

  const seenByQuiz: string[] = []
  quiz.subscribe((s) => seenByQuiz.push(s))

  assert.equal(quiz.subscriberCount(), 1)
  assert.equal(pixels.subscriberCount(), 0, "subscribing to one broadcaster registered on the other")

  quiz._reset()
  pixels._reset()
})

test("a publish reaches only its own subscribers", async () => {
  const a = createBroadcaster<string>("a")
  const b = createBroadcaster<string>("b")
  const gotA: string[] = []
  const gotB: string[] = []
  a.subscribe((s) => gotA.push(s))
  b.subscribe((s) => gotB.push(s))
  a.setPoller(async () => "from-a")
  b.setPoller(async () => "from-b")

  await a.publishNow()
  assert.deepEqual(gotA, ["from-a"])
  assert.deepEqual(gotB, [], "a publish on one broadcaster leaked into the other")

  a._reset()
  b._reset()
})

test("publishing with no poller registered is a no-op, not a crash", async () => {
  const bc = createBroadcaster<string>("x")
  const got: string[] = []
  bc.subscribe((s) => got.push(s))
  await bc.publishNow()
  assert.deepEqual(got, [], "it invented a snapshot from nowhere")
  bc._reset()
})

test("publishing to nobody never calls the poller", async () => {
  // A mutation can fire a forced publish before anyone has opened the stream.
  // Polling then would be a database query whose result goes nowhere.
  const bc = createBroadcaster<string>("x")
  let polls = 0
  bc.setPoller(async () => {
    polls++
    return "s"
  })
  await bc.publishNow()
  assert.equal(polls, 0, "the poller ran with no subscribers")
  bc._reset()
})

test("one broken subscriber does not stop the others", async () => {
  const bc = createBroadcaster<string>("x")
  const errors: unknown[] = []
  bc.setErrorHandler((e) => errors.push(e))
  const got: string[] = []
  bc.subscribe(() => {
    throw new Error("client exploded")
  })
  bc.subscribe((s) => got.push(s))
  bc.setPoller(async () => "snap")

  await bc.publishNow()
  assert.deepEqual(got, ["snap"], "a throwing subscriber swallowed the snapshot for everyone else")
  assert.equal(errors.length, 1)
  assert.equal(bc.droppedCount(), 1)
  bc._reset()
})

test("unsubscribing twice does not double-count", () => {
  const bc = createBroadcaster<string>("x")
  const off = bc.subscribe(() => {})
  bc.subscribe(() => {})
  off()
  off()
  assert.equal(bc.subscriberCount(), 1)
  bc._reset()
})
