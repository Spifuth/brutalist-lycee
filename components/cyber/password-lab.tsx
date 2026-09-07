"use client"

import { useEffect, useRef, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import {
  analyse,
  crackSeconds,
  humaniseDuration,
  ATTACKERS,
  type Analysis,
} from "@/lib/password-strength"
import { Table } from "@/components/primitives"
import { cn } from "@/lib/utils"

const SAMPLES = ["azerty", "P@ssw0rd!", "chateau2024", "orage-cobalt-ardoise-prisme"]

const VERDICT_LABEL: Record<Analysis["verdict"], string> = {
  catastrophique: "catastrophique",
  faible: "faible",
  moyen: "moyen",
  solide: "solide",
  excellent: "excellent",
}

/** The GPU profile drives the animated counter — the one people picture. */
const COUNTER_ATTACKER = ATTACKERS.find((a) => a.key === "gpu")!

function formatBig(n: number): string {
  if (n < 1000) return String(Math.round(n))
  if (n < 1e6) return `${(n / 1e3).toFixed(1)} mille`
  if (n < 1e9) return `${(n / 1e6).toFixed(1)} millions`
  if (n < 1e12) return `${(n / 1e9).toFixed(1)} milliards`
  return n.toExponential(2).replace("e+", " × 10^")
}

export function PasswordLab() {
  const [value, setValue] = useState("")
  const [visible, setVisible] = useState(false)
  const [tried, setTried] = useState(0)

  const a = analyse(value)
  const empty = value.length === 0

  // The counter restarts on every keystroke: it is showing how far this
  // attacker gets against THIS password, not accumulating across attempts.
  const startedAt = useRef<number>(0)
  useEffect(() => {
    setTried(0)
    if (!value) return
    startedAt.current = performance.now()
    let frame = 0
    const tick = () => {
      const elapsed = (performance.now() - startedAt.current) / 1000
      setTried(Math.min(elapsed * COUNTER_ATTACKER.guessesPerSecond, a.guesses))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // a.guesses is derived from value; depending on value alone is deliberate.
  }, [value, a.guesses])

  const progress = a.guesses > 0 ? Math.min(tried / a.guesses, 1) : 0
  const naiveSeconds = Math.pow(2, a.entropyBits) / COUNTER_ATTACKER.guessesPerSecond
  const realSeconds = crackSeconds(a, COUNTER_ATTACKER.guessesPerSecond)
  const lying = !empty && naiveSeconds > realSeconds * 1000

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="pw" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          tape un mot de passe
        </label>
        <div className="flex items-stretch border-2 border-foreground">
          <input
            id="pw"
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            name="demonstration-non-envoyee"
            placeholder="essaie le tien, ou clique un exemple"
            className="flex-1 bg-transparent px-4 py-3 font-mono text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="border-l-2 border-foreground px-4 hover:bg-muted transition-colors"
            aria-label={visible ? "Masquer" : "Afficher"}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">exemples</span>
          {SAMPLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setValue(s)
                setVisible(true)
              }}
              className="border-2 border-border px-2 py-1 font-mono text-[11px] hover:bg-muted transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Verdict + counter */}
      <div className="border-2 border-foreground">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b-2 border-foreground bg-muted px-4 py-3">
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold">verdict</span>
          <span className={cn("font-pixel text-2xl", !empty && "text-accent")}>
            {empty ? "—" : VERDICT_LABEL[a.verdict]}
          </span>
          {!empty && (
            <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {a.length} caractères · {Math.round(a.effectiveBits)} bits utiles
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            une carte graphique essaie {formatBig(COUNTER_ATTACKER.guessesPerSecond)} de combinaisons par seconde
          </p>
          {/* Progress through the whole search space, live. */}
          <div className="h-4 border-2 border-foreground">
            <div className="h-full bg-accent" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex flex-wrap justify-between gap-2 font-mono text-xs">
            <span>
              {formatBig(tried)} essais / {empty ? "—" : formatBig(a.guesses)}
            </span>
            <span className={cn(progress >= 1 && "text-accent font-bold")}>
              {empty ? "" : progress >= 1 ? "trouvé" : `${(progress * 100).toPrecision(2)} %`}
            </span>
          </div>
        </div>
      </div>

      {/* Paper vs reality — the whole point of the page */}
      {lying && (
        <div className="border-2 border-foreground">
          <div className="border-b-2 border-foreground bg-muted px-4 py-2 text-[10px] font-mono uppercase tracking-widest font-bold">
            ce que le calcul naïf prétend, et ce qui se passe vraiment
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-foreground">
            <div className="p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                sur le papier ({Math.round(a.entropyBits)} bits)
              </p>
              <p className="font-mono text-sm line-through decoration-2">{humaniseDuration(naiveSeconds)}</p>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-1">
                en vrai ({Math.round(a.effectiveBits)} bits)
              </p>
              <p className="font-mono text-sm font-bold">{humaniseDuration(realSeconds)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attackers */}
      {!empty && (
        <Table
          caption="Les vitesses sont des ordres de grandeur : ce qui compte est l'écart entre les lignes, pas la troisième décimale."
          headers={["Qui attaque", "Vitesse", "Temps pour trouver"]}
          rows={ATTACKERS.map((at) => [
            at.label,
            `${formatBig(at.guessesPerSecond)} / s`,
            humaniseDuration(crackSeconds(a, at.guessesPerSecond)),
          ])}
        />
      )}

      {/* What is wrong with it */}
      {!empty && a.weaknesses.length > 0 && (
        <div className="border-2 border-foreground">
          <div className="border-b-2 border-foreground bg-muted px-4 py-2 text-[10px] font-mono uppercase tracking-widest font-bold">
            ce que l&apos;attaquant reconnaît
          </div>
          <ul className="divide-y-2 divide-border">
            {a.weaknesses.map((w, i) => (
              <li key={i} className="flex gap-3 px-4 py-3 text-sm">
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-accent pt-1">
                  {w.kind}
                </span>
                <span className="text-foreground/90">{w.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
