// Canonical badge catalogue (seed source of truth). The app reads badges from
// the database; this file defines the starting set and is re-run by db/seed.ts.
//
// `kind` documents how a badge is earned:
//   - "auto:<event>" : awarded automatically by server logic (see lib/awards.ts)
//   - "manual"       : granted by an admin
// `icon` is a lucide-react icon name.

export interface BadgeSeed {
  slug: string
  name: string
  description: string
  icon: string
  points: number
  kind: string
}

export const BADGE_SEEDS: BadgeSeed[] = [
  { slug: "first-login", name: "Première connexion", description: "Tu as créé ton identité.", icon: "log-in", points: 5, kind: "auto:signup" },
  { slug: "survey-court", name: "Sondé·e", description: "Questionnaire découverte terminé.", icon: "clipboard-check", points: 10, kind: "auto:survey:decouverte" },
  { slug: "survey-moyen", name: "Curieux·se", description: "Questionnaire intermédiaire terminé.", icon: "clipboard-check", points: 10, kind: "auto:survey:intermediaire" },
  { slug: "survey-complet", name: "À fond", description: "Questionnaire complet terminé.", icon: "clipboard-check", points: 15, kind: "auto:survey:avance" },
  { slug: "voter", name: "Électeur·rice", description: "Tu as voté pour des sujets.", icon: "vote", points: 10, kind: "auto:vote" },
  { slug: "quiz-first", name: "Premier quiz", description: "Un quiz terminé.", icon: "help-circle", points: 10, kind: "auto:quiz:any" },
  { slug: "quiz-perfect", name: "Sans faute", description: "100 % à un quiz.", icon: "target", points: 20, kind: "auto:quiz:perfect" },
  { slug: "quiz-all", name: "Encyclopédie", description: "Tous les quiz terminés.", icon: "library", points: 40, kind: "auto:quiz:all" },
  { slug: "ia-aware", name: "IA lucide", description: "Connaît les limites des IA.", icon: "brain", points: 15, kind: "manual" },
  { slug: "net-explorer", name: "Explorateur·rice", description: "Comprend le voyage d'une donnée.", icon: "network", points: 15, kind: "manual" },
  { slug: "terminal-init", name: "Shell", description: "Première commande dans le terminal.", icon: "terminal", points: 10, kind: "auto:terminal" },
  { slug: "asker", name: "Questionneur·se", description: "A posé une question au mur.", icon: "message-circle", points: 10, kind: "auto:question" },
  { slug: "hunter", name: "Chasseur·se", description: "A trouvé un premier secret.", icon: "search", points: 15, kind: "auto:secret:any" },
  { slug: "secret", name: "Easter egg", description: "A débusqué un secret bien caché.", icon: "egg", points: 20, kind: "manual" },
  { slug: "night-owl", name: "Noctambule", description: "Actif·ve tard le soir.", icon: "moon", points: 10, kind: "manual" },
  // Gaming-themed secrets (DESTINY2 / ACHERON / FORTNITE) were created live in
  // the admin console pointing at a badge slug that did not exist — "Jeu" and
  // "jeu". awardBadge() returns false silently for an unknown slug, so students
  // redeeming those three got `hunter` and nothing else, with no error anywhere.
  { slug: "jeu", name: "Gamer", description: "Tu as trouvé un secret caché dans un jeu.", icon: "gamepad-2", points: 15, kind: "manual" },
  { slug: "legend", name: "Légende", description: "A trouvé tous les secrets.", icon: "crown", points: 50, kind: "auto:secret:all" },
]
