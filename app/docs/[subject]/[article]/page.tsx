// One article of the documentation. Also: how a folder name becomes a URL.
//
// This single file serves every article on the site, and nothing in it says
// which one. That is worth stopping on, because it is the first thing the App
// Router does that has no equivalent in plain HTML.
//
// There is no routing table anywhere in this project. The URL *is* the folder
// tree: app/quiz/page.tsx answers /quiz because it sits in a folder called
// quiz. A folder whose name is wrapped in square brackets -- [subject] and
// [article] here -- is a *dynamic segment*: it matches any one path segment
// and hands the matched text to the page. So /docs/reseaux/du-nom-a-la-page
// lands in this file with { subject: "reseaux", article: "du-nom-a-la-page" },
// and every other article lands in the same file with different values. Rename
// the [article] folder and you have renamed the parameter.
//
// `params` is a Promise and has to be awaited. That is deliberate in recent
// Next versions: the segment values are not necessarily settled when rendering
// starts, and making them a Promise lets the framework begin rendering the
// parts of the page that do not depend on them instead of waiting.
//
// notFound() is the other idiom worth naming. It returns nothing -- it throws,
// and the framework catches it and renders the 404 page. Which is why the
// lines after it can assume `data` exists, and why TypeScript agrees rather
// than complaining: notFound() is typed as returning `never`.
//
// The URL being the folder tree cuts both ways. It is impossible to have a
// route no file explains, and impossible to move a file without moving its
// URL.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Breadcrumbs } from "@/components/docs/breadcrumbs"
import { DocBlocks } from "@/components/docs/doc-blocks"
import { ArticleToc } from "@/components/docs/article-toc"
import type { DocBlock } from "@/lib/docs"
import { getDocArticle } from "@/lib/content"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; article: string }>
}): Promise<Metadata> {
  const { subject, article } = await params
  const data = await getDocArticle(subject, article)
  if (!data) return { title: "Article introuvable" }
  return { title: data.article.title, description: data.article.summary }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ subject: string; article: string }>
}) {
  const { subject, article } = await params
  const data = await getDocArticle(subject, article)
  if (!data) notFound()

  const { subject: s, article: a, prev, next } = data
  const blocks = a.blocks as DocBlock[]
  const tocEntries = blocks
    .filter((b): b is Extract<DocBlock, { type: "section" }> => b.type === "section")
    .map((b) => ({ id: b.id, text: b.text }))

  return (
    <div className="flex gap-8">
      <article className="min-w-0 flex-1 max-w-2xl">
        <Breadcrumbs
          items={[
            { label: "Docs", href: "/docs" },
            { label: s.title, href: `/docs/${s.slug}` },
            { label: a.title },
          ]}
        />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent">
          {s.title}
        </span>
        <h1 className="font-pixel text-3xl lg:text-4xl tracking-tight mt-2 mb-6 text-balance">
          {a.title}
        </h1>

        <DocBlocks blocks={blocks} />

        {/* Prev / Next */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 pt-6 border-t-2 border-foreground">
          {prev ? (
            <Link
              href={`/docs/${prev.subjectSlug}/${prev.slug}`}
              className="group flex flex-col gap-1 border-2 border-foreground p-4 hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                <ChevronLeft size={12} /> Précédent
              </span>
              <span className="font-mono text-sm font-bold">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/docs/${next.subjectSlug}/${next.slug}`}
              className="group flex flex-col gap-1 border-2 border-foreground p-4 hover:bg-muted transition-colors sm:text-right sm:items-end"
            >
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Suivant <ChevronRight size={12} />
              </span>
              <span className="font-mono text-sm font-bold">{next.title}</span>
            </Link>
          )}
        </div>
      </article>

      <ArticleToc entries={tocEntries} />
    </div>
  )
}
