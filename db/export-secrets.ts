// Dumps the secrets from the database to the private YAML format.
//
//   docker exec brutalist-web tsx db/export-secrets.ts > db/secrets.yml
//
// This is the half that was missing. A secret created from the admin console
// existed in no file: `pnpm db:setup` never recreated it, no test ever saw
// it, and seven of them ended up drifting the final milestone with nothing
// to signal it. Exporting closes the loop — what is created live comes back
// down into a file, gitignored, versionable elsewhere.
import pg from "pg"

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED
if (!connectionString) {
  console.error("[export] DATABASE_URL n'est pas défini.")
  process.exit(1)
}

/** Always quoted: a French sentence contains colons. */
function quote(text: string): string {
  return `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

const db = new pg.Client({ connectionString })

async function main() {
  await db.connect()
  const { rows } = await db.query<{
    code: string; name: string; hint: string; location: string; points: number
    category: string; difficulty: string; badge_slug: string | null
    unlock_at: number | null; aliases: string[] | null
  }>(
    `SELECT s.code, s.name, s.hint, s.location, s.points, s.category, s.difficulty,
            s.badge_slug, s.unlock_at,
            (SELECT array_agg(a.code ORDER BY a.code) FROM secret_aliases a WHERE a.secret_id = s.id) AS aliases
       FROM secrets s
      WHERE s.active AND s.unlock_at IS NULL
      ORDER BY s.category, s.points, s.code`,
  )

  const out: string[] = [
    "# Secrets de la chasse — fichier PRIVÉ, jamais commité (voir .gitignore).",
    `# Export du ${new Date().toISOString().slice(0, 10)} : ${rows.length} secrets ordinaires.`,
    "# Les paliers ne sont pas exportés : leur seuil est recalculé à l'import.",
    "secrets:",
  ]
  for (const r of rows) {
    out.push(`  - code: ${r.code}`)
    out.push(`    name: ${quote(r.name)}`)
    out.push(`    hint: ${quote(r.hint)}`)
    out.push(`    category: ${r.category}`)
    out.push(`    difficulty: ${r.difficulty}`)
    out.push(`    points: ${r.points}`)
    if (r.location) out.push(`    location: ${quote(r.location)}`)
    if (r.badge_slug) out.push(`    badgeSlug: ${r.badge_slug}`)
    if (r.aliases?.length) out.push(`    aliases: [${r.aliases.join(", ")}]`)
    out.push("")
  }
  console.log(out.join("\n"))
}

main()
  .catch((err) => {
    console.error("[export] échec :", err)
    process.exit(1)
  })
  .finally(() => db.end())
