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

const MOT_DE_PASSE_ARTICLE: DocArticle = {
  slug: "mot-de-passe",
  title: "Le mot de passe, et pourquoi il ne suffit plus",
  summary: "Longueur, unicité, fuites : ce qui fait vraiment tomber un compte n'est pas ce qu'on croit.",
  blocks: [
    {
      type: "para",
      text:
        "Le mot de passe est de loin le plus vieux des trois facteurs : bien avant l'informatique, les armées romaines s'en servaient déjà comme mot de passe de nuit, pour reconnaître leurs propres soldats dans le noir. C'est aussi, aujourd'hui, le seul des trois que la quasi-totalité des comptes en ligne acceptent seul, sans rien d'autre derrière lui. Toute la sécurité d'un compte Discord, d'une boîte mail ou de l'ENT repose donc, la plupart du temps, sur cette unique preuve. Le problème n'est pas qu'elle ait mal vieilli ; c'est qu'on l'utilise mal.",
    },
    { type: "section", id: "longueur-avant-complexite", text: "La longueur bat la complexité" },
    {
      type: "para",
      text:
        "Tr0ub4dor&3 a l'air redoutable avec ses chiffres et son caractère spécial, mais il ne fait que onze caractères, et il demande de réfléchir à chaque substitution pour s'en souvenir. Quatre mots ordinaires mis bout à bout, comme chameau-lampe-tiroir-nuage, dépassent vingt caractères sans effort et se retiennent comme une petite phrase. Ce qui coûte cher à un attaquant qui essaie toutes les combinaisons, ce n'est pas la présence d'un symbole ou d'une majuscule : c'est le nombre total de possibilités à tester, et ce nombre grimpe avec chaque caractère ajouté, pas avec chaque type de caractère utilisé. Un mot de passe plus long bat presque toujours un mot de passe plus tordu.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "Va le mesurer toi-même",
      text:
        "La page /force-brute de ce site, « Casser un mot de passe », calcule tout dans ton navigateur : rien n'est envoyé nulle part, ni le mot de passe que tu tapes ni le résultat. Tape un mot de passe court avec des majuscules et des caractères spéciaux, note le temps affiché, puis tape quatre mots ordinaires à la suite et compare les deux résultats. La différence te convaincra plus vite que n'importe quelle explication.",
    },
    { type: "section", id: "la-reutilisation", text: "La réutilisation" },
    {
      type: "para",
      text:
        "Voici le vrai tueur de comptes, loin devant la complexité. Quand un site se fait pirater, les couples identifiant/mot de passe volés ne restent pas sagement rangés : ils sont rejoués automatiquement, par milliers à la seconde, sur des centaines d'autres services. C'est ce qu'on appelle le bourrage d'identifiants. Une fuite chez un forum que tu as oublié depuis longtemps peut ainsi ouvrir ta boîte mail, ton Discord et tes comptes d'achat en ligne le même jour, sans que personne n'ait eu besoin de deviner quoi que ce soit.",
    },
    {
      type: "callout",
      tone: "warning",
      title: "C'est la première cause",
      text:
        "La réutilisation est, de loin, la première cause de comptes piratés — bien avant le mot de passe jugé « pas assez compliqué ». Un mot de passe de trente caractères, avec majuscules, chiffres et symboles, ne vaut plus rien s'il est copié-collé sur dix sites différents : il suffit qu'un seul de ces dix sites se fasse pirater pour que les neuf autres tombent avec lui. Un excellent mot de passe réutilisé partout est, en pratique, un mot de passe faible.",
    },
    { type: "section", id: "les-fuites", text: "Les fuites" },
    {
      type: "para",
      text:
        "Un dump, c'est une base d'identifiants volée lors d'un piratage, d'abord vendue sur des forums spécialisés, puis, tôt ou tard, diffusée gratuitement à tout le monde. Il en circule des dizaines de milliards de lignes, cumulées fuite après fuite depuis plus de dix ans. Une fois qu'un mot de passe atterrit dans un dump, il n'en ressort jamais : il ne redevient pas sûr avec le temps, même des années plus tard, même si le site qui l'a laissé fuiter a fermé depuis longtemps. La seule chose qui répare une fuite, c'est de changer le mot de passe concerné — partout où tu l'as réutilisé.",
    },
    { type: "section", id: "ou-les-ranger", text: "Où les ranger" },
    {
      type: "para",
      text:
        "La règle qui découle de tout ça tient en une phrase : un mot de passe différent, long, et imprévisible pour chaque compte. Dit comme ça, elle a l'air raisonnable — jusqu'à ce que tu comptes le nombre de comptes que tu as réellement, et que tu réalises qu'il est impossible de tous les retenir de tête. Ce n'est pas un défaut de la règle : c'est l'aveu qu'elle n'a jamais été conçue pour être suivie à la main. Il faut un endroit pour les ranger, pas une meilleure mémoire.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "L'article d'à côté",
      text:
        "L'article Gestionnaires de mots de passe, dans Sécurité, à l'adresse /docs/securite/gestionnaires, compare en détail les outils qui font exactement ça — NordPass, Bitwarden et 1Password — et t'aide à choisir lequel installer.",
    },
  ],
}

