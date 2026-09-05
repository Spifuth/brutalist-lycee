"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { KeyRound, Check, Lock, Trophy, Search } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { redeemSecret, getHuntBoard, type HuntEntry } from "@/app/actions/engage"
import { cn } from "@/lib/utils"

export function HuntBoard() {
  const { user } = useAuth()
  const [code, setCode] = useState("")
  const [entries, setEntries] = useState<HuntEntry[]>([])
  const [found, setFound] = useState(0)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null)

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
      setFlash({ ok: true, msg: `Secret « ${res.name} » validé — +${res.points} pts` })
      setCode("")
      refresh()
    } else {
      setFlash({ ok: false, msg: res.error ?? "Code refusé." })
    }
  }

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
          </div>
          <ul className="divide-y-2 divide-border border-2 border-foreground">
            {entries.map((s, i) => (
              <li key={i} className="flex items-start gap-3 bg-card p-4">
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2",
                    s.found ? "border-accent bg-accent text-accent-foreground" : "border-foreground text-muted-foreground",
                  )}
                >
                  {s.found ? <Check size={14} /> : <Lock size={12} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("font-mono text-sm font-bold", s.found ? "text-accent" : "text-foreground")}>
                      {s.found ? s.name : "Secret verrouillé"}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      +{s.points} pts
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs leading-relaxed text-muted-foreground">{s.hint}</p>
                  {s.found && s.location && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-accent/80">
                      trouvé : {s.location}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
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
          Les codes sont cachés partout : dans le terminal, le code source, les articles, les easter eggs...
          Ouvre l&apos;œil.
        </p>
      </aside>
    </div>
  )
}
