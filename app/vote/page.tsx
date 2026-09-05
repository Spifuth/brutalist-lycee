import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { VoteBoard } from "@/components/vote/vote-board"

export const metadata: Metadata = {
  title: "Vote",
  description: "Vote pour les sujets que tu veux voir abordés pendant l'intervention. Jusqu'à 3 choix.",
}

export default function VotePage() {
  return (
    <PageShell>
      <PageHeader
        index="VOTE / 002"
        command="vote --max 3"
        title="Choisis les sujets"
        description="Sélectionne jusqu'à 3 thèmes que tu aimerais voir traités. Les totaux se mettent à jour en direct."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        <VoteBoard />
      </section>
    </PageShell>
  )
}
