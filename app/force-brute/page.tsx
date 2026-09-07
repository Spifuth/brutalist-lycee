import type { Metadata } from "next"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { Callout, P } from "@/components/primitives"
import { PasswordLab } from "@/components/cyber/password-lab"

export const metadata: Metadata = {
  title: "Casser un mot de passe",
  description:
    "Combien de temps tient vraiment un mot de passe. Tout se calcule dans ton navigateur, rien n'est envoyé.",
}

export default function ForceBrutePage() {
  return (
    <PageShell>
      <PageHeader
        index="CYBER / 011"
        command="hashcat -a 3"
        title="Casser un mot de passe"
        description="Un attaquant ne devine pas au hasard : il commence par les listes, applique les substitutions évidentes, et ne brute-force qu'en dernier recours. Voilà ce que ça donne."
      />

      <section className="w-full px-6 pb-6 lg:px-12">
        <div className="max-w-3xl mb-6">
          <Callout tone="success" title="Rien ne quitte cette page">
            Tout le calcul se fait dans ton navigateur. Le mot de passe que tu tapes n&apos;est
            envoyé à aucun serveur, n&apos;est enregistré nulle part, et disparaît dès que tu fermes
            l&apos;onglet. Tu peux le vérifier toi-même : ouvre l&apos;onglet Réseau des outils de
            développement et regarde — la page ne fait aucune requête pendant que tu tapes.
          </Callout>
        </div>
        <PasswordLab />
      </section>

      <section className="w-full px-6 pb-16 lg:px-12">
        <div className="flex max-w-3xl flex-col gap-5">
          <h2 className="font-mono text-lg font-bold uppercase tracking-wide border-b-2 border-foreground pb-2">
            Pourquoi « compliqué » ne veut rien dire
          </h2>
          <P>
            L&apos;intuition dit qu&apos;un mot de passe est solide s&apos;il est difficile à
            retenir. C&apos;est faux, et c&apos;est même à peu près l&apos;inverse : ce qui coûte
            cher à un attaquant, c&apos;est la longueur et l&apos;imprévisibilité, pas les
            caractères bizarres.
          </P>
          <P>
            « P@ssw0rd! » a neuf caractères, des majuscules, des chiffres et un symbole. Sur le
            papier, ça fait des milliards de milliards de combinaisons. En vrai, il est trouvé
            immédiatement : « password » est dans toutes les listes, et remplacer a par @ ou o par 0
            fait partie des premières choses qu&apos;un outil de cassage essaie.
          </P>
          <P>
            À l&apos;inverse, quatre mots ordinaires reliés par des tirets font une phrase longue,
            facile à retenir et coûteuse à casser — c&apos;est exactement la forme des phrases de
            passe que ce site distribue.
          </P>
          <Callout tone="warning" title="Ce simulateur est optimiste, et c'est important">
            Il reconnaît les mots de passe très courants, les suites de clavier, les répétitions,
            les années et les mots du dictionnaire qu&apos;il connaît — mais sa liste est courte, et
            il ne sait pas découper des mots collés sans séparateur. Un vrai outil de cassage a des
            dictionnaires de plusieurs millions d&apos;entrées et sait très bien le faire. Donc : si
            cette page te dit « catastrophique », c&apos;est certain ; si elle te dit
            « excellent », ça veut seulement dire qu&apos;elle n&apos;a rien trouvé.
          </Callout>
          <Callout tone="tip" title="Et surtout : un mot de passe par compte">
            Le meilleur mot de passe du monde ne protège rien s&apos;il sert aussi sur le forum qui
            se fera pirater l&apos;an prochain. C&apos;est le rôle d&apos;un gestionnaire de mots de
            passe — il y a un cours entier là-dessus dans les docs.
          </Callout>
        </div>
      </section>
    </PageShell>
  )
}
