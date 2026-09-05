import "server-only"
import { query, queryOne } from "@/lib/db"
import type { Quiz } from "@/lib/quizzes"

// Server-only read helpers for DB-backed content, used by RSC pages.
// Mutations live in app/actions/*; these are plain reads (no "use server").

// ---------------- Quizzes ----------------

interface QuizRow {
  slug: string
  title: string
  description: string
  topic: string
  level: string
}
interface QuizQuestionRow {
  id: string
  prompt: string
  options: string[]
  correct_index: number
  explanation: string
}

const TOPIC_LABEL: Record<string, string> = {
  cyber: "Cybersécurité",
  ia: "Intelligence artificielle",
  reseaux: "Comment ça marche",
  "vie-privee": "Données personnelles",
}

export async function getQuizList(): Promise<
  { slug: string; title: string; theme: string; description: string; count: number }[]
> {
  const rows = await query<QuizRow & { count: string }>(
    `SELECT q.slug, q.title, q.description, q.topic, q.level,
            (SELECT COUNT(*)::text FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS count
       FROM quizzes q WHERE q.published ORDER BY q.position ASC, q.created_at ASC`,
  )
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    theme: TOPIC_LABEL[r.topic] ?? r.topic,
    description: r.description,
    count: Number(r.count),
  }))
}

export async function getQuizContent(slug: string): Promise<Quiz | null> {
  const quiz = await queryOne<QuizRow & { id: string }>(
    "SELECT id, slug, title, description, topic, level FROM quizzes WHERE slug = $1 AND published",
    [slug],
  )
  if (!quiz) return null
  const questions = await query<QuizQuestionRow>(
    "SELECT id, prompt, options, correct_index, explanation FROM quiz_questions WHERE quiz_id = $1 ORDER BY position ASC",
    [quiz.id],
  )
  return {
    slug: quiz.slug,
    title: quiz.title,
    theme: TOPIC_LABEL[quiz.topic] ?? quiz.topic,
    description: quiz.description,
    questions: questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      correct: q.correct_index,
      explanation: q.explanation,
    })),
  }
}

// ---------------- Docs ----------------

export interface DocSubjectMeta {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  command: string
}
export interface DocArticle {
  id: string
  slug: string
  title: string
  summary: string
  blocks: unknown[]
}
export interface DocSubject extends DocSubjectMeta {
  articles: DocArticle[]
}

function withCommand(s: Omit<DocSubjectMeta, "command">): DocSubjectMeta {
  return { ...s, command: `man ${s.slug}` }
}

export async function getDocSubjects(): Promise<DocSubject[]> {
  const subjects = await query<Omit<DocSubjectMeta, "command">>(
    "SELECT id, slug, title, description, icon FROM doc_subjects ORDER BY position ASC",
  )
  const articles = await query<DocArticle & { subject_id: string }>(
    "SELECT id, subject_id, slug, title, summary, blocks FROM doc_articles WHERE published ORDER BY position ASC",
  )
  return subjects.map((s) => ({
    ...withCommand(s),
    articles: articles
      .filter((a) => a.subject_id === s.id)
      .map(({ subject_id, ...rest }) => rest),
  }))
}

export async function getDocArticle(
  subjectSlug: string,
  articleSlug: string,
): Promise<{
  subject: DocSubjectMeta
  article: DocArticle
  prev: { subjectSlug: string; slug: string; title: string } | null
  next: { subjectSlug: string; slug: string; title: string } | null
} | null> {
  const subjects = await getDocSubjects()
  const flat = subjects.flatMap((s) =>
    s.articles.map((a) => ({ subjectSlug: s.slug, slug: a.slug, title: a.title })),
  )
  const subject = subjects.find((s) => s.slug === subjectSlug)
  if (!subject) return null
  const article = subject.articles.find((a) => a.slug === articleSlug)
  if (!article) return null
  const idx = flat.findIndex((f) => f.subjectSlug === subjectSlug && f.slug === articleSlug)
  const { articles, ...meta } = subject
  return {
    subject: meta,
    article,
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  }
}

export async function getDocSubject(slug: string): Promise<DocSubject | null> {
  const subjects = await getDocSubjects()
  return subjects.find((s) => s.slug === slug) ?? null
}

export async function countDocs(): Promise<{ subjects: number; articles: number }> {
  const row = await queryOne<{ subjects: string; articles: string }>(
    "SELECT (SELECT COUNT(*)::text FROM doc_subjects) AS subjects, (SELECT COUNT(*)::text FROM doc_articles WHERE published) AS articles",
  )
  return { subjects: Number(row?.subjects ?? 0), articles: Number(row?.articles ?? 0) }
}
