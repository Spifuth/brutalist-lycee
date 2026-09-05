"use client"

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
