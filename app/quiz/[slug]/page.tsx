// One quiz, played: the server fetches it, <QuizRunner> plays it.
//
// The whole quiz is handed to a Client Component as a prop, and that prop
// includes `correct`, the index of the right answer for every question. So the
// answer key reaches the browser before the student answers question one, and
// anyone who opens the devtools can read it. This is not an oversight left
// lying around: grading happens in components/quiz/quiz-runner.tsx, in the
// browser, which is what makes the quiz instant and indifferent to a bad
// connection, and a classroom quiz is not an exam.
//
// The rule to carry away is the general one. Every prop passed to a
// "use client" component is serialised and sent, so choose what crosses that
// boundary on purpose. When a value must not be known, keep the check on the
// server and send back only the verdict -- app/actions/engage.ts does exactly
// that for the hunt codes, which is why those never travel.

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
