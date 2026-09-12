// Pure key-building + refusal logic for db/seed.ts's doc prune, pulled out so
// it can be unit-tested without a database — no `pg` import here, nothing
// async, nothing that touches DATABASE_URL. tests/docs-content.test.ts imports
// this directly under `node --test --experimental-strip-types`.
//
// The two throws below are the most destructive guard on the branch: without
// them, an empty or article-less DOC_SUBJECTS (bad merge, broken import)
// would make the seed prune every doc_article and/or doc_subject row on the
// next `docker compose up`. Deleting either throw fails no test that existed
// before this file — that is exactly why they are tested here.

export interface PruneKeySubject {
  slug: string
  articles: { slug: string }[]
}

export interface PruneKeys {
  subjectSlugs: string[]
  articleKeys: string[]
}

/**
 * Builds the two "what the seed is allowed to keep" key sets from a subjects
 * array, and refuses outright if the input looks broken rather than merely
 * small.
 *
 * `<> ALL('{}'::text[])` (used downstream in db/seed.ts) is vacuously true for
 * every row: an empty `subjectSlugs` would prune every doc_subject, and an
 * empty `articleKeys` would prune every doc_article, in one run. That is not
 * what "authoritative seed" means — refuse instead of executing it.
 *
 * Both arrays are checked independently: a subjects array that still has
 * entries but where every subject's `articles` is `[]` leaves `articleKeys`
 * empty on its own, and would prune all of doc_articles while doc_subjects
 * looks untouched. Same bug, narrower trigger.
 *
 * A single subject with zero articles is harmless on its own and must NOT
 * throw — the other subjects keep `articleKeys` non-empty, and a subject
 * legitimately can be article-less while its content is being written.
 */
export function buildPruneKeys(subjects: PruneKeySubject[]): PruneKeys {
  const subjectSlugs = subjects.map((s) => s.slug)
  const articleKeys = subjects.flatMap((s) => s.articles.map((a) => `${s.slug}/${a.slug}`))

  if (subjectSlugs.length === 0) {
    throw new Error(
      "[seed] DOC_SUBJECTS is empty — refusing to prune, this would delete every doc_article and doc_subject row",
    )
  }
  if (articleKeys.length === 0) {
    throw new Error(
      "[seed] DOC_SUBJECTS declares no articles at all — refusing to prune, this would delete every doc_article row",
    )
  }

  return { subjectSlugs, articleKeys }
}
