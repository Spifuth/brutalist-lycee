// The "Psychologie humaine" subject: how we come to believe we understand
// something, and why that matters for anyone who works with computers.
//
// Real written content, not lorem -- one subject per file, like
// ./docs-git.ts, so a long course does not bury the subject index in
// ./docs.ts. The import below is `import type`, which TypeScript erases
// entirely at compile time: it costs no runtime import, so ./docs.ts can
// import this file back without a cycle.
//
// The renderer draws plain text: no bold, no italics. The source article
// leaned on bold for its key sentences, so here those sentences are carried
// by callouts and keylists instead -- the only emphasis the renderer has.
import type { DocSubject } from "./docs"

export const PSYCHOLOGIE_SUBJECT: DocSubject = {
  slug: "psychologie",
  title: "Psychologie humaine",
  command: "man brain",
  description: "Comment on apprend, et comment on se trompe.",
  articles: [
    {
      slug: "google-knowledge",
      title: "Google knowledge : savoir sans comprendre",
      summary:
        "Pourquoi connaître un fait ne suffit pas, et pourquoi c'est un vrai problème en informatique, en cybersécurité et à l'ère de l'IA.",
      blocks: [
        {
          type: "para",
          text:
            "En 2016, le philosophe Michael Patrick Lynch publie The Internet of Us. Il y décrit un phénomène qu'il appelle le Google knowing (« Google knowledge » dans la version vulgarisée).",
        },
        {
          type: "callout",
          tone: "info",
          title: "Google knowledge",
          text: "Connaître un fait sans connaître la structure qui l'entoure.",
        },
        {
          type: "para",
          text:
            "L'exemple classique : tu sais que les globules blancs combattent les infections. C'est vrai, c'est utile, tu peux répondre à un quiz. Mais sais-tu comment le sang circule dans le corps, ce que font réellement ces cellules, quels autres facteurs entrent en jeu ? Si non, tu as une réponse, pas une compréhension. Tu possèdes le fait, mais pas l'environnement dans lequel il prend son sens.",
        },
        { type: "para", text: "Lynch oppose deux choses :" },
        {
          type: "table",
          headers: ["", "Google knowledge", "Compréhension"],
          rows: [
            ["Ce que tu as", "Le fait, la réponse", "Le fait et son contexte"],
            ["Ce que tu peux faire", "Répéter, citer", "Expliquer, vérifier, adapter"],
            ["Quand ça casse", "Dès que la situation sort du cas connu", "Tu sais pourquoi, donc tu peux raisonner"],
          ],
        },
        {
          type: "para",
          text:
            "Et ce n'est pas qu'une affaire de Google. Le fait appris pour un quiz, pour impressionner quelqu'un ou pour réussir un examen relève du même mécanisme : un fait remis sans le contexte nécessaire pour le comprendre vraiment.",
        },

        { type: "section", id: "pourquoi-on-tombe-dans-le-piege", text: "Pourquoi on tombe dans le piège" },
        {
          type: "para",
          text: "Ce n'est ni de la paresse ni de la bêtise. C'est la façon dont notre cerveau fonctionne.",
        },
        {
          type: "keylist",
          items: [
            {
              term: "1. L'illusion de profondeur explicative",
              desc:
                "Les chercheurs Rozenblit et Keil (2002) ont montré que les gens surestiment massivement leur compréhension du fonctionnement des objets du quotidien (une fermeture éclair, des toilettes, un vélo). Quand on leur demande de l'expliquer étape par étape, ils s'aperçoivent qu'ils ne savent pas, et leur confiance chute. Les psychologues Sloman et Fernbach en ont tiré The Knowledge Illusion : nous confondons ce que nous savons avec ce que la communauté (et nos outils) savent.",
            },
            {
              term: "2. L'effet Google sur la mémoire",
              desc:
                "Sparrow, Liu et Wegner (2011) ont observé que lorsqu'on sait qu'une information est facilement retrouvable, on retient moins l'information elle-même et davantage où la retrouver. Notre cerveau externalise ce qu'il peut externaliser, ce qui est rationnel. Le risque apparaît quand on externalise aussi la compréhension.",
            },
            {
              term: "3. L'accès instantané",
              desc:
                "Une réponse qui arrive en trois secondes donne la sensation d'avoir compris. Elle donne la sensation de savoir, ce qui n'est pas la même chose.",
            },
          ],
        },

        {
          type: "section",
          id: "on-devient-mauvais-pour-debattre",
          text: "Le vrai problème : on devient mauvais pour débattre",
        },
        {
          type: "para",
          text:
            "C'est le point le plus intéressant de l'idée de Lynch : le risque n'est pas seulement individuel, il est collectif.",
        },
        {
          type: "para",
          text:
            "Imagine deux personnes, Dan et Hannah, qui débattent de l'efficacité d'un complément alimentaire. Dan dit que ça marche, Hannah dit que non. Chacun sort une étude à l'appui. Mais ni l'un ni l'autre n'a les outils pour évaluer ces études :",
        },
        {
          type: "list",
          items: [
            "Combien de personnes ont été testées ?",
            "Comparées à quoi (placebo, autre traitement, rien) ?",
            "L'expérience a-t-elle été reproduite ?",
            "Qui l'a financée ?",
          ],
        },
        {
          type: "para",
          text:
            "Sans ces fondations, le débat devient un duel de citations. Personne ne peut trancher, parce que personne ne peut juger la qualité de la source. On ne discute plus de la vérité, on compare des liens. C'est exactement le mécanisme qui alimente la polarisation : chacun a « ses sources ».",
        },

        { type: "section", id: "en-informatique", text: "En informatique, on y est tous les jours" },
        {
          type: "para",
          text:
            "Ce domaine est un terrain parfait pour le Google knowledge, parce que tout marche très bien sans qu'on comprenne.",
        },
        {
          type: "keylist",
          items: [
            {
              term: "Copier-coller depuis Stack Overflow",
              desc:
                "La commande fonctionne, on passe à la suite. Jusqu'au jour où l'environnement change et plus rien ne marche, sans aucun indice sur la cause.",
            },
            {
              term: "Le code généré par une IA",
              desc:
                "Il compile, les tests passent. Mais si tu ne peux pas l'expliquer ligne par ligne, tu ne peux ni le débugger, ni l'adapter, ni juger s'il est sûr. Tu ne le maîtrises pas, tu en es dépendant.",
            },
            {
              term: "« HTTPS = site sûr »",
              desc:
                "Le cadenas indique que la connexion est chiffrée. Il ne dit rien sur l'honnêteté du site : de nombreux sites de phishing ont un certificat valide. Le fait est vrai, la conclusion est fausse, faute de contexte.",
            },
            {
              term: "« Un antivirus me protège »",
              desc: "De quoi, exactement ? Comment détecte-t-il une menace ? Que ne voit-il pas ?",
            },
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "Le point commun",
          text: "Le fait est correct, c'est l'usage qu'on en fait qui ne l'est pas.",
        },

        { type: "section", id: "un-exemple-concret-le-soc", text: "Un exemple concret : le SOC" },
        {
          type: "para",
          text:
            "Je travaille comme analyste en SOC (centre opérationnel de sécurité). Mon quotidien : des alertes arrivent, et je dois décider si c'est une vraie attaque ou une fausse alerte. Prenons celle-ci :",
        },
        {
          type: "code",
          label: "alerte",
          code: "Connexion depuis une IP signalée comme malveillante par une base de réputation.",
        },
        {
          type: "keylist",
          items: [
            { term: "Réaction Google knowledge", desc: "« IP malveillante = attaque, on escalade. »" },
            { term: "Réaction d'un analyste", desc: "Je me pose des questions que le fait seul ne me donne pas." },
          ],
        },
        {
          type: "list",
          items: [
            "Cette IP est-elle un VPN ou un proxy d'entreprise, partagé avec d'autres utilisateurs légitimes ?",
            "Cette connexion est-elle cohérente avec les habitudes de ce compte (horaires, pays, appareil) ?",
            "Que s'est-il passé juste avant (échecs de connexion, changement de mot de passe) et juste après (accès à des données, création de règles de messagerie) ?",
            "La base de réputation est-elle fiable, à jour, ou une IP « propre » hier s'est-elle retrouvée réutilisée ?",
          ],
        },
        {
          type: "para",
          text:
            "Deux analystes qui ont le même fait n'ont pas la même valeur. Celui qui connaît le contexte tranche vite et juste. Celui qui n'a que le fait escalade à tort (et épuise ses collègues) ou classe à tort (et laisse passer une vraie attaque).",
        },
        {
          type: "callout",
          tone: "info",
          title: "Le métier",
          text:
            "Ce métier consiste à transformer des faits en décisions, et la différence se joue entièrement sur le contexte.",
        },
        {
          type: "para",
          text:
            "C'est aussi pour ça que, dans nos ateliers, on ne se contente pas de « trouver la bonne réponse » dans les logs : on apprend à rédiger un ticket qui explique pourquoi, avec les hypothèses faites et ce qui reste incertain.",
        },

        { type: "section", id: "ia-accelerateur-ou-bequille", text: "L'IA : accélérateur ou béquille ?" },
        {
          type: "para",
          text:
            "L'IA est probablement l'outil le plus puissant jamais inventé pour obtenir des réponses. C'est précisément pourquoi la distinction de Lynch compte maintenant plus que jamais.",
        },
        {
          type: "list",
          items: [
            "Utilisée pour comprendre (« explique-moi pourquoi ça marche », « qu'est-ce que j'ai raté ? », « donne-moi un contre-exemple »), elle est un accélérateur formidable.",
            "Utilisée pour éviter de comprendre (« donne-moi le code »), elle fabrique du Google knowledge à grande échelle, avec en prime la confiance excessive que donne une réponse bien rédigée.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Le test",
          text: "Si l'outil disparaît demain, est-ce que je sais encore ce que je fais ?",
        },

        { type: "section", id: "que-faire-concretement", text: "Que faire concrètement" },
        {
          type: "para",
          text:
            "La solution, dit-on, est plus lente et plus difficile que ce que la plupart des gens voudront faire. Mais elle est simple à énoncer :",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "Choisis un sujet, pas un fait. Au lieu de retenir « le port 443 = HTTPS », plonge dans le fonctionnement d'une connexion TLS.",
            "Cherche le pourquoi. Chaque fois qu'une commande ou un snippet marche, demande-toi : qu'est-ce qui s'est passé ici ?",
            "Fais le test de la fermeture éclair. Essaie d'expliquer le sujet à voix haute, étape par étape, sans notes. Là où tu bloques, c'est là que s'arrête ta compréhension.",
            "Teste tes sources. Avant de citer une étude ou un article : qui l'a produit, sur quel échantillon, reproduit par d'autres ?",
            "Reste dessus assez longtemps. La compréhension ne s'obtient pas en 3 secondes, elle s'accumule.",
            "Accepte de dire « je ne sais pas ». Savoir où s'arrête sa compréhension est déjà une forme de maîtrise.",
          ],
        },

        { type: "section", id: "en-resume", text: "En résumé" },
        {
          type: "callout",
          tone: "success",
          title: "À retenir",
          text:
            "Connaître le quoi te permet de répondre. Connaître le pourquoi te permet de juger, de corriger et de débattre.",
        },
        {
          type: "para",
          text:
            "Dans un monde où toutes les réponses sont à portée de clic, ce n'est plus la réponse qui est rare, c'est la compréhension.",
        },

        { type: "section", id: "pour-aller-plus-loin", text: "Pour aller plus loin" },
        {
          type: "list",
          items: [
            "Michael Patrick Lynch, The Internet of Us (2016) : l'origine de l'idée.",
            "Steven Sloman & Philip Fernbach, The Knowledge Illusion (2017) : pourquoi nous surestimons ce que nous savons.",
            "Luciano Floridi, The Philosophy of Information : une réflexion de fond sur ce qu'est l'information.",
            "Sparrow, Liu & Wegner, « Google Effects on Memory », Science (2011) : l'étude sur l'externalisation de la mémoire.",
          ],
        },
        {
          type: "para",
          text:
            "Idée inspirée d'un reel de Michael Patrick Lynch, reprise et adaptée au contexte de l'informatique.",
        },
      ],
    },
  ],
}
