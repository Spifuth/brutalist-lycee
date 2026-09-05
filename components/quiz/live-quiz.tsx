"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Radio, Users, Clock, Trophy, Check, X } from "lucide-react"
import { getQuiz } from "@/lib/quizzes"
import { cn } from "@/lib/utils"

// SWAP POINT: a real live quiz would be driven by SSE from an admin console.
// Here everything (players, timing, other scores) is simulated in the browser.

const QUIZ = getQuiz("cyber-bases")!
const QUESTION_SECONDS = 15
const BOTS = ["nova_42", "kilo", "z3ro", "pixel", "mira", "byte_me", "l0up", "echo"]

type Phase = "lobby" | "question" | "reveal" | "final"

interface Player {
  name: string
  score: number
  isYou?: boolean
}

export function LiveQuiz() {
  const [phase, setPhase] = useState<Phase>("lobby")
  const [step, setStep] = useState(0)
  const [seconds, setSeconds] = useState(QUESTION_SECONDS)
  const [selected, setSelected] = useState<number | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const question = QUIZ.questions[step]
  const total = QUIZ.questions.length

  // Countdown during a question.
  useEffect(() => {
    if (phase !== "question") return
    setSeconds(QUESTION_SECONDS)
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer.current!)
          reveal()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step])

  const start = () => {
    setPlayers([{ name: "toi", score: 0, isYou: true }, ...BOTS.map((n) => ({ name: n, score: 0 }))])
    setStep(0)
    setPhase("question")
  }

  const choose = (i: number) => {
    if (phase !== "question" || selected !== null) return
    setSelected(i)
  }

  const reveal = () => {
    setPhase("reveal")
    // Score: you get points for correct + speed; bots get random-ish points.
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.isYou) {
          const correct = selected === question.correct
          const gain = correct ? 500 + Math.round((seconds / QUESTION_SECONDS) * 500) : 0
          return { ...p, score: p.score + gain }
        }
        // bots answer correctly ~65% of the time
        const correct = Math.random() < 0.65
        const gain = correct ? 400 + Math.floor(Math.random() * 600) : 0
        return { ...p, score: p.score + gain }
      }),
    )
    setTimeout(() => {
      if (step < total - 1) {
        setStep((s) => s + 1)
        setSelected(null)
        setPhase("question")
      } else {
        setPhase("final")
      }
    }, 2600)
  }

  const ranked = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="border-2 border-foreground max-w-3xl">
      {/* header */}
      <div className="border-b-2 border-foreground bg-foreground text-background px-4 py-2.5 flex items-center gap-3">
        <Radio size={15} className="text-accent animate-blink" />
        <span className="text-[10px] font-mono uppercase tracking-widest">flux en direct — simulé</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono">
          <Users size={12} /> {players.length || BOTS.length + 1}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "lobby" && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">// salle d'attente</p>
            <h2 className="font-pixel text-3xl mb-3">{QUIZ.title}</h2>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
              Réponds le plus vite possible : plus tu es rapide, plus tu gagnes de points. Version
              simulée d'un quiz synchronisé façon Kahoot.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {BOTS.map((b) => (
                <span key={b} className="text-[10px] font-mono border-2 border-foreground px-2 py-1">
                  {b}
                </span>
              ))}
            </div>
            <button
              onClick={start}
              className="bg-foreground text-background px-6 py-3 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Rejoindre la partie
            </button>
          </motion.div>
        )}

        {(phase === "question" || phase === "reveal") && (
          <motion.div key={`q-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-4 px-4 py-2 border-b-2 border-foreground bg-muted">
              <span className="text-[10px] font-mono uppercase tracking-widest">
                {step + 1}/{total}
              </span>
              <div className="flex-1" />
              <span className={cn("flex items-center gap-1.5 text-sm font-mono font-bold", seconds <= 5 && phase === "question" ? "text-destructive" : "text-accent")}>
                <Clock size={14} /> {seconds}s
              </span>
            </div>
            <div className="p-6">
              <h2 className="font-mono text-base lg:text-lg font-bold leading-snug mb-5 text-balance">
                {question.prompt}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {question.options.map((opt, i) => {
                  const isCorrect = i === question.correct
                  const isChosen = i === selected
                  const showResult = phase === "reveal"
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      disabled={phase === "reveal" || selected !== null}
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
              {phase === "question" && selected !== null && (
                <p className="mt-4 text-[11px] font-mono uppercase tracking-widest text-accent">
                  Réponse enregistrée — attends la fin du compte à rebours…
                </p>
              )}
              {phase === "reveal" && (
                <p className="mt-4 text-sm text-foreground/90 leading-relaxed border-l-4 border-l-accent border-2 border-foreground bg-muted/40 px-4 py-3">
                  {question.explanation}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {phase === "final" && (
          <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
            <div className="text-center mb-6">
              <Trophy size={28} className="mx-auto text-accent mb-2" />
              <h2 className="font-pixel text-3xl">Classement final</h2>
            </div>
            <ol className="flex flex-col divide-y-2 divide-border border-2 border-foreground">
              {ranked.map((p, i) => (
                <li
                  key={p.name}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    p.isYou && "bg-accent/15",
                    i === 0 && "bg-foreground text-background",
                  )}
                >
                  <span className="font-mono text-sm font-bold w-6">{i + 1}</span>
                  <span className="font-mono text-sm flex-1">
                    {p.name} {p.isYou && <span className="text-accent">(toi)</span>}
                  </span>
                  <span className="font-mono text-sm font-bold">{p.score}</span>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setPhase("lobby")}
              className="mt-5 w-full border-2 border-foreground px-4 py-3 text-xs font-mono uppercase tracking-widest hover:bg-muted transition-colors"
            >
              Rejouer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
