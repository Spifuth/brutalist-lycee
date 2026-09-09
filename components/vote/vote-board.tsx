"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Lock } from "lucide-react"
import { VOTE_TOPICS, MAX_PICKS, type VoteTopic } from "@/lib/vote"
import { getMyVotes, toggleVote } from "@/app/actions/engage"
import { useAuth } from "@/components/auth/auth-provider"
import type { LiveSnapshot } from "@/lib/live-broadcast"
import { connectSse } from "@/lib/sse-client"
import { cn } from "@/lib/utils"

// Server-authoritative totals, like components/quiz/live-quiz.tsx: the vote
// tallies and the open/closed flag are a render of the snapshot
// app/api/live/stream/route.ts pushes — never predicted client-side. Only
// the caller's own picks (`getMyVotes`) are fetched directly, since they are
// personal, not part of the shared broadcast.

export function VoteBoard() {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null)
  const [picks, setPicks] = useState<string[]>([])
  const [warn, setWarn] = useState<string | null>(null)

  useEffect(() => {
    const connection = connectSse("/api/live/stream", {
      on: {
        message: (data) => {
          try {
            setSnapshot(JSON.parse(data) as LiveSnapshot)
          } catch {
            // Malformed frame — skip it, the next tick will correct itself.
          }
        },
      },
    })
    return () => connection.close()
  }, [])

  useEffect(() => {
    getMyVotes().then(setPicks)
  }, [user])

  const ready = snapshot !== null
  const tallies = snapshot?.voteTallies ?? {}
  const voteOpen = snapshot?.voteOpen ?? false

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
    if (!voteOpen) {
      flash("Le vote est actuellement fermé.")
      return
    }
    // optimistic — picks are personal, so predicting them locally is safe;
    // the shared totals below are never predicted, only the server's own
    // next broadcast frame moves them (see app/actions/engage.ts's
    // toggleVote(), which calls publishNow() after every write).
    const had = picks.includes(id)
    if (!had && picks.length >= MAX_PICKS) {
      flash(`Maximum ${MAX_PICKS} choix. Retire-en un d'abord.`)
      return
    }
    setPicks((p) => (had ? p.filter((x) => x !== id) : [...p, id]))

    const res = await toggleVote(id, MAX_PICKS)
    if (!res.ok) {
      // Refused server-side (closed in the moment between our check above
      // and the call landing, or the max-picks race) — resync from truth.
      setPicks(await getMyVotes())
      if (res.error) flash(res.error)
    } else {
      setPicks(res.picks)
    }
  }

  const remaining = MAX_PICKS - picks.length

  // Closed state: only rendered once the stream has confirmed it, in the
  // existing brutalist idiom — an inverted header bar and a micro-label, not
  // a modal or a greyed-out disabled board.
  if (snapshot && !voteOpen) {
    return (
      <div className="border-2 border-foreground max-w-3xl">
        <div className="border-b-2 border-foreground bg-foreground text-background px-4 py-2.5 flex items-center gap-3">
          <Lock size={15} className="text-accent" />
          <span className="text-[10px] font-mono uppercase tracking-widest">vote fermé</span>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground max-w-md">
            Le vote n&apos;est pas ouvert pour le moment. Ton professeur l&apos;ouvrira pendant
            l&apos;intervention — reviens à ce moment-là.
          </p>
        </div>
      </div>
    )
  }

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
