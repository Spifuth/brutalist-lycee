import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { TerminalPlayground } from "@/components/terminal/terminal-playground"

export const metadata: Metadata = {
  title: "Terminal",
  description: "Un terminal en bac à sable pour découvrir la ligne de commande, sans risque.",
}

export default function TerminalPage() {
  return (
    <PageShell>
      <PageHeader
        index="TERMINAL / 110"
        command="ssh eleve@lycee"
        title="Terminal"
        description="Manipule un vrai terminal. Sans passerelle configurée, tu utilises un bac à sable local en mémoire."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        <TerminalPlayground />
      </section>
    </PageShell>
  )
}
