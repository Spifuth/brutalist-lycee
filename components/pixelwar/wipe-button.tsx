"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { clearCanvas } from "@/app/actions/pixelwar"

/**
 * The operator's escape hatch. Two clicks on purpose: it deletes every pixel
 * the class placed, and there is no undo.
 */
export function WipeButton() {
  const [arming, setArming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  if (!arming) {
    return (
      <button
        onClick={() => setArming(true)}
        className="flex items-center gap-2 border-2 border-destructive px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-destructive hover:bg-muted transition-colors"
      >
        <Trash2 size={13} /> effacer la toile
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-mono uppercase tracking-widest text-destructive">
        tout effacer ? c&apos;est définitif
      </span>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          const res = await clearCanvas()
          setBusy(false)
          setArming(false)
          setResult(`${res.cleared} pixels effacés`)
        }}
        className="border-2 border-destructive bg-destructive px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-background disabled:opacity-50"
      >
        {busy ? "…" : "oui, effacer"}
      </button>
      <button
        onClick={() => setArming(false)}
        className="border-2 border-foreground px-4 py-2 text-[11px] font-mono uppercase tracking-widest hover:bg-muted transition-colors"
      >
        annuler
      </button>
      {result && <span className="text-[11px] font-mono text-muted-foreground">{result}</span>}
    </div>
  )
}
