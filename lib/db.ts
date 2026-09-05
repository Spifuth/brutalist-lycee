import { Pool, type QueryResultRow } from "pg"

// The pool is created lazily on first query rather than at import time. This
// keeps `next build` page-data collection working even when DATABASE_URL isn't
// set in the build environment — the connection (and the "not set" error) is
// deferred until an actual request runs a query at runtime.

declare global {
  // eslint-disable-next-line no-var
  var __lyceeSinPool: Pool | undefined
}

function createPool(): Pool {
  // Reads the standard DATABASE_URL, so the exact same code runs against Neon
  // (v0 preview / cloud) and a self-hosted Postgres in Docker. Falls back to the
  // non-pooled URL if that's all that's provided.
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Point it at your Postgres instance (Neon or self-hosted).",
    )
  }

  // SSL is required by Neon and most managed Postgres; harmless for local Docker
  // when sslmode isn't requested. `rejectUnauthorized: false` keeps self-signed
  // container certs working without extra config.
  const useSsl =
    /sslmode=require/.test(connectionString) || /neon\.tech/.test(connectionString)

  return new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
  })
}

function getPool(): Pool {
  if (!global.__lyceeSinPool) {
    global.__lyceeSinPool = createPool()
  }
  return global.__lyceeSinPool
}

/** Run a parameterized query. Always use $1, $2… placeholders — never string interpolation. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as never[])
  return res.rows
}

/** Convenience for queries that return at most one row. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
