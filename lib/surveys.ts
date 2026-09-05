import { readJSON, writeJSON } from "@/lib/storage"
import type { SurveyLevel } from "@/lib/profile"

// ---------------------------------------------------------------------------
// Shared question bank. Every survey (court / moyen / complet) references keys
// from this single bank so answers are stored per QUESTION KEY and shared
// across surveys. Answering the short survey pre-fills the same questions in a
// longer one later.
// ---------------------------------------------------------------------------

export type QuestionType = "single" | "multi" | "scale"

export interface SurveyOption {
  value: string
  label: string
}

export interface Question {
  key: string
  theme: string
  type: QuestionType
  prompt: string
  help?: string
  options?: SurveyOption[] // for single / multi
  scaleLabels?: [string, string] // for scale [min, max]
}

// answers: single -> string, multi -> string[], scale -> number
export type AnswerValue = string | string[] | number
export type SurveyAnswers = Record<string, AnswerValue>

export const SURVEY_STORAGE_KEY = "lycee.survey"

export interface SurveyStore {
  answers: SurveyAnswers
  completedLevels: SurveyLevel[]
  updatedAt: number
}

const EMPTY_STORE: SurveyStore = { answers: {}, completedLevels: [], updatedAt: 0 }

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------

export const QUESTION_BANK: Record<string, Question> = {
  aisance_info: {
    key: "aisance_info",
    theme: "Aisance informatique",
    type: "scale",
    prompt: "À quel point te sens-tu à l'aise avec l'informatique en général ?",
    scaleLabels: ["Débutant·e", "Très à l'aise"],
  },
  usage_quotidien: {
    key: "usage_quotidien",
    theme: "Aisance informatique",
    type: "multi",
    prompt: "Qu'est-ce que tu utilises le plus au quotidien ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "smartphone", label: "Smartphone" },
      { value: "ordi", label: "Ordinateur portable / fixe" },
      { value: "console", label: "Console de jeu" },
      { value: "tablette", label: "Tablette" },
      { value: "aucun", label: "Le moins possible" },
    ],
  },
  mdp_gestion: {
    key: "mdp_gestion",
    theme: "Mots de passe",
    type: "single",
    prompt: "Comment gères-tu tes mots de passe ?",
    options: [
      { value: "meme", label: "Souvent le même partout" },
      { value: "variantes", label: "Des variantes proches" },
      { value: "differents", label: "Différents pour les comptes importants" },
      { value: "gestionnaire", label: "Un gestionnaire de mots de passe" },
    ],
  },
  mdp_solide: {
    key: "mdp_solide",
    theme: "Mots de passe",
    type: "single",
    prompt: "Selon toi, qu'est-ce qui rend un mot de passe solide ?",
    options: [
      { value: "long", label: "Sa longueur (une phrase de passe)" },
      { value: "symboles", label: "Beaucoup de symboles compliqués" },
      { value: "secret", label: "Le fait que personne ne le connaisse" },
      { value: "sais_pas", label: "Je ne sais pas trop" },
    ],
  },
  phishing_reflexe: {
    key: "phishing_reflexe",
    theme: "Phishing",
    type: "single",
    prompt: "Tu reçois un SMS « Votre colis est bloqué, payez 2€ ici ». Que fais-tu ?",
    options: [
      { value: "clique", label: "Je clique pour régler vite" },
      { value: "verifie", label: "Je vérifie directement sur le site du transporteur" },
      { value: "ignore", label: "J'ignore / je supprime" },
      { value: "demande", label: "Je demande à quelqu'un de confiance" },
    ],
  },
  phishing_indices: {
    key: "phishing_indices",
    theme: "Phishing",
    type: "multi",
    prompt: "Quels signes peuvent trahir une tentative d'arnaque ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "urgence", label: "Un sentiment d'urgence" },
      { value: "fautes", label: "Des fautes d'orthographe" },
      { value: "adresse", label: "Une adresse d'expéditeur bizarre" },
      { value: "cadeau", label: "Un cadeau / gain trop beau" },
      { value: "lien", label: "Un lien qui ne correspond pas au site" },
    ],
  },
  ia_usage: {
    key: "ia_usage",
    theme: "Intelligence artificielle",
    type: "single",
    prompt: "Utilises-tu des outils d'IA (ChatGPT, générateurs d'images…) ?",
    options: [
      { value: "souvent", label: "Souvent" },
      { value: "parfois", label: "De temps en temps" },
      { value: "jamais", label: "Jamais" },
      { value: "sais_pas", label: "Je ne sais pas ce que c'est vraiment" },
    ],
  },
  ia_confiance: {
    key: "ia_confiance",
    theme: "Intelligence artificielle",
    type: "scale",
    prompt: "À quel point fais-tu confiance aux réponses d'une IA ?",
    scaleLabels: ["Aucune confiance", "Confiance totale"],
  },
  vie_privee_partage: {
    key: "vie_privee_partage",
    theme: "Vie privée",
    type: "single",
    prompt: "Avant de publier une photo, tu penses à…",
    options: [
      { value: "rien", label: "Rien de spécial" },
      { value: "qui_voit", label: "Qui peut la voir" },
      { value: "consequences", label: "Aux conséquences plus tard" },
      { value: "jamais_publie", label: "Je ne publie pas de photos" },
    ],
  },
  vie_privee_donnees: {
    key: "vie_privee_donnees",
    theme: "Vie privée",
    type: "scale",
    prompt: "À quel point te sens-tu concerné·e par la protection de tes données ?",
    scaleLabels: ["Pas du tout", "Beaucoup"],
  },
  // --- Deeper questions (moyen / complet) ---
  double_auth: {
    key: "double_auth",
    theme: "Double authentification",
    type: "single",
    prompt: "As-tu déjà activé la double authentification (2FA) sur un compte ?",
    options: [
      { value: "oui_plusieurs", label: "Oui, sur plusieurs comptes" },
      { value: "oui_un", label: "Oui, sur au moins un" },
      { value: "non", label: "Non" },
      { value: "connais_pas", label: "Je ne connais pas la 2FA" },
    ],
  },
  https_compris: {
    key: "https_compris",
    theme: "HTTPS",
    type: "single",
    prompt: "Que signifie le cadenas / « https » dans la barre d'adresse ?",
    options: [
      { value: "chiffre", label: "La connexion au site est chiffrée" },
      { value: "sur", label: "Le site est forcément fiable" },
      { value: "rapide", label: "Le site est plus rapide" },
      { value: "sais_pas", label: "Je ne sais pas" },
    ],
  },
  sauvegardes: {
    key: "sauvegardes",
    theme: "Sauvegardes",
    type: "single",
    prompt: "Fais-tu des sauvegardes de tes fichiers importants ?",
    options: [
      { value: "auto", label: "Oui, automatiquement (cloud / disque)" },
      { value: "parfois", label: "De temps en temps, à la main" },
      { value: "jamais", label: "Jamais" },
      { value: "pas_besoin", label: "Je n'ai rien d'important" },
    ],
  },
  // --- Complet only ---
  chiffrement: {
    key: "chiffrement",
    theme: "Chiffrement",
    type: "scale",
    prompt: "Comprends-tu ce qu'est le chiffrement des messages ?",
    scaleLabels: ["Pas du tout", "Très bien"],
  },
  empreinte_num: {
    key: "empreinte_num",
    theme: "Empreinte numérique",
    type: "multi",
    prompt: "Qu'est-ce qui compose ton « empreinte numérique » ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "posts", label: "Tes publications" },
      { value: "recherches", label: "Tes recherches" },
      { value: "achats", label: "Tes achats en ligne" },
      { value: "position", label: "Ta position / géolocalisation" },
      { value: "comptes", label: "Les comptes créés puis oubliés" },
    ],
  },
  esprit_critique: {
    key: "esprit_critique",
    theme: "Esprit critique",
    type: "single",
    prompt: "Face à une info surprenante en ligne, ton premier réflexe est de…",
    options: [
      { value: "partage", label: "La partager si elle est marquante" },
      { value: "source", label: "Chercher la source d'origine" },
      { value: "recoupe", label: "Recouper avec d'autres médias" },
      { value: "rien", label: "Ne rien faire de particulier" },
    ],
  },
  metiers_interet: {
    key: "metiers_interet",
    theme: "Orientation",
    type: "multi",
    prompt: "Quels domaines du numérique t'attirent le plus ?",
    help: "Plusieurs réponses possibles.",
    options: [
      { value: "cyber", label: "Cybersécurité" },
      { value: "dev", label: "Développement / programmation" },
      { value: "ia", label: "Intelligence artificielle" },
      { value: "reseau", label: "Réseaux & systèmes" },
      { value: "jeu", label: "Jeu vidéo" },
      { value: "aucun", label: "Aucun pour l'instant" },
    ],
  },
}

