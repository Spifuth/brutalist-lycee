// Secret-hunt codes hidden around the site. Students find a code, redeem it on
// /chasse, and earn points (+ an optional badge). Edit here for the starting
// set, or manage live in the admin console (Secrets tab).
//
// `location` is a private note for you (where the code is hidden); `hint` is the
// public clue shown on the hunt page.

export interface SecretSeed {
  code: string
  name: string
  hint: string
  location: string
  points: number
  badgeSlug?: string
}

export const SECRET_SEEDS: SecretSeed[] = [
  {
    code: "SIN-KONAMI",
    name: "Le code Konami",
    hint: "Les vieux joueurs connaissent la combinaison magique. Essaie-la sur la page d'accueil.",
    location: "Accueil : séquence clavier ↑ ↑ ↓ ↓ ← → ← → B A",
    points: 30,
    badgeSlug: "secret",
  },
  {
    code: "SIN-SOURCE",
    name: "Vue sur la source",
    hint: "Les développeurs regardent toujours sous le capot. Que cache le code d'une page ?",
    location: "Commentaire HTML caché dans le <head> du site",
    points: 15,
    badgeSlug: "secret",
  },
  {
    code: "SIN-ROBOTS",
    name: "Robots autorisés",
    hint: "Un fichier standard indique aux moteurs de recherche où ne pas aller. Va y jeter un œil.",
    location: "/robots.txt (commentaire)",
    points: 15,
  },
  {
    code: "SIN-TERMINAL",
    name: "L'invité du terminal",
    hint: "Dans le terminal, une commande peu connue révèle un message. Tape « secret ».",
    location: "Terminal : commande `secret`",
    points: 20,
  },
  {
    code: "SIN-404",
    name: "Perdu mais pas pour tout le monde",
    hint: "Que se passe-t-il si tu demandes une page qui n'existe pas ?",
    location: "Page 404 personnalisée",
    points: 15,
  },
  {
    code: "SIN-CONSOLE",
    name: "Message dans la console",
    hint: "Les navigateurs ont une console pour les développeurs. Ouvre-la (F12) et lis bien.",
    location: "console.log au chargement du site",
    points: 20,
  },
  {
    code: "SIN-PROF",
    name: "La page secrète",
    hint: "Il paraît qu'une page cachée existe. Son adresse ressemble à un mot que les espions adorent.",
    location: "/secret",
    points: 25,
    badgeSlug: "secret",
  },
  {
    code: "SIN-LEGENDE",
    name: "La légende",
    hint: "Trouve tous les autres secrets d'abord. Celui-ci se mérite.",
    location: "Récompense manuelle / fin de chasse",
    points: 50,
    badgeSlug: "legend",
  },
]
