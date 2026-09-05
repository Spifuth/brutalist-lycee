import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { LiveQuiz } from "@/components/quiz/live-quiz"

export const metadata: Metadata = {
  title: "Quiz en direct",
  description: "Un quiz synchronisé façon Kahoot, joué en temps réel avec le reste de la classe.",
}

export default function LivePage() {
  return (
    <PageShell>
      <PageHeader
        index="LIVE / 071"
        command="quiz --live --room classe"
        title="Quiz en direct"
        description="Réponds vite, marque des points, grimpe au classement. Les autres joueurs sont de vrais élèves connectés en même temps que toi."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        <LiveQuiz />
      </section>
    </PageShell>
  )
}
