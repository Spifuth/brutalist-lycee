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
          desc: "Un mot de passe, un code PIN, une réponse secrète. Le problème, c'est que ça se copie, ça se devine, et ça se retape ailleurs — donc ça peut t'être volé sans qu'on te touche.",
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
        "Tr0ub4dor&3 a l'air redoutable avec ses chiffres et son caractère spécial, mais il ne fait que onze caractères, et il demande de réfléchir à chaque substitution pour s'en souvenir. Quatre mots ordinaires mis bout à bout, comme chameau-lampe-tiroir-nuage, dépassent vingt caractères sans effort et se retiennent comme une petite phrase. Ce qui coûte cher à un attaquant qui essaie toutes les combinaisons, ce n'est pas la présence d'un symbole ou d'une majuscule : c'est le nombre total de possibilités à tester, et ce nombre grimpe bien plus vite avec chaque caractère ajouté qu'avec chaque type de caractère utilisé. Un mot de passe plus long bat presque toujours un mot de passe plus tordu.",
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
        ["SMS", "Un mot de passe volé, une fuite de base", "Échange de carte SIM, interception réseau"],
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
        "Il existe une manière d'entrer dans un compte qui ne passe jamais par cette porte — ni mot de passe, ni code, ni clé physique, parce qu'elle contourne la connexion elle-même. Le prochain article démonte ce cas précis à travers le jeton Discord, une preuve de session bien réelle : et ce que ta 2FA toute neuve y change, c'est rien.",
    },
  ],
}

