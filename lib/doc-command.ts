// The `$ man …` micro-label at the top of each /docs card.
//
// Each subject in lib/docs.ts declares its own `command`; db/seed.ts writes it
// to doc_subjects.command and lib/content.ts reads it back. A subject created
// from the admin console has none, so it falls back to `man <slug>` rather
// than an empty label. Kept apart from lib/content.ts, which imports the
// database and cannot be loaded by `node --test`, so that
// tests/doc-command.test.ts can check it.

/** The declared command when there is one, `man <slug>` otherwise (NULL and blank alike). */
export function subjectCommand(row: { slug: string; command?: string | null }): string {
  return row.command?.trim() ? row.command : `man ${row.slug}`
}