const DEUX_FACTEURS_ARTICLE: DocArticle = {
  slug: "deux-facteurs",
  title: "La double authentification",
  summary: "La seconde barrière : ce qu'elle arrête vraiment, et ce qu'elle ne touche pas du tout.",
  blocks: [
    {
      type: "para",
      text:
        "Un bon mot de passe, unique et bien rangé, réduit déjà énormément le risque — mais il reste une preuve unique, de la même famille : ce que tu sais. Si quelqu'un la connaît, la connexion est accordée, sans autre question. La double authentification ajoute une seconde preuve, tirée d'une famille différente, pour que voler la première ne suffise plus.",
    },
    { type: "section", id: "le-principe", text: "Le principe" },
    {
      type: "para",
      text:
        "Le principe tient dans une seule contrainte : les deux facteurs doivent venir de catégories différentes, parmi les trois posées dans l'article précédent — ce que tu sais, ce que tu as, ce que tu es. Deux mots de passe l'un après l'autre, aussi différents soient-ils, ne forment pas une double authentification : ce sont deux fois la même faiblesse, puisqu'un mot de passe se devine, se réutilise et se retrouve dans une fuite exactement comme l'autre. La vraie double authentification oblige un attaquant à voler un objet ou intercepter un flux en plus d'un secret — deux opérations distinctes, pas la même refaite deux fois.",
    },
    { type: "section", id: "les-trois-methodes", text: "Les trois méthodes" },
    {
      type: "table",
      headers: ["Méthode", "Ce que ça arrête", "La faiblesse"],
      rows: [
        ["SMS", "Un mot de passe volé puis rejoué", "Échange de carte SIM, interception réseau"],
        [
          "Application TOTP (code à 6 chiffres)",
          "Un mot de passe volé, une fuite de base",
          "Hameçonnable en direct : le code se retape sur un faux site",
        ],
        [
          "Clé physique ou passkey",
          "Tout ce qui précède, plus l'hameçonnage",
          "Rien, côté connexion — voir l'article sur les passkeys",
        ],
      ],
    },
    {
      type: "para",
      text:
        "Les trois valent mieux que rien, et de loin : même la moins robuste bloque déjà les connexions automatisées, celles où un robot rejoue un mot de passe volé sans jamais toucher ton téléphone. L'écart qui compte le plus n'est donc pas celui entre le SMS et une clé physique, aussi réel soit-il : c'est celui qui sépare l'absence de 2FA du SMS. Passer de rien à un code par SMS ferme la porte à l'essentiel des attaques automatisées ; passer du SMS à une clé physique ferme une porte plus étroite, réservée à quelqu'un qui te vise toi en particulier et sait déjà hameçonner un code ou intercepter ta ligne.",
    },
    { type: "section", id: "les-codes-de-secours", text: "Les codes de secours" },
    {
      type: "para",
      text:
        "Les codes de secours existent pour le jour où le second facteur devient inaccessible : téléphone perdu, cassé, volé, ou simplement resté à la maison le matin d'un contrôle. Un service en génère une poignée à usage unique au moment où tu actives la 2FA, à mettre de côté avant d'en avoir besoin, pas après. Le piège classique consiste à les laisser dans un fichier nommé codes.txt, posé sur le bureau : quiconque ouvre une session sur cette machine récupère alors, dans la foulée, exactement ce que la 2FA était censée protéger. Ils se rangent là où se rangent les mots de passe — dans le gestionnaire, ou sur un papier gardé hors de portée — jamais en clair sur l'appareil qu'ils sont censés secourir.",
    },
    { type: "section", id: "ce-que-la-2fa-n-arrete-pas", text: "Ce que la 2FA n'arrête pas" },
    {
      type: "para",
      text:
        "La 2FA garde une porte, une seule : celle de la connexion, au moment précis où tu prouves qui tu es. Une fois cette porte franchie, elle ne voit plus rien — ni ce qui circule ensuite entre ton appareil et le service, ni ce qui tourne sur ta machine pendant que tu restes connecté. Un second facteur parfaitement respecté à l'authentification ne dit donc rien sur ce qui se passe une minute plus tard, dans la session qu'il vient d'ouvrir.",
    },
    {
      type: "callout",
      tone: "warning",
      title: "Elle ne protège pas une session déjà ouverte",
      text:
        "Il existe une manière d'entrer dans un compte qui ne passe jamais par cette porte — ni mot de passe, ni code, ni clé physique, parce qu'elle contourne la connexion elle-même. Le prochain article démonte ce cas précis à travers le jeton Discord, une preuve de session bien réelle : et ce que sa capture change pour la 2FA que tu viens de mettre en place, c'est rien.",
    },
  ],
}

export const COMPTES_SUBJECT: DocSubject = {
  slug: "comptes",
  title: "Comptes & identité",
  command: "man identity",
  description: "Ce qui prouve que c'est bien toi — et ce qui peut le voler.",
  articles: [PREUVE_ARTICLE, MOT_DE_PASSE_ARTICLE, DEUX_FACTEURS_ARTICLE],
}
