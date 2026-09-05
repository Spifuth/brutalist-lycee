import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Radio } from "lucide-react"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { getQuizList } from "@/lib/content"

export const metadata: Metadata = {
  title: "Quiz",
  description: "Teste tes connaissances par thème : cybersécurité, IA, réseaux et vie privée.",
}

export const dynamic = "force-dynamic"

export default async function QuizIndexPage() {
  const quizzes = await getQuizList()
  return (
    <PageShell>
      <PageHeader
        index="QUIZ / 070"
        command="quiz --list"
        title="Quiz par thème"
        description="Une question à la fois, avec l'explication après chaque réponse. Sans pression."
      />

      <section className="w-full px-6 pb-4 lg:px-12">
        <Link
          href="/live"
          className="group flex items-center justify-between border-2 border-foreground bg-foreground text-background p-5 mb-6 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <div className="flex items-center gap-3">
            <Radio size={18} className="animate-blink" />
            <div>
              <p className="font-mono text-sm font-bold uppercase tracking-wide">Quiz en direct</p>
              <p className="text-[11px] opacity-70">Joue en même temps que la classe, façon Kahoot.</p>
            </div>
          </div>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-foreground">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.slug}
              href={`/quiz/${quiz.slug}`}
              className="group flex flex-col gap-2 border-foreground p-6 hover:bg-muted transition-colors border-b-2 md:[&:nth-last-child(-n+2)]:border-b-0 md:[&:nth-child(odd)]:border-r-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-accent">
                  {quiz.theme}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {quiz.count} questions
                </span>
              </div>
              <h2 className="font-mono text-lg font-bold uppercase tracking-wide">{quiz.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{quiz.description}</p>
              <span className="flex items-center gap-1 mt-2 text-[10px] font-mono uppercase tracking-widest text-foreground group-hover:text-accent">
                Commencer <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
