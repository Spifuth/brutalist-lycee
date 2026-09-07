import type { Metadata } from "next"
import Link from "next/link"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Section, CodeBlock, Callout, KeyList, List, P } from "@/components/primitives"

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Du clic au serveur : comment circulent les données sur Internet, expliqué simplement.",
}

export default function CommentCaMarchePage() {
  return (
    <PageShell>
      <PageHeader
        index="RESEAU / 040"
        command="traceroute internet"
        title="Comment ça marche"
        description="Que se passe-t-il vraiment quand tu tapes une adresse et appuies sur Entrée ?"
      />

      <Section title="Du clic au serveur" eyebrow="// requete" id="requete">
        <P>
          Quand tu visites un site, ton appareil envoie une <strong>requête</strong> qui traverse
          plusieurs équipements avant d'atteindre un serveur, qui renvoie la page.
        </P>
        <CodeBlock
          label="parcours-donnee"
          code={`toi -> box/wifi -> fournisseur d'acces -> routeurs -> serveur
     <----------------- reponse ------------------`}
        />
        <P>
          Ce schéma cache le plus intéressant : à chaque étape, quelqu&apos;un de différent peut
          voir quelque chose de différent.{" "}
          <Link href="/voyage" className="text-accent underline underline-offset-2">
            Déroule le voyage étape par étape
          </Link>{" "}
          pour voir qui lit quoi, et à partir de quand plus personne ne lit rien.
        </P>
      </Section>

      <Section title="Le vocabulaire de base" eyebrow="// glossaire" id="glossaire">
        <KeyList
          items={[
            { term: "Adresse IP", desc: "Le numéro qui identifie un appareil sur le réseau." },
            { term: "DNS", desc: "L'annuaire qui traduit un nom de site en adresse IP." },
            { term: "HTTP / HTTPS", desc: "Le langage des échanges web ; HTTPS est chiffré." },
            { term: "Serveur", desc: "Un ordinateur qui répond aux requêtes des autres." },
            { term: "Paquet", desc: "Un petit morceau de donnée qui voyage sur le réseau." },
          ]}
        />
      </Section>

      <Section title="Pourquoi HTTPS est important" eyebrow="// chiffrement" id="https">
        <P>
          Le petit cadenas signifie que la connexion est <strong>chiffrée</strong> : personne entre
          toi et le site ne peut lire ce qui circule. Attention, cela ne garantit pas que le site
          est honnête, seulement que la connexion est protégée.
        </P>
        <Callout tone="warning" title="Wi-Fi public">
          Sur un réseau public, privilégie toujours les sites en HTTPS et évite de te connecter à
          des comptes sensibles.
        </Callout>
      </Section>

      <Section title="Où sont tes données ?" eyebrow="// donnees" id="donnees">
        <List
          items={[
            "Sur tes appareils (téléphone, ordinateur).",
            "Sur les serveurs des services que tu utilises.",
            "Dans des sauvegardes, parfois à l'autre bout du monde.",
            "Parfois copiées sans que tu le saches, d'où l'importance de la vie privée.",
          ]}
        />
      </Section>
    </PageShell>
  )
}
