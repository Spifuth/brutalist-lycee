"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronRight, Wifi, WifiOff, Info } from "lucide-react"
import "@xterm/xterm/css/xterm.css"
import { SimShell } from "@/lib/sim-shell"
import { cn } from "@/lib/utils"

type Mode = "connecting" | "gateway" | "sim"

const WS_URL = process.env.NEXT_PUBLIC_TERMINAL_WS_URL

export function TerminalPlayground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>("connecting")
  const [showProtocol, setShowProtocol] = useState(false)

  useEffect(() => {
    let disposed = false
    let cleanup = () => {}

    ;(async () => {
      const { Terminal } = await import("@xterm/xterm")
      const { FitAddon } = await import("@xterm/addon-fit")
      if (disposed || !containerRef.current) return

      const term = new Terminal({
        fontFamily: "var(--font-mono), monospace",
        fontSize: 13,
        cursorBlink: true,
        theme: {
          background: "#111111",
          foreground: "#f2f1ea",
          cursor: "#ea580c",
          selectionBackground: "#ea580c66",
        },
        convertEol: true,
      })
      const fit = new FitAddon()
      term.loadAddon(fit)
      term.open(containerRef.current)

      const safeFit = () => {
        try {
          fit.fit()
        } catch {
          /* container not measured yet — ignore */
        }
      }
      // Defer initial fit until the container has resolved layout dimensions.
      requestAnimationFrame(safeFit)

      const onResize = () => safeFit()
      window.addEventListener("resize", onResize)

      const banner = (extra: string) => {
        term.writeln("\x1b[38;5;208mLYCEE.SIN — terminal\x1b[0m")
        term.writeln(extra)
        term.writeln("")
      }

      if (WS_URL) {
        // --- Gateway mode over WebSocket ---
        setMode("gateway")
        banner("mode: passerelle conteneur (WebSocket)")
        const ws = new WebSocket(WS_URL)

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "hello", cols: term.cols, rows: term.rows }))
        }
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            if (msg.type === "output") term.write(msg.data)
            else if (msg.type === "ready") term.writeln("\x1b[38;5;208m[pret]\x1b[0m")
            else if (msg.type === "exit") term.writeln(`\r\n[session terminee: code ${msg.code}]`)
            else if (msg.type === "error") term.writeln(`\r\n\x1b[31m[erreur] ${msg.message}\x1b[0m`)
          } catch {
            term.write(ev.data)
          }
        }
        ws.onerror = () => term.writeln("\r\n\x1b[31m[connexion impossible a la passerelle]\x1b[0m")
        ws.onclose = () => term.writeln("\r\n[deconnecte]")

        const dataDisp = term.onData((d) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "input", data: d }))
        })
        const resizeDisp = term.onResize(({ cols, rows }) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "resize", cols, rows }))
        })

        cleanup = () => {
          dataDisp.dispose()
          resizeDisp.dispose()
          ws.close()
          window.removeEventListener("resize", onResize)
          term.dispose()
        }
      } else {
        // --- Simulated in-browser fallback ---
        setMode("sim")
        banner("mode: bac a sable local (aucune connexion) — tape `help`")
        const shell = new SimShell()
        let buffer = ""

        const writePrompt = () => term.write(`\x1b[38;5;208m${shell.prompt}\x1b[0m`)
        writePrompt()

        const dataDisp = term.onData((d) => {
          const code = d.charCodeAt(0)
          if (d === "\r") {
            term.write("\r\n")
            const out = shell.run(buffer)
            buffer = ""
            if (out[0] === "\u0000CLEAR") {
              term.clear()
            } else {
              for (const l of out) term.writeln(l)
            }
            writePrompt()
          } else if (code === 127) {
            // backspace
            if (buffer.length > 0) {
              buffer = buffer.slice(0, -1)
              term.write("\b \b")
            }
          } else if (code === 3) {
            // Ctrl-C
            term.write("^C\r\n")
            buffer = ""
            writePrompt()
          } else if (code >= 32) {
            buffer += d
            term.write(d)
          }
        })

        cleanup = () => {
          dataDisp.dispose()
          window.removeEventListener("resize", onResize)
          term.dispose()
        }
      }
    })()

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return (
    <div className="max-w-4xl">
      {/* Mode badge + hints */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span
          className={cn(
            "flex items-center gap-2 border-2 border-foreground px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest",
            mode === "gateway" && "bg-accent text-accent-foreground border-accent",
          )}
        >
          {mode === "gateway" ? <Wifi size={12} /> : <WifiOff size={12} />}
          {mode === "connecting" ? "initialisation…" : mode === "gateway" ? "passerelle conteneur" : "bac à sable local"}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          essaie : <span className="text-foreground">ls</span> ·{" "}
          <span className="text-foreground">cat bienvenue.txt</span> ·{" "}
          <span className="text-foreground">cd projets</span> ·{" "}
          <span className="text-foreground">{"node -e 'console.log(2+2)'"}</span>
        </span>
      </div>

      {/* Terminal surface */}
      <div className="border-2 border-foreground">
        <div className="flex items-center gap-2 border-b-2 border-foreground bg-foreground px-4 py-2">
          <span className="h-2 w-2 bg-accent" />
          <span className="h-2 w-2 bg-background/60" />
          <span className="h-2 w-2 border border-background/60" />
          <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-background/60">
            tty — {mode === "gateway" ? "ssh" : "sandbox"}
          </span>
        </div>
        {/* Padding lives on this wrapper so the element FitAddon measures has none —
            prevents the canvas from overflowing past the bottom border. */}
        <div className="bg-[#111111] p-2 overflow-hidden">
          <div ref={containerRef} className="h-[416px]" />
        </div>
      </div>

      {/* Collapsible protocol docs */}
      <div className="border-2 border-foreground mt-4">
        <button
          onClick={() => setShowProtocol((s) => !s)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted transition-colors"
          aria-expanded={showProtocol}
        >
          <ChevronRight size={14} className={cn("text-accent transition-transform", showProtocol && "rotate-90")} />
          <Info size={13} />
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
            Protocole WebSocket de la passerelle
          </span>
        </button>
        {showProtocol && (
          <div className="border-t-2 border-foreground p-4 text-xs font-mono leading-relaxed">
            <p className="text-muted-foreground mb-3">
              Définis <span className="text-foreground">NEXT_PUBLIC_TERMINAL_WS_URL</span> pour
              connecter le terminal à une passerelle qui donne à chaque élève un conteneur jetable.
              Messages échangés (JSON) :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border-2 border-border p-3">
                <p className="text-accent uppercase tracking-widest text-[10px] mb-2">client → serveur</p>
                <ul className="flex flex-col gap-1 text-[11px]">
                  <li>{'{ type: "hello", cols, rows }'}</li>
                  <li>{'{ type: "input", data }'}</li>
                  <li>{'{ type: "resize", cols, rows }'}</li>
                </ul>
              </div>
              <div className="border-2 border-border p-3">
                <p className="text-accent uppercase tracking-widest text-[10px] mb-2">serveur → client</p>
                <ul className="flex flex-col gap-1 text-[11px]">
                  <li>{'{ type: "ready" }'}</li>
                  <li>{'{ type: "output", data }'}</li>
                  <li>{'{ type: "exit", code }'}</li>
                  <li>{'{ type: "error", message }'}</li>
                </ul>
              </div>
            </div>
            <p className="text-muted-foreground mt-3">
              Le dossier <span className="text-foreground">gateway/</span> contient une
              implémentation de référence (Docker, limites de ressources, /health, /sessions).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
