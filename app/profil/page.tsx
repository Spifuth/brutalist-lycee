import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { ProfileView } from "@/components/profile/profile-view"

export const metadata: Metadata = {
  title: "Profil",
  description: "Ta carte d'identité locale : questionnaires, badges et avatar.",
}

export default function ProfilPage() {
  return (
    <PageShell>
      <PageHeader
        index="PROFIL / 090"
        command="whoami --full"
        title="Mon profil"
        description="Toutes tes données restent dans ce navigateur. Rien n'est envoyé sur un serveur."
      />
      <section className="w-full px-6 pb-8 lg:px-12">
        <ProfileView />
      </section>
    </PageShell>
  )
}
