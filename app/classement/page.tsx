import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Leaderboard } from "@/components/hunt/leaderboard"
import { getLeaderboard } from "@/app/actions/engage"

export const metadata: Metadata = {
  title: "Classement",
  description: "Le classement des chasseurs de secrets : points, secrets trouvés et badges.",
}

export const dynamic = "force-dynamic"

export default async function ClassementPage() {
  const rows = await getLeaderboard(50)
  return (
    <PageShell>
      <PageHeader
        index="./classement"
        command="sort -rn points"
        title="Classement"
        description="Points gagnés via les quiz, les secrets trouvés et les badges. Le top 3 est mis à l'honneur."
      />
      <div className="mx-auto w-full max-w-3xl px-6 pb-16 lg:px-12">
        <Leaderboard rows={rows} />
      </div>
    </PageShell>
  )
}
