import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { AdminConsole } from "@/components/admin/admin-console"
import { getPlacedCodes } from "@/lib/secret-placements"

export const metadata: Metadata = {
  title: "Console admin",
  description: "Console de suivi de l'intervention : statistiques, votes et modération des questions.",
  robots: { index: false, follow: false },
}

// SIN-ADMIN : « certains chemins d'URL sont tellement prévisibles qu'on les
// essaie en premier ». Le code est dans la page, donc dans le code source de
// quiconque a pensé à essayer /admin — la console elle-même reste protégée,
// c'est l'adresse qui était l'énigme.
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const codes = await getPlacedCodes(["admin-path"])

  return (
    <PageShell>
      <PageHeader
        index="ADMIN / 100"
        command="sudo console --room"
        title="Console admin"
        description="Suivi en direct de la session : vue d'ensemble, résultats des votes et file de modération."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        {codes["admin-path"] && (
          <p className="mb-4 border-2 border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            tu as trouvé la page : {codes["admin-path"]}
          </p>
        )}
        <AdminConsole />
      </section>
    </PageShell>
  )
}
