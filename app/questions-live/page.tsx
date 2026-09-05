import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { LiveQuestions } from "@/components/questions/live-questions"

export const metadata: Metadata = {
  title: "Questions en direct",
  description: "Le flux en direct des questions avec réactions, façon mur live pendant l'intervention.",
}

export default function QuestionsLivePage() {
  return (
    <PageShell>
      <PageHeader
        index="LIVE / 081"
        command="tail -f questions.log"
        title="Questions en direct"
        description="Les questions arrivent en temps réel (simulé). Réagis et suis ce qui a déjà été traité."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        <LiveQuestions />
      </section>
    </PageShell>
  )
}
