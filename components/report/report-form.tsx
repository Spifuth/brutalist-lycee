"use client"

// The /bug-report form: pick a kind, fill in its fields, get a message to
// paste and an issue to open.
//
// Everything that decides anything is a pure function in lib/bug-report.ts,
// which is what lets tests/bug-report.test.ts check the wording, the
// truncation and the issue URL without rendering a single component. Read
// that file first.
//
// What this one is really about is not losing what a student typed. The
// fields are kept per kind, so switching tabs cannot wipe an entry; the
// pseudo is pre-filled once per mount and never again, so clearing it stays
// cleared; and the clipboard write can fail -- `navigator.clipboard` does not
// exist outside a secure context, and permission can be refused -- so the
// failure is displayed instead of swallowed. The first and the last of those
// are repairs rather than foresight: `git log -- components/report/` has them
// under "le bouton copier ne ment plus, la saisie survit au changement
// d'onglet".

import { useEffect, useMemo, useRef, useState } from "react"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import {
  KINDS,
  specFor,
  buildDiscordMessage,
  buildIssueUrl,
  DISCORD_CHANNEL,
  type ReportKind,
} from "@/lib/bug-report"

// The form decides nothing: it collects fields and shows what
// lib/bug-report.ts makes of them. Both outputs are on screen at the same
// time on purpose -- you paste the message AND you open the issue, it is not
// a choice to make.

// One set of answers per kind: switching tabs must not erase what the student
// has already typed in another one.
const emptyFieldsByKind: Record<ReportKind, Record<string, string>> = {
  bug: {},
  contenu: {},
  code: {},
  idee: {},
}

export function ReportForm() {
  const { user } = useAuth()
  const [kind, setKind] = useState<ReportKind>("bug")
  const [fieldsByKind, setFieldsByKind] = useState<Record<ReportKind, Record<string, string>>>(emptyFieldsByKind)
  const [pseudo, setPseudo] = useState("")
  const [agent, setAgent] = useState("")
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")
  // The pseudo is the one "privacy" field in this form: once the student has
  // deliberately cleared it, it must not come back on its own at the next
  // render triggered by a session `refresh()`. So it is pre-filled once per
  // mount, never after.
  const pseudoFilledRef = useRef(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (user?.pseudo && !pseudoFilledRef.current) {
      setPseudo(user.pseudo)
      pseudoFilledRef.current = true
    }
  }, [user])

  useEffect(() => {
    // The "copied" timeout must not land on an unmounted component.
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    // The browser and the OS explain half the display bugs. It is shown in
    // plain text and can be erased: nothing leaves without the student seeing
    // it first.
    setAgent(navigator.userAgent)
  }, [])

  const fields = fieldsByKind[kind]
  const spec = specFor(kind)
  const report = { kind, fields, pseudo, agent }
  const message = useMemo(() => buildDiscordMessage(report), [kind, fields, pseudo, agent])
  const issueUrl = useMemo(() => buildIssueUrl(report), [kind, fields, pseudo, agent])

  const missing = spec.fields.filter((f) => f.required && !(fields[f.id] ?? "").trim())
  const ready = missing.length === 0

  const set = (id: string, value: string) =>
    setFieldsByKind((prev) => ({ ...prev, [kind]: { ...prev[kind], [id]: value } }))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopyState("copied")
    } catch {
      // Insecure context (no navigator.clipboard) or permission refused:
      // nothing was copied, so say so rather than lie about it.
      setCopyState("failed")
    }
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    copyTimeoutRef.current = setTimeout(() => setCopyState("idle"), 2000)
  }

  const inputClass =
    "w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            onClick={() => setKind(k.kind)}
            aria-pressed={kind === k.kind}
            className={`border-2 border-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest transition-colors ${
              kind === k.kind ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {spec.fields.map((field) => (
          <label key={field.id} className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {field.label}
              {field.required ? " *" : " (facultatif)"}
            </span>
            {field.input === "select" ? (
              <select
                className={inputClass}
                value={fields[field.id] ?? ""}
                onChange={(e) => set(field.id, e.target.value)}
              >
                <option value="">— choisis —</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.input === "textarea" ? (
              <textarea
                rows={4}
                // With no limit, a whole log pasted in here is only found to
                // be truncated at preview time -- and runs buildIssueUrl's
                // trimming loop on every keystroke for nothing.
                maxLength={4000}
                className={inputClass}
                placeholder={field.placeholder}
                value={fields[field.id] ?? ""}
                onChange={(e) => set(field.id, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className={inputClass}
                placeholder={field.placeholder}
                value={fields[field.id] ?? ""}
                onChange={(e) => set(field.id, e.target.value)}
              />
            )}
          </label>
        ))}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Ton pseudo (effaçable)
            </span>
            <input type="text" className={inputClass} value={pseudo} onChange={(e) => setPseudo(e.target.value)} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Ton navigateur (effaçable)
            </span>
            <input type="text" className={inputClass} value={agent} onChange={(e) => setAgent(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-2 border-foreground p-5">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Le message pour {DISCORD_CHANNEL}
        </span>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border-2 border-border bg-muted p-4 font-mono text-xs text-foreground">
          {message}
        </pre>
        <p className="text-xs leading-relaxed text-muted-foreground">
          L&apos;issue GitHub, elle, ne reprend que les champs du formulaire ci-dessus — ni ton
          pseudo, ni ton navigateur.
        </p>

        {!ready && (
          <p className="font-mono text-[11px] uppercase tracking-widest text-destructive">
            il manque : {missing.map((f) => f.label).join(", ")}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={copy}
            disabled={!ready}
            className="flex items-center gap-2 border-2 border-foreground bg-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-background disabled:opacity-40"
          >
            {copyState === "copied" ? <Check size={13} /> : <Copy size={13} />}
            {copyState === "copied" ? "copié" : `copier pour ${DISCORD_CHANNEL}`}
          </button>
          {/* Button, not <a> without href: a link without href is not focusable
              and disappears from keyboard navigation. Same disabled semantics
              as the copy button, therefore same behavior for a keyboard or
              screen reader in both states. */}
          <button
            type="button"
            onClick={() => window.open(issueUrl, "_blank", "noopener,noreferrer")}
            disabled={!ready}
            className="flex items-center gap-2 border-2 border-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-foreground hover:bg-muted disabled:opacity-40"
          >
            <ExternalLink size={13} /> ouvrir l&apos;issue pré-remplie
          </button>
        </div>

        {copyState === "failed" && (
          <p role="alert" className="font-mono text-[11px] uppercase tracking-widest text-destructive">
            la copie automatique a échoué : sélectionne le texte ci-dessus et copie-le à la main
          </p>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          Fais les deux : le message sur Discord pour que la classe le voie tout de suite, l&apos;issue
          pour que ce soit réparé et suivi. Sur GitHub il restera peut-être une case à cocher — les
          cases ne se pré-remplissent pas.
        </p>
      </div>
    </div>
  )
}
