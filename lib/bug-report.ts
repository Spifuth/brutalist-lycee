// Deux fonctions pures derrière la page /bug-report : l'une rend le message
// que l'élève colle dans #bug-report, l'autre construit l'URL d'une issue
// GitHub déjà remplie.
//
// Les `id` ci-dessous ne sont pas décoratifs : ce sont les identifiants des
// champs de .github/ISSUE_TEMPLATE/*.yml. GitHub pré-remplit un formulaire
// d'issue à partir de paramètres de query portant ces noms, et ignore
// silencieusement tout paramètre inconnu — d'où le test qui relit les vrais
// templates.

export const REPO_URL = "https://github.com/Spifuth/brutalist-lycee"
export const DISCORD_CHANNEL = "#bug-report"

/** Discord refuse un message au-delà de 2000 caractères. */
export const DISCORD_LIMIT = 2000
/** Au-delà, une URL est tronquée ou refusée selon le navigateur. */
export const URL_BUDGET = 6000
export const TRUNCATION_MARK = "…(coupé — la suite est dans l'issue)"

export type ReportKind = "bug" | "contenu" | "code" | "idee"

export interface ReportField {
  id: string
  label: string
  input: "text" | "textarea" | "select"
  options?: string[]
  placeholder?: string
  required?: boolean
}

export interface KindSpec {
  kind: ReportKind
  label: string
  template: string
  fields: ReportField[]
}

export interface Report {
  kind: ReportKind
  fields: Record<string, string>
  pseudo?: string
  agent?: string
}

export const KINDS: KindSpec[] = [
  {
    kind: "bug",
    label: "Bug",
    template: "bug.yml",
    fields: [
      { id: "quoi", label: "Ce qui se passe", input: "textarea", required: true,
        placeholder: "Sur /chasse, quand je valide un code correct, rien ne se passe." },
      { id: "reproduire", label: "Comment le reproduire", input: "textarea", required: true,
        placeholder: "1.\n2.\n3." },
      { id: "attendu", label: "Ce que tu attendais à la place", input: "text", required: true },
      { id: "erreur", label: "Message d'erreur", input: "textarea",
        placeholder: "F12 → Console. Du texte, pas une capture d'écran." },
      { id: "ou", label: "Où", input: "select", required: true,
        options: ["Sur le site en ligne", "En local (pnpm dev)", "En local (docker compose)"] },
    ],
  },
  {
    kind: "contenu",
    label: "Contenu",
    template: "contenu.yml",
    fields: [
      { id: "type", label: "Type de contenu", input: "select", required: true,
        options: [
          "Quiz (db/seeds/quizzes.ts)",
          "Badge (db/seeds/badges.ts)",
          "Secret de la chasse (db/seeds/secrets.ts)",
          "Article de cours (lib/docs-*.ts)",
          "Correction de texte / faute",
        ] },
      { id: "proposition", label: "Ta proposition", input: "textarea", required: true },
      { id: "pourquoi", label: "Pourquoi c'est utile pour la classe", input: "text", required: true },
    ],
  },
  {
    kind: "code",
    label: "Code",
    template: "code.yml",
    fields: [
      { id: "fichiers", label: "Les fichiers concernés", input: "text", required: true,
        placeholder: "components/quiz/quiz-runner.tsx, components/quiz/live-quiz.tsx" },
      { id: "constat", label: "Ce que tu as remarqué", input: "textarea", required: true },
      { id: "pourquoi", label: "Pourquoi ça pose problème", input: "textarea" },
      { id: "corriger", label: "Est-ce que tu veux le corriger toi-même ?", input: "select", required: true,
        options: ["Oui, je veux essayer", "Oui, mais j'aurai besoin d'aide", "Non, je signale seulement"] },
    ],
  },
  {
    kind: "idee",
    label: "Idée",
    template: "idee.yml",
    fields: [
      { id: "idee", label: "L'idée", input: "textarea", required: true },
      { id: "probleme", label: "Quel problème ça résout", input: "textarea", required: true },
      { id: "aide", label: "Est-ce que tu veux la coder toi-même ?", input: "select", required: true,
        options: ["Oui, je veux essayer", "Oui, mais j'aurai besoin d'aide", "Non, je propose seulement"] },
    ],
  },
]

