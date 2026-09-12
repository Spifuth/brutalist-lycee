// Data-driven documentation. Each article is a list of typed blocks rendered
// generically by the docs renderer.
//
// SWAP POINT: most subjects below are still placeholder lorem built by
// makeArticle(), ready to be replaced by the real course. "Git & GitHub" is the
// first one that is actually written — it lives in ./docs-git so real content
// does not bury the subject index. Follow that shape for the next subject you
// write: a DocSubject in its own file, imported here.

// Explicit .ts extension (tsconfig allowImportingTsExtensions): tests run under
// `node --test --experimental-strip-types`, which resolves ESM specifiers
// literally and cannot find an extensionless one.
import { CE_SITE_SUBJECT } from "./docs-ce-site.ts"
import { COMPTES_SUBJECT } from "./docs-comptes.ts"
import { GIT_SUBJECT } from "./docs-git.ts"
import { PASSWORD_MANAGERS_ARTICLE } from "./docs-gestionnaires-mdp.ts"
import { RESEAUX_SUBJECT } from "./docs-reseaux.ts"

export type DocBlock =
  | { type: "para"; text: string }
  | { type: "section"; id: string; text: string }
  | { type: "code"; label?: string; code: string; prompt?: boolean }
  | { type: "callout"; tone: "info" | "warning" | "tip" | "success"; title?: string; text: string }
  | { type: "keylist"; items: { term: string; desc: string }[] }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }

export interface DocArticle {
  slug: string
  title: string
  summary: string
  blocks: DocBlock[]
}

export interface DocSubject {
  slug: string
  title: string
  command: string
  description: string
  articles: DocArticle[]
}

// --- Helpers to build placeholder-but-structured articles -------------------

const LOREM =
  "Cette section est un contenu d'exemple, prêt à être remplacé par le cours définitif. Le texte reste volontairement neutre pour illustrer la mise en page."

function makeArticle(slug: string, title: string, summary: string, sections: string[]): DocArticle {
  const blocks: DocBlock[] = [
    { type: "para", text: `${summary} ${LOREM}` },
    {
      type: "callout",
      tone: "info",
      title: "Objectif",
      text: `À la fin de cet article, tu sauras l'essentiel sur « ${title.toLowerCase()} ».`,
    },
  ]
  sections.forEach((sec, i) => {
    const id = sec
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    blocks.push({ type: "section", id, text: sec })
    blocks.push({ type: "para", text: LOREM })
    if (i === 0) {
      blocks.push({
        type: "list",
        items: ["Premier point clé à retenir.", "Deuxième point clé à retenir.", "Troisième point clé à retenir."],
      })
    }
    if (i === 1) {
      blocks.push({
        type: "code",
        label: "exemple",
        prompt: true,
        code: `echo "exemple lié à ${title}"\ncat /etc/exemple.conf`,
      })
    }
    if (i === 2) {
      blocks.push({
        type: "keylist",
        items: [
          { term: "Terme A", desc: "Définition d'exemple à remplacer." },
          { term: "Terme B", desc: "Définition d'exemple à remplacer." },
        ],
      })
    }
  })
  blocks.push({
    type: "callout",
    tone: "tip",
    title: "À retenir",
    text: "Reformule l'idée principale avec tes propres mots : c'est la meilleure façon de la mémoriser.",
  })
  return { slug, title, summary, blocks }
}

// --- Subjects ---------------------------------------------------------------

