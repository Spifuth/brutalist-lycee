// The admin route: a Server Component whose only job is to hand over to
// <AdminConsole>.
//
// The route is not access control. It renders for anybody; the "Accès
// restreint" screen lives inside the client console and, as that file says in
// its own header, hides the console without protecting it. What protects it is
// requireAdmin() inside each server action in app/actions/admin.ts -- those
// are the things a browser can actually call. Hiding a control is
// presentation; checking on the server is authorisation, and only the second
// one survives someone who reads your JavaScript.

import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { AdminConsole } from "@/components/admin/admin-console"
import { getPlacedCodes } from "@/lib/secret-placements"

export const metadata: Metadata = {
  title: "Console admin",
  description: "Console de suivi de l'intervention : statistiques, votes et modération des questions.",
  robots: { index: false, follow: false },
}

// SIN-ADMIN: "some URL paths are so predictable that they get tried first".
// The code is in the page, and therefore in the page source of anyone who
// thought to try /admin -- the console itself stays protected, it was the
// address that was the riddle.
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
