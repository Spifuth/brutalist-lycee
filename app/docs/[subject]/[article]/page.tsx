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
