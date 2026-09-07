import type { DocArticle } from "./docs"

export const STRONG_PASSWORDS_ARTICLE: DocArticle = {
  slug: "mots-de-passe",
  title: "Mots de passe solides",
  summary: "Pourquoi une phrase de passe est meilleure, et comment la garder simple à vivre au quotidien.",
  blocks: [
    {
      type: "para",
      text:
        "Le but d'un mot de passe n'est pas d'être « compliqué », mais d'être impossible à deviner et impossible à réutiliser ailleurs. La meilleure stratégie n'est pas un mot bizarre avec des symboles au hasard : c'est une phrase de passe longue, unique pour chaque compte, générée et stockée dans un gestionnaire.",
    },
    {
      type: "callout",
      tone: "tip",
      title: "Pourquoi le site te propose une phrase de passe",
      text:
        "Une phrase de passe de 5 ou 6 mots aléatoires contient beaucoup plus d'entropie qu'un mot court « amélioré » avec un point d'exclamation. Elle est à la fois plus sûre et plus facile à recopier correctement.",
    },
    { type: "section", id: "ce-qui-rend-un-mot-de-passe-fort", text: "Ce qui rend un mot de passe fort" },
    {
      type: "keylist",
      items: [
        { term: "Longueur", desc: "Le critère principal : plus c'est long, plus la recherche exhaustive devient irréaliste." },
        { term: "Unicité", desc: "Un mot de passe par service. Une fuite sur un site ne doit ouvrir aucun autre compte." },
        { term: "Aléatoire", desc: "Évite les dates, prénoms, équipes de foot, suites de clavier ou références perso faciles à deviner." },
        { term: "Stockage sûr", desc: "Un gestionnaire te permet d'avoir des mots de passe uniques partout sans les mémoriser tous." },
      ],
    },
    { type: "section", id: "mauvais-reflexes-courants", text: "Mauvais réflexes courants" },
    {
      type: "list",
      items: [
        "Réutiliser le même mot de passe sur la boîte mail et les réseaux sociaux.",
        "Faire juste une variante (exemple: motdepasse1, motdepasse2, motdepasse3).",
        "Conserver ses identifiants en clair dans les notes du téléphone ou un fichier non chiffré.",
        "Partager un mot de passe important dans une conversation.",
      ],
    },
    { type: "section", id: "la-bonne-routine", text: "La bonne routine" },
    {
      type: "list",
      ordered: true,
      items: [
        "Choisis un gestionnaire de mots de passe et active sa génération automatique.",
        "Commence par les comptes critiques : e-mail, ENT, banque, réseaux sociaux.",
        "Remplace les anciens mots de passe réutilisés par des phrases longues et uniques.",
        "Active la double authentification sur ces mêmes comptes.",
      ],
    },
    {
      type: "callout",
      tone: "warning",
      title: "Le compte e-mail d'abord",
      text:
        "Si ta messagerie est compromise, un attaquant peut réinitialiser tes autres mots de passe. Sécurise-la en premier avec une phrase de passe unique et la double authentification.",
    },
  ],
}

export const PHISHING_ARTICLE: DocArticle = {
  slug: "phishing",
  title: "Le phishing",
  summary: "Repérer les messages piégés, éviter le clic de trop, et réagir vite si tu t'es fait avoir.",
  blocks: [
    {
      type: "para",
      text:
        "Le phishing (hameçonnage) consiste à te pousser à agir dans l'urgence: cliquer un lien, ouvrir une pièce jointe, ou donner un code. L'attaque vise ton attention, pas ton niveau technique.",
    },
    { type: "section", id: "les-signes-qui-doivent-alerter", text: "Les signes qui doivent alerter" },
    {
      type: "list",
      items: [
        "Le message crée une urgence artificielle: « ton compte sera suspendu dans 10 minutes ».",
        "L'adresse d'expéditeur ressemble à la vraie sans l'être exactement.",
        "Le lien visible n'est pas le même que l'URL réelle.",
        "On te demande un code de double authentification, un mot de passe ou des infos bancaires.",
        "Le ton est inhabituel pour la personne ou l'organisme censé l'envoyer.",
      ],
    },
    { type: "section", id: "les-bons-reflexes", text: "Les bons réflexes" },
    {
      type: "keylist",
      items: [
        { term: "Pause", desc: "Prends 10 secondes. Les arnaques marchent surtout quand on agit trop vite." },
        { term: "Vérification", desc: "Ouvre le service toi-même depuis un favori ou en tapant l'adresse, pas via le lien du message." },
        { term: "Canal secondaire", desc: "Si un proche demande de l'argent ou un code, confirme par appel ou message séparé." },
        { term: "Signalement", desc: "Transmets le message suspect à l'adulte référent, au support ou à la plateforme concernée." },
      ],
    },
    { type: "section", id: "si-tu-as-clique-ou-donne-ton-mot-de-passe", text: "Si tu as cliqué ou donné ton mot de passe" },
    {
      type: "list",
      ordered: true,
      items: [
        "Change immédiatement le mot de passe du compte concerné, puis des autres comptes qui réutilisaient le même.",
        "Déconnecte les sessions inconnues et vérifie les appareils connectés.",
        "Active (ou renforce) la double authentification.",
        "Préviens le support du service pour signaler la compromission.",
        "Vérifie ensuite ta boîte mail et tes règles de transfert: c'est souvent la deuxième étape d'une prise de compte.",
      ],
    },
    {
      type: "callout",
      tone: "success",
      title: "Pas de honte",
      text:
        "Se faire piéger arrive à tout le monde. La différence, c'est la vitesse de réaction: plus tu agis tôt, plus tu limites les dégâts.",
    },
  ],
}
