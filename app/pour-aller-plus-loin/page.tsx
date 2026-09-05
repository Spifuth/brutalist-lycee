import type { Metadata } from "next"
import { ExternalLink } from "lucide-react"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Section, Callout, P } from "@/components/primitives"

export const metadata: Metadata = {
  title: "Pour aller plus loin",
  description: "Ressources, sites, chaînes et podcasts pour continuer à explorer la cyber et le numérique.",
}

interface Resource {
  name: string
  kind: string
  desc: string
}

const SITES: Resource[] = [
  { name: "cybermalveillance.gouv.fr", kind: "site officiel", desc: "Aide et conseils face aux cybermenaces." },
  { name: "CNIL — jeunes", kind: "vie privée", desc: "Comprendre et protéger ses données personnelles." },
  { name: "Root-Me", kind: "plateforme", desc: "Des défis de hacking éthique pour progresser." },
  { name: "France Cyber Sécurité", kind: "orientation", desc: "Panorama des métiers et formations." },
]

const CHANNELS: Resource[] = [
  { name: "Micode", kind: "chaîne vidéo", desc: "Vulgarisation cyber et enquêtes numériques." },
  { name: "Cookie connecté", kind: "chaîne vidéo", desc: "Sécurité et culture numérique accessibles." },
  { name: "Computerphile", kind: "chaîne (EN)", desc: "Concepts informatiques expliqués clairement." },
]

const PODCASTS: Resource[] = [
  { name: "NoLimitSecu", kind: "podcast", desc: "Actualité et sujets de cybersécurité." },
  { name: "Le Comptoir Sécu", kind: "podcast", desc: "Discussions accessibles autour de la sécurité." },
  { name: "Darknet Diaries", kind: "podcast (EN)", desc: "Histoires vraies de hacking et de cybercrime." },
]

function ResourceGrid({ items }: { items: Resource[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 border-2 border-foreground">
      {items.map((r, i) => (
        <div
          key={r.name}
          className={`p-4 border-foreground ${i % 2 === 0 ? "sm:border-r-2" : ""} ${i < items.length - (items.length % 2 === 0 ? 2 : 1) ? "border-b-2" : ""}`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-mono text-sm font-bold">{r.name}</span>
            <ExternalLink size={13} className="text-muted-foreground shrink-0" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-accent">{r.kind}</span>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{r.desc}</p>
        </div>
      ))}
    </div>
  )
}

export default function PlusLoinPage() {
  return (
    <PageShell>
      <PageHeader
        index="RESSOURCES / 060"
        command="curl ressources --list"
        title="Pour aller plus loin"
        description="Une sélection pour prolonger la découverte, à ton rythme et en toute curiosité."
      />

      <Section title="Sites & plateformes" eyebrow="// sites" id="sites">
        <ResourceGrid items={SITES} />
      </Section>

      <Section title="Chaînes vidéo" eyebrow="// video" id="chaines">
        <ResourceGrid items={CHANNELS} />
      </Section>

      <Section title="Podcasts" eyebrow="// audio" id="podcasts">
        <ResourceGrid items={PODCASTS} />
      </Section>

      <Section title="Un dernier conseil" eyebrow="// note" id="note">
        <Callout tone="tip" title="Reste curieux·se">
          <P>
            La meilleure protection, c'est la compréhension. Chaque fois que tu apprends comment une
            chose fonctionne, tu deviens plus difficile à piéger.
          </P>
        </Callout>
      </Section>
    </PageShell>
  )
}
