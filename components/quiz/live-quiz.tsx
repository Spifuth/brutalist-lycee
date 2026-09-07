"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Radio, Users, Clock, Trophy, Check, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { joinSession, submitAnswer } from "@/app/actions/live"
import type { LiveSnapshot } from "@/lib/live-broadcast"
import { cn } from "@/lib/utils"

// Server-authoritative: everything below is a render of the snapshot the
// server pushes over /api/live/stream. The client never decides the state
// machine — it derives a display-only countdown and waits for the server to
// say "reveal"; see the effect below.

export function LiveQuiz() {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null)
  const [localSelected, setLocalSelected] = useState<number | null>(null)
  const [, forceTick] = useState(0)
  const lastQuestionKey = useRef<string | null>(null)
  const joinedSessionId = useRef<string | null>(null)

  // Subscribe to the live stream. A dropped connection is reopened by the
  // browser's own EventSource retry, not by anything here.
  useEffect(() => {
    const source = new EventSource("/api/live/stream")
    source.onmessage = (event) => {
      try {
        setSnapshot(JSON.parse(event.data) as LiveSnapshot)
      } catch {
        // Malformed frame — skip it, the next tick will correct itself.
      }
    }
    return () => source.close()
  }, [])

  const state = snapshot?.state ?? null
  const question = snapshot?.question ?? null
  const participants = snapshot?.participants ?? []

  // Reset the optimistic local pick whenever the question actually changes.
  useEffect(() => {
    if (question?.key !== lastQuestionKey.current) {
      lastQuestionKey.current = question?.key ?? null
      setLocalSelected(null)
    }
  }, [question?.key])

  // Register the signed-in viewer on the scoreboard as soon as a session
  // exists, so they show up in the waiting room instead of only appearing
  // once they submit a first answer. Idempotent server-side; runs once per
  // session id.
  useEffect(() => {
    if (!user || !snapshot?.sessionId) return
    if (joinedSessionId.current === snapshot.sessionId) return
    joinedSessionId.current = snapshot.sessionId
    joinSession().catch(() => {
      // Not fatal — submitAnswer() creates the participant row itself if
      // this never lands.
    })
  }, [user, snapshot?.sessionId])

  // The countdown is display-only: a 1s re-render tick while a question is
  // open, computed from question_started_at + question_duration_s. It never
  // changes `state` itself — that only ever comes from the server.
  useEffect(() => {
    if (state !== "question") return
    const id = setInterval(() => forceTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [state, question?.key])

  const durationS = snapshot?.questionDurationS ?? 0
  const startedAtMs = snapshot?.questionStartedAt ? Date.parse(snapshot.questionStartedAt) : null
  const secondsLeft =
    startedAtMs === null ? durationS : Math.max(0, durationS - Math.floor((Date.now() - startedAtMs) / 1000))

  const selected = localSelected ?? snapshot?.viewerAnswer?.choice ?? null

  const choose = async (i: number) => {
    if (!question || state !== "question" || selected !== null || !user) return
    setLocalSelected(i)
    try {
      await submitAnswer(question.key, i)
    } catch {
      // Refused (late, duplicate, session moved on) — fall back to
      // whatever the server reports on the next frame instead of getting
      // stuck showing a pick that never actually landed.
      setLocalSelected(null)
    }
  }

  const ranked = participants

  return (
    <div className="border-2 border-foreground max-w-3xl">
      {/* header */}
      <div className="border-b-2 border-foreground bg-foreground text-background px-4 py-2.5 flex items-center gap-3">
        <Radio size={15} className="text-accent animate-blink" />
        <span className="text-[10px] font-mono uppercase tracking-widest">flux en direct</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono">
          <Users size={12} /> {participants.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {(state === null || state === "lobby" || state === "aborted") && (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">// salle d'attente</p>
            <h2 className="font-pixel text-3xl mb-3">{snapshot?.quizTitle ?? "Quiz en direct"}</h2>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
              {state === "aborted"
                ? "La session a été interrompue par ton professeur. Attends qu'il en ouvre une nouvelle."
                : state === "lobby" && snapshot?.sessionId
                  ? "La session est ouverte. La partie démarre dès que ton professeur lance la première question."
                  : "Aucune session en direct pour le moment. Attends que ton professeur en ouvre une."}
            </p>
            {participants.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-2">
                {participants.map((p) => (
                  <span key={p.userId} className="text-[10px] font-mono border-2 border-foreground px-2 py-1">
                    {p.pseudo}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {(state === "question" || state === "reveal") && question && (
          <motion.div key={`q-${question.key}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-4 px-4 py-2 border-b-2 border-foreground bg-muted">
              <span className="text-[10px] font-mono uppercase tracking-widest">
                {question.index + 1}/{question.total}
              </span>
              <div className="flex-1" />
              <span className={cn("flex items-center gap-1.5 text-sm font-mono font-bold", secondsLeft <= 5 && state === "question" ? "text-destructive" : "text-accent")}>
                <Clock size={14} /> {secondsLeft}s
              </span>
            </div>
            <div className="p-6">
              <h2 className="font-mono text-base lg:text-lg font-bold leading-snug mb-5 text-balance">
                {question.prompt}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt, i) => {
                  const showResult = state === "reveal"
                  const isCorrect = showResult && question.correct !== null && i === question.correct
                  const isChosen = i === selected
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      disabled={state === "reveal" || selected !== null || !user}
                      className={cn(
                        "flex items-center gap-3 border-2 border-foreground px-4 py-3 text-left text-sm transition-colors",
                        !showResult && selected === null && "hover:bg-muted",
                        !showResult && isChosen && "bg-foreground text-background",
                        showResult && isCorrect && "bg-accent text-accent-foreground border-accent",
                        showResult && isChosen && !isCorrect && "bg-destructive text-destructive-foreground border-destructive",
                        showResult && !isCorrect && !isChosen && "opacity-50",
                      )}
                    >
                      <span className="font-mono text-xs w-4 shrink-0">{String.fromCharCode(65 + i)}</span>
                      <span className="flex-1">{opt}</span>
                      {showResult && isCorrect && <Check size={15} />}
                      {showResult && isChosen && !isCorrect && <X size={15} />}
                    </button>
                  )
                })}
              </div>
              {state === "question" && selected !== null && (
                <p className="mt-4 text-[11px] font-mono uppercase tracking-widest text-accent">
                  Réponse enregistrée — attends la fin du compte à rebours…
                </p>
              )}
              {state === "question" && selected === null && !user && (
                <p className="mt-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  Connecte-toi pour participer.
                </p>
              )}
              {state === "reveal" && (
                <p className="mt-4 text-sm text-foreground/90 leading-relaxed border-l-4 border-l-accent border-2 border-foreground bg-muted/40 px-4 py-3">
                  {question.explanation}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {state === "finished" && (
          <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
            <div className="text-center mb-6">
              <Trophy size={28} className="mx-auto text-accent mb-2" />
              <h2 className="font-pixel text-3xl">Classement final</h2>
            </div>
            <ol className="flex flex-col divide-y-2 divide-border border-2 border-foreground">
              {ranked.map((p, i) => {
                const isYou = p.userId === user?.id
                return (
                  <li
                    key={p.userId}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      isYou && "bg-accent/15",
                      i === 0 && "bg-foreground text-background",
                    )}
                  >
                    <span className="font-mono text-sm font-bold w-6">{i + 1}</span>
                    <span className="font-mono text-sm flex-1">
                      {p.pseudo} {isYou && <span className="text-accent">(toi)</span>}
                    </span>
                    <span className="font-mono text-sm font-bold">{p.score}</span>
                  </li>
                )
              })}
            </ol>
            <p className="mt-5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center">
              // en attente d'une nouvelle session
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
