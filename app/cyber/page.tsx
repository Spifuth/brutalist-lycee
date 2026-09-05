import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Section, CodeBlock, Callout, KeyList, List, P } from "@/components/primitives"

export const metadata: Metadata = {
  title: "Cyber",
  description: "Les bases de la cybersécurité : menaces courantes, mots de passe, phishing et bons réflexes.",
}

export default function CyberPage() {
  return (
    <PageShell>
      <PageHeader
        index="CYBER / 010"
        command="nmap --friendly localhost"
        title="Cybersécurité"
        description="Comprendre les menaces du quotidien et adopter les bons réflexes, sans être expert·e."
      />

      <Section title="C'est quoi la cybersécurité ?" eyebrow="// definition" id="intro">
        <P>
          La cybersécurité, c'est l'ensemble des moyens pour protéger les ordinateurs, les
          téléphones, les réseaux et surtout les données des personnes. Ce n'est pas réservé aux
          experts : la plupart des attaques réussissent à cause d'un geste humain, pas d'un exploit
          de génie.
        </P>
        <Callout tone="info" title="Idée reçue">
          « Je n'ai rien à cacher » ne veut pas dire « je n'ai rien à protéger ». Tes comptes, tes
          photos et ton identité ont de la valeur pour quelqu'un de malveillant.
        </Callout>
      </Section>

      <Section title="Les menaces les plus courantes" eyebrow="// threats" id="menaces">
        <KeyList
          items={[
            { term: "Phishing", desc: "Un faux message qui imite une marque pour voler tes identifiants." },
            { term: "Malware", desc: "Un logiciel malveillant installé sans que tu le saches." },
            { term: "Ransomware", desc: "Un programme qui chiffre tes fichiers et réclame une rançon." },
            { term: "Ingénierie sociale", desc: "Manipuler une personne pour qu'elle donne un accès." },
            { term: "Fuite de données", desc: "Des mots de passe volés lors du piratage d'un site." },
          ]}
        />
      </Section>

      <Section title="Des mots de passe solides" eyebrow="// passwords" id="mots-de-passe">
        <P>
          Un bon mot de passe est <strong>long</strong> et <strong>unique</strong>. Une phrase de
          passe de plusieurs mots est plus facile à retenir et plus difficile à casser qu'un
          « P@ssw0rd! » compliqué mais court.
        </P>
        <List
          ordered
          items={[
            "Une phrase de passe de 4 mots minimum : « orage-cobalt-lynx-ardoise ».",
            "Un mot de passe différent par compte important.",
            "Un gestionnaire de mots de passe pour tout retenir à ta place.",
            "La double authentification (2FA) sur les comptes sensibles.",
          ]}
        />
        <Callout tone="tip" title="Teste l'idée">
          Plus un mot de passe est long, plus le nombre de combinaisons explose. C'est la longueur
          qui compte le plus, pas les symboles bizarres.
        </Callout>
      </Section>

      <Section title="Repérer un message piégé" eyebrow="// phishing" id="phishing">
        <P>
          Avant de cliquer, prends trois secondes. Les arnaques jouent sur l'urgence et l'émotion.
        </P>
        <CodeBlock
          label="signes-suspects.txt"
          code={`[!] "Votre compte sera supprimé dans 24h"      -> urgence
[!] expediteur : securite@amaz0n-support.co    -> domaine bizarre
[!] "Cliquez ici pour vérifier vos informations" -> lien douteux
[!] fautes d'orthographe et logo flou          -> negligence
[!] on vous promet un cadeau / un gain          -> trop beau`}
        />
        <Callout tone="warning" title="Le bon réflexe">
          En cas de doute, n'utilise jamais le lien du message. Va directement sur le site officiel
          en tapant l'adresse toi-même.
        </Callout>
      </Section>

      <Section title="Pour t'exercer" eyebrow="// next" id="exercice">
        <P>
          Passe le <strong>quiz cybersécurité</strong> pour tester tes réflexes, ou ouvre le
          terminal pour manipuler quelques commandes en toute sécurité.
        </P>
      </Section>
    </PageShell>
  )
}
