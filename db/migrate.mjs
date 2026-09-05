// Applies db/schema.sql to the database at DATABASE_URL.
// Idempotent: schema.sql uses CREATE ... IF NOT EXISTS everywhere, so this is
// safe to run on every container start. Used by the Docker entrypoint.
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  console.error("[migrate] DATABASE_URL is not set.")
  process.exit(1)
}

const useSsl = /sslmode=require/.test(connectionString) || /neon\.tech/.test(connectionString)

const sql = readFileSync(join(__dirname, "schema.sql"), "utf8")

const client = new pg.Client({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
})

try {
  await client.connect()
  console.log("[migrate] applying schema.sql…")
  await client.query(sql)
  console.log("[migrate] done.")
} catch (err) {
  console.error("[migrate] failed:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
