// Canonical quiz content (seed source of truth). The app reads quizzes from the
// database; this file defines the starting set and is re-run by db/seed.ts.
// Add quizzes here for version-controlled defaults, or create them live in the
// admin console (Quiz tab).

export interface QuizQuestionSeed {
  prompt: string
  options: string[]
  correct: number
  explanation: string
}

export interface QuizSeed {
  slug: string
  title: string
  topic: string
  level: string
  description: string
  badgeSlug?: string
  questions: QuizQuestionSeed[]
}

export const QUIZ_SEEDS: QuizSeed[] = [
  {
    slug: "cyber-bases",
    title: "Les bases de la cyber",
    topic: "Cybersécurité",
    level: "tous",
    description: "Mots de passe, phishing et bons réflexes du quotidien.",
    badgeSlug: "quiz-first",
    questions: [
      {
        prompt: "Quel mot de passe est le plus solide ?",
        options: ["Azerty123", "P@ss!", "orage-cobalt-lynx-ardoise", "ton prénom + année"],
        correct: 2,
        explanation:
          "Une phrase de passe longue de plusieurs mots est bien plus difficile à casser qu'un mot court, même compliqué.",
      },
      {
        prompt: "Tu reçois un mail « urgent » de ta banque avec un lien. Que fais-tu ?",
        options: [
          "Je clique tout de suite",
          "Je vais sur le site de la banque en tapant l'adresse moi-même",
          "Je réponds avec mon numéro de carte",
          "Je transfère à mes amis",
        ],
        correct: 1,
        explanation: "On n'utilise jamais le lien d'un message suspect. On se rend directement sur le site officiel.",
      },
      {
        prompt: "À quoi sert la double authentification (2FA) ?",
        options: [
          "À rendre le site plus rapide",
          "À ajouter une 2e preuve d'identité en plus du mot de passe",
          "À changer de mot de passe automatiquement",
          "À supprimer les pubs",
        ],
        correct: 1,
        explanation: "La 2FA demande une seconde preuve (code, appli) : même volé, ton mot de passe ne suffit plus.",
      },
      {
        prompt: "Lequel est un signe fréquent de phishing ?",
        options: ["Un ton calme", "Une adresse officielle", "Un sentiment d'urgence", "Aucune faute"],
        correct: 2,
        explanation: "Les arnaques jouent sur l'urgence pour t'empêcher de réfléchir.",
      },
    ],
  },
  {
    slug: "ia-comprendre",
    title: "Comprendre l'IA",
    topic: "Intelligence artificielle",
    level: "tous",
    description: "Fonctionnement, limites et usages d'une IA générative.",
    badgeSlug: "ia-aware",
    questions: [
      {
        prompt: "Une IA générative, en simplifiant, ça fait quoi ?",
        options: [
          "Elle réfléchit comme un humain",
          "Elle prédit le mot suivant le plus probable",
          "Elle copie Internet en direct",
          "Elle dit toujours la vérité",
        ],
        correct: 1,
        explanation: "Un modèle de langage calcule des probabilités de mots ; il ne « comprend » pas comme nous.",
      },
      {
        prompt: "Comment appelle-t-on une info fausse inventée par une IA ?",
        options: ["Un bug", "Une hallucination", "Un virus", "Un cache"],
        correct: 1,
        explanation: "On parle d'hallucination : l'IA peut affirmer une fausseté avec assurance.",
      },
      {
        prompt: "Quel est le meilleur réflexe avec une réponse d'IA ?",
        options: ["La recopier telle quelle", "La vérifier avec une source fiable", "Toujours la refuser", "La partager vite"],
        correct: 1,
        explanation: "On garde son esprit critique : on recoupe avec une source de confiance.",
      },
    ],
  },
  {
    slug: "reseaux",
    title: "Internet & réseaux",
    topic: "Comment ça marche",
    level: "tous",
    description: "Du clic au serveur : le vocabulaire essentiel.",
    badgeSlug: "net-explorer",
    questions: [
      {
        prompt: "À quoi sert le DNS ?",
        options: ["À chiffrer les messages", "À traduire un nom de site en adresse IP", "À bloquer les pubs", "À accélérer le Wi-Fi"],
        correct: 1,
        explanation: "Le DNS est l'annuaire d'Internet : il relie un nom (exemple.fr) à une adresse IP.",
      },
      {
        prompt: "Que garantit le « https » avec le cadenas ?",
        options: ["Que le site est honnête", "Que la connexion est chiffrée", "Que le site est français", "Que le site est gratuit"],
        correct: 1,
        explanation: "HTTPS chiffre la connexion, mais ne prouve pas que le site est fiable.",
      },
      {
        prompt: "Une donnée qui voyage sur le réseau est découpée en…",
        options: ["Pixels", "Paquets", "Cookies", "Tokens"],
        correct: 1,
        explanation: "Les données circulent en petits paquets réassemblés à l'arrivée.",
      },
    ],
  },
  {
    slug: "vie-privee",
    title: "Vie privée en ligne",
    topic: "Données personnelles",
    level: "tous",
    description: "Traces, réseaux sociaux et empreinte numérique.",
    badgeSlug: "net-explorer",
    questions: [
      {
        prompt: "Qu'est-ce que l'empreinte numérique ?",
        options: ["Ton mot de passe", "L'ensemble des traces que tu laisses en ligne", "Un type de virus", "Ta vitesse de connexion"],
        correct: 1,
        explanation: "Publications, recherches, achats, position… tout cela compose ton empreinte.",
      },
      {
        prompt: "Avant de publier une photo, le meilleur réflexe est de…",
        options: ["Ne penser à rien", "Se demander qui pourra la voir et plus tard", "Ajouter sa localisation", "Taguer tout le monde"],
        correct: 1,
        explanation: "Ce qui est publié peut rester et être partagé : on réfléchit avant.",
      },
    ],
  },
]
