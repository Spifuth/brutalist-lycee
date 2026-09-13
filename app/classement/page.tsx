// The hunt leaderboard: fifty rows, queried and rendered on the server.
//
// /docs/ce-site/chargement uses this exact page as its worked example, with
// measurements taken off the running site: the pseudos and the points are
// written into the HTML before it leaves the server, which is why the table
// still appears with JavaScript switched off. Compare /pixelwar, whose HTML
// arrives with an empty <canvas> and nothing else.
//
// It calls getLeaderboard() from app/actions/engage.ts, a file marked
// "use server", and that deserves a second look. Awaiting a server action
// during a server render works fine, but every export of a "use server" file
// is also published as an endpoint the browser may call. Harmless here -- a
// public leaderboard is public -- yet the habit worth keeping is that a read
// helper only server components need belongs in lib/, where lib/content.ts
// imports "server-only" to turn leaking it into a build error rather than a
// surprise.

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
