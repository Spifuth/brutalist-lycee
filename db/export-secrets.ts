// Sort les secrets de la base au format YAML privé.
//
//   docker exec brutalist-web tsx db/export-secrets.ts > db/secrets.yml
//
// C'est la moitié qui manquait. Un secret créé dans la console admin
// n'existait dans aucun fichier : `pnpm db:setup` ne le recréait pas, aucun
// test ne le voyait, et sept d'entre eux ont fini par faire dériver le palier
// final sans que rien ne le signale. Exporter referme la boucle — ce qui est
// créé en direct redescend dans un fichier, gitignoré, versionnable ailleurs.
import pg from "pg"

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED
if (!connectionString) {
  console.error("[export] DATABASE_URL n'est pas défini.")
  process.exit(1)
}

/** Toujours entre guillemets : une phrase française contient des deux-points. */
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
