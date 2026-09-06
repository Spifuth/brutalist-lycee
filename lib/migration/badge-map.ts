// Old (Astro/SQLite) badge id → new (Next.js/Postgres) badge slug, for
// sub-project C's one-time data migration. See the vault:
// "Migration des données — SQLite → PostgreSQL", problem 3.
//
// The old and new badge vocabularies were invented eight months apart, by
// different processes, with no shared schema — of 18 old ids and 16 new
// slugs, not one name is shared. Ten map onto an existing new slug by
// meaning. The other eight have no equivalent concept at all, so they map
// onto themselves and are created fresh via ORPHAN_BADGES below.
//
// BADGE_MAP MUST be total over the old id set: 106 badge_unlocks rows are
// migrated by looking each one up here, and a missing entry means that
// student's unlock silently vanishes instead of migrating.
import type { BadgeSeed } from "@/db/seeds/badges"

export const BADGE_MAP: Record<string, string> = {
  // Ten map onto badges that already exist in db/seeds/badges.ts, by meaning.
  bienvenue: "first-login",
  bavard: "asker",
  curieux: "survey-court",
  "premier-quiz": "quiz-first",
  "score-parfait": "quiz-perfect",
  explorateur: "net-explorer",
  encyclopediste: "quiz-all",
  supporter: "voter",
  causeur: "asker",
  insomniaque: "night-owl",

  // Eight have no new-app equivalent. They map onto themselves and are
  // created by ORPHAN_BADGES so their unlocks still resolve to a real row.
  coquet: "coquet",
  "pinceau-fou": "pinceau-fou",
  marathonien: "marathonien",
  perfectionniste: "perfectionniste",
  polyvalent: "polyvalent",
  "vieux-gamer": "vieux-gamer",
  citoyen: "citoyen",
  matinal: "matinal",
}

// The eight orphan badges, to be upserted into the new `badges` table
// before badge_unlocks is migrated.
//
// `coquet` and `pinceau-fou` were earned for customising an avatar — a
// feature the new app had lost and has now regained (avatar upload,
// sub-project G). The operator's call: re-point them at that feature and
// keep them earnable (`kind: "auto:avatar"`), rather than freeze them as
// dead history.
//
// The other six describe concepts the new app has no mechanic for at all
// (session length, perfect-run streaks, activity breadth, account tenure,
// site citizenship, early-morning activity) — they stay `kind: "manual"`,
// same as other inert badges in db/seeds/badges.ts (e.g. "secret").
export const ORPHAN_BADGES: BadgeSeed[] = [
  {
    slug: "coquet",
    name: "Coquet·te",
    description: "A personnalisé son avatar.",
    icon: "sparkles",
    points: 10,
    kind: "auto:avatar",
  },
  {
    slug: "pinceau-fou",
    name: "Pinceau fou",
    description: "A customisé son avatar plusieurs fois.",
    icon: "paintbrush",
    points: 15,
    kind: "auto:avatar",
  },
  {
    slug: "marathonien",
    name: "Marathonien·ne",
    description: "Une longue session d'un seul tenant.",
    icon: "timer",
    points: 15,
    kind: "manual",
  },
  {
    slug: "perfectionniste",
    name: "Perfectionniste",
    description: "Plusieurs quiz réussis sans faute.",
    icon: "target",
    points: 20,
    kind: "manual",
  },
  {
    slug: "polyvalent",
    name: "Polyvalent·e",
    description: "Actif·ve sur toutes les rubriques du site.",
    icon: "shapes",
    points: 15,
    kind: "manual",
  },
  {
    slug: "vieux-gamer",
    name: "Vieux gamer",
    description: "Fidèle depuis les débuts du site.",
    icon: "history",
    points: 10,
    kind: "manual",
  },
  {
    slug: "citoyen",
    name: "Citoyen·ne",
    description: "Implication remarquée dans la vie du site.",
    icon: "users",
    points: 10,
    kind: "manual",
  },
  {
    slug: "matinal",
    name: "Matinal·e",
    description: "Actif·ve tôt le matin.",
    icon: "sunrise",
    points: 10,
    kind: "manual",
  },
]
