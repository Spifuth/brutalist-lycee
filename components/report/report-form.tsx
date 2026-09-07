"use client"

import { useEffect, useMemo, useState } from "react"
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

// Le formulaire ne décide de rien : il collecte des champs et affiche ce que
// lib/bug-report.ts en fait. Les deux sorties sont montrées en même temps —
// on colle le message ET on ouvre l'issue, ce n'est pas un choix à faire.

export function ReportForm() {
  const { user } = useAuth()
  const [kind, setKind] = useState<ReportKind>("bug")
  const [fields, setFields] = useState<Record<string, string>>({})
  const [pseudo, setPseudo] = useState("")
  const [agent, setAgent] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user?.pseudo) setPseudo(user.pseudo)
  }, [user])

  useEffect(() => {
    // Le navigateur et l'OS expliquent la moitié des bugs d'affichage. C'est
    // affiché en clair et effaçable : rien n'est envoyé sans que l'élève le voie.
    setAgent(navigator.userAgent)
  }, [])

  const spec = specFor(kind)
  const report = { kind, fields, pseudo, agent }
  const message = useMemo(() => buildDiscordMessage(report), [kind, fields, pseudo, agent])
  const issueUrl = useMemo(() => buildIssueUrl(report), [kind, fields, pseudo, agent])

  const missing = spec.fields.filter((f) => f.required && !(fields[f.id] ?? "").trim())
  const ready = missing.length === 0

  const set = (id: string, value: string) => setFields((prev) => ({ ...prev, [id]: value }))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      // Contexte non sécurisé ou permission refusée : le bloc en dessous reste
      // sélectionnable, c'est le repli.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass =
    "w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            onClick={() => {
              setKind(k.kind)
              setFields({})
            }}
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
          Ce que tu vas envoyer
        </span>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border-2 border-border bg-muted p-4 font-mono text-xs text-foreground">
          {message}
        </pre>

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
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "copié" : `copier pour ${DISCORD_CHANNEL}`}
          </button>
          <a
            href={ready ? issueUrl : undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!ready}
            className={`flex items-center gap-2 border-2 border-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-foreground hover:bg-muted ${
              ready ? "" : "pointer-events-none opacity-40"
            }`}
          >
            <ExternalLink size={13} /> ouvrir l&apos;issue pré-remplie
          </a>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Fais les deux : le message sur Discord pour que la classe le voie tout de suite, l&apos;issue
          pour que ce soit réparé et suivi. Sur GitHub il restera peut-être une case à cocher — les
          cases ne se pré-remplissent pas.
        </p>
      </div>
    </div>
  )
}
