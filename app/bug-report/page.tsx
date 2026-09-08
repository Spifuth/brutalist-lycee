import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { ReportForm } from "@/components/report/report-form"
import { DISCORD_CHANNEL } from "@/lib/bug-report"

export const metadata: Metadata = {
  title: "Bug Report",
  description:
    "Un truc cassé, du code dupliqué, une faute, une idée : remplis une fois, poste sur Discord et ouvre l'issue.",
}

export default function BugReportPage() {
  return (
    <PageShell>
      <PageHeader
        index="BUG / 120"
        command="bug --report"
        title="Signaler quelque chose"
        description="Un truc cassé, du code dupliqué, une faute dans un quiz, une idée. Tu remplis une fois : tu obtiens le message à coller sur Discord et une issue GitHub déjà remplie."
      />

      <section className="w-full px-6 pb-10 lg:px-12">
        <div className="max-w-3xl">
          <ReportForm />
        </div>
      </section>

      <section className="w-full px-6 pb-16 lg:px-12">
        <div className="flex max-w-3xl flex-col gap-5">
          <h2 className="border-b-2 border-foreground pb-2 font-mono text-lg font-bold uppercase tracking-wide">
            Ce qui fait un rapport utile
          </h2>
          <ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Une seule chose à la fois.</strong> Deux problèmes
              dans un même rapport, c&apos;est un des deux qui sera oublié.
            </li>
            <li>
              <strong className="text-foreground">Les étapes exactes, dans l&apos;ordre.</strong>{" "}
              C&apos;est la partie la plus utile : personne ne peut réparer ce qu&apos;il n&apos;arrive
              pas à reproduire.
            </li>
            <li>
              <strong className="text-foreground">Le message d&apos;erreur en texte.</strong> F12 →
              Console, puis copier-coller. Une capture d&apos;écran floue ne se cherche pas.
            </li>
            <li>
              <strong className="text-foreground">Aucun nom, photo ou adresse d&apos;un camarade.</strong>{" "}
              Le dépôt est public et une issue ne s&apos;efface pas vraiment.
            </li>
          </ul>

          <h2 className="mt-4 border-b-2 border-foreground pb-2 font-mono text-lg font-bold uppercase tracking-wide">
            Pas de compte GitHub ?
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Colle juste le message dans <span className="text-accent">{DISCORD_CHANNEL}</span>, sur
            le Discord de la classe — pas encore dessus ? demande le lien au prof. C&apos;est déjà
            utile, quelqu&apos;un ouvrira l&apos;issue. Créer un compte GitHub prend deux minutes si
            tu veux suivre ce que devient ton signalement — et c&apos;est le même compte qui te
            permettra de proposer une correction toi-même.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Si tu ouvres quand même un compte : une issue est publique et signée avec ton nom
            GitHub — souvent ton vrai nom — de façon permanente, sur un dépôt lié à la classe.
            Choisis un pseudonyme si ça compte pour toi. Ne poster que sur Discord reste un choix
            parfaitement valable.
          </p>
        </div>
      </section>
    </PageShell>
  )
}
