"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Lock } from "lucide-react"
import { VOTE_TOPICS, MAX_PICKS, type VoteTopic } from "@/lib/vote"
import { getVoteTallies, getMyVotes, toggleVote } from "@/app/actions/engage"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

export function VoteBoard() {
  const { user } = useAuth()
  const [tallies, setTallies] = useState<Record<string, number>>({})
  const [picks, setPicks] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [warn, setWarn] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getVoteTallies(), getMyVotes()]).then(([t, p]) => {
      setTallies(t)
      setPicks(p)
      setReady(true)
    })
  }, [user])

  const totalFor = (topic: VoteTopic) => topic.base + (tallies[topic.id] ?? 0)

  const grandTotal = useMemo(
    () => VOTE_TOPICS.reduce((sum, t) => sum + totalFor(t), 0),
    [tallies],
  )
  const maxTotal = useMemo(
    () => Math.max(...VOTE_TOPICS.map((t) => totalFor(t))),
    [tallies],
  )

  const flash = (msg: string) => {
    setWarn(msg)
    setTimeout(() => setWarn(null), 1800)
  }

  const handleToggle = async (id: string) => {
    if (!user) {
      flash("Connecte-toi pour voter.")
      return
    }
    // optimistic
    const had = picks.includes(id)
    if (!had && picks.length >= MAX_PICKS) {
      flash(`Maximum ${MAX_PICKS} choix. Retire-en un d'abord.`)
      return
    }
    setPicks((p) => (had ? p.filter((x) => x !== id) : [...p, id]))
    setTallies((t) => ({ ...t, [id]: (t[id] ?? 0) + (had ? -1 : 1) }))

    const res = await toggleVote(id, MAX_PICKS)
    if (!res.ok) {
      // revert by re-reading truth
      const [t, p] = await Promise.all([getVoteTallies(), getMyVotes()])
      setTallies(t)
      setPicks(p)
      if (res.error) flash(res.error)
    } else {
      setPicks(res.picks)
    }
  }

  const remaining = MAX_PICKS - picks.length

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 border-2 border-foreground bg-muted px-4 py-3 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest">
          {picks.length} / {MAX_PICKS} choix
        </span>
        <div className="flex gap-1">
          {Array.from({ length: MAX_PICKS }).map((_, i) => (
            <span
              key={i}
              className={cn("h-3 w-3 border-2 border-foreground", i < picks.length && "bg-accent")}
            />
          ))}
        </div>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {grandTotal.toLocaleString("fr-FR")} votes au total
        </span>
      </div>

      {warn && (
        <p className="mb-4 border-l-4 border-l-destructive border-2 border-foreground px-4 py-2 text-xs font-mono">
          {warn}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {VOTE_TOPICS.map((topic) => {
          const total = totalFor(topic)
          const picked = picks.includes(topic.id)
          const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0
          const capped = !picked && picks.length >= MAX_PICKS
          return (
            <button
              key={topic.id}
              onClick={() => handleToggle(topic.id)}
              aria-pressed={picked}
              className={cn(
                "group flex flex-col text-left border-2 border-foreground p-4 transition-colors",
                picked ? "bg-foreground text-background" : capped ? "opacity-60" : "hover:bg-muted",
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-sm font-bold leading-snug">{topic.label}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center border-2",
                    picked ? "bg-accent border-accent" : "border-foreground",
                  )}
                >
                  {picked ? (
                    <Check size={12} className="text-accent-foreground" />
                  ) : capped ? (
                    <Lock size={11} className="text-muted-foreground" />
                  ) : null}
                </span>
              </div>
              <p className={cn("text-[11px] leading-snug mb-3", picked ? "text-background/70" : "text-muted-foreground")}>
                {topic.desc}
              </p>
              <div className="mt-auto">
                <div className={cn("h-2 border", picked ? "border-background/40" : "border-foreground")}>
                  <div
                    className={cn("h-full transition-all duration-500", ready ? "bg-accent" : "bg-transparent")}
                    style={{ width: ready ? `${pct}%` : "0%" }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className={cn("text-[10px] font-mono", picked ? "text-background/70" : "text-muted-foreground")}>
                    {total.toLocaleString("fr-FR")} votes
                  </span>
                  <span className={cn("text-[10px] font-mono", picked ? "text-background/70" : "text-muted-foreground")}>
                    {ready ? `${pct}%` : ""}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-[10px] font-mono text-muted-foreground">
        {!user
          ? "Connecte-toi pour enregistrer tes votes."
          : remaining > 0
            ? `Tu peux encore choisir ${remaining} sujet${remaining > 1 ? "s" : ""}.`
            : "Merci ! Tu peux modifier tes choix à tout moment."}
      </p>
    </div>
  )
}
