"use client"

// The console's landing tab: nine counters, fetched once when it mounts.
//
// It is the smallest example of the pattern every file in this folder uses,
// so it is the one to read first. `getAdminStats` is imported from
// app/actions/admin.ts, a file whose first line is "use server"; the import
// does not put that code in the browser. Next compiles it into a stub that
// POSTs to the server and awaits the answer -- that is a *server action*.
// There is no fetch() to write, no /api route to invent and no URL to keep in
// sync on two sides, because the network call is generated. What is left to
// get right is the door on the other side, which is why getAdminStats opens
// with `await requireAdmin()`: a call the browser can make is a call anyone
// can make.
//
// The nine counters are one SELECT of nine sub-selects, not nine queries.
// Nine round trips cost nine latencies; one costs one.
//
// `.catch(() => {})` is worth reading twice. It stops the rejection, but
// `stats` stays null, so a failed load renders exactly like a slow one --
// "Chargement des statistiques..." for as long as anyone is willing to wait.
// Swallowing an error and having no error state are the same bug.

import { useEffect, useState } from "react"
import { getAdminStats, type AdminStats } from "@/app/actions/admin"
import { StatGrid } from "@/components/admin/ui"

export function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {})
  }, [])

  if (!stats) {
    return <p className="font-mono text-sm text-muted-foreground">Chargement des statistiques...</p>
  }

  return (
    <div>
      <StatGrid
        stats={[
          { label: "Comptes", value: stats.users },
          { label: "Actifs", value: stats.active },
          { label: "Suspendus", value: stats.suspended },
          { label: "Badges décernés", value: stats.badgesAwarded },
          { label: "Quiz terminés", value: stats.quizAttempts },
          { label: "Votes", value: stats.votes },
          { label: "Questions en attente", value: stats.pendingQuestions },
          { label: "Secrets", value: stats.secrets },
          { label: "Codes validés", value: stats.redemptions },
        ]}
      />
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        {"// chiffres réels, lus directement depuis la base Postgres"}
      </p>
    </div>
  )
}
