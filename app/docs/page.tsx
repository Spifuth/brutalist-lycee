import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getDocSubjects, countDocs } from "@/lib/content"

export const metadata: Metadata = {
  title: "Documentation",
  description: "La documentation du cours : fondamentaux, sécurité, réseaux, IA, Linux, web et données.",
}

export const dynamic = "force-dynamic"

export default async function DocsIndexPage() {
  const subjects = await getDocSubjects()
  const counts = await countDocs()
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">$ man</span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {counts.subjects} sujets · {counts.articles} articles
        </span>
      </div>
      <h1 className="font-pixel text-4xl lg:text-5xl tracking-tight mb-3">Documentation</h1>
      <p className="text-sm text-muted-foreground max-w-2xl mb-8 leading-relaxed">
        Une base de connaissances organisée par sujet. Le contenu est un exemple structuré, prêt à
        être remplacé par le cours définitif.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-foreground">
        {subjects.map((subject) => (
          <Link
            key={subject.slug}
            href={`/docs/${subject.slug}`}
            className="group flex flex-col gap-2 border-foreground p-5 hover:bg-muted transition-colors border-b-2 md:[&:nth-last-child(-n+2)]:border-b-0 md:[&:nth-child(odd)]:border-r-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent">
                {subject.command}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {subject.articles.length} articles
              </span>
            </div>
            <h2 className="font-mono text-lg font-bold uppercase tracking-wide">{subject.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{subject.description}</p>
            <span className="flex items-center gap-1 mt-1 text-[10px] font-mono uppercase tracking-widest group-hover:text-accent">
              Ouvrir <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
