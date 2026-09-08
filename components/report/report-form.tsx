"use client"

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

// Le formulaire ne décide de rien : il collecte des champs et affiche ce que
// lib/bug-report.ts en fait. Les deux sorties sont montrées en même temps —
// on colle le message ET on ouvre l'issue, ce n'est pas un choix à faire.

// Un jeu de réponses par type : changer d'onglet ne doit pas effacer ce que
// l'élève a déjà tapé dans un autre onglet.
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
  // Le pseudo est le seul champ « vie privée » du formulaire : une fois que
  // l'élève l'a effacé volontairement, il ne doit pas revenir tout seul au
  // prochain rendu déclenché par un `refresh()` de la session. On ne le
  // pré-remplit donc qu'une fois par montage, jamais après.
  const pseudoFilledRef = useRef(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (user?.pseudo && !pseudoFilledRef.current) {
      setPseudo(user.pseudo)
      pseudoFilledRef.current = true
    }
  }, [user])

  useEffect(() => {
    // Le timeout de « copié » ne doit pas retomber sur un composant démonté.
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    // Le navigateur et l'OS expliquent la moitié des bugs d'affichage. C'est
    // affiché en clair et effaçable : rien n'est envoyé sans que l'élève le voie.
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
      // Contexte non sécurisé (pas de navigator.clipboard) ou permission
      // refusée : rien n'est parti, on le dit à l'élève plutôt que de mentir.
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
                // Sans limite, un log entier collé ici ne se découvre tronqué
                // qu'à la prévisualisation — et fait tourner la boucle de
                // rognage de buildIssueUrl à chaque frappe pour rien.
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
          {/* Bouton, pas <a> sans href : un lien sans href n'est pas focusable
              et disparaît de la navigation au clavier. Même sémantique
              disabled que le bouton copier, donc même comportement pour un
              clavier ou un lecteur d'écran dans les deux états. */}
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
