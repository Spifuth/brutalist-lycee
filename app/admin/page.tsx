import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { AdminConsole } from "@/components/admin/admin-console"

export const metadata: Metadata = {
  title: "Console admin",
  description: "Console de suivi de l'intervention : statistiques, votes et modération des questions.",
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <PageShell>
      <PageHeader
        index="ADMIN / 100"
        command="sudo console --room"
        title="Console admin"
        description="Suivi en direct de la session : vue d'ensemble, résultats des votes et file de modération."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        <AdminConsole />
      </section>
    </PageShell>
  )
}
