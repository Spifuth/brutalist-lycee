import type { Metadata } from "next"
import Link from "next/link"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Section, CodeBlock, Callout, KeyList, List, P } from "@/components/primitives"
import { getPlacedCodes, encodeBase64, demoJwt, fakeApiKey } from "@/lib/secret-placements"

export const metadata: Metadata = {
  title: "Cyber",
  description: "Les bases de la cybersécurité : menaces courantes, mots de passe, phishing et bons réflexes.",
}

// Trois cachettes de la chasse vivent dans la section « Lire ce qui traîne »
// en bas de page. Elles ne sont pas décoratives : chacune illustre une erreur
// réelle — un encodage pris pour un chiffrement, une charge utile de JWT lue
// sans clé, une clé d'API laissée côté client. Les codes viennent de la base ;
// le dépôt est public et ne doit jamais les contenir.
export const dynamic = "force-dynamic"

export default async function CyberPage() {
  const codes = await getPlacedCodes(["base64", "jwt", "api-key"])

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
        <Callout tone="tip" title="Teste l'idée, ne la crois pas sur parole">
          Plus un mot de passe est long, plus le nombre de combinaisons explose — et les symboles
          bizarres comptent beaucoup moins qu'on ne le croit.{" "}
          <Link href="/force-brute" className="text-accent underline underline-offset-2">
            Essaie sur la page « Casser un mot de passe »
          </Link>{" "}
          : tout se calcule dans ton navigateur, rien n'est envoyé.
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

      <Section title="Lire ce qui traîne" eyebrow="// atelier" id="atelier">
        <P>
          Trois choses qu&apos;on croit protégées et qui ne le sont pas. Elles sont ici en vrai,
          avec de fausses valeurs : à toi de les lire.
        </P>

        <P>
          <strong>Encodé n&apos;est pas chiffré.</strong> Le Base64 sert à transporter du texte, pas
          à le cacher : n&apos;importe quel navigateur le décode en une ligne.
        </P>
        {codes.base64 && <CodeBlock label="chaine.b64" code={encodeBase64(codes.base64)} />}

        <P>
          <strong>Un JWT se lit sans clé.</strong> Ses trois parties sont séparées par des points ;
          la deuxième est du Base64. La signature ne protège pas le contenu, elle prouve seulement
          qu&apos;il n&apos;a pas été modifié — celle-ci n&apos;en est pas une.
        </P>
        {codes.jwt && <CodeBlock label="jeton.jwt" code={demoJwt(codes.jwt)} />}

        <P>
          <strong>Une clé écrite côté client est publique.</strong> Tout ce que la page envoie au
          navigateur est lisible : configuration comprise. Regarde le code source de cette page.
        </P>
        {codes["api-key"] && (
          <script
            type="application/json"
            id="app-config"
            // Une fausse clé, jamais une vraie : la faille est illustrée, pas créée.
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({ env: "demo", apiKey: fakeApiKey(codes["api-key"]) }, null, 2),
            }}
          />
        )}

        <Callout tone="warning" title="Ce que ça veut dire">
          Aucun secret ne doit vivre dans une page. S&apos;il est arrivé jusqu&apos;au navigateur,
          il appartient à celui qui regarde.
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
