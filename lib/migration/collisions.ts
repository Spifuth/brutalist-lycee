// Collision resolution for the pseudo → pseudo_lower migration. See the
// vault: "Migration des données — SQLite → PostgreSQL", problem 2.
//
// The old app's `pseudo` is a case-sensitive primary key: "Legeek38" and
// "legeek38" are two distinct rows there. The new schema has a UNIQUE
// constraint on pseudo_lower, deliberately, so nobody can impersonate a
// classmate by changing a letter's case — the second insert would be
// rejected outright.
//
// The operator's decision for this migration: keep the account with the
// earliest createdAt in each colliding group, drop the rest. This is
// general on purpose — it must resolve whatever collisions exist in
// whatever data is fed to it, not just the one known pair in today's data
// (Legeek38 / legeek38), because a later run against different data will
// have different collisions, or none.

export interface MigrationUser {
  pseudo: string
  createdAt: Date
}

export interface CollisionResolution {
  /** One pseudo per lower-cased group: the earliest-created account. */
  keep: string[]
  /** Every other pseudo in a group that collided with a kept one. */
  drop: string[]
}

export function resolveCollisions(users: MigrationUser[]): CollisionResolution {
  const groups = new Map<string, MigrationUser[]>()
  for (const user of users) {
    const key = user.pseudo.toLowerCase()
    const group = groups.get(key)
    if (group) {
      group.push(user)
    } else {
      groups.set(key, [user])
    }
  }

  const keep: string[] = []
  const drop: string[] = []
  for (const group of groups.values()) {
    const [earliest, ...rest] = [...group].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )
    keep.push(earliest.pseudo)
    for (const loser of rest) {
      drop.push(loser.pseudo)
    }
  }
  return { keep, drop }
}
