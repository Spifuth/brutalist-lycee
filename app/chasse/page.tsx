import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { HuntBoard } from "@/components/hunt/hunt-board"
import { HuntPlacements } from "@/components/hunt/placements"
import { getPlacedCodes } from "@/lib/secret-placements"

export const metadata: Metadata = {
  title: "Chasse aux secrets",
  description: "Trouve les codes cachés sur le site, valide-les et grimpe au classement.",
}

// Trois cachettes vivent sur cette page (texte masqué en CSS, clé de
// localStorage, créneau de minuit) et une quatrième part d'ici vers
// /api/decoy. Les codes sont lus en base : le dépôt est public, les écrire
// ici reviendrait à publier les réponses à côté des énigmes.
export const dynamic = "force-dynamic"

export default async function ChassePage() {
  const codes = await getPlacedCodes(["hidden-css", "timing", "local-storage"])

  return (
    <PageShell>
      <PageHeader
        index="./chasse"
        command="sudo find / -name secret"
        title="Chasse aux secrets"
        description="Des codes sont dissimulés partout sur le site. Trouve-les, valide-les ici et gagne des points."
      />
      <div className="px-6 pb-16 lg:px-12">
        {/* SIN-CSS-DISPLAY-NONE : hors de l'écran, pas hors de la page. Un
            Ctrl+A ou un coup d'œil au code source le ramène. aria-hidden pour
            qu'un lecteur d'écran n'énonce pas une suite de lettres absurde. */}
        {codes["hidden-css"] && (
          <span aria-hidden="true" className="absolute left-[-9999px] select-text font-mono">
            {codes["hidden-css"]}
          </span>
        )}
        <HuntBoard />
        <HuntPlacements timing={codes.timing} storage={codes["local-storage"]} />
      </div>
    </PageShell>
  )
}
