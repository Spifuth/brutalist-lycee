import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { PageShell } from "@/components/site/page-shell"
import { QuizRunner } from "@/components/quiz/quiz-runner"
import { getQuizContent } from "@/lib/content"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const quiz = await getQuizContent(slug)
  if (!quiz) return { title: "Quiz introuvable" }
  return { title: quiz.title, description: quiz.description }
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const quiz = await getQuizContent(slug)
  if (!quiz) notFound()

  return (
    <PageShell>
      <div className="w-full px-6 pt-10 pb-8 lg:px-12">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft size={12} /> Tous les quiz
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent">
            {quiz.theme}
          </span>
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {quiz.questions.length} Q
          </span>
        </div>
        <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-6 text-balance">
          {quiz.title}
        </h1>
        <div className="max-w-2xl">
          <QuizRunner quiz={quiz} />
        </div>
      </div>
    </PageShell>
  )
}
