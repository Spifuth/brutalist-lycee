import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Callout, P } from "@/components/primitives"
import { DataJourney } from "@/components/cyber/data-journey"

export const metadata: Metadata = {
  title: "Le voyage d'une donnée",
  description:
    "Ce qui se passe entre le moment où tu tapes une adresse et celui où la page s'affiche — et qui peut voir quoi en chemin.",
}

export default function VoyagePage() {
  return (
    <PageShell>
      <PageHeader
        index="RESEAU / 101"
        command="traceroute lycee.nebulahost.tech"
        title="Le voyage d'une donnée"
        description="Entre le moment où tu tapes une adresse et celui où la page s'affiche, il se passe sept choses. Déroule-les, et regarde à chaque étape qui peut voir quoi."
      />

      <section className="w-full px-6 pb-8 lg:px-12">
        <DataJourney />
      </section>

      <section className="w-full px-6 pb-16 lg:px-12">
        <div className="flex max-w-3xl flex-col gap-5">
          <h2 className="font-mono text-lg font-bold uppercase tracking-wide border-b-2 border-foreground pb-2">
            Ce qu&apos;il faut retenir
          </h2>
          <P>
            Le cadenas du navigateur protège <strong>le contenu</strong> de ta conversation avec un
            site : ce que tu envoies, ce que tu reçois, tes mots de passe, tes cookies. Personne sur
            le trajet ne peut les lire.
          </P>
          <P>
            Il ne cache pas <strong>la destination</strong>. Ton opérateur, et n&apos;importe qui
            sur le même Wi-Fi, savent quels sites tu ouvres — d&apos;abord parce que la question DNS
            part en clair, ensuite parce que le nom du site voyage en clair au tout début de la
            négociation chiffrée.
          </P>
          <Callout tone="warning" title="C'est exactement ce que vendent les VPN">
            Un VPN ne « chiffre pas Internet » : le trafic était déjà chiffré. Il déplace la
            question, en cachant la destination à ton opérateur — et en la montrant au fournisseur
            du VPN à la place. Ça peut être un bon échange, ou non, selon à qui tu fais le plus
            confiance. Il y a un article là-dessus dans les docs.
          </Callout>
          <Callout tone="tip" title="Le vrai risque du Wi-Fi public n'est pas l'écoute">
            Avec HTTPS partout, quelqu&apos;un sur le même réseau ne lit pas tes messages. Ce
            qu&apos;il peut faire, c&apos;est te <strong>rediriger</strong> : monter un faux point
            d&apos;accès, répondre à ta place aux questions DNS, et t&apos;emmener sur une copie du
            site. D&apos;où le réflexe : vérifier le nom de domaine, pas le cadenas.
          </Callout>
        </div>
      </section>
    </PageShell>
  )
}