const JETON_ARTICLE: DocArticle = {
  slug: "jeton-discord",
  title: "Le jeton Discord",
  summary: "Une ligne de texte qui vaut ton compte entier — mot de passe et double authentification compris.",
  blocks: [
    {
      type: "para",
      text:
        "Le Discord de la classe, c'est là que tu postes tes rapports de bug, que traîne le lien du cours et que quelqu'un demande toujours les devoirs à vingt-deux heures. Ton compte là-dessus ne tient pas à ton mot de passe : il tient à une chaîne de caractères que ton application renvoie toute seule, sans rien te demander, à chaque fois qu'elle parle à Discord. Cette chaîne s'appelle un jeton, et l'article précédent vient de t'annoncer qu'elle se moque complètement de la double authentification. Voici pourquoi.",
    },
    { type: "section", id: "c-est-quoi-un-jeton", text: "C'est quoi un jeton" },
    {
      type: "para",
      text:
        "Un jeton n'est pas une deuxième version de ton mot de passe : c'est ce que Discord te remet une fois que tu as fini de prouver ton identité. Il est émis après le mot de passe, et après le code de double authentification — il n'existe donc qu'au bout du parcours de connexion, jamais avant. Il ne contient pas ton mot de passe : il contient la preuve que tu l'as déjà donné, signée par Discord. Ton application le renvoie ensuite à chaque requête, pour ouvrir un salon, envoyer un message, charger une image : des centaines de fois par session, sans jamais te le montrer.",
    },
    { type: "section", id: "a-quoi-ca-ressemble", text: "À quoi ça ressemble" },
    {
      type: "code",
      label: "un jeton — faux, caviardé",
      code: "MTE0NTE0MTkxOTgxMDAwMDAw.XXXXXX.EXEMPLE-FACTICE-NE-FONCTIONNE-PAS",
    },
    {
      type: "keylist",
      items: [
        {
          term: "Avant le premier point",
          desc: "Ton identifiant de compte, simplement encodé pour tenir sur une ligne. N'importe qui peut le décoder, et ça n'apprend rien à personne : cet identifiant n'a jamais été un secret, c'est le numéro public avec lequel Discord désigne ton compte. Cette partie ne protège rien, elle dit seulement de quel compte on parle.",
        },
        {
          term: "Entre les deux points",
          desc: "Le moment où le jeton a été émis. C'est ce qui date le jeton, à la seconde près.",
        },
        {
          term: "Après le second point",
          desc: "La signature, calculée par Discord. C'est elle qui prouve que le jeton vient bien de Discord, et c'est la seule des trois parties qu'on ne peut pas fabriquer : on recopie les deux premières en une seconde, mais sans une signature valable le serveur refuse tout. C'est aussi pourquoi personne n'invente un jeton — on ne peut que voler un jeton qui existe déjà.",
        },
      ],
    },
    {
      type: "para",
      text:
        "Regarde cette ligne : elle n'a pas l'air d'un secret. Un mot de passe, on sait qu'on ne le montre pas ; cette suite de caractères, elle ressemble à une référence technique sans importance, le genre de chose qu'on copie-colle sans réfléchir pour demander de l'aide. C'est exactement le problème : ça part dans un partage d'écran, dans une vidéo, dans un fichier de log qu'on envoie à quelqu'un pour qu'il y jette un œil. Personne ne poste son mot de passe par accident ; un jeton, si.",
    },
    { type: "section", id: "la-requete-qui-fait-tout", text: "La requête qui fait tout" },
    {
      type: "code",
      label: "ce que voit le serveur de Discord",
      code: 'curl -H "Authorization: MTE0NTE0MTkxOTgxMDAwMDAw.XXXXXX.EXEMPLE-FACTICE-NE-FONCTIONNE-PAS" \\\n     https://discord.com/api/v10/users/@me',
    },
    {
      type: "para",
      text:
        "L'important n'est pas ce qu'il y a dans cette requête, c'est ce qui n'y est pas. Pas de mot de passe. Pas de code à six chiffres. Pas de « nouvel appareil détecté, est-ce bien toi ? ». Une seule ligne d'en-tête, et le serveur renvoie tranquillement les informations du compte, comme il le ferait pour toi : de son point de vue la question est déjà réglée, quelqu'un a prouvé son identité tout à l'heure et voici la preuve qu'il l'a fait.",
    },
    { type: "section", id: "pourquoi-la-2fa-ne-sert-a-rien-ici", text: "Pourquoi la 2FA ne sert à rien ici" },
    {
      type: "para",
      text:
        "La double authentification surveille un moment précis : celui où quelqu'un se connecte. Une requête comme celle du dessus ne se connecte pas — elle arrive avec une session déjà ouverte, donc elle ne croise jamais la porte que la 2FA garde. Il faut en tirer la conséquence, même si elle est désagréable : activer la double authentification après le vol d'un jeton ne change rien, le jeton volé continue de fonctionner exactement comme avant. Ajouter une serrure à la porte d'entrée ne fait pas sortir celui qui est déjà dans la maison.",
    },
    { type: "section", id: "comment-un-jeton-se-fait-voler", text: "Comment un jeton se fait voler" },
    {
      type: "para",
      text:
        "Aucune des voies qui suivent n'est un exploit technique contre Discord : les serveurs ne sont pas percés, la signature n'est pas contournée, il n'y a pas de faille à corriger quelque part. Toutes passent par toi — par ta machine, par ton navigateur, par un programme que tu as lancé toi-même. C'est plutôt une bonne nouvelle, parce que ça veut dire que la protection est de ton côté. Tu n'as pas besoin de savoir comment chacune fonctionne : il faut juste savoir les reconnaître quand elles se présentent.",
    },
    {
      type: "keylist",
      items: [
        {
          term: "Le script à coller dans la console",
          desc: "« Colle ça pour avoir Nitro gratuit », « colle ça pour voir qui a supprimé un message ». Le script ne fait jamais ce qu'il promet : il fait autre chose, avec tes droits, dans ta session déjà ouverte. Discord et les navigateurs affichent eux-mêmes un gros avertissement dans cette console, et ce n'est pas de la décoration : cet avertissement existe précisément parce que cette arnaque-là fonctionne.",
        },
        {
          term: "L'extension de navigateur",
          desc: "Une extension a le droit de lire ce que la page garde pour elle, et ce droit, c'est toi qui le lui donnes à l'installation. Un « thème Discord », un compteur de messages, un outil aperçu dans une vidéo : installé sans réfléchir, il voit tout ce que ton onglet Discord voit. Le nombre d'étoiles ne prouve rien non plus, une extension honnête pouvant changer de propriétaire puis se mettre à jour toute seule.",
        },
        {
          term: "L'infostealer",
          desc: "Un programme dont c'est tout le métier : ramasser ce qui traîne sur une machine — jetons de session, mots de passe enregistrés dans le navigateur, cookies. Il arrive par un crack, un cheat, un « mod menu », un installeur envoyé en message privé, souvent accompagné de la consigne de désactiver l'antivirus le temps de l'installation. Il ne casse rien et ne se fait pas remarquer : il ramasse, il envoie, il s'en va, et tu n'apprends son passage que bien plus tard.",
        },
        {
          term: "La dépendance piégée",
          desc: "Pour ceux qui codent : un paquet installé depuis npm ou pip s'exécute avec tes droits, sur ta machine, comme n'importe quel programme que tu lances. Un paquet malveillant — ou un paquet honnête dont le compte du mainteneur a été volé — a donc exactement les mêmes accès que toi. Relis le nom avant d'installer : une lettre en trop, et ce n'est plus le même paquet.",
        },
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Ne colle jamais rien dans cette console",
      text:
        "Quoi qu'on te promette — Nitro gratuit, un badge, un outil « réservé aux modérateurs » — et quel que soit celui qui te l'envoie, y compris un ami dont le compte vient justement d'être volé et qui ne le sait pas encore. Quelqu'un qui a une raison légitime de te faire manipuler quelque chose ne te demandera jamais de coller du code là-dedans.",
    },
    { type: "section", id: "revoquer", text: "Révoquer" },
    {
      type: "para",
      text:
        "Une seule action met vraiment fin à une session volée : changer le mot de passe. Chez Discord, ça invalide d'un coup les jetons existants, partout, sur tous les appareils — celui du voleur comme le tien, qui devra se reconnecter. Activer la double authentification ne le fait pas, et se déconnecter de l'appareil sur lequel tu es en train de lire ne le fait pas davantage : ces deux gestes ne touchent pas le jeton d'en face. C'est la seule révocation qui marche, et c'est ce qui rend l'ordre des étapes suivantes si important.",
    },
    { type: "section", id: "mon-compte-est-compromis", text: "Mon compte est compromis" },
    {
      type: "list",
      ordered: true,
      items: [
        "Nettoyer la machine, avant tout le reste. Si ce qui a volé le premier jeton tourne encore, le suivant partira pareil : tu changeras ton mot de passe, tu te reconnecteras, et tu offriras au voleur un jeton tout neuf après avoir tout refait pour rien. Antivirus à jour, analyse complète, et on désinstalle l'extension ou le programme par lequel c'est arrivé.",
        "Changer le mot de passe. C'est ce geste, et lui seul, qui invalide les jetons déjà émis — la vraie révocation, pas une précaution de plus.",
        "Activer la double authentification si ce n'est pas déjà fait. Maintenant elle sert à quelque chose : les anciens jetons sont morts, la prochaine connexion repassera donc par la porte d'entrée, et c'est cette porte qu'elle garde.",
        "Ranger les codes de secours ailleurs que sur la machine : dans le gestionnaire de mots de passe, ou sur une feuille de papier rangée loin d'elle.",
        "Prévenir la classe et les serveurs où tu traînes. Pendant le vol, ton compte a peut-être envoyé des liens en ton nom, à des gens qui te font confiance — c'est comme ça que ça se propage.",
        "Passer en revue les sessions actives et les applications autorisées dans les réglages de Discord. Une application autorisée par OAuth survit au changement de mot de passe : elle garde son accès même une fois les anciens jetons invalidés, c'est tout l'intérêt de cette étape. Et la session volée, elle, ne ressortira pas comme un appareil inconnu, puisque c'est la tienne : ne rien voir d'anormal dans la liste ne veut pas dire que tu es tranquille.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "À retenir",
      text:
        "Un jeton n'est pas un mot de passe, c'est une session. On ne le protège donc pas en renforçant la connexion — mot de passe plus long, second facteur, tout ce que tu veux : la connexion a déjà eu lieu. On le protège en gardant propre la machine sur laquelle la session est ouverte.",
    },
  ],
}

const PASSKEYS_ARTICLE: DocArticle = {
  slug: "passkeys",
  title: "Les passkeys",
  summary: "Ce qui remplace le mot de passe — et ce que ça ne répare pas.",
  blocks: [
    {
      type: "para",
      text:
        "Après tout ça, la question devient presque évidente : est-ce qu'on peut supprimer le mot de passe ? Depuis quelques années, certains sites te proposent justement de te connecter sans lui, avec l'empreinte de ton doigt ou le code de déverrouillage de ton téléphone. Ce n'est pas un raccourci de confort qui contourne le mot de passe habituel : c'est un mécanisme entièrement différent, appelé passkey. Discord les prend en charge.",
    },
    { type: "section", id: "le-principe", text: "Le principe" },
    {
      type: "para",
      text:
        "Une passkey repose sur une paire de clés : une clé privée — jamais envoyée au site, et qui, si elle se synchronise avec tes autres appareils, ne voyage que chiffrée — et une clé publique, que le site conserve de son côté. Pour te connecter, le site envoie un défi — une valeur aléatoire, différente à chaque fois — et ton appareil le signe avec la clé privée. Le site ne reçoit jamais que cette signature ; il vérifie qu'elle correspond à la clé publique qu'il a en base, et t'ouvre la porte.",
    },
    {
      type: "callout",
      tone: "info",
      title: "Il n'y a plus rien à voler côté site",
      text:
        "Le site ne détient aucun secret partagé avec toi : pas de mot de passe, même haché, qui pourrait être cassé. Une fuite de sa base ne livre que des clés publiques, qui ne servent strictement à rien sans la clé privée, jamais transmise au site.",
    },
    { type: "section", id: "pourquoi-le-phishing-ne-marche-plus", text: "Pourquoi le hameçonnage ne marche plus" },
    {
      type: "para",
      text:
        "La signature que ton appareil produit est liée à l'origine du site qui a envoyé le défi. Un faux discord-nitro.xyz, aussi bien imité soit-il, ne peut pas obtenir une signature valable pour discord.com : l'appareil refuse de signer pour la mauvaise origine, même si l'élève, lui, est complètement tombé dans le piège et pense sincèrement être sur le vrai site. C'est la première défense de toute la matière qui ne dépend plus de ta vigilance.",
    },
    { type: "section", id: "ce-que-ca-remplace", text: "Ce que ça remplace" },
    {
      type: "table",
      headers: ["Attaque", "Mot de passe", "TOTP", "Passkey"],
      rows: [
        ["Fuite de la base du site", "Compromis", "Protégé", "Protégé"],
        ["Bourrage d'identifiants", "Compromis", "Protégé", "Protégé"],
        ["Hameçonnage", "Compromis", "Compromis", "Protégé"],
        ["Vol du jeton de session", "Compromis", "Compromis", "Compromis"],
      ],
    },
    { type: "section", id: "la-limite-honnete", text: "La limite honnête" },
    {
      type: "para",
      text:
        "La dernière ligne du tableau est la dernière ligne de la matière. La passkey protège la connexion, pas la session. Un jeton volé sur ta machine marche toujours, passkey ou pas : il a été émis après une connexion parfaitement valide, exactement comme dans l'article sur le jeton Discord.",
    },
    {
      type: "para",
      text:
        "Il y a une seconde limite, moins visible mais tout aussi réelle sur Discord : ajouter une passkey ajoute une façon de te connecter, elle n'en retire aucune. Le mot de passe reste actif à côté — Discord ne permet pas de le supprimer — donc un faux site n'a qu'à ne pas proposer de passkey et t'afficher, comme avant, la case mot de passe et code.",
    },
    {
      type: "para",
      text:
        "Ce que ça déplace : sur le chemin de la passkey, il n'y a plus rien à hameçonner, plus rien à deviner, plus rien à rejouer. Restent les deux portes qu'elle ne ferme pas — l'ancienne, restée ouverte à côté d'elle, et la session, une fois que tu es entré. Le maillon faible n'est donc plus ta mémoire ni ta vigilance : c'est ton appareil, et ta discipline à ne pas repasser par l'ancienne porte.",
    },
    {
      type: "callout",
      tone: "success",
      title: "La boucle est bouclée",
      text:
        "Le tout premier article de cette matière posait une question simple : qu'est-ce qui prouve que c'est bien toi ? Une passkey rend cet instant-là presque inattaquable — à condition de ne plus jamais repasser par l'ancienne porte. Mais la preuve d'identité n'a jamais été le problème le plus dur ; c'est la session qui dure après elle qui reste, encore et toujours, ta responsabilité.",
    },
  ],
}

export const COMPTES_SUBJECT: DocSubject = {
  slug: "comptes",
  title: "Comptes & identité",
  command: "man identity",
  description: "Ce qui prouve que c'est bien toi — et ce qui peut le voler.",
  articles: [PREUVE_ARTICLE, MOT_DE_PASSE_ARTICLE, DEUX_FACTEURS_ARTICLE, JETON_ARTICLE, PASSKEYS_ARTICLE],
}
