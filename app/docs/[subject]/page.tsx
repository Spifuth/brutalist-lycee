// One docs subject, with the list of its articles.
//
// The folder is named [subject], in square brackets; the file next door,
// app/docs/[subject]/[article]/page.tsx, explains what that means.
//
// Two exports here, and the App Router calls both for the same request:
// generateMetadata() to fill the <title> in the <head>, and the default export
// to render the page. Each awaits `params` and each calls getDocSubject(), so
// the same SQL query runs twice per visit. Nothing deduplicates it on its own:
// the App Router memoises fetch(), never an arbitrary async function. React's
// cache() is the tool that would -- it memoises a function for the duration of
// one request, so the second call gets the first one's result. Worth knowing
// it exists, and worth knowing that going without it is a choice rather than
// a free lunch.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Breadcrumbs } from "@/components/docs/breadcrumbs"
import { getDocSubject } from "@/lib/content"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string }>
}): Promise<Metadata> {
  const { subject } = await params
  const s = await getDocSubject(subject)
  if (!s) return { title: "Sujet introuvable" }
  return { title: s.title, description: s.description }
}

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params
  const s = await getDocSubject(subject)
  if (!s) notFound()

  return (
    <div>
      <Breadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: s.title }]} />
      <div className="flex items-center gap-4 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent">$ {s.command}</span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {s.articles.length} articles
        </span>
      </div>
      <h1 className="font-pixel text-3xl lg:text-4xl tracking-tight mb-3">{s.title}</h1>
      <p className="text-sm text-muted-foreground max-w-2xl mb-8 leading-relaxed">{s.description}</p>

      <ul className="border-2 border-foreground divide-y-2 divide-border">
        {s.articles.map((a, i) => (
          <li key={a.slug}>
            <Link
              href={`/docs/${s.slug}/${a.slug}`}
              className="group flex items-start gap-4 p-4 hover:bg-muted transition-colors"
            >
              <span className="font-mono text-xs text-muted-foreground pt-0.5 w-6 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-mono text-sm font-bold">{a.title}</h2>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{a.summary}</p>
              </div>
              <ArrowRight size={15} className="mt-0.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
