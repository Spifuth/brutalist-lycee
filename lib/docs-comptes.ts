// The "Comptes & identité" subject: how a login actually works, and why a
// stolen session token is the account itself.
//
// Real written content, not lorem — one subject per file, like ./docs-git.ts,
// so a long course does not bury the subject index in ./docs.ts. Import
// type-only from ./docs so there is no runtime import cycle.
//
// SAFETY CONTRACT for the "jeton-discord" article: it shows what an
// authenticated request looks like (one header, no password, no 2FA code) and
// names the real-world delivery routes at the level of "recognise it". It
// documents no extraction method, no working payload, and no real token.
// tests/docs-content.test.ts enforces the last one.
import type { DocArticle, DocSubject } from "./docs"

const PREUVE_ARTICLE: DocArticle = {
  slug: "preuve",
  title: "Prouver que c'est toi",
  summary: "Trois façons de prouver son identité — et celle qui compte vraiment, parce qu'elle dure.",
  blocks: [
    {
      type: "para",
      text:
        "Tu te connectes des dizaines de fois par jour sans jamais y penser : ton téléphone, Discord, l'ENT, un jeu. Le geste est devenu tellement automatique que la question derrière disparaît complètement. Qu'est-ce qui prouve à la machine que c'est bien toi, et pas quelqu'un qui a simplement récupéré ton pseudo ?",
    },
    { type: "section", id: "les-trois-facteurs", text: "Les trois facteurs" },
    {
      type: "para",
      text:
        "Il n'existe que trois familles de preuves possibles. Tout système d'authentification, du plus simple au plus paranoïaque, pioche dedans — souvent dans une seule, parfois dans deux à la fois.",
    },
    {
      type: "keylist",
      items: [
        {
          term: "Ce que tu sais",
          desc: "Un mot de passe, un code PIN, une réponse secrète. Le problème, c'est que ça se copie, ça se devine, et ça se retape ailleurs — donc ça se réutilise, ce qui le rend volable sans même te toucher.",
        },
        {
          term: "Ce que tu as",
          desc: "Ton téléphone, une clé de sécurité USB. Pour te voler cette preuve, il faut te prendre l'objet — ou intercepter ce qu'il vient de produire, comme un code affiché une seule fois.",
        },
        {
          term: "Ce que tu es",
          desc: "Ton empreinte digitale, ton visage. Le plus dur à copier au quotidien, mais aussi le seul que tu ne peux jamais changer : si cette donnée fuite un jour, elle reste compromise pour toujours.",
        },
      ],
    },
    { type: "section", id: "une-fois-puis-plus-jamais", text: "Une fois, puis plus jamais" },
    {
      type: "para",
      text:
        "Voici le pivot de toute la matière. Tu donnes ta preuve d'identité une seule fois, au moment de la connexion. Après ça, plus rien ne te la redemande : tu ouvres l'appli le lendemain, ou même dans un mois, et tu es déjà dedans. L'authentification est un instant ; ce qui se passe après est une durée.",
    },
    { type: "section", id: "la-session", text: "La session" },
    {
      type: "para",
      text:
        "Ce qui porte cette durée s'appelle une session. Concrètement, elle tient dans une chaîne de caractères que ton appareil garde en mémoire et renvoie tout seul à chaque requête, sans que tu la voies passer. Sans elle, il faudrait retaper ton mot de passe à chaque clic — ce que personne ne ferait.",
    },
    {
      type: "callout",
      tone: "info",
      title: "Le confort a un prix",
      text:
        "Ce confort a un nom et un coût : cette chaîne de caractères vaut exactement ta preuve d'identité, puisqu'elle la remplace pendant toute la session. Qui la possède est toi, aux yeux de la machine — que ce soit vraiment toi, ou quelqu'un qui a simplement mis la main dessus.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "La suite",
      text:
        "Les quatre articles qui suivent creusent chacun un maillon de cette chaîne : le mot de passe et ses limites, la double authentification et ce qu'elle bloque vraiment, le jeton Discord comme cas concret d'une session volée, et les passkeys comme réponse qui essaie de supprimer le problème à la racine.",
    },
  ],
}

export const COMPTES_SUBJECT: DocSubject = {
  slug: "comptes",
  title: "Comptes & identité",
  command: "man identity",
  description: "Ce qui prouve que c'est bien toi — et ce qui peut le voler.",
  articles: [PREUVE_ARTICLE],
}
