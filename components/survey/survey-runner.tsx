"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react"
import {
  getQuestions,
  loadSurveyData,
  saveSurveyResult,
  type AnswerValue,
  type Question,
  type SurveyAnswers,
} from "@/lib/surveys"
import { type SurveyLevel } from "@/lib/profile"
import { saveSurvey } from "@/app/actions/engage"
import { cn } from "@/lib/utils"

interface SurveyRunnerProps {
  level: SurveyLevel
  onDone?: () => void
  onSkip?: () => void
}

export function SurveyRunner({ level, onDone, onSkip }: SurveyRunnerProps) {
  const questions = useMemo(() => getQuestions(level), [level])
  const existing = useMemo(() => loadSurveyData().answers, [])

  const [answers, setAnswers] = useState<SurveyAnswers>(() => {
    // Pre-fill from previously answered questions (shared by key).
    const seed: SurveyAnswers = {}
    for (const q of questions) {
      if (existing[q.key] !== undefined) seed[q.key] = existing[q.key]
    }
    return seed
  })
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)

  const total = questions.length
  const current = questions[step]
  const progress = Math.round(((step + (finished ? 1 : 0)) / total) * 100)
  const preFilled = existing[current?.key] !== undefined

  const setAnswer = (key: string, value: AnswerValue) =>
    setAnswers((a) => ({ ...a, [key]: value }))

  const canAdvance = answers[current?.key] !== undefined &&
    !(Array.isArray(answers[current?.key]) && (answers[current.key] as string[]).length === 0)

  const next = () => {
    if (step < total - 1) setStep((s) => s + 1)
    else setFinished(true)
  }
  const prev = () => {
    if (finished) setFinished(false)
    else if (step > 0) setStep((s) => s - 1)
  }

  const confirm = () => {
    // Keep a local copy for instant answer pre-fill; persist to the DB (source of truth).
    saveSurveyResult(answers, level)
    void saveSurvey(level, answers as Record<string, unknown>)
    onDone?.()
  }

  if (finished) {
    return (
      <div className="border-2 border-foreground">
        <div className="border-b-2 border-foreground bg-muted px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest">Confirmation</span>
          <span className="text-[10px] font-mono text-accent">{total}/{total}</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check size={18} className="text-accent" />
            <h3 className="font-mono uppercase tracking-wide font-bold text-sm">
              Récapitulatif de tes réponses
            </h3>
          </div>
          <ul className="flex flex-col divide-y-2 divide-border border-2 border-border mb-6">
            {questions.map((q) => (
              <li key={q.key} className="px-3 py-2">
                <p className="text-[11px] text-muted-foreground leading-snug">{q.prompt}</p>
                <p className="text-xs font-mono text-foreground mt-1">{formatAnswer(q, answers[q.key])}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={confirm}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Check size={14} /> Valider mes réponses
            </button>
            <button
              onClick={prev}
              className="flex items-center gap-2 border-2 border-foreground px-4 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-muted transition-colors"
            >
              <RotateCcw size={14} /> Revoir
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-foreground">
      {/* Progress */}
      <div className="border-b-2 border-foreground bg-muted px-4 py-2 flex items-center gap-4">
        <span className="text-[10px] font-mono uppercase tracking-widest whitespace-nowrap">
          {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <div className="flex-1 h-2 border border-foreground">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] font-mono text-accent">{current.theme}</span>
      </div>

      <div className="p-6 min-h-[280px] flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-mono text-base lg:text-lg font-bold leading-snug text-balance">
                {current.prompt}
              </h3>
              {preFilled && (
                <span className="shrink-0 text-[9px] font-mono uppercase tracking-widest bg-accent text-accent-foreground px-2 py-1">
                  déjà répondu
                </span>
              )}
            </div>
            {current.help && (
              <p className="text-[11px] text-muted-foreground mb-4">{current.help}</p>
            )}
            <div className="mt-4">
              <QuestionInput question={current} value={answers[current.key]} onChange={(v) => setAnswer(current.key, v)} />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t-2 border-border">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft size={14} /> Précédent
          </button>
          <div className="flex items-center gap-3">
            {onSkip && (
              <button
                onClick={onSkip}
                className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Passer pour l'instant
              </button>
            )}
            <button
              onClick={next}
              disabled={!canAdvance}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              {step === total - 1 ? "Terminer" : "Suivant"} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question
  value: AnswerValue | undefined
  onChange: (v: AnswerValue) => void
}) {
  if (question.type === "scale") {
    const current = typeof value === "number" ? value : 0
    return (
      <div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={cn(
                "h-14 border-2 border-foreground font-mono text-lg font-bold transition-colors",
                current === n ? "bg-accent text-accent-foreground" : "hover:bg-muted",
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {question.scaleLabels && (
          <div className="flex justify-between mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>{question.scaleLabels[0]}</span>
            <span>{question.scaleLabels[1]}</span>
          </div>
        )}
      </div>
    )
  }

  if (question.type === "single") {
    return (
      <div className="flex flex-col gap-2">
        {question.options?.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-3 border-2 border-foreground px-4 py-3 text-left text-sm transition-colors",
              value === opt.value ? "bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "h-3 w-3 border-2 shrink-0",
                value === opt.value ? "bg-accent border-accent" : "border-foreground",
              )}
            />
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  // multi
  const arr = Array.isArray(value) ? value : []
  const toggle = (v: string) =>
    onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  return (
    <div className="flex flex-col gap-2">
      {question.options?.map((opt) => {
        const on = arr.includes(opt.value)
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              "flex items-center gap-3 border-2 border-foreground px-4 py-3 text-left text-sm transition-colors",
              on ? "bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center border-2 shrink-0",
                on ? "bg-accent border-accent" : "border-foreground",
              )}
            >
              {on && <Check size={10} className="text-accent-foreground" />}
            </span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function formatAnswer(q: Question, value: AnswerValue | undefined): string {
  if (value === undefined) return "—"
  if (q.type === "scale") return `${value} / 5`
  if (q.type === "single") {
    return q.options?.find((o) => o.value === value)?.label ?? String(value)
  }
  const arr = Array.isArray(value) ? value : []
  if (arr.length === 0) return "—"
  return arr.map((v) => q.options?.find((o) => o.value === v)?.label ?? v).join(", ")
}
