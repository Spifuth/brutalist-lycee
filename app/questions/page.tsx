import type { Metadata } from "next"
import Link from "next/link"
import { Radio } from "lucide-react"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { QuestionsWall } from "@/components/questions/questions-wall"

export const metadata: Metadata = {
  title: "Questions",
  description: "Un mur de questions anonymes : pose ta question et vote pour celles des autres.",
}

export default function QuestionsPage() {
  return (
    <PageShell>
      <PageHeader
        index="Q&A / 080"
        command="ask --anonymous"
        title="Mur de questions"
        description="Aucune question n'est bête. Pose la tienne anonymement et fais remonter celles qui t'intéressent."
      />
      <section className="w-full px-6 pb-4 lg:px-12">
        <Link
          href="/questions-live"
          className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-accent hover:underline mb-6"
        >
          <Radio size={12} className="animate-blink" /> Voir le flux en direct →
        </Link>
        <QuestionsWall />
      </section>
    </PageShell>
  )
}
