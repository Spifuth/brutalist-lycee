"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pause, Play, Radio, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// SWAP POINT: incoming questions + rising reaction counts are simulated on a
// timer. A real version would receive these over SSE from a moderator console.

const REACTIONS = ["👍", "❤️", "😮", "🤔", "🔥"] as const
type Reaction = (typeof REACTIONS)[number]

interface LiveItem {
  id: string
  text: string
  reactions: Record<Reaction, number>
  handled: boolean
  at: number
}

const INCOMING_POOL = [
  "Est-ce qu'un antivirus suffit pour être protégé ?",
  "Comment les mots de passe sont-ils stockés par les sites ?",
  "Pourquoi on dit qu'il ne faut pas utiliser le même mot de passe partout ?",
  "Est-ce que le mode navigation privée cache vraiment tout ?",
  "Comment fonctionne un VPN, concrètement ?",
  "Une IA peut-elle deviner mon mot de passe ?",
  "C'est quoi un ransomware exactement ?",
  "Pourquoi mon téléphone chauffe quand j'utilise certaines applis ?",
  "Est-ce dangereux de se connecter au Wi-Fi du lycée ?",
  "Comment repérer une fausse boutique en ligne ?",
  "Les cookies, c'est vraiment un problème ?",
  "Peut-on supprimer définitivement une photo publiée ?",
]

function emptyReactions(): Record<Reaction, number> {
  return { "👍": 0, "❤️": 0, "😮": 0, "🤔": 0, "🔥": 0 }
}

function seedItem(text: string, ageMs: number): LiveItem {
  const r = emptyReactions()
  for (const k of REACTIONS) r[k] = Math.floor(Math.random() * 8)
  return { id: `live-${Math.random().toString(36).slice(2)}`, text, reactions: r, handled: false, at: Date.now() - ageMs }
}

export function LiveQuestions() {
  const [items, setItems] = useState<LiveItem[]>([])
  const [paused, setPaused] = useState(false)
  const poolRef = useRef(0)

  // Seed a few items on mount.
  useEffect(() => {
    setItems([
      seedItem(INCOMING_POOL[0], 1000 * 60 * 4),
      seedItem(INCOMING_POOL[1], 1000 * 60 * 2),
      seedItem(INCOMING_POOL[2], 1000 * 30),
    ])
    poolRef.current = 3
  }, [])

  // Simulated feed: new items + rising reaction counts.
  useEffect(() => {
    if (paused) return

    const addInterval = setInterval(() => {
      const next = INCOMING_POOL[poolRef.current % INCOMING_POOL.length]
      poolRef.current += 1
      setItems((prev) => [seedItem(next, 0), ...prev].slice(0, 40))
    }, 4500)

    const riseInterval = setInterval(() => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.handled || Math.random() > 0.5) return it
          const key = REACTIONS[Math.floor(Math.random() * REACTIONS.length)]
          return { ...it, reactions: { ...it.reactions, [key]: it.reactions[key] + 1 } }
        }),
      )
    }, 1200)

    return () => {
      clearInterval(addInterval)
      clearInterval(riseInterval)
    }
  }, [paused])

  const react = (id: string, key: Reaction) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, reactions: { ...it.reactions, [key]: it.reactions[key] + 1 } } : it)),
    )

  const toggleHandled = (id: string) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, handled: !it.handled } : it)))

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
          onClick={() => setPaused((p) => !p)}
          className="flex items-center gap-1.5 border-2 border-background px-3 py-1 text-[10px] font-mono uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors"
        >
          {paused ? <Play size={11} /> : <Pause size={11} />}
          {paused ? "Reprendre" : "Pause"}
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li
              key={it.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={cn("border-2 border-foreground", it.handled && "opacity-60")}
            >
              <div className="flex items-start justify-between gap-3 p-4">
                <p className="text-sm leading-relaxed flex-1">{it.text}</p>
                <button
                  onClick={() => toggleHandled(it.id)}
                  className={cn(
                    "flex items-center gap-1 shrink-0 text-[9px] font-mono uppercase tracking-widest px-2 py-1 border-2 border-foreground transition-colors",
                    it.handled ? "bg-accent text-accent-foreground border-accent" : "hover:bg-muted",
                  )}
                >
                  <Check size={10} /> {it.handled ? "traitée" : "marquer"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 border-t-2 border-foreground p-2">
                {REACTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => react(it.id, r)}
                    className="flex items-center gap-1 border-2 border-border px-2 py-1 text-xs hover:border-foreground hover:bg-muted transition-colors"
                    aria-label={`Réagir ${r}`}
                  >
                    <span aria-hidden>{r}</span>
                    <span className="font-mono text-[11px] tabular-nums">{it.reactions[r]}</span>
                  </button>
                ))}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
