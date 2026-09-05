import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Section, Callout, KeyList, List, P } from "@/components/primitives"

export const metadata: Metadata = {
  title: "Métiers",
  description: "Panorama des métiers de la cybersécurité et du numérique, avec leurs missions concrètes.",
}

const JOBS = [
  { term: "Analyste SOC", desc: "Surveille les alertes de sécurité et réagit aux incidents en temps réel." },
  { term: "Pentester", desc: "Attaque légalement des systèmes pour trouver les failles avant les pirates." },
  { term: "Analyste forensic", desc: "Enquête après une attaque : reconstitue ce qui s'est passé." },
  { term: "Ingénieur·e réseau", desc: "Conçoit et sécurise l'infrastructure qui fait circuler les données." },
  { term: "Développeur·se", desc: "Écrit les programmes et pense la sécurité dès la conception." },
  { term: "Data scientist", desc: "Analyse les données et entraîne des modèles d'IA." },
]

export default function MetiersPage() {
  return (
    <PageShell>
      <PageHeader
        index="METIERS / 030"
        command="jobs --field cyber,numerique"
        title="Métiers du numérique"
        description="Le numérique recrute, et la cybersécurité manque de bras. Voici quelques pistes concrètes."
      />

      <Section title="Un secteur qui recrute" eyebrow="// contexte" id="contexte">
        <P>
          Des dizaines de milliers de postes sont à pourvoir en cybersécurité en France. On peut y
          arriver par des voies très variées : école d'ingénieur, BUT, BTS, université, mais aussi
          en reconversion.
        </P>
        <Callout tone="info" title="Bon à savoir">
          Il n'existe pas un seul profil « type ». Curiosité, rigueur et envie d'apprendre comptent
          autant que les maths.
        </Callout>
      </Section>

      <Section title="Quelques métiers" eyebrow="// roles" id="roles">
        <KeyList items={JOBS} />
      </Section>

      <Section title="Des qualités utiles" eyebrow="// skills" id="qualites">
        <List
          items={[
            "La curiosité : vouloir comprendre comment les choses marchent.",
            "La rigueur : un détail peut tout changer en sécurité.",
            "La communication : expliquer un risque à des non-experts.",
            "L'éthique : un grand pouvoir implique de grandes responsabilités.",
            "L'anglais : la plupart de la documentation technique est en anglais.",
          ]}
        />
      </Section>

      <Section title="Et après le lycée ?" eyebrow="// next" id="apres">
        <P>
          La section <strong>Parcours</strong> détaille les études possibles après le bac,
          notamment après un bac STI2D spécialité SIN.
        </P>
      </Section>
    </PageShell>
  )
}
