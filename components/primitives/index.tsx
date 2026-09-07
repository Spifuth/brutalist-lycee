import type { ReactNode } from "react"
import { Terminal, Info, AlertTriangle, Lightbulb, Check } from "lucide-react"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

interface SectionProps {
  title: string
  id?: string
  eyebrow?: string
  children: ReactNode
  className?: string
}

export function Section({ title, id, eyebrow, children, className }: SectionProps) {
  return (
    <section id={id} className={cn("w-full px-6 py-10 lg:px-12 scroll-mt-24", className)}>
      {eyebrow && (
        <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-accent mb-2">
          {eyebrow}
        </span>
      )}
      <h2 className="font-mono text-xl lg:text-2xl font-bold uppercase tracking-wide border-b-2 border-foreground pb-3 mb-6">
        {title}
      </h2>
      <div className="flex flex-col gap-5 max-w-3xl text-sm leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* CodeBlock (terminal-style)                                                 */
/* -------------------------------------------------------------------------- */

interface CodeBlockProps {
  code: string
  label?: string
  /** Prefix each line with a "$ " prompt. */
  prompt?: boolean
}

export function CodeBlock({ code, label = "shell", prompt = false }: CodeBlockProps) {
  const lines = code.replace(/\n+$/, "").split("\n")
  return (
    <div className="border-2 border-foreground">
      <div className="flex items-center gap-2 border-b-2 border-foreground bg-muted px-3 py-1.5">
        <Terminal size={12} className="text-accent" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <pre className="bg-foreground text-background p-4 overflow-x-auto">
        <code className="text-xs font-mono leading-relaxed">
          {lines.map((line, i) => (
            <span key={i} className="block whitespace-pre">
              {prompt && <span className="text-accent select-none">{"$ "}</span>}
              {line || " "}
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Callout                                                                    */
/* -------------------------------------------------------------------------- */

type CalloutTone = "info" | "warning" | "tip" | "success"

const CALLOUT_META: Record<CalloutTone, { icon: typeof Info; label: string }> = {
  info: { icon: Info, label: "Info" },
  warning: { icon: AlertTriangle, label: "Attention" },
  tip: { icon: Lightbulb, label: "Astuce" },
  success: { icon: Check, label: "À retenir" },
}

interface CalloutProps {
  tone?: CalloutTone
  title?: string
  children: ReactNode
}

export function Callout({ tone = "info", title, children }: CalloutProps) {
  const { icon: Icon, label } = CALLOUT_META[tone]
  return (
    <div
      className={cn(
        "border-l-4 border-2 pl-4 pr-4 py-3 bg-muted/40",
        tone === "warning" ? "border-l-destructive" : "border-l-accent",
        "border-foreground",
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={tone === "warning" ? "text-destructive" : "text-accent"} />
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
          {title || label}
        </span>
      </div>
      <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* KeyList (key → value definition list)                                      */
/* -------------------------------------------------------------------------- */

interface KeyListItem {
  term: string
  desc: ReactNode
}

export function KeyList({ items }: { items: KeyListItem[] }) {
  return (
    <dl className="border-2 border-foreground divide-y-2 divide-foreground">
      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[160px_1fr]">
          <dt className="bg-muted px-4 py-3 text-xs font-mono uppercase tracking-widest font-bold border-b-2 sm:border-b-0 sm:border-r-2 border-foreground">
            {item.term}
          </dt>
          <dd className="px-4 py-3 text-sm text-foreground/90">{item.desc}</dd>
        </div>
      ))}
    </dl>
  )
}

/* -------------------------------------------------------------------------- */
/* List (ordered / unordered, monospace markers)                             */
/* -------------------------------------------------------------------------- */

interface ListProps {
  items: ReactNode[]
  ordered?: boolean
}

export function List({ items, ordered = false }: ListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-foreground/90 leading-relaxed">
          <span className="select-none font-mono text-accent shrink-0">
            {ordered ? `${String(i + 1).padStart(2, "0")}.` : "▸"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/* Table (comparison / pricing grid)                                          */
/* -------------------------------------------------------------------------- */

interface TableProps {
  headers: string[]
  rows: ReactNode[][]
  /** Footnote under the grid — asterisks, "prices read in September 2026". */
  caption?: string
}

export function Table({ headers, rows, caption }: TableProps) {
  return (
    <figure className="m-0">
      {/* A four-column pricing grid does not fit a phone. Let the grid scroll
          inside its border rather than squeezing every cell to two words. */}
      <div className="overflow-x-auto border-2 border-foreground">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead>
            <tr className="bg-muted">
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="border-b-2 border-foreground px-3 py-2 text-left text-[10px] font-mono uppercase tracking-widest font-bold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b-2 border-border last:border-b-0">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={cn(
                      "px-3 py-2 align-top text-foreground/90",
                      j === 0 && "font-mono font-bold text-foreground",
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Prose paragraph helper                                                     */
/* -------------------------------------------------------------------------- */

export function P({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-foreground/90">{children}</p>
}
