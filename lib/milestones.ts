// Milestone secrets — the ones a student cannot type, only reach.
//
// An ordinary secret is redeemed by entering its code. A milestone has an
// `unlock_at` count instead: once the student has found that many ORDINARY
// secrets, it is granted automatically. Counting ordinary secrets rather than
// all of them matters — milestones are themselves rows in `secrets`, so
// counting everything would let a milestone satisfy a later milestone's gate.
//
// Pure and dependency-free on purpose: this is the rule the whole endgame rests
// on, and it should be testable without a database.

export interface MilestoneGate {
  code: string
  unlockAt: number
}

/**
 * True if this row is a milestone rather than an ordinary secret.
 *
 * The DB column is a nullable INTEGER and the seed type uses an optional
 * number, so "not a milestone" arrives as `null` or `undefined` depending on
 * the caller. Zero is also not a milestone: an admin who leaves the field blank
 * should not accidentally create a secret granted to everyone on their first
 * redemption.
 */
export function isMilestone(row: { unlockAt?: number | null }): boolean {
  return typeof row.unlockAt === "number" && row.unlockAt > 0
}

/**
 * Every milestone earned at `ordinaryFound` ordinary secrets.
 *
 * Returns all gates at or below the count, not just the one just crossed:
 * granting is idempotent downstream (`ON CONFLICT DO NOTHING` on the
 * redemption, and awardBadge is idempotent too), and returning the full set
 * means a count that jumps — an admin granting several secrets at once, a
 * recount after a deletion — cannot leave a student permanently owed a
 * milestone they walked past.
 */
export function milestonesReached(ordinaryFound: number, gates: MilestoneGate[]): string[] {
  return gates.filter((g) => g.unlockAt > 0 && ordinaryFound >= g.unlockAt).map((g) => g.code)
}
