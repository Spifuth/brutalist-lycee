"use client"

import { useEffect, useState } from "react"
import { Play, Pause, ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react"
import { STEPS, OBSERVERS, VISIBILITY_LABEL } from "@/lib/voyage"
import { CodeBlock, Table } from "@/components/primitives"
import { cn } from "@/lib/utils"

const STEP_MS = 5000

export function DataJourney() {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const step = STEPS[index]

  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => {
      setIndex((i) => {
        // Stop at the end rather than looping: the last step is a conclusion,
        // not a frame in a carousel.
        if (i + 1 >= STEPS.length) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, STEP_MS)
    return () => clearTimeout(id)
  }, [playing, index])

  const go = (i: number) => {
    setPlaying(false)
    setIndex(Math.max(0, Math.min(STEPS.length - 1, i)))
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Timeline */}
      <div className="flex items-stretch border-2 border-foreground overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            aria-current={i === index}
            className={cn(
              "flex-1 min-w-[5.5rem] border-r-2 border-foreground last:border-r-0 px-2 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors",
              i === index
                ? "bg-accent text-accent-foreground font-bold"
                : i < index
                  ? "bg-muted"
                  : "hover:bg-muted",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            if (index >= STEPS.length - 1) setIndex(0)
            setPlaying((p) => !p)
          }}
          className="flex items-center gap-2 border-2 border-foreground bg-accent px-4 py-2 text-[11px] font-mono uppercase tracking-widest font-bold text-accent-foreground"
        >
          {playing ? <Pause size={13} /> : <Play size={13} />}
          {playing ? "pause" : "dérouler"}
        </button>
        <button
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="flex items-center gap-2 border-2 border-foreground px-3 py-2 text-[11px] font-mono uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-40"
        >
          <ChevronLeft size={13} /> précédent
        </button>
        <button
          onClick={() => go(index + 1)}
          disabled={index === STEPS.length - 1}
          className="flex items-center gap-2 border-2 border-foreground px-3 py-2 text-[11px] font-mono uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-40"
        >
          suivant <ChevronRight size={13} />
        </button>
        <span
          className={cn(
            "ml-auto flex items-center gap-2 border-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest",
            step.encrypted ? "border-accent text-accent" : "border-foreground",
          )}
        >
          {step.encrypted ? <Lock size={12} /> : <Unlock size={12} />}
          {step.encrypted ? "chiffré" : "en clair"}
        </span>
      </div>

      {/* The step */}
      <div className="border-2 border-foreground">
        <div className="border-b-2 border-foreground bg-muted px-4 py-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            étape {index + 1} / {STEPS.length}
          </span>
          <h3 className="font-mono text-base font-bold uppercase tracking-wide">{step.title}</h3>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-foreground/90">{step.what}</p>
          <CodeBlock label="sur le câble" code={step.wire.join("\n")} />
        </div>
      </div>

      {/* Who sees what */}
      <Table
        caption="« le nom du site » et « l'adresse IP » reviennent au même : les deux disent où tu es allé·e."
        headers={["Qui écoute", "Ce qu'il voit ici", "Pourquoi"]}
        rows={step.sees.map((v) => [OBSERVERS[v.observer].label, VISIBILITY_LABEL[v.sees], v.note])}
      />
    </div>
  )
}