export const DOC_SUBJECTS: DocSubject[] = [
  {
    slug: "fondamentaux",
    title: "Fondamentaux",
    command: "man intro",
    description: "Les bases pour bien démarrer avec l'informatique.",
    articles: [
      makeArticle("ordinateur", "Comment marche un ordinateur", "Processeur, mémoire, stockage : les grands rôles.", ["Le processeur", "La mémoire", "Le stockage"]),
      makeArticle("binaire", "Le binaire", "Pourquoi tout se ramène à des 0 et des 1.", ["Bits et octets", "Compter en binaire", "Encoder du texte"]),
      makeArticle("fichiers", "Fichiers et dossiers", "Organiser l'information sur une machine.", ["Chemins", "Extensions", "Arborescence"]),
      makeArticle("systeme", "Le système d'exploitation", "Le chef d'orchestre de la machine.", ["Rôle de l'OS", "Processus", "Utilisateurs"]),
      makeArticle("logiciel", "Logiciel vs matériel", "Distinguer le physique du programme.", ["Le matériel", "Le logiciel", "Le firmware"]),
      makeArticle("algorithme", "C'est quoi un algorithme", "Une recette d'instructions pour résoudre un problème.", ["Définition", "Un exemple", "Complexité"]),
    ],
  },
  {
    slug: "securite",
    title: "Sécurité",
    command: "man security",
    description: "Se protéger et comprendre les menaces.",
    articles: [
      // Written content, not lorem — unlike every other article in this
      // subject below, still makeArticle() placeholders. "mots-de-passe" and
      // "2fa" used to sit in this list too; both are retired, written for
      // real in the comptes subject instead.
      PASSWORD_MANAGERS_ARTICLE,
      makeArticle("phishing", "Le phishing", "Reconnaître et éviter les messages piégés.", ["Les signes", "Les réflexes", "Que faire"]),
      makeArticle("malwares", "Virus et malwares", "Panorama des logiciels malveillants.", ["Types", "Contamination", "Protection"]),
      makeArticle("ransomware", "Les rançongiciels", "Quand tes fichiers sont pris en otage.", ["Fonctionnement", "Prévention", "Réaction"]),
      makeArticle("ingenierie-sociale", "Ingénierie sociale", "Manipuler l'humain plutôt que la machine.", ["Techniques", "Exemples", "Défense"]),
      makeArticle("hygiene", "Hygiène numérique", "Les bonnes habitudes du quotidien.", ["Mises à jour", "Sauvegardes", "Vigilance"]),
    ],
  },
  // Right after "Sécurité": the same reader, one level deeper — what a login
  // actually is, and why a stolen session survives every barrier in front of it.
  COMPTES_SUBJECT,
  RESEAUX_SUBJECT,
  {
    slug: "ia",
    title: "Intelligence artificielle",
    command: "man ai",
    description: "Comprendre les IA génératives.",
    articles: [
      makeArticle("modeles", "Modèles de langage", "Comment une IA prédit du texte.", ["Entraînement", "Tokens", "Inférence"]),
      makeArticle("hallucinations", "Les hallucinations", "Quand l'IA invente avec assurance.", ["Pourquoi", "Repérer", "Se protéger"]),
      makeArticle("prompts", "Bien écrire un prompt", "La consigne fait la réponse.", ["Contexte", "Objectif", "Format"]),
      makeArticle("biais", "Les biais des IA", "Les données façonnent les réponses.", ["Origine", "Conséquences", "Vigilance"]),
      makeArticle("deepfakes", "Deepfakes", "Images et voix truquées.", ["Techniques", "Détection", "Enjeux"]),
      makeArticle("ethique-ia", "IA et éthique", "Usages responsables au lycée.", ["Travail scolaire", "Vie privée", "Esprit critique"]),
    ],
  },
  {
    slug: "linux",
    title: "Linux & terminal",
    command: "man shell",
    description: "Premiers pas en ligne de commande.",
    articles: [
      makeArticle("terminal", "C'est quoi un terminal", "Parler à la machine par du texte.", ["Le shell", "Le prompt", "Les commandes"]),
      makeArticle("navigation", "Se déplacer", "ls, cd, pwd et l'arborescence.", ["Lister", "Changer de dossier", "Chemins"]),
      makeArticle("fichiers-cli", "Manipuler des fichiers", "cat, cp, mv, rm avec prudence.", ["Lire", "Copier/déplacer", "Supprimer"]),
      makeArticle("permissions", "Les permissions", "Qui a le droit de faire quoi.", ["Utilisateurs", "Groupes", "chmod"]),
      makeArticle("pipes", "Tubes et redirections", "Enchaîner des commandes.", ["Le pipe", "Redirections", "Filtres"]),
      makeArticle("scripts", "Petits scripts", "Automatiser des tâches simples.", ["Variables", "Boucles", "Bonnes pratiques"]),
    ],
  },
  // Placed right after "Linux & terminal": Git is the next tool you meet once
  // you are comfortable in a shell.
  GIT_SUBJECT,
  {
    slug: "web",
    title: "Le Web",
    command: "man web",
    description: "Ce qui se cache derrière une page.",
    articles: [
      makeArticle("html", "HTML", "La structure d'une page.", ["Balises", "Structure", "Accessibilité"]),
      makeArticle("css", "CSS", "La mise en forme.", ["Sélecteurs", "Boîtes", "Responsive"]),
      makeArticle("js", "JavaScript", "Rendre une page interactive.", ["Variables", "Événements", "DOM"]),
      makeArticle("navigateur", "Le navigateur", "Ton fenêtre sur le Web.", ["Moteur de rendu", "Cookies", "Extensions"]),
      makeArticle("cookies", "Cookies et traceurs", "Ce qui te suit d'un site à l'autre.", ["Rôle", "Traceurs", "Contrôle"]),
    ],
  },
  // Straight after "Le Web": the same ideas, but applied to the one site the
  // reader already has open, with traces they can go and measure themselves.
  CE_SITE_SUBJECT,
  {
    slug: "donnees",
    title: "Données & vie privée",
    command: "man privacy",
    description: "Protéger ce qui te définit en ligne.",
    articles: [
      makeArticle("donnees-perso", "Données personnelles", "Ce qui permet de t'identifier.", ["Définition", "Catégories", "Valeur"]),
      makeArticle("empreinte", "Empreinte numérique", "Les traces que tu laisses.", ["Composition", "Durée", "Maîtrise"]),
      makeArticle("rgpd", "Le RGPD", "Tes droits sur tes données.", ["Principes", "Tes droits", "En pratique"]),
      makeArticle("chiffrement", "Le chiffrement", "Rendre un message illisible sans la clé.", ["Principe", "Symétrique/asymétrique", "Au quotidien"]),
      makeArticle("sauvegardes", "Les sauvegardes", "Ne jamais perdre l'essentiel.", ["Règle 3-2-1", "Méthodes", "Tester"]),
      makeArticle("reseaux-sociaux", "Réseaux sociaux", "Partager sans se mettre en danger.", ["Paramètres", "Réputation", "Recul"]),
    ],
  },
]

// --- Lookups ----------------------------------------------------------------

export function getSubject(slug: string): DocSubject | undefined {
  return DOC_SUBJECTS.find((s) => s.slug === slug)
}

export function getArticle(subjectSlug: string, articleSlug: string): DocArticle | undefined {
  return getSubject(subjectSlug)?.articles.find((a) => a.slug === articleSlug)
}

export interface FlatArticle {
  subject: DocSubject
  article: DocArticle
}

// Flattened, ordered list for prev/next navigation.
export function flatArticles(): FlatArticle[] {
  const out: FlatArticle[] = []
  for (const subject of DOC_SUBJECTS) {
    for (const article of subject.articles) out.push({ subject, article })
  }
  return out
}

export function adjacentArticles(subjectSlug: string, articleSlug: string): {
  prev: FlatArticle | null
  next: FlatArticle | null
} {
  const flat = flatArticles()
  const idx = flat.findIndex((f) => f.subject.slug === subjectSlug && f.article.slug === articleSlug)
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null,
  }
}

export function totalArticles(): number {
  return DOC_SUBJECTS.reduce((n, s) => n + s.articles.length, 0)
}
