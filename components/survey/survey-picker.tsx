"use client"

import { useState } from "react"
import { Clock, Check, ArrowRight } from "lucide-react"
import { SURVEY_LEVELS, SURVEYS } from "@/lib/surveys"
import { SurveyRunner } from "@/components/survey/survey-runner"
import type { SurveyLevel } from "@/lib/profile"
import { cn } from "@/lib/utils"

interface SurveyPickerProps {
  completed: SurveyLevel[]
  onComplete?: () => void
  onSkip?: () => void
  /** Heading text. */
  title?: string
}

export function SurveyPicker({ completed, onComplete, onSkip, title = "Choisis un questionnaire" }: SurveyPickerProps) {
  const [active, setActive] = useState<SurveyLevel | null>(null)

  if (active) {
    return (
      <div>
        <button
          onClick={() => setActive(null)}
          className="mb-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          {"< retour au choix"}
        </button>
        <SurveyRunner
          level={active}
          onDone={() => {
            setActive(null)
            onComplete?.()
          }}
          onSkip={() => setActive(null)}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent">
          {"// enquete_connaissances"}
        </span>
      </div>
      <h3 className="font-mono uppercase tracking-wide font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Tes réponses sont partagées entre les questionnaires : ce que tu réponds ici pré-remplit les
        versions plus longues. Tu peux aussi passer pour l'instant.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border-2 border-foreground">
        {SURVEY_LEVELS.map((level, i) => {
          const s = SURVEYS[level]
          const done = completed.includes(level)
          return (
            <button
              key={level}
              onClick={() => setActive(level)}
              className={cn(
                "group flex flex-col items-start gap-2 p-4 text-left transition-colors hover:bg-muted",
                i < SURVEY_LEVELS.length - 1 && "border-b-2 sm:border-b-0 sm:border-r-2 border-foreground",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-mono uppercase tracking-widest text-accent">
                  {level}
                </span>
                {done && (
                  <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest bg-accent text-accent-foreground px-1.5 py-0.5">
                    <Check size={9} /> fait
                  </span>
                )}
              </div>
              <span className="font-mono text-sm font-bold">{s.title}</span>
              <span className="text-[11px] text-muted-foreground leading-snug">{s.subtitle}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground mt-auto pt-2">
                <Clock size={11} /> ~{s.minutes} min · {s.questionKeys.length} questions
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-foreground group-hover:text-accent">
                {done ? "Refaire" : "Commencer"} <ArrowRight size={11} />
              </span>
            </button>
          )
        })}
      </div>

      {onSkip && (
        <button
          onClick={onSkip}
          className="mt-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Passer pour l'instant →
        </button>
      )}
    </div>
  )
}
