// Two pure functions behind the /bug-report page: one renders the message a
// student pastes into #bug-report, the other builds the URL of an
// already-filled-in GitHub issue.
//
// The `id`s below are not decorative: they are the field identifiers of
// .github/ISSUE_TEMPLATE/*.yml. GitHub prefills an issue form from query
// parameters carrying exactly those names, and silently ignores any parameter
// it does not recognise — which is why tests/bug-report.test.ts reads the real
// template files back and matches them against KINDS.

export const REPO_URL = "https://github.com/Spifuth/brutalist-lycee"
export const DISCORD_CHANNEL = "#bug-report"

/** Discord refuses any message past 2000 characters. */
export const DISCORD_LIMIT = 2000
/** Past this, a URL is truncated or refused depending on the browser. */
export const URL_BUDGET = 6000
/**
 * Used when it is the Discord message that gets cut: the rest really does
 * exist somewhere else, in the issue.
 */
export const TRUNCATION_MARK = "…(coupé — la suite est dans l'issue)"
/**
 * Used when it is a field *inside the issue URL* that gets cut. There is no
 * "somewhere else" here: the trimmed part exists nowhere at all. Reusing
 * TRUNCATION_MARK would promise a continuation that does not exist.
 */
export const URL_TRUNCATION_MARK = "…(texte trop long, coupé)"
/** Length of the issue-title summary; see `issueTitle` below. */
const TITLE_SUMMARY_MAX = 60

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

/** Throws on an unknown kind rather than returning undefined — every caller builds a URL or a message straight from the result. */
export function specFor(kind: ReportKind): KindSpec {
  const spec = KINDS.find((k) => k.kind === kind)
  if (!spec) throw new Error(`type de signalement inconnu : ${kind}`)
  return spec
}

function truncate(text: string, max: number, mark: string = TRUNCATION_MARK): string {
  if (text.length <= max) return text
  if (max <= 0) return ""
  // Not enough room for the truncation mark itself: adding it would push past
  // `max`. Cut flush rather than lie about the length.
  if (max <= mark.length) return text.slice(0, max)
  const keep = max - mark.length - 1
  return `${text.slice(0, keep).trimEnd()}\n${mark}`
}

/**
 * The short tag at the head of an issue title, one per kind. Derived from the
 * label rather than duplicated into a separate table: adding a kind to KINDS
 * leaves nothing extra to keep in sync here.
 */
export function titleTagFor(kind: ReportKind): string {
  return `[${specFor(kind).label.toUpperCase()}]`
}

/**
 * The title of a prefilled issue. GitHub always demands a title — leaving it
 * empty means promising an "already filled in" issue and failing at the very
 * first box the student sees (see buildIssueUrl). A short summary is built
 * from the kind's first required field — the one the student is likeliest to
 * have filled in first — cut at ~60 characters: enough to recognise the report
 * in a list of issues, never enough to weigh on the URL budget.
 */
function issueTitle(spec: KindSpec, fields: Record<string, string>): string {
  const tag = titleTagFor(spec.kind)
  const first = spec.fields.find((f) => f.required)
  const raw = first ? (fields[first.id] ?? "").trim() : ""
  if (!raw) return tag
  const oneLine = raw.replace(/\s+/g, " ").trim()
  const summary =
    oneLine.length <= TITLE_SUMMARY_MAX
      ? oneLine
      : `${oneLine.slice(0, TITLE_SUMMARY_MAX - 1).trimEnd()}…`
  return `${tag} ${summary}`
}

/** The text a student pastes into #bug-report. */
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
 * The URL of a GitHub issue whose form is already filled in.
 *
 * `budget` defaults to `URL_BUDGET`, so existing callers (the /bug-report
 * page) have nothing to change. The parameter exists mainly for the tests: it
 * lets the "always <= budget" guarantee be exercised at a size where the
 * trimming loop actually runs, instead of having to generate megabytes of text
 * just to get past 6000 characters.
 */
export function buildIssueUrl(report: Report, budget: number = URL_BUDGET): string {
  const spec = specFor(report.kind)
  // Computed once, from the fields as the student typed them: the title stays
  // a short summary whatever happens to the body during the trimming below, so
  // there is no reason to recompute it on every pass.
  const title = issueTitle(spec, report.fields)
  const values = new Map<string, string>()
  for (const field of spec.fields) {
    const value = (report.fields[field.id] ?? "").trim()
    if (value) values.set(field.id, value)
  }

  const render = () => {
    const params = new URLSearchParams({ template: spec.template, title })
    for (const [id, value] of values) params.set(id, value)
    return `${REPO_URL}/issues/new?${params.toString()}`
  }

  // An "error message" field pasted from the console — or simply accented
  // text, which costs up to 3 bytes per character once percent-encoded — can
  // run far past the budget. Trim the longest field first and never the
  // others: as long as a longer field survives, a shorter one is left alone.
  //
  // The original stop condition looked at the length of the remaining field
  // rather than at the length of the real URL: it could leave the loop
  // believing it was done while the URL was still over budget. There are only
  // two ways out here: the URL fits, or there is nothing left to trim (every
  // field empty — at which point the URL is only the fixed scaffolding, far
  // below URL_BUDGET). The guarantee is structural rather than arithmetic: it
  // holds even if a field is added to a KindSpec, if URL_BUDGET is lowered, or
  // if URL_TRUNCATION_MARK gets longer.
  let url = render()
  while (url.length > budget) {
    const longest = [...values.entries()].sort((a, b) => b[1].length - a[1].length)[0]
    if (!longest || longest[1].length === 0) break
    const [id, value] = longest
    const next = Math.max(0, Math.min(value.length - 1, Math.floor(value.length * 0.6)))
    // URL_TRUNCATION_MARK, not TRUNCATION_MARK: there is no issue here where
    // "the rest" would be waiting — this *is* the issue being built, and the
    // trimmed part exists nowhere else.
    values.set(id, truncate(value, next, URL_TRUNCATION_MARK))
    url = render()
  }
  if (url.length > budget) {
    // Should never happen: even with every field emptied, all that is left is
    // the fixed scaffolding (repo URL plus field names), far under budget —
    // unless the caller asks for a budget smaller than that scaffolding
    // itself, a case the tests exercise on purpose. Fail loudly rather than
    // return an over-long URL in silence.
    throw new Error(
      `buildIssueUrl : impossible de tenir sous ${budget} caractères même en vidant tous les champs (${url.length})`,
    )
  }
  return url
}