export function specFor(kind: ReportKind): KindSpec {
  const spec = KINDS.find((k) => k.kind === kind)
  if (!spec) throw new Error(`type de signalement inconnu : ${kind}`)
  return spec
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  if (max <= 0) return ""
  // Pas assez de place pour le repère de coupure lui-même : l'ajouter
  // dépasserait `max`. On tronque net plutôt que de mentir sur la longueur.
  if (max <= TRUNCATION_MARK.length) return text.slice(0, max)
  const keep = max - TRUNCATION_MARK.length - 1
  return `${text.slice(0, keep).trimEnd()}\n${TRUNCATION_MARK}`
}

/** Le texte que l'élève colle dans #bug-report. */
export function buildDiscordMessage(report: Report): string {
  const spec = specFor(report.kind)
  const lines: string[] = [`**[${spec.label.toUpperCase()}]** \`brutalist-lycee\``]

  for (const field of spec.fields) {
    const value = (report.fields[field.id] ?? "").trim()
    if (!value) continue
    lines.push("", `**${field.label}**`, value)
  }

  const context = [report.pseudo?.trim(), report.agent?.trim()].filter(Boolean).join(" · ")
  if (context) lines.push("", `— ${context}`)

  return truncate(lines.join("\n"), DISCORD_LIMIT)
}

/**
 * L'URL d'une issue GitHub dont le formulaire est déjà rempli.
 *
 * `budget` par défaut à `URL_BUDGET` : les appelants existants (la page
 * /bug-report) n'ont rien à changer. Le paramètre existe surtout pour les
 * tests — il permet de mettre la garantie « toujours ≤ budget » à l'épreuve
 * à une taille où la boucle de rognage est réellement sollicitée, sans avoir
 * à générer des mégaoctets de texte pour dépasser 6000 caractères.
 */
export function buildIssueUrl(report: Report, budget: number = URL_BUDGET): string {
  const spec = specFor(report.kind)
  const values = new Map<string, string>()
  for (const field of spec.fields) {
    const value = (report.fields[field.id] ?? "").trim()
    if (value) values.set(field.id, value)
  }

  const render = () => {
    const params = new URLSearchParams({ template: spec.template })
    for (const [id, value] of values) params.set(id, value)
    return `${REPO_URL}/issues/new?${params.toString()}`
  }

  // Un champ « message d'erreur » collé depuis la console — ou simplement du
  // texte accentué, qui pèse jusqu'à 3 octets par caractère une fois encodé
  // en % — peut dépasser largement le budget. On rogne le plus long d'abord,
  // jamais les autres : tant qu'un champ plus long survit, un champ plus
  // court n'est pas touché.
  //
  // La condition d'arrêt originale se basait sur la longueur du champ
  // restant, pas sur celle de l'URL réelle : elle pouvait sortir de boucle
  // en pensant avoir fini alors que l'URL dépassait encore le budget. Ici on
  // ne sort que dans deux cas : l'URL tient, ou il n'y a plus rien à rogner
  // (tous les champs vides — auquel cas l'URL ne contient plus que le
  // gabarit fixe, très en-dessous d'URL_BUDGET). La garantie est donc
  // structurelle : elle tient même si on ajoute un champ à un KindSpec, si
  // on baisse URL_BUDGET ou si on allonge TRUNCATION_MARK.
  let url = render()
  while (url.length > budget) {
    const longest = [...values.entries()].sort((a, b) => b[1].length - a[1].length)[0]
    if (!longest || longest[1].length === 0) break
    const [id, value] = longest
    const next = Math.max(0, Math.min(value.length - 1, Math.floor(value.length * 0.6)))
    values.set(id, truncate(value, next))
    url = render()
  }
  if (url.length > budget) {
    // Ne devrait jamais arriver : même tous champs vidés, il ne reste que le
    // gabarit fixe (URL du dépôt + nom des champs), largement sous le
    // budget — sauf si l'appelant demande un budget plus petit que ce
    // gabarit lui-même (cas volontairement testé). On le signale fort
    // plutôt que de renvoyer une URL trop longue en silence.
    throw new Error(
      `buildIssueUrl : impossible de tenir sous ${budget} caractères même en vidant tous les champs (${url.length})`,
    )
  }
  return url
}
