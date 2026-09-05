import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { HuntBoard } from "@/components/hunt/hunt-board"

export const metadata: Metadata = {
  title: "Chasse aux secrets",
  description: "Trouve les codes cachés sur le site, valide-les et grimpe au classement.",
}

export default function ChassePage() {
  return (
    <PageShell>
      <PageHeader
        index="./chasse"
        command="sudo find / -name secret"
        title="Chasse aux secrets"
        description="Des codes sont dissimulés partout sur le site. Trouve-les, valide-les ici et gagne des points."
      />
      <div className="px-6 pb-16 lg:px-12">
        <HuntBoard />
      </div>
    </PageShell>
  )
}
