// Secret categories, grouped into something a student can actually filter on.
//
// The secret list carries 46 distinct raw categories, 24 of which have exactly
// one member (PHILOSOPHY, ART-HISTORY, JOKES, MANGA-CREATORS…). As a filter row
// that is unusable: 46 chips, most of them matching a single card. The raw
// category is still what gets stored — the admin console takes free text and
// the operator's own vocabulary is worth keeping — but the board groups them
// into ten families.
//
// An unmapped category falls into AUTRE rather than vanishing.
// tests/secret-seeds.test.ts fails if any seeded category lands there, so
// adding a secret with a new category is a decision, not a silent demotion.

export const SECRET_FAMILIES = {
  CYBER: "Cybersécurité",
  WEB: "Web & dev",
  TECH: "Tech & IA",
  GAMING: "Jeux vidéo",
  INTERNET: "Culture internet",
  ECRANS: "Films & séries",
  ANIME: "Anime & manga",
  CULTURE: "Culture générale",
  SCIENCE: "Sciences",
  META: "Paliers",
  AUTRE: "Autre",
} as const

export type SecretFamily = keyof typeof SECRET_FAMILIES

const BY_CATEGORY: Record<string, SecretFamily> = {
  // Cybersécurité — the biggest family by far, and the point of the site.
  CYBERSECURITY: "CYBER",
  "CYBERSECURITY-HISTORY": "CYBER",
  SECURITY: "CYBER",
  HACKING: "CYBER",
  "HACKING-HISTORY": "CYBER",
  ENCODING: "CYBER",

  // Web & dev
  WEB: "WEB",
  "WEB-HISTORY": "WEB",
  PROGRAMMING: "WEB",
  DEVOPS: "WEB",

  // Tech & IA
  TECH: "TECH",
  "TECH-HISTORY": "TECH",
  "TECH-PEOPLE": "TECH",
  AI: "TECH",
  "AI-GAMING": "TECH",

  // Jeux vidéo
  GAMING: "GAMING",
  "GAMING-ANIME": "GAMING",
  "GAMING-CREATORS": "GAMING",
  STREAMERS: "GAMING",
  "EASTER-EGG": "GAMING",

  // Culture internet
  "INTERNET-MEMES": "INTERNET",
  "INTERNET-HORROR": "INTERNET",
  "INTERNET-CULTURE": "INTERNET",
  YOUTUBERS: "INTERNET",
  JOKES: "INTERNET",

  // Films & séries
  MOVIES: "ECRANS",
  "MOVIES-BOOKS": "ECRANS",
  "MOVIES-AESTHETIC": "ECRANS",
  TV: "ECRANS",
  COMICS: "ECRANS",
  "COMICS-MOVIES": "ECRANS",

  // Anime & manga
  ANIME: "ANIME",
  "ANIME-MANGA": "ANIME",
  "MANGA-CREATORS": "ANIME",

  // Culture générale
  BOOKS: "CULTURE",
  "BOOKS-TV": "CULTURE",
  LITERATURE: "CULTURE",
  MUSIC: "CULTURE",
  "MUSIC-HISTORY": "CULTURE",
  PHILOSOPHY: "CULTURE",
  "ART-HISTORY": "CULTURE",
  HISTORY: "CULTURE",

  // Sciences
  SCIENCE: "SCIENCE",
  ASTRONOMY: "SCIENCE",
  PHYSICS: "SCIENCE",

  // Paliers
  META: "META",
}

/** The family a raw category belongs to. Unknown categories land in AUTRE. */
export function familyOf(category: string): SecretFamily {
  return BY_CATEGORY[category?.toUpperCase?.() ?? ""] ?? "AUTRE"
}

export const DIFFICULTY_LABELS = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  insane: "Démentiel",
} as const

export type SecretDifficulty = keyof typeof DIFFICULTY_LABELS

/** Hardest last, so the board reads as a ramp rather than an unsorted pile. */
export const DIFFICULTY_ORDER: SecretDifficulty[] = ["easy", "medium", "hard", "insane"]
