"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Pause, SkipForward, Trash2, Shuffle } from "lucide-react"
import {
  createGrid,
  population,
  PATTERNS,
  randomise,
  stampCentred,
  step,
  toggle,
  type Grid,
} from "@/lib/life"
import { cn } from "@/lib/utils"

const COLS = 64
const ROWS = 36

const SPEEDS: { label: string; ms: number }[] = [
  { label: "lent", ms: 320 },
  { label: "normal", ms: 120 },
  { label: "rapide", ms: 40 },
]

/**
 * Read a design token at draw time rather than importing a literal.
 *
 * Canvas needs a real colour string, but `lib/theme-tokens.ts` is the only
 * file allowed to hold raw hex (the CI style gate enforces it). Reading the
 * CSS custom property instead means this canvas follows the light/dark toggle
 * for free — and keeps this file free of colour.
 */
function token(el: Element, name: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim()
  return value ? `hsl(${value})` : "transparent"
}

export function GameOfLife() {
  const [grid, setGrid] = useState<Grid>(() => stampCentred(createGrid(COLS, ROWS), PATTERNS.pulsar))
  const [running, setRunning] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [speed, setSpeed] = useState(SPEEDS[1].ms)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Which cell the pointer last painted, so a drag across one cell does not
  // toggle it back and forth on every mousemove event.
  const lastPainted = useRef<string | null>(null)

  const advance = useCallback(() => {
    setGrid((g) => step(g))
    setGeneration((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!running) return
    const id = setInterval(advance, speed)
    return () => clearInterval(id)
  }, [running, speed, advance])

  // --- Drawing --------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let frame = 0
    const draw = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      const cssWidth = parent.clientWidth
      const cell = Math.max(2, Math.floor(cssWidth / COLS))
      const width = cell * COLS
      const height = cell * ROWS

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      ctx.fillStyle = token(canvas, "--background")
      ctx.fillRect(0, 0, width, height)

      // Below ~6px a grid line is most of the cell — it reads as noise.
      if (cell >= 6) {
        ctx.strokeStyle = token(canvas, "--border")
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let x = 0; x <= COLS; x++) {
          ctx.moveTo(x * cell + 0.5, 0)
          ctx.lineTo(x * cell + 0.5, height)
        }
        for (let y = 0; y <= ROWS; y++) {
          ctx.moveTo(0, y * cell + 0.5)
          ctx.lineTo(width, y * cell + 0.5)
        }
        ctx.stroke()
      }

      ctx.fillStyle = token(canvas, "--accent")
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (grid.cells[y * COLS + x] === 1) ctx.fillRect(x * cell, y * cell, cell, cell)
        }
      }
    }

    draw()
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(draw)
    }
    window.addEventListener("resize", onResize)
    // The site's theme toggle swaps a class on <html>; the tokens read above
    // change with it, so the canvas has to be repainted or it keeps the old
    // palette until the next generation.
    const observer = new MutationObserver(draw)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
      observer.disconnect()
    }
  }, [grid])

  // --- Pointer painting -----------------------------------------------------
  const cellFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * COLS)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * ROWS)
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null
    return [x, y]
  }

  const paint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const at = cellFromEvent(e)
    if (!at) return
    const key = `${at[0]},${at[1]}`
    if (lastPainted.current === key) return
    lastPainted.current = key
    setGrid((g) => toggle(g, at[0], at[1]))
  }

  const reset = (next: Grid) => {
    setGrid(next)
    setGeneration(0)
  }

  const alive = population(grid)

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-2 border-2 border-foreground bg-accent px-4 py-2 text-[11px] font-mono uppercase tracking-widest font-bold text-accent-foreground"
          aria-pressed={running}
        >
          {running ? <Pause size={13} /> : <Play size={13} />}
          {running ? "pause" : "lecture"}
        </button>
        <button
          onClick={() => {
            setRunning(false)
            advance()
          }}
          className="flex items-center gap-2 border-2 border-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
        >
          <SkipForward size={13} /> pas à pas
        </button>
        <button
          onClick={() => reset(createGrid(COLS, ROWS))}
          className="flex items-center gap-2 border-2 border-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
        >
          <Trash2 size={13} /> effacer
        </button>
        <button
          onClick={() => reset(randomise(createGrid(COLS, ROWS)))}
          className="flex items-center gap-2 border-2 border-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
        >
          <Shuffle size={13} /> aléatoire
        </button>

        <span className="ml-auto flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <span>
            génération <span className="text-foreground font-bold">{generation}</span>
          </span>
          <span>
            vivantes <span className="text-foreground font-bold">{alive}</span>
          </span>
        </span>
      </div>

      {/* Speed + presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">vitesse</span>
        {SPEEDS.map((s) => (
          <button
            key={s.label}
            onClick={() => setSpeed(s.ms)}
            className={cn(
              "border-2 border-foreground px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors",
              speed === s.ms ? "bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">motifs</span>
        {Object.entries(PATTERNS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => reset(stampCentred(createGrid(COLS, ROWS), p))}
            className="border-2 border-foreground px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* The grid */}
      <div className="border-2 border-foreground overflow-hidden leading-[0]">
        <canvas
          ref={canvasRef}
          className="block touch-none cursor-crosshair"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            lastPainted.current = null
            paint(e)
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) paint(e)
          }}
          onPointerUp={() => {
            lastPainted.current = null
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Clique (ou glisse) sur la grille pour allumer et éteindre des cellules. Les bords se
        rejoignent : ce qui sort à droite revient à gauche.
      </p>
    </div>
  )
}
