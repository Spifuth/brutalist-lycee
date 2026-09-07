import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Callout, P } from "@/components/primitives"
import { PixelCanvas } from "@/components/pixelwar/pixel-canvas"
import { WipeButton } from "@/components/pixelwar/wipe-button"
import { getSessionUser } from "@/lib/auth"
import { CANVAS_WIDTH, CANVAS_HEIGHT, COOLDOWN_MS } from "@/lib/pixelwar"

export const metadata: Metadata = {
  title: "PixelWar",
  description: "Une toile partagée. Un pixel toutes les cinq secondes, et tout le monde dessine dessus en même temps.",
}

// The canvas is read live from the database on every request; nothing here can
// be cached.
export const dynamic = "force-dynamic"

export default async function PixelWarPage() {
  const user = await getSessionUser()

  return (
    <PageShell flat>
      <PageHeader
        index="PIXELWAR / 300"
        command="paint --shared"
        title="PixelWar"
        description={`Une grille de ${CANVAS_WIDTH} × ${CANVAS_HEIGHT} cases que toute la classe partage. Un pixel toutes les ${COOLDOWN_MS / 1000} secondes chacun — seul, on ne fait rien ; à trente, on fait une image.`}
      />

      <section className="w-full px-6 pb-8 lg:px-12">
        <PixelCanvas signedIn={Boolean(user)} />
      </section>

      <section className="w-full px-6 pb-16 lg:px-12">
        <div className="flex max-w-3xl flex-col gap-5">
          <h2 className="font-mono text-lg font-bold uppercase tracking-wide border-b-2 border-foreground pb-2">
            Comment ça marche
          </h2>
          <P>
            Chaque pixel posé est envoyé au serveur, écrit en base, puis renvoyé à tous les
            navigateurs connectés. Personne ne recharge la page : elle reçoit les changements au fil
            de l&apos;eau par un flux ouvert en permanence.
          </P>
          <Callout tone="info" title="Une seule requête par seconde, pour toute la classe">
            Si chaque navigateur interrogeait la base de son côté, trente élèves feraient trente
            requêtes par seconde. Ici le serveur regarde une fois ce qui a changé et distribue le
            résultat à tout le monde — c&apos;est le même mécanisme que le quiz en direct, et
            c&apos;est la différence entre un site qui tient une classe et un site qui tombe.
          </Callout>
          <Callout tone="tip" title="Le délai fait le jeu">
            Cinq secondes entre deux pixels, ça paraît pénible. C&apos;est ce qui force à
            s&apos;organiser : à ce rythme, une image un peu grande n&apos;est faisable qu&apos;à
            plusieurs, en se mettant d&apos;accord. C&apos;est exactement le principe de r/place, où
            des millions de personnes ont dessiné ensemble sur une toile commune.
          </Callout>
          {user?.isAdmin && (
            <div className="border-2 border-destructive p-4 flex flex-col gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-destructive">
                console — visible seulement pour toi
              </span>
              <WipeButton />
            </div>
          )}
        </div>
      </section>
    </PageShell>
  )
}
