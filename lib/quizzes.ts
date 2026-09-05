import { readJSON, writeJSON } from "@/lib/storage"

// SWAP POINT: quiz definitions are static here; results are stored in
// localStorage. A real version would load quizzes + persist scores in Neon.

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correct: number // index into options
  explanation: string
}

export interface Quiz {
  slug: string
  title: string
  theme: string
  description: string
  emojiFree?: boolean
  questions: QuizQuestion[]
}

export const QUIZZES: Quiz[] = [
  {
    slug: "cyber-bases",
    title: "Les bases de la cyber",
    theme: "Cybersécurité",
    description: "Mots de passe, phishing et bons réflexes du quotidien.",
    questions: [
      {
        id: "q1",
        prompt: "Quel mot de passe est le plus solide ?",
        options: ["Azerty123", "P@ss!", "orage-cobalt-lynx-ardoise", "ton prénom + année"],
        correct: 2,
        explanation: "Une phrase de passe longue de plusieurs mots est bien plus difficile à casser qu'un mot court, même compliqué.",
      },
      {
        id: "q2",
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
        id: "q3",
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
        id: "q4",
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
    theme: "Intelligence artificielle",
    description: "Fonctionnement, limites et usages d'une IA générative.",
    questions: [
      {
        id: "q1",
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
        id: "q2",
        prompt: "Comment appelle-t-on une info fausse inventée par une IA ?",
        options: ["Un bug", "Une hallucination", "Un virus", "Un cache"],
        correct: 1,
        explanation: "On parle d'hallucination : l'IA peut affirmer une fausseté avec assurance.",
      },
      {
        id: "q3",
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
    theme: "Comment ça marche",
    description: "Du clic au serveur : le vocabulaire essentiel.",
    questions: [
      {
        id: "q1",
        prompt: "À quoi sert le DNS ?",
        options: [
          "À chiffrer les messages",
          "À traduire un nom de site en adresse IP",
          "À bloquer les pubs",
          "À accélérer le Wi-Fi",
        ],
        correct: 1,
        explanation: "Le DNS est l'annuaire d'Internet : il relie un nom (exemple.fr) à une adresse IP.",
      },
      {
        id: "q2",
        prompt: "Que garantit le « https » avec le cadenas ?",
        options: [
          "Que le site est honnête",
          "Que la connexion est chiffrée",
          "Que le site est français",
          "Que le site est gratuit",
        ],
        correct: 1,
        explanation: "HTTPS chiffre la connexion, mais ne prouve pas que le site est fiable.",
      },
      {
        id: "q3",
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
    theme: "Données personnelles",
    description: "Traces, réseaux sociaux et empreinte numérique.",
    questions: [
      {
        id: "q1",
        prompt: "Qu'est-ce que l'empreinte numérique ?",
        options: [
          "Ton mot de passe",
          "L'ensemble des traces que tu laisses en ligne",
          "Un type de virus",
          "Ta vitesse de connexion",
        ],
        correct: 1,
        explanation: "Publications, recherches, achats, position… tout cela compose ton empreinte.",
      },
      {
        id: "q2",
        prompt: "Avant de publier une photo, le meilleur réflexe est de…",
        options: [
          "Ne penser à rien",
          "Se demander qui pourra la voir et plus tard",
          "Ajouter sa localisation",
          "Taguer tout le monde",
        ],
        correct: 1,
        explanation: "Ce qui est publié peut rester et être partagé : on réfléchit avant.",
      },
    ],
  },
]

export function getQuiz(slug: string): Quiz | undefined {
  return QUIZZES.find((q) => q.slug === slug)
}

// --- Results persistence ---

export const QUIZ_STORAGE_KEY = "lycee.quiz"

export interface QuizResult {
  slug: string
  score: number
  total: number
  at: number
}

export function loadQuizResults(): Record<string, QuizResult> {
  return readJSON<Record<string, QuizResult>>(QUIZ_STORAGE_KEY, {})
}

export function saveQuizResult(result: QuizResult): void {
  const all = loadQuizResults()
  all[result.slug] = result
  writeJSON(QUIZ_STORAGE_KEY, all)
}
