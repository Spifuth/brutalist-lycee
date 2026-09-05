"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pause, Play, Radio, ThumbsUp } from "lucide-react"
import { upvoteQuestion } from "@/app/actions/engage"
import { useAuth } from "@/components/auth/auth-provider"
import type { LiveSnapshot } from "@/lib/live-broadcast"
import { cn } from "@/lib/utils"

// Server-authoritative, like components/quiz/live-quiz.tsx: every question on
// this wall and its upvote count are a render of the snapshot
// app/api/live/stream/route.ts pushes (its shared poller's fetchQuestions()).
// "Pause" only freezes what this one tab renders — the subscription and the
// server state underneath keep running, so unpausing shows the true current
// state immediately rather than replaying anything.

export function LiveQuestions() {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null)
  const [paused, setPaused] = useState(false)
  const [voted, setVoted] = useState<Set<string>>(new Set())
  const pausedRef = useRef(false)
  const latest = useRef<LiveSnapshot | null>(null)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const source = new EventSource("/api/live/stream")
    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as LiveSnapshot
        latest.current = parsed
        if (!pausedRef.current) setSnapshot(parsed)
      } catch {
        // Malformed frame — skip it, the next tick will correct itself.
      }
    }
    return () => source.close()
  }, [])

  // Applies the most recently received frame the moment playback resumes,
  // instead of waiting for the next tick to catch up.
  const togglePause = () => {
    setPaused((p) => {
      const next = !p
      if (!next && latest.current) setSnapshot(latest.current)
      return next
    })
  }

  const items = snapshot?.questions ?? []

  const react = async (id: string) => {
    if (!user || voted.has(id)) return
    setVoted((s) => new Set(s).add(id))
    try {
      await upvoteQuestion(id)
    } catch {
      // Refused or failed — let the viewer try again instead of getting
      // stuck showing a reaction that never actually landed.
      setVoted((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="max-w-2xl">
      {/* control bar */}
      <div className="flex items-center gap-3 border-2 border-foreground bg-foreground text-background px-4 py-2.5 mb-4">
        <Radio size={15} className={cn("text-accent", !paused && "animate-blink")} />
        <span className="text-[10px] font-mono uppercase tracking-widest">
          {paused ? "flux en pause" : "flux en direct"}
        </span>
        <span className="ml-auto text-[10px] font-mono">{items.length} questions</span>
        <button
          onClick={togglePause}
          className="flex items-center gap-1.5 border-2 border-background px-3 py-1 text-[10px] font-mono uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
        >
          {paused ? <Play size={11} /> : <Pause size={11} />}
          {paused ? "Reprendre" : "Pause"}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((it) => {
            const hasReacted = voted.has(it.id)
            return (
              <motion.li
                key={it.id}
                layout
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="border-2 border-foreground"
              >
                <div className="flex items-start justify-between gap-3 p-4">
                  <p className="text-sm leading-relaxed flex-1">{it.body}</p>
                  <button
                    onClick={() => react(it.id)}
                    disabled={!user || hasReacted}
                    aria-pressed={hasReacted}
                    className={cn(
                      "flex items-center gap-1.5 shrink-0 text-[10px] font-mono px-2.5 py-1.5 border-2 border-foreground transition-colors",
                      hasReacted
                        ? "bg-accent text-accent-foreground border-accent"
                        : "hover:bg-muted disabled:opacity-40 disabled:pointer-events-none",
                    )}
                  >
                    <ThumbsUp size={11} />
                    <span className="font-mono tabular-nums">{it.upvotes}</span>
                  </button>
                </div>
                <p className="border-t-2 border-foreground px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {it.pseudo}
                </p>
              </motion.li>
            )
          })}
        </AnimatePresence>
        {items.length === 0 && (
          <li className="border-2 border-dashed border-foreground/40 p-6 text-center text-xs font-mono text-muted-foreground">
            Aucune question validée pour l'instant.
          </li>
        )}
      </ul>
    </div>
  )
}
