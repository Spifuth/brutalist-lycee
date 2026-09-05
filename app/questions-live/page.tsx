import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { LiveQuestions } from "@/components/questions/live-questions"

export const metadata: Metadata = {
  title: "Questions en direct",
  description:
    "Le mur des questions validées, mis à jour en temps réel, avec leur nombre de réactions.",
}

export default function QuestionsLivePage() {
  return (
    <PageShell>
      <PageHeader
        index="LIVE / 081"
        command="tail -f questions.log"
        title="Questions en direct"
        description="Les questions validées par l'intervenant·e apparaissent ici en temps réel. Réagis et regarde les totaux évoluer en direct."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        <LiveQuestions />
      </section>
    </PageShell>
  )
}
