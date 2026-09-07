// Sliding-window brake on passphrase guessing, keyed on the pseudo.
//
// WHY PER PSEUDO AND NOT PER IP. Thirty students in one classroom come from
// one public address. A per-IP limit is a perfectly correct rate limit and the
// wrong one here: one student mistyping their passphrase would lock out the
// whole room in the middle of a session. This estate has already paid for that
// lesson once — see the "a *correct* per-IP rate limit is the wrong limit for
// a classroom" entry in the Nebula gotchas. So the counter follows the account
// being attacked, and a student can only ever lock out themselves.
//
// WHY IN MEMORY. `brutalist-web` runs as a single container, so there is one
// process and one map. It resets on redeploy, which loses an attacker's
// accumulated failures — acceptable, because the space they are searching is
// 2.7e12 wide and a redeploy is not something they can trigger. Moving this to
// Postgres is the prerequisite for a second replica, not an optimisation.

/** Failures allowed inside one window before the account stops answering. */
export const MAX_FAILURES = 10
/** How long a failure is remembered. */
export const WINDOW_MS = 15 * 60 * 1000
/**
 * Ceiling on tracked keys. The key is attacker-controlled — spraying unique
 * pseudos would otherwise grow this map without bound, which would make the
 * brake itself a memory-exhaustion vector.
 */
export const MAX_TRACKED = 5000

/** pseudo (lower-cased) → timestamps of recent failures, oldest first. */
const failures = new Map<string, number[]>()

function key(pseudo: string): string {
  // login() matches on `pseudo_lower`; keying on the raw input would let an
  // attacker alternate "Eleve" and "eleve" for a free doubling of the budget.
  return (pseudo || "").trim().toLowerCase()
}

function recent(list: number[], now: number): number[] {
  const cutoff = now - WINDOW_MS
  return list.filter((t) => t > cutoff)
}

/** Drop keys whose failures have all aged out, then enforce the hard cap. */
function prune(now: number): void {
  for (const [k, list] of failures) {
    const live = recent(list, now)
    if (live.length === 0) failures.delete(k)
    else if (live.length !== list.length) failures.set(k, live)
  }
  if (failures.size <= MAX_TRACKED) return
  // Map preserves insertion order, and every write re-inserts, so the head is
  // the least recently active key.
  const excess = failures.size - MAX_TRACKED
  let dropped = 0
  for (const k of failures.keys()) {
    failures.delete(k)
    if (++dropped >= excess) break
  }
}

export interface ThrottleVerdict {
  allowed: boolean
  /** Milliseconds until the oldest failure ages out. 0 when allowed. */
  retryAfterMs: number
}

export function checkLogin(pseudo: string, now: number = Date.now()): ThrottleVerdict {
  const list = recent(failures.get(key(pseudo)) ?? [], now)
  if (list.length < MAX_FAILURES) return { allowed: true, retryAfterMs: 0 }
  return { allowed: false, retryAfterMs: Math.max(1, list[0] + WINDOW_MS - now) }
}

export function recordFailure(pseudo: string, now: number = Date.now()): void {
  const k = key(pseudo)
  const list = recent(failures.get(k) ?? [], now)
  list.push(now)
  // Re-insert so this key moves to the tail of the eviction order.
  failures.delete(k)
  failures.set(k, list)
  prune(now)
}

/** Called on a successful login: the account is clearly not under guess. */
export function clearFailures(pseudo: string): void {
  failures.delete(key(pseudo))
}

/** Test seam. */
export function _reset(): void {
  failures.clear()
}

/** Test seam: how many keys are being tracked. */
export function _size(): number {
  return failures.size
}