// ---------------------------------------------------------------------------
// Survey definitions (level -> ordered list of question keys)
// ---------------------------------------------------------------------------

export interface SurveyDef {
  level: SurveyLevel
  title: string
  subtitle: string
  minutes: number
  questionKeys: string[]
}

const COURT_KEYS = ["aisance_info", "mdp_gestion", "phishing_reflexe", "ia_usage", "vie_privee_partage"]

const MOYEN_KEYS = [
  ...COURT_KEYS,
  "usage_quotidien",
  "mdp_solide",
  "phishing_indices",
  "ia_confiance",
  "double_auth",
  "https_compris",
]

const COMPLET_KEYS = [
  ...MOYEN_KEYS,
  "vie_privee_donnees",
  "sauvegardes",
  "chiffrement",
  "empreinte_num",
  "esprit_critique",
  "metiers_interet",
]

export const SURVEYS: Record<SurveyLevel, SurveyDef> = {
  court: {
    level: "court",
    title: "Questionnaire court",
    subtitle: "L'essentiel en 5 questions",
    minutes: 2,
    questionKeys: COURT_KEYS,
  },
  moyen: {
    level: "moyen",
    title: "Questionnaire moyen",
    subtitle: "Un peu plus en détail",
    minutes: 5,
    questionKeys: MOYEN_KEYS,
  },
  complet: {
    level: "complet",
    title: "Questionnaire complet",
    subtitle: "Le tour complet de tes usages",
    minutes: 10,
    questionKeys: COMPLET_KEYS,
  },
}

