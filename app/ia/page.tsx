import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Section, CodeBlock, Callout, KeyList, List, P } from "@/components/primitives"

export const metadata: Metadata = {
  title: "Intelligence artificielle",
  description: "Comment fonctionne une IA générative, ce qu'elle sait faire, ses limites et ses usages responsables.",
}

export default function IaPage() {
  return (
    <PageShell>
      <PageHeader
        index="IA / 020"
        command="ollama run comprendre-lia"
        title="Intelligence artificielle"
        description="Derrière la magie apparente, une IA reste un programme qui calcule des probabilités."
      />

      <Section title="Une IA, comment ça marche ?" eyebrow="// modele" id="modele">
        <P>
          Une IA générative comme un chatbot est un <strong>modèle de langage</strong> entraîné sur
          d'énormes quantités de textes. Elle a appris à prédire le mot suivant le plus probable.
          Elle ne « comprend » pas comme un humain : elle calcule.
        </P>
        <KeyList
          items={[
            { term: "Données", desc: "Des milliards de textes utilisés pour l'entraînement." },
            { term: "Modèle", desc: "Un réseau de neurones avec des milliards de paramètres." },
            { term: "Prompt", desc: "Ta consigne : la qualité de la réponse en dépend beaucoup." },
            { term: "Token", desc: "Un morceau de mot ; l'IA travaille token par token." },
          ]}
        />
      </Section>

      <Section title="Ce qu'elle sait (et ne sait pas) faire" eyebrow="// limites" id="limites">
        <P>Une IA est très forte pour reformuler, résumer, traduire, coder. Mais attention :</P>
        <List
          items={[
            "Elle peut inventer des informations fausses avec assurance : ce sont les hallucinations.",
            "Elle n'a pas de conscience ni d'intention.",
            "Ses connaissances s'arrêtent à une certaine date.",
            "Elle reproduit parfois les biais présents dans ses données.",
          ]}
        />
        <Callout tone="warning" title="Vérifie toujours">
          Ne prends jamais une réponse d'IA pour argent comptant, surtout pour un devoir, une info
          médicale ou juridique. Recoupe avec une source fiable.
        </Callout>
      </Section>

      <Section title="Bien écrire une consigne" eyebrow="// prompt" id="prompt">
        <P>Un bon prompt est précis : contexte, objectif, format attendu.</P>
        <CodeBlock
          label="prompt-exemple.txt"
          prompt
          code={`Explique la photosynthèse a un eleve de seconde,
en 5 phrases maximum, avec une analogie simple.`}
        />
        <Callout tone="tip" title="Astuce">
          Demande à l'IA d'expliquer son raisonnement, ou de proposer plusieurs versions. Tu gardes
          le contrôle et l'esprit critique.
        </Callout>
      </Section>

      <Section title="IA et travail scolaire" eyebrow="// ethique" id="ethique">
        <P>
          Utiliser l'IA pour comprendre, s'entraîner ou se faire expliquer, c'est utile. Lui faire
          faire le travail à ta place, c'est se priver d'apprendre — et souvent, ça se voit.
        </P>
      </Section>
    </PageShell>
  )
}
