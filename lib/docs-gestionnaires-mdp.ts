// The "Gestionnaires de mots de passe" article, in the Sécurité subject.
//
// Real written content, not generated lorem — it lives in its own file for the
// same reason as ./docs-git.ts: so a long article does not bury the subject
// index in ./docs.ts. Import type-only from ./docs so there is no runtime
// import cycle.
//
// PRICES GO STALE. Every figure below was read from the three vendors' pricing
// pages in September 2026 and is in US dollars. The article says so out loud in
// the "Les prix bougent" callout — if you update a table, update that date too.
import type { DocArticle } from "./docs"

export const PASSWORD_MANAGERS_ARTICLE: DocArticle = {
  slug: "gestionnaires",
  title: "Gestionnaires de mots de passe",
  summary: "NordPass, Bitwarden, 1Password : ce qu'ils font, ce qu'ils coûtent, et lequel est pour toi.",
  blocks: [
    {
      type: "para",
      text:
        "Tu as sans doute plus de comptes en ligne que tu ne le crois : réseaux sociaux, ENT, jeux, boutiques, forums, plateformes de streaming. La règle de sécurité tient en une phrase, et elle est impossible à tenir de tête : un mot de passe différent, long et imprévisible, pour chaque compte. Un gestionnaire de mots de passe est l'outil qui rend cette règle tenable.",
    },
    {
      type: "list",
      items: [
        "Il fabrique des mots de passe longs et aléatoires à ta place.",
        "Il les range dans un coffre chiffré, verrouillé par un seul mot de passe maître.",
        "Il les remplit automatiquement sur le bon site — et seulement sur le bon, ce qui te protège au passage du phishing.",
        "Il te prévient quand un de tes comptes apparaît dans une fuite de données.",
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Le vrai danger, c'est la réutilisation",
      text:
        "Quand un site se fait pirater, les identifiants volés sont rejoués automatiquement sur des centaines d'autres services. Si tu utilises le même mot de passe partout, une seule fuite chez un forum oublié ouvre ta boîte mail, tes réseaux et tes achats d'un seul coup. C'est la cause de la majorité des piratages de comptes personnels — bien plus que le mot de passe « pas assez compliqué ».",
    },
    {
      type: "para",
      text:
        "Trois outils se partagent l'essentiel du marché : NordPass, Bitwarden et 1Password. Les trois font correctement le travail. Cet article compare ce qu'ils savent faire, ce qu'ils coûtent, et à qui chacun s'adresse.",
    },

    { type: "section", id: "le-vocabulaire", text: "Le vocabulaire" },
    {
      type: "para",
      text: "Cinq mots reviennent dans toutes les fiches produit. Autant les poser avant de comparer.",
    },
    {
      type: "keylist",
      items: [
        {
          term: "Coffre",
          desc: "Le fichier chiffré qui contient tous tes mots de passe. Sans la clé, ce n'est qu'un bloc d'octets illisible.",
        },
        {
          term: "Mot de passe maître",
          desc: "Le seul que tu retiens encore. Il ouvre le coffre : il doit être long, et il ne doit servir à rien d'autre, nulle part.",
        },
        {
          term: "Zéro-connaissance",
          desc: "Le chiffrement se fait sur ton appareil, avant l'envoi. L'éditeur héberge ton coffre mais ne peut pas le lire — même piraté, il n'a rien d'exploitable à livrer.",
        },
        {
          term: "AES-256, XChaCha20",
          desc: "Deux algorithmes de chiffrement modernes. Les deux sont hors de portée d'une attaque par force brute : le choix de l'un ou de l'autre est un argument commercial, pas un argument de sécurité.",
        },
        {
          term: "TOTP",
          desc: "Le code à six chiffres qui change toutes les trente secondes, utilisé pour la double authentification. Certains gestionnaires savent le générer eux-mêmes.",
        },
      ],
    },

    { type: "section", id: "les-prix-bougent", text: "Les prix bougent" },
    {
      type: "callout",
      tone: "warning",
      title: "Tarifs relevés en septembre 2026",
      text:
        "Tous les prix de cet article ont été relevés en septembre 2026 et sont donnés en dollars américains. Les trois éditeurs ont augmenté leurs tarifs dans l'année, et les promotions de première année disparaissent au renouvellement. Vérifie le prix sur le site de l'éditeur avant de payer : cette page vieillira plus vite que le reste du cours.",
    },

    { type: "section", id: "nordpass", text: "NordPass" },
    {
      type: "para",
      text:
        "NordPass est édité par Nord Security, la société qui vend aussi NordVPN. C'est le plus récent des trois et le plus tourné grand public.",
    },
    {
      type: "keylist",
      items: [
        { term: "XChaCha20", desc: "Un algorithme de chiffrement moderne, différent de celui des deux autres, sans que cela change quoi que ce soit pour toi." },
        { term: "Zéro-connaissance", desc: "NordPass héberge ton coffre mais ne peut pas le lire." },
        { term: "Masquage d'e-mail", desc: "Des adresses jetables qui redirigent vers ta vraie boîte, pour t'inscrire quelque part sans donner ton adresse." },
        { term: "Data Breach Scanner", desc: "Surveille si tes adresses et tes cartes apparaissent dans des fuites connues." },
        { term: "Partage sécurisé", desc: "Envoyer un mot de passe à quelqu'un sans le coller dans une conversation, avec un contrôle sur qui y accède." },
        { term: "Plateformes", desc: "Web, iOS, Android, Windows, macOS, Linux, extensions de navigateur." },
      ],
    },
    {
      type: "table",
      caption: "* Prix de la première année, en promotion. Le renouvellement est plus cher.",
      headers: ["Offre", "Par mois", "À l'année", "Personnes", "Appareils"],
      rows: [
        ["Free", "Gratuit", "Gratuit", "1", "1 seul à la fois"],
        ["Premium", "$4.99", "$1.99/mois*", "1", "Illimités"],
        ["Family", "$6.99", "$3.99/mois*", "6", "Illimités"],
        ["Teams", "—", "$4.99/personne/mois", "Illimité", "Illimités"],
      ],
    },
    { type: "para", text: "Ce qui est bien :" },
    {
      type: "list",
      items: [
        "Le moins cher la première année, avec des fonctionnalités complètes.",
        "Le masquage d'e-mail est inclus — les deux autres ne le proposent pas.",
        "Interface moderne, facile à prendre en main quand on n'a jamais utilisé de gestionnaire.",
        "30 jours satisfait ou remboursé.",
      ],
    },
    { type: "para", text: "Ce qu'on lui reproche :" },
    {
      type: "list",
      items: [
        "Le renouvellement coûte nettement plus cher que la première année : c'est le prix à comparer, pas celui de la promotion.",
        "L'offre gratuite ne sert qu'à essayer — un seul appareil connecté à la fois.",
        "Moins d'outils avancés que 1Password.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "Pour qui ?",
      text:
        "Pour débuter, et pour une famille qui veut partager ses accès sans y consacrer un budget. Le meilleur équilibre fonctionnalités/prix des trois — à condition de regarder le prix de la deuxième année.",
    },

    { type: "section", id: "bitwarden", text: "Bitwarden" },
    {
      type: "para",
      text:
        "Bitwarden est développé par Bitwarden Inc., mais son code est ouvert : n'importe qui peut le lire, l'auditer, et même faire tourner le serveur chez lui. C'est le choix par défaut du monde technique.",
    },
    {
      type: "keylist",
      items: [
        { term: "Code ouvert", desc: "Le code des applications et du serveur est public. Une faille peut être trouvée par n'importe quel chercheur, pas seulement par l'éditeur." },
        { term: "AES-256", desc: "Le standard, le même que celui de 1Password." },
        { term: "Auto-hébergement", desc: "Tu peux faire tourner le serveur Bitwarden sur ta propre machine et ne confier ton coffre à personne." },
        { term: "TOTP intégré", desc: "Le gestionnaire génère lui-même tes codes à six chiffres — mais dans l'offre Premium seulement." },
        { term: "Passkeys", desc: "Prise en charge des clés d'accès, la technologie qui vise à remplacer le mot de passe." },
        { term: "Plateformes", desc: "Web, iOS, Android, Windows, macOS, Linux, extensions de navigateur." },
      ],
    },
    {
      type: "table",
      headers: ["Offre", "Par mois", "À l'année", "Personnes", "Ce que ça ajoute"],
      rows: [
        ["Free", "Gratuit", "Gratuit", "1", "Coffre complet, appareils illimités, mais sans TOTP"],
        ["Premium", "$1.65/mois", "$19.80/an", "1", "TOTP, pièces jointes, accès d'urgence"],
        ["Families", "$3.99/mois", "$47.88/an", "6", "Tout le Premium, pour six personnes"],
        ["Teams", "$4/personne/mois", "—", "Illimité", "SSO, journaux d'audit, rôles personnalisés"],
        ["Enterprise", "$6/personne/mois", "—", "Illimité", "Teams, plus des politiques imposées à tout le monde"],
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Prix doublé en janvier 2026",
      text:
        "Bitwarden a augmenté son offre Premium de 98 % en janvier 2026, de $9.99 à $19.80 par an. Les comptes existants ont reçu une réduction ponctuelle de 25 % au premier renouvellement. Même après cette hausse, c'est l'offre payante la moins chère des trois.",
    },
    { type: "para", text: "Ce qui est bien :" },
    {
      type: "list",
      items: [
        "Le seul vrai plan gratuit : coffre illimité, sur tous tes appareils, sans date de fin.",
        "Code ouvert : la sécurité est vérifiable, pas seulement promise.",
        "L'offre payante la moins chère, y compris pour une équipe.",
        "Auto-hébergement possible si tu veux garder tes données chez toi.",
      ],
    },
    { type: "para", text: "Ce qu'on lui reproche :" },
    {
      type: "list",
      items: [
        "Une hausse de prix brutale en 2026.",
        "Interface plus austère que celle de 1Password.",
        "L'authentificateur TOTP est réservé au Premium.",
        "Pas d'équivalent du mode voyage de 1Password.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "Pour qui ?",
      text:
        "Pour qui veut du code ouvert, héberge déjà ses propres services, ou ne veut simplement rien payer. C'est aussi le choix le plus raisonnable pour un club ou une classe : le plan gratuit suffit à tout le monde.",
    },

    { type: "section", id: "onepassword", text: "1Password" },
    {
      type: "para",
      text:
        "1Password est développé par une entreprise canadienne. C'est le plus cher des trois, le plus abouti, et le seul à imposer deux éléments pour ouvrir ton coffre.",
    },
    {
      type: "keylist",
      items: [
        {
          term: "Clé secrète",
          desc: "En plus du mot de passe maître. C'est un long code généré à l'inscription et stocké sur tes appareils : sans lui, un mot de passe maître volé ne suffit pas à ouvrir le coffre.",
        },
        {
          term: "Mode voyage",
          desc: "Retire temporairement des coffres entiers de tes appareils. À une frontière, on ne peut pas te faire déverrouiller ce qui n'est plus là.",
        },
        { term: "Watchtower", desc: "Surveille en continu tes mots de passe faibles, réutilisés, ou apparus dans une fuite, et te le signale sans que tu aies rien à lancer." },
        { term: "Cartes virtuelles", desc: "Des numéros de carte jetables pour payer en ligne sans exposer ta vraie carte (selon les pays)." },
        { term: "Numérisation (OCR)", desc: "Reconnaissance du texte d'un document scanné, pour ranger un papier dans le coffre sans le retaper." },
        { term: "Plateformes", desc: "Web, iOS, Android, Windows, macOS, Linux, extensions de navigateur." },
      ],
    },
    {
      type: "table",
      headers: ["Offre", "Par mois", "À l'année", "Personnes", "Notes"],
      rows: [
        ["Individual", "$4.99", "$47.88", "1", "Pas de partage familial"],
        ["Families", "$7.99", "$71.88", "5", "Le mieux pour un foyer aux appareils variés"],
        ["Teams Starter", "$19.95", "$239.40", "Jusqu'à 10", "Forfait plat, pensé pour les petites équipes"],
        ["Business", "$7.99/personne", "—", "Illimité", "SSO, Okta, journaux d'audit"],
        ["Enterprise", "Sur devis", "Sur devis", "Illimité", "Il faut contacter le service commercial"],
      ],
    },
    {
      type: "callout",
      tone: "info",
      title: "Hausse de mars 2026",
      text:
        "1Password a augmenté ses tarifs en mars 2026 : l'offre Individual est passée de $35.88 à $47.88 par an (+33 %), et Families de $59.88 à $71.88 (+20 %).",
    },
    { type: "para", text: "Ce qui est bien :" },
    {
      type: "list",
      items: [
        "La clé secrète ajoute une protection que les deux autres n'ont pas : il faut te voler deux choses, pas une.",
        "Le mode voyage n'existe nulle part ailleurs.",
        "Watchtower te prévient tout seul, sans que tu penses à vérifier.",
        "L'interface et le support client sont les meilleurs des trois.",
      ],
    },
    { type: "para", text: "Ce qu'on lui reproche :" },
    {
      type: "list",
      items: [
        "Deux fois et demie le prix de Bitwarden.",
        "Aucune offre gratuite : 14 jours d'essai, puis il faut payer.",
        "Le code est fermé — tu fais confiance à l'éditeur et aux audits externes qu'il publie, sans pouvoir vérifier toi-même.",
        "La clé secrète est aussi une contrainte : si tu la perds, personne, pas même 1Password, ne peut te rendre ton coffre.",
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "Pour qui ?",
      text:
        "Pour qui veut l'expérience la plus soignée et accepte de la payer, pour un foyer avec des appareils de toutes marques, et pour qui voyage.",
    },

    { type: "section", id: "le-comparatif", text: "Le comparatif" },
    { type: "para", text: "Ce que ça coûte pour une personne, sur un an :" },
    {
      type: "table",
      headers: ["Offre", "Un an"],
      rows: [
        ["NordPass Premium", "$23.88 (promotion première année)"],
        ["Bitwarden Premium", "$19.80"],
        ["1Password Individual", "$47.88"],
      ],
    },
    {
      type: "para",
      text: "Bitwarden est le moins cher, NordPass suit de près la première année, et 1Password coûte 2,4 fois le prix de Bitwarden.",
    },
    { type: "para", text: "Ce que ça coûte pour une famille, sur un an :" },
    {
      type: "table",
      headers: ["Offre", "Un an", "Personnes"],
      rows: [
        ["NordPass Family", "$47.88", "6"],
        ["Bitwarden Families", "$47.88", "6"],
        ["1Password Families", "$71.88", "5"],
      ],
    },
    {
      type: "para",
      text: "NordPass et Bitwarden sont au même prix pour une personne de plus. Chez 1Password, la sixième personne n'est pas prévue.",
    },
    { type: "para", text: "Et le détail, critère par critère :" },
    {
      type: "table",
      caption: "* Promotion de première année. Bitwarden et 1Password : prix de l'abonnement annuel, ramené au mois.",
      headers: ["Critère", "NordPass", "Bitwarden", "1Password"],
      rows: [
        ["Prix pour une personne", "$1.99/mois*", "$1.65/mois", "$3.99/mois"],
        ["Offre gratuite", "Oui (1 appareil)", "Oui (illimitée)", "Non (essai 14 jours)"],
        ["Chiffrement", "XChaCha20", "AES-256", "AES-256 + clé secrète"],
        ["TOTP intégré", "Non", "Oui (Premium)", "Oui"],
        ["Mode voyage", "Non", "Non", "Oui"],
        ["Code ouvert", "Non", "Oui", "Non"],
        ["Masquage d'e-mail", "Oui", "Non", "Non"],
        ["Partage de coffre", "Oui", "Oui", "Oui"],
        ["Surveillance des fuites", "Oui", "Non", "Oui"],
        ["Cartes virtuelles", "Non", "Non", "Oui"],
        ["Auto-hébergement", "Non", "Oui", "Non"],
        ["Interface", "Très bonne", "Bonne", "Excellente"],
        ["Support client", "Bon", "Bon", "Excellent"],
      ],
    },

    { type: "section", id: "quel-outil-pour-toi", text: "Quel outil pour toi" },
    {
      type: "keylist",
      items: [
        { term: "Tu bidouilles", desc: "Bitwarden. Code ouvert, auto-hébergement, TOTP intégré, et le prix le plus bas." },
        { term: "Sécurité maximale", desc: "1Password. La clé secrète oblige un attaquant à te voler deux choses au lieu d'une." },
        { term: "Le meilleur rapport", desc: "NordPass. Masquage d'e-mail, partage et scanner de fuites, pour moins de deux dollars par mois la première année." },
        { term: "Budget zéro", desc: "Bitwarden. Le seul plan gratuit vraiment utilisable : coffre illimité, tous tes appareils." },
        { term: "Toute la famille", desc: "NordPass Family ou Bitwarden Families : six personnes pour $47.88 par an, contre cinq pour $71.88 chez 1Password." },
        { term: "Tu voyages", desc: "1Password, pour le mode voyage — personne d'autre ne le propose." },
      ],
    },

    { type: "section", id: "migrer", text: "Migrer ses mots de passe" },
    {
      type: "para",
      text:
        "Les trois savent importer depuis un autre gestionnaire et depuis les mots de passe enregistrés dans ton navigateur. Compte un quart d'heure.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Exporte tes mots de passe depuis ton gestionnaire ou ton navigateur actuel, au format CSV.",
        "Crée ton compte sur le nouveau gestionnaire, et mets ton mot de passe maître en lieu sûr (ainsi que la clé secrète, chez 1Password).",
        "Lance l'import du fichier CSV.",
        "Vérifie que tout est bien arrivé, en commençant par les comptes qui comptent : mail, banque, ENT.",
        "Change les mots de passe faibles ou réutilisés que l'outil te signale. C'est à cette étape que tu gagnes vraiment en sécurité, pas à l'installation.",
      ],
    },
    {
      type: "callout",
      tone: "success",
      title: "Supprime le CSV",
      text:
        "Le fichier exporté contient tous tes mots de passe en clair, sans aucune protection. Supprime-le dès l'import terminé, vide la corbeille, et ne le laisse jamais traîner dans tes téléchargements ni dans un cloud.",
    },

    { type: "section", id: "le-verdict", text: "Le verdict" },
    {
      type: "keylist",
      items: [
        { term: "Le moins cher", desc: "Bitwarden." },
        { term: "Le plus équilibré", desc: "NordPass." },
        { term: "Le plus sûr", desc: "1Password, grâce à la clé secrète." },
        { term: "Le plus agréable", desc: "1Password." },
        { term: "Pour les devs", desc: "Bitwarden." },
      ],
    },
    {
      type: "callout",
      tone: "tip",
      title: "Le plus important",
      text:
        "Tu ne peux pas vraiment te tromper : les trois font correctement leur travail. Le seul mauvais choix, c'est de n'en utiliser aucun et de continuer à réutiliser le même mot de passe partout. Commence par l'offre gratuite de Bitwarden ; tu changeras plus tard si l'interface ne te plaît pas.",
    },
  ],
}
