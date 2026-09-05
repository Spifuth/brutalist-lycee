import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Section, Callout, KeyList, List, P } from "@/components/primitives"

export const metadata: Metadata = {
  title: "Parcours",
  description: "Les voies d'études après le bac STI2D SIN pour aller vers l'informatique et la cybersécurité.",
}

export default function ParcoursPage() {
  return (
    <PageShell>
      <PageHeader
        index="PARCOURS / 050"
        command="paths --after bac"
        title="Parcours d'études"
        description="Après un bac STI2D spécialité SIN, plusieurs routes mènent au numérique et à la cyber."
      />

      <Section title="Le bac STI2D SIN" eyebrow="// depart" id="sin">
        <P>
          La spécialité <strong>SIN</strong> (Systèmes d'Information et Numérique) aborde le codage,
          les réseaux, l'électronique et les objets connectés. C'est une bonne rampe de lancement
          vers les études supérieures du numérique.
        </P>
      </Section>

      <Section title="Les voies possibles après le bac" eyebrow="// voies" id="voies">
        <KeyList
          items={[
            { term: "BTS (2 ans)", desc: "SIO, CIEL : rapide, professionnalisant, poursuite possible." },
            { term: "BUT (3 ans)", desc: "Informatique, Réseaux & Télécoms : équilibre théorie/pratique." },
            { term: "Prépa (2 ans)", desc: "Voie vers les écoles d'ingénieur, plus théorique." },
            { term: "École d'ingénieur", desc: "Post-bac ou post-prépa, spécialisation cyber possible." },
            { term: "Université", desc: "Licence puis master informatique ou cybersécurité." },
          ]}
        />
        <Callout tone="info" title="Pas de voie unique">
          On peut devenir expert·e en cybersécurité en passant par un BTS comme par une école
          d'ingénieur. L'important est de continuer à apprendre.
        </Callout>
      </Section>

      <Section title="Se construire un profil" eyebrow="// conseils" id="conseils">
        <List
          ordered
          items={[
            "Bidouille des projets perso : un petit site, un script, un Raspberry Pi.",
            "Participe à des challenges (CTF) accessibles aux débutants.",
            "Suis l'actualité cyber : elle bouge très vite.",
            "Soigne ton anglais technique.",
            "Garde une hygiène numérique exemplaire : montre l'exemple.",
          ]}
        />
      </Section>

      <Section title="Ressources" eyebrow="// next" id="ressources">
        <P>
          La page <strong>Pour aller plus loin</strong> rassemble des sites, chaînes et podcasts
          pour continuer à explorer par toi-même.
        </P>
      </Section>
    </PageShell>
  )
}
