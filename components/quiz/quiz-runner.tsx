"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, ArrowRight, RotateCcw, Trophy } from "lucide-react"
import { type Quiz } from "@/lib/quizzes"
import { submitQuizAttempt } from "@/app/actions/engage"
import { cn } from "@/lib/utils"

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [earned, setEarned] = useState<string[]>([])

  const total = quiz.questions.length
  const question = quiz.questions[step]
  const progress = Math.round(((step + (revealed ? 1 : 0)) / total) * 100)

  const choose = (i: number) => {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    if (i === question.correct) setScore((s) => s + 1)
  }

  const next = () => {
    if (step < total - 1) {
      setStep((s) => s + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      const finalScore = score // score already reflects the last correct answer
      setDone(true)
      submitQuizAttempt(quiz.slug, finalScore, total)
        .then((res) => setEarned(res.earned ?? []))
        .catch(() => {})
    }
  }

  const restart = () => {
    setStep(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setDone(false)
    setEarned([])
  }

  if (done) {
    const pct = Math.round((score / total) * 100)
    const msg =
      pct >= 80 ? "Excellent, tu maîtrises !" : pct >= 50 ? "Pas mal, continue à explorer." : "C'est un début, recommence pour progresser."
    return (
      <div className="border-2 border-foreground">
        <div className="border-b-2 border-foreground bg-muted px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest">Résultat</span>
          <span className="text-[10px] font-mono text-accent">{quiz.theme}</span>
        </div>
        <div className="p-8 text-center">
          <Trophy size={32} className="mx-auto text-accent mb-4" />
          <p className="font-pixel text-5xl mb-2">
            {score}/{total}
          </p>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            {pct}% de bonnes réponses
          </p>
          <p className="text-sm text-foreground/90 mb-4">{msg}</p>
          {earned.length > 0 && (
            <p className="mb-6 inline-block border-2 border-foreground bg-accent px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-accent-foreground">
              {earned.length} badge{earned.length > 1 ? "s" : ""} débloqué{earned.length > 1 ? "s" : ""} — vois ton profil
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={restart}
              className="flex items-center gap-2 border-2 border-foreground px-4 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-muted transition-colors"
            >
              <RotateCcw size={14} /> Recommencer
            </button>
            <Link
              href="/quiz"
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Autres quiz <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-foreground">
      <div className="border-b-2 border-foreground bg-muted px-4 py-2 flex items-center gap-4">
        <span className="text-[10px] font-mono uppercase tracking-widest whitespace-nowrap">
          {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <div className="flex-1 h-2 border border-foreground">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] font-mono text-accent whitespace-nowrap">score {score}</span>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="font-mono text-base lg:text-lg font-bold leading-snug mb-5 text-balance">
              {question.prompt}
            </h2>
            <div className="flex flex-col gap-2">
              {question.options.map((opt, i) => {
                const isCorrect = i === question.correct
                const isChosen = i === selected
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={revealed}
                    className={cn(
                      "flex items-center gap-3 border-2 border-foreground px-4 py-3 text-left text-sm transition-colors",
                      !revealed && "hover:bg-muted",
                      revealed && isCorrect && "bg-accent text-accent-foreground border-accent",
                      revealed && isChosen && !isCorrect && "bg-destructive text-destructive-foreground border-destructive",
                      revealed && !isCorrect && !isChosen && "opacity-50",
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground w-4 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {revealed && isCorrect && <Check size={15} />}
                    {revealed && isChosen && !isCorrect && <X size={15} />}
                  </button>
                )
              })}
            </div>

            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 border-l-4 border-l-accent border-2 border-foreground bg-muted/40 px-4 py-3"
              >
                <p className="text-[10px] font-mono uppercase tracking-widest font-bold mb-1">
                  {selected === question.correct ? "Bonne réponse" : "Explication"}
                </p>
                <p className="text-sm text-foreground/90 leading-relaxed">{question.explanation}</p>
              </motion.div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={next}
                disabled={!revealed}
                className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                {step === total - 1 ? "Voir mon résultat" : "Question suivante"} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
