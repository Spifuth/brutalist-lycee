"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ZoomIn, ZoomOut, Crosshair, WifiOff, Wifi } from "lucide-react"
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COOLDOWN_MS,
  PALETTE,
  decodePixels,
  isInBounds,
} from "@/lib/pixelwar"
import { placePixel, myCooldown } from "@/app/actions/pixelwar"
import { connectSse } from "@/lib/sse-client"
import { cn } from "@/lib/utils"

/** 255 means "never painted" — the canvas shows the page background there. */
const EMPTY = 255

const MIN_SCALE = 1
const MAX_SCALE = 24
/** Pointer movement beyond this many pixels is a pan, not a click. */
const DRAG_SLOP = 4

interface Snapshot {
  pixels: number[]
  at: number
  clearedAt: number
}

export function PixelCanvas({ signedIn }: { signedIn: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // The board itself lives in a ref, not in state: it is 90 000 bytes mutated
  // several times a second, and putting it through setState would re-render
  // the whole component on every incoming pixel for no visual gain — the
  // canvas is drawn imperatively anyway.
  const cells = useRef<Uint8Array>(new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(EMPTY))
  const clearedAt = useRef(0)
  const dirty = useRef(true)

  const [color, setColor] = useState(5)
  const [connected, setConnected] = useState(false)
  const [cooldownMs, setCooldownMs] = useState(0)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const view = useRef({ scale: 3, x: 0, y: 0 })
  const [, forceRedraw] = useState(0)

  // ---------------------------------------------------------------- drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const dpr = window.devicePixelRatio || 1
    const w = wrap.clientWidth
    const h = Math.min(Math.round(w * 0.75), 620)
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const style = getComputedStyle(canvas)
    const token = (name: string) => `hsl(${style.getPropertyValue(name).trim()})`

    ctx.fillStyle = token("--muted")
    ctx.fillRect(0, 0, w, h)

    const { scale, x: ox, y: oy } = view.current
    // The board's own background, so painted and unpainted areas are
    // distinguishable from the surrounding page.
    ctx.fillStyle = token("--background")
    ctx.fillRect(ox, oy, CANVAS_WIDTH * scale, CANVAS_HEIGHT * scale)

    // Cache the sixteen resolved colours once per frame rather than calling
    // getComputedStyle up to 90 000 times.
    const colours = PALETTE.map((p) => token(p.cssVar))
    const data = cells.current
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const py = oy + y * scale
      if (py + scale < 0 || py > h) continue
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        const c = data[y * CANVAS_WIDTH + x]
        if (c === EMPTY) continue
        const px = ox + x * scale
        if (px + scale < 0 || px > w) continue
        ctx.fillStyle = colours[c] ?? colours[0]
        ctx.fillRect(px, py, scale, scale)
      }
    }

    // Board outline, so you can tell where the 300×300 ends.
    ctx.strokeStyle = token("--foreground")
    ctx.lineWidth = 2
    ctx.strokeRect(ox - 1, oy - 1, CANVAS_WIDTH * scale + 2, CANVAS_HEIGHT * scale + 2)

    if (hover && scale >= 4) {
      ctx.strokeStyle = token("--foreground")
      ctx.lineWidth = 2
      ctx.strokeRect(ox + hover.x * scale, oy + hover.y * scale, scale, scale)
    }
  }, [hover])

  useEffect(() => {
    let frame = 0
    const loop = () => {
      if (dirty.current) {
        dirty.current = false
        draw()
      }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    const onResize = () => {
      dirty.current = true
    }
    window.addEventListener("resize", onResize)
    // The theme toggle swaps a class on <html>; the board keeps its own fixed
    // palette but its background and outline follow the theme.
    const observer = new MutationObserver(() => {
      dirty.current = true
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
      observer.disconnect()
    }
  }, [draw])

  useEffect(() => {
    dirty.current = true
  }, [hover])

  // ------------------------------------------------------------ apply a tick
  const applySnapshot = useCallback((snap: Snapshot, isFull: boolean) => {
    if (snap.clearedAt > clearedAt.current) {
      // A wipe leaves no rows to report, so it arrives as a moved timestamp.
      clearedAt.current = snap.clearedAt
      cells.current.fill(EMPTY)
    } else if (isFull) {
      clearedAt.current = snap.clearedAt
      cells.current.fill(EMPTY)
    }
    let pixels
    try {
      pixels = decodePixels(snap.pixels)
    } catch {
      // A malformed frame is dropped whole rather than half-applied: half a
      // frame is a smeared canvas that looks like someone painted it.
      return
    }
    for (const p of pixels) cells.current[p.y * CANVAS_WIDTH + p.x] = p.color
    dirty.current = true
  }, [])

  // ------------------------------------------------------------------ stream
  // Supervised rather than a bare EventSource: the browser abandons a stream
  // for good on a non-200 (Traefik's 502 during a recreate), and a stream can
  // also go quiet without reporting anything at all. Either way this badge
  // used to read "hors ligne" until the student reloaded. See lib/sse-client.
  useEffect(() => {
    const connection = connectSse("/api/pixelwar/stream", {
      on: {
        full: (data) => {
          applySnapshot(JSON.parse(data) as Snapshot, true)
          centreOnContent()
        },
        tick: (data) => applySnapshot(JSON.parse(data) as Snapshot, false),
      },
      onStatus: setConnected,
    })
    return () => connection.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySnapshot])

  useEffect(() => {
    if (!signedIn) return
    myCooldown()
      .then(setCooldownMs)
      .catch(() => {})
  }, [signedIn])

  useEffect(() => {
    if (cooldownMs <= 0) return
    const id = setInterval(() => setCooldownMs((ms) => Math.max(0, ms - 250)), 250)
    return () => clearInterval(id)
  }, [cooldownMs])

  // --------------------------------------------------------------- framing
  const centreOnContent = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const w = wrap.clientWidth
    const h = Math.min(Math.round(w * 0.75), 620)
    const data = cells.current
    let minX = CANVAS_WIDTH
    let minY = CANVAS_HEIGHT
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      for (let x = 0; x < CANVAS_WIDTH; x++) {
        if (data[y * CANVAS_WIDTH + x] === EMPTY) continue
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
    // 300 × 300 is 90 000 cells and a class paints a few hundred. Opening on
    // the whole board would show specks; open on what has actually been drawn.
    if (maxX < 0) {
      minX = CANVAS_WIDTH / 2 - 25
      maxX = CANVAS_WIDTH / 2 + 25
      minY = CANVAS_HEIGHT / 2 - 25
      maxY = CANVAS_HEIGHT / 2 + 25
    }
    const pad = 12
    const bw = maxX - minX + 1 + pad * 2
    const bh = maxY - minY + 1 + pad * 2
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(w / bw, h / bh)))
    view.current = {
      scale,
      x: w / 2 - ((minX + maxX) / 2 + 0.5) * scale,
      y: h / 2 - ((minY + maxY) / 2 + 0.5) * scale,
    }
    dirty.current = true
    forceRedraw((n) => n + 1)
  }, [])

  const zoomBy = (factor: number) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const w = wrap.clientWidth
    const h = Math.min(Math.round(w * 0.75), 620)
    const v = view.current
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor))
    // Keep the centre of the viewport fixed while zooming.
    const cx = (w / 2 - v.x) / v.scale
    const cy = (h / 2 - v.y) / v.scale
    view.current = { scale: next, x: w / 2 - cx * next, y: h / 2 - cy * next }
    dirty.current = true
    forceRedraw((n) => n + 1)
  }

  // --------------------------------------------------------------- pointer
  const drag = useRef<{ id: number; startX: number; startY: number; moved: boolean } | null>(null)

  const cellAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const v = view.current
    const x = Math.floor((clientX - rect.left - v.x) / v.scale)
    const y = Math.floor((clientY - rect.top - v.y) / v.scale)
    return isInBounds(x, y) ? { x, y } : null
  }

  const paint = async (x: number, y: number) => {
    setError(null)
    // Optimistic: the pixel appears at once and the tick confirms it. If the
    // server refuses, the next tick paints the truth back over it.
    const previous = cells.current[y * CANVAS_WIDTH + x]
    cells.current[y * CANVAS_WIDTH + x] = color
    dirty.current = true
    setCooldownMs(COOLDOWN_MS)
    const res = await placePixel(x, y, color)
    if (!res.ok) {
      cells.current[y * CANVAS_WIDTH + x] = previous
      dirty.current = true
      setCooldownMs(res.cooldownMs)
      setError(res.error ?? "Impossible de poser ce pixel.")
    }
  }

  const ready = signedIn && cooldownMs <= 0

  return (
    <div className="flex flex-col gap-3">
      {/* Palette */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap border-2 border-foreground">
          {PALETTE.map((p, i) => (
            <button
              key={p.cssVar}
              onClick={() => setColor(i)}
              title={p.label}
              aria-label={p.label}
              aria-pressed={color === i}
              className={cn(
                "h-8 w-8 border-r-2 border-foreground last:border-r-0",
                color === i && "outline outline-2 -outline-offset-4 outline-foreground",
              )}
              style={{ backgroundColor: `hsl(var(${p.cssVar}))` }}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {PALETTE[color].label}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => zoomBy(1 / 1.4)}
            aria-label="Dézoomer"
            className="border-2 border-foreground p-2 hover:bg-muted transition-colors"
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={() => zoomBy(1.4)}
            aria-label="Zoomer"
            className="border-2 border-foreground p-2 hover:bg-muted transition-colors"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={centreOnContent}
            aria-label="Recentrer"
            className="border-2 border-foreground p-2 hover:bg-muted transition-colors"
          >
            <Crosshair size={13} />
          </button>
          <span
            className={cn(
              "flex items-center gap-2 border-2 px-3 py-2 text-[10px] font-mono uppercase tracking-widest",
              connected ? "border-accent text-accent" : "border-foreground",
            )}
          >
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "en direct" : "hors ligne"}
          </span>
        </div>
      </div>

      {/* Board */}
      <div ref={wrapRef} className="border-2 border-foreground leading-[0]">
        <canvas
          ref={canvasRef}
          className={cn("block touch-none", ready ? "cursor-crosshair" : "cursor-grab")}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false }
          }}
          onPointerMove={(e) => {
            const at = cellAt(e.clientX, e.clientY)
            setHover(at)
            const d = drag.current
            if (!d || d.id !== e.pointerId) return
            if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > DRAG_SLOP) {
              d.moved = true
            }
            if (d.moved) {
              view.current.x += e.movementX
              view.current.y += e.movementY
              dirty.current = true
            }
          }}
          onPointerUp={(e) => {
            const d = drag.current
            drag.current = null
            // A drag pans, a tap paints. Without the slop threshold every pan
            // would end by dropping a pixel wherever the finger stopped.
            if (!d || d.moved || !ready) return
            const at = cellAt(e.clientX, e.clientY)
            if (at) void paint(at.x, at.y)
          }}
          onPointerLeave={() => setHover(null)}
        />
      </div>

      {/* Status */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
        <span className="text-muted-foreground">
          {hover ? `x ${hover.x} · y ${hover.y}` : `grille ${CANVAS_WIDTH} × ${CANVAS_HEIGHT}`}
        </span>
        {!signedIn ? (
          <span className="text-muted-foreground">
            connecte-toi pour poser des pixels — la toile reste visible sans compte
          </span>
        ) : cooldownMs > 0 ? (
          <span className="text-accent font-bold">
            prochain pixel dans {(cooldownMs / 1000).toFixed(1)} s
          </span>
        ) : (
          <span className="text-accent font-bold">à toi de jouer</span>
        )}
        {error && <span className="text-destructive">{error}</span>}
        <span className="ml-auto text-muted-foreground">glisse pour te déplacer, clique pour poser</span>
      </div>
    </div>
  )
}
