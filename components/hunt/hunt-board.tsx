"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { KeyRound, Check, Lock, Trophy, Search, Crown } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { redeemSecret, getHuntBoard, type HuntEntry } from "@/app/actions/engage"
import {
  SECRET_FAMILIES,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  familyOf,
  type SecretFamily,
  type SecretDifficulty,
} from "@/lib/secret-taxonomy"
import { cn } from "@/lib/utils"

/** Strips accents and case so "démentiel" matches a search for "dementiel". */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-2 border-foreground px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors",
        active ? "bg-foreground text-background" : "bg-background hover:bg-muted",
      )}
    >
      {children}
      {count !== undefined && <span className="ml-1.5 opacity-60">{count}</span>}
    </button>
  )
}

export function HuntBoard() {
  const { user } = useAuth()
  const [code, setCode] = useState("")
  const [entries, setEntries] = useState<HuntEntry[]>([])
  const [found, setFound] = useState(0)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)

  const [q, setQ] = useState("")
  const [difficulty, setDifficulty] = useState<SecretDifficulty | null>(null)
  const [family, setFamily] = useState<SecretFamily | null>(null)
  const [hideFound, setHideFound] = useState(false)

  async function refresh() {
    const board = await getHuntBoard()
    setEntries(board.entries)
    setFound(board.found)
    setTotal(board.total)
  }

  useEffect(() => {
    refresh()
  }, [user?.id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || busy) return
    setBusy(true)
    setFlash(null)
    const res = await redeemSecret(code)
    setBusy(false)
    if (res.ok) {
      const extra = res.milestones?.length
        ? ` — palier atteint : ${res.milestones.map((m) => `${m.name} (+${m.points})`).join(", ")}`
        : ""
      setFlash({ ok: true, msg: `Secret « ${res.name} » validé — +${res.points} pts${extra}` })
      setCode("")
      refresh()
    } else {
      setFlash({ ok: false, msg: res.error ?? "Code refusé." })
    }
  }

  // Counts are computed over everything, not over the current filter, so the
  // numbers on the chips do not move as you click them.
  const familyCounts = useMemo(() => {
    const c = {} as Record<SecretFamily, number>
    for (const e of entries) {
      const f = familyOf(e.category)
      c[f] = (c[f] ?? 0) + 1
    }
    return c
  }, [entries])

  const difficultyCounts = useMemo(() => {
    const c = {} as Record<string, number>
    for (const e of entries) c[e.difficulty] = (c[e.difficulty] ?? 0) + 1
    return c
  }, [entries])

  const visible = useMemo(() => {
    const needle = fold(q.trim())
    return entries.filter((e) => {
      if (difficulty && e.difficulty !== difficulty) return false
      if (family && familyOf(e.category) !== family) return false
      if (hideFound && e.found) return false
      if (!needle) return true
      return fold(e.name).includes(needle) || fold(e.hint).includes(needle)
    })
  }, [entries, q, difficulty, family, hideFound])

  const families = (Object.keys(SECRET_FAMILIES) as SecretFamily[]).filter((f) => familyCounts[f] > 0)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        {/* Redeem form */}
        <form onSubmit={submit} className="border-2 border-foreground bg-card">
          <div className="flex items-center gap-2 border-b-2 border-foreground bg-foreground px-4 py-2">
            <KeyRound size={14} className="text-background" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-background">
              Valider un code secret
            </span>
          </div>
          <div className="p-4">
            {!user && (
              <p className="mb-3 border-2 border-dashed border-muted-foreground/50 px-3 py-2 text-[11px] font-mono text-muted-foreground">
                Connecte-toi pour enregistrer tes trouvailles et gagner des points.{" "}
                <Link href="/" className="text-accent underline">
                  Se connecter
                </Link>
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SIN-XXXX"
                disabled={!user || busy}
                className="flex-1 border-2 border-foreground bg-background px-3 py-2 font-mono text-sm uppercase tracking-widest outline-none focus:bg-muted disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!user || busy || !code.trim()}
                className="border-2 border-foreground bg-accent px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest text-accent-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
              >
                {busy ? "..." : "Valider"}
              </button>
            </div>
            {flash && (
              <p
                className={cn(
                  "mt-3 border-2 px-3 py-2 font-mono text-[11px]",
                  flash.ok
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-destructive bg-destructive/10 text-destructive",
                )}
              >
                {flash.msg}
              </p>
            )}
          </div>
        </form>

        {/* Hint board */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Search size={14} className="text-accent" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Indices</h2>
            <div className="flex-1 border-t border-border" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {visible.length} / {entries.length}
            </span>
          </div>

          {/* Filters. 153 secrets is a wall without them. */}
          <div className="mb-4 flex flex-col gap-3 border-2 border-foreground bg-card p-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Chercher dans les noms et les indices..."
              className="w-full border-2 border-foreground bg-background px-3 py-2 font-mono text-xs outline-none focus:bg-muted"
            />
            <div className="flex flex-wrap gap-1.5">
              <Chip active={difficulty === null} onClick={() => setDifficulty(null)}>
                Toutes
              </Chip>
              {DIFFICULTY_ORDER.filter((d) => difficultyCounts[d] > 0).map((d) => (
                <Chip
                  key={d}
                  active={difficulty === d}
                  onClick={() => setDifficulty(difficulty === d ? null : d)}
                  count={difficultyCounts[d]}
                >
                  {DIFFICULTY_LABELS[d]}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={family === null} onClick={() => setFamily(null)}>
                Tous thèmes
              </Chip>
              {families.map((f) => (
                <Chip
                  key={f}
                  active={family === f}
                  onClick={() => setFamily(family === f ? null : f)}
                  count={familyCounts[f]}
                >
                  {SECRET_FAMILIES[f]}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={hideFound} onClick={() => setHideFound(!hideFound)}>
                Cacher ceux que j&apos;ai trouvés
              </Chip>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="border-2 border-dashed border-muted-foreground/40 p-6 text-center font-mono text-[11px] text-muted-foreground">
              Aucun secret ne correspond à ce filtre.
            </p>
          ) : (
            <ul className="divide-y-2 divide-border border-2 border-foreground">
              {visible.map((s, i) => {
                const milestone = s.unlockAt !== null
                return (
                  <li key={i} className="flex items-start gap-3 bg-card p-4">
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2",
                        s.found
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-foreground text-muted-foreground",
                      )}
                    >
                      {s.found ? <Check size={14} /> : milestone ? <Crown size={12} /> : <Lock size={12} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        {/* The name is the riddle on most of these — hiding it
                            until you win leaves nothing to solve. Only the code
                            is secret. */}
                        <span
                          className={cn(
                            "font-mono text-sm font-bold",
                            s.found ? "text-accent" : "text-foreground",
                          )}
                        >
                          {s.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          +{s.points} pts
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="border border-foreground px-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                          {DIFFICULTY_LABELS[s.difficulty as SecretDifficulty] ?? s.difficulty}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                          {SECRET_FAMILIES[familyOf(s.category)]}
                        </span>
                        {milestone && (
                          <span className="border border-accent px-1.5 font-mono text-[9px] uppercase tracking-widest text-accent">
                            se débloque à {s.unlockAt} secrets
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted-foreground">{s.hint}</p>
                      {s.found && s.location && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-accent/80">
                          trouvé : {s.location}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Progress rail */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-2 border-foreground bg-card p-5">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-accent" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">Ta progression</span>
          </div>
          <p className="mt-4 font-pixel text-5xl text-accent">
            {found}
            <span className="text-2xl text-muted-foreground">/{total}</span>
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            secrets trouvés
          </p>
          <div className="mt-4 h-3 w-full border-2 border-foreground bg-background">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${total ? (found / total) * 100 : 0}%` }}
            />
          </div>
          <Link
            href="/classement"
            className="mt-5 flex items-center justify-center gap-2 border-2 border-foreground bg-background px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Trophy size={12} /> Voir le classement
          </Link>
        </div>
        <p className="mt-4 border-2 border-dashed border-muted-foreground/40 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
          La plupart des secrets sont des devinettes : le nom pose la question, le code est la réponse.
          D&apos;autres sont cachés dans le site — terminal, code source, en-têtes, easter eggs. Et les
          paliers <Crown size={10} className="inline text-accent" /> s&apos;ouvrent tout seuls.
        </p>
      </aside>
    </div>
  )
}
