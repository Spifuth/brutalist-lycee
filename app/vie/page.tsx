// Conway's Game of Life, reachable only by typing `life` in the /terminal
// sandbox.
//
// The interesting line here is the one that is missing. This page has no
// `export const dynamic = "force-dynamic"`, and `pnpm build` still prints /vie
// with an f rather than a circle: awaiting `searchParams` is enough on its own
// to opt a page out of static rendering, because a query string is by
// definition unknown at build time. cookies() and headers() do the same. You
// do not always have to ask for dynamic rendering -- sometimes you acquire it
// by touching something that only exists per request, which is also how a page
// silently stops being cacheable.
//
// ?debug=true prints a hunt code. Because this is a Server Component, that
// code is not in the JavaScript the browser downloads: after a build, grep
// .next/static for SIN-DEBUG-PARAM and it is absent, while the same grep over
// .next/server finds it. app/secret/page.tsx does the opposite, on purpose,
// and the pair is the shortest demonstration of what the directive changes.

import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Callout, KeyList, P } from "@/components/primitives"
import { GameOfLife } from "@/components/vie/game-of-life"
import { VIE_SECRET_CODE } from "@/lib/vie-secret"

// Not in NAV_ITEMS, not in SITEMAP, not indexed: this page is reached by
// typing `life` in the terminal, and that is the point. Same posture as
// /admin, for a different reason.
export const metadata: Metadata = {
  title: "Le jeu de la vie",
  description: "Quatre règles, aucune stratégie, et pourtant des formes qui marchent.",
  robots: { index: false, follow: false },
}

export default async function ViePage({
  searchParams,
}: {
  searchParams: Promise<{ debug?: string }>
}) {
  const { debug } = await searchParams

  return (
    <PageShell>
      <PageHeader
        index="VIE / 404"
        command="life"
        title="Le jeu de la vie"
        description="Une grille, quatre règles, et personne aux commandes. John Conway l'a inventé en 1970 — ce n'est pas un jeu auquel on joue, c'est un jeu qu'on regarde."
      />

      <section className="w-full px-6 pb-8 lg:px-12">
        <GameOfLife />
      </section>

      <section className="w-full px-6 pb-12 lg:px-12">
        <div className="flex max-w-3xl flex-col gap-5">
          <h2 className="font-mono text-lg font-bold uppercase tracking-wide border-b-2 border-foreground pb-2">
            Les quatre règles
          </h2>
          <P>
            À chaque génération, chaque case regarde ses huit voisines et applique la même règle.
            Toutes les cases changent en même temps.
          </P>
          <KeyList
            items={[
              { term: "Solitude", desc: "Une cellule vivante entourée de moins de deux voisines meurt." },
              { term: "Survie", desc: "Avec deux ou trois voisines, elle reste vivante." },
              { term: "Surpopulation", desc: "Avec plus de trois voisines, elle meurt." },
              { term: "Naissance", desc: "Une case vide entourée d'exactement trois voisines devient vivante." },
            ]}
          />
          <Callout tone="tip" title="Personne n'a programmé le planeur">
            Aucune des quatre règles ne parle de planeur, de pulsar ni de canon. Ces formes ne sont
            écrites nulle part : elles apparaissent toutes seules à partir des quatre lignes
            ci-dessus. C&apos;est ce qu&apos;on appelle un comportement émergent, et c&apos;est
            exactement ce qui rend cet automate cellulaire célèbre depuis cinquante ans.
          </Callout>
          <Callout tone="info" title="Turing-complet, avec des points">
            Le jeu de la vie peut simuler n&apos;importe quel calcul qu&apos;un ordinateur peut
            faire — on a construit des additionneurs, de la mémoire, et même le jeu de la vie
            dans le jeu de la vie. Avec des cases qui s&apos;allument.
          </Callout>
        </div>
      </section>

      {debug === "true" && (
        <section className="w-full px-6 pb-16 lg:px-12">
          <div className="max-w-3xl border-2 border-foreground">
            <div className="border-b-2 border-foreground bg-muted px-4 py-2 text-[10px] font-mono uppercase tracking-widest font-bold">
              debug panel
            </div>
            <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-foreground/90">
              {[
                "[debug] grid       64x36 (torique)",
                "[debug] rule       B3/S23",
                "[debug] renderer   canvas2d",
                `[debug] flag       ${VIE_SECRET_CODE}`,
                "[debug] warn       panneau de debug actif en production",
              ].join("\n")}
            </pre>
          </div>
        </section>
      )}
    </PageShell>
  )
}