export const SURVEY_LEVELS: SurveyLevel[] = ["court", "moyen", "complet"]

export function getSurvey(level: SurveyLevel): SurveyDef {
  return SURVEYS[level]
}

export function getQuestions(level: SurveyLevel): Question[] {
  return SURVEYS[level].questionKeys.map((k) => QUESTION_BANK[k])
}

// ---------------------------------------------------------------------------
// Persistence (SWAP POINT: loadSurveyData / saveSurveyResult -> real DB)
// ---------------------------------------------------------------------------

export function loadSurveyData(): SurveyStore {
  return readJSON<SurveyStore>(SURVEY_STORAGE_KEY, EMPTY_STORE)
}

export function saveSurveyResult(answers: SurveyAnswers, level: SurveyLevel): SurveyStore {
  const store = loadSurveyData()
  const merged: SurveyStore = {
    answers: { ...store.answers, ...answers },
    completedLevels: store.completedLevels.includes(level)
      ? store.completedLevels
      : [...store.completedLevels, level],
    updatedAt: Date.now(),
  }
  writeJSON(SURVEY_STORAGE_KEY, merged)
  return merged
}

export function saveSurveyProgress(answers: SurveyAnswers): void {
  const store = loadSurveyData()
  writeJSON(SURVEY_STORAGE_KEY, { ...store, answers: { ...store.answers, ...answers }, updatedAt: Date.now() })
}
