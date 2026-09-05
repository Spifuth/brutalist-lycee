import { query, queryOne } from "@/lib/db"

// Typed read/write over the `settings` key/value table (db/schema.sql):
// `key TEXT PRIMARY KEY`, `value JSONB`. db/seed.ts already writes one row
// under the key `site`; `vote_open` and `ai_open` are new keys this module
// owns, one row each, not nested inside `site`'s blob.
//
// Missing-row semantics matter and are the whole point of this file: a
// fresh database (or one where a teacher has never touched the toggle) has
// no `vote_open` row at all. If a missing row meant "open", every fresh
// deploy would start with voting live before a teacher ever said so. Every
// helper below defaults to `false`, never to `true`, when the row is
// absent — see isVoteOpen()/isAiOpen().

interface SettingRow {
  value: unknown
}

/** Raw read. `null` when the key has never been written — not an error. */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const row = await queryOne<SettingRow>("SELECT value FROM settings WHERE key = $1", [key])
  return row ? (row.value as T) : null
}

/**
 * Upsert. `value` is JSON-serialised as-is — a bare boolean round-trips
 * through the `jsonb` column exactly as cleanly as an object would.
 */
export async function setSetting(key: string, value: unknown): Promise<void> {
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  )
}

/**
 * Whether the vote board accepts new picks right now. Defaults to `false`
 * when the `vote_open` row is absent (see the file header) — this is the
 * server-side gate app/actions/engage.ts's `toggleVote` calls; hiding the
 * UI when closed is not the gate, this function is.
 */
export async function isVoteOpen(): Promise<boolean> {
  return (await getSetting<boolean>("vote_open")) === true
}

/**
 * Whether the AI-assisted feature is enabled right now. Same
 * missing-row-reads-as-closed contract as isVoteOpen().
 */
export async function isAiOpen(): Promise<boolean> {
  return (await getSetting<boolean>("ai_open")) === true
}
