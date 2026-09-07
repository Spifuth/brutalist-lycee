"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { redeemSecret, getMySecrets } from "@/app/actions/engage"

const BANNER = String.raw`
 _      _     ______ _____ _____   _____ _____ _   _
| |    | |   |  ____/ ____|  ___| / ____|_   _| \ | |
| |    | |   | |__ | |    | |__  | (___   | | |  \| |
| |    | |   |  __|| |    |  __|  \___ \  | | | . \` |
| |____| |___| |___| |____| |____ ____) |_| |_| |\  |
|______|______|______\_____|______|_____/|_____|_| \_|
`

const HELP = [
  "commandes disponibles :",
  "  help            afficher cette aide",
  "  ls              lister les fichiers",
  "  cat indice.txt  lire l'indice",
  "  unlock <code>   déverrouiller la zone secrète",
  "  whoami          afficher ton pseudo",
  "  clear           nettoyer l'écran",
  "  exit            retour à l'accueil",
]

const UNLOCK_CODE = "root-access"

type Line = { text: string; tone?: "accent" | "muted" | "err" }

export default function SecretPage() {
  const [lines, setLines] = useState<Line[]>([
    { text: BANNER, tone: "accent" },
    { text: "zone restreinte // tape `help` pour commencer", tone: "muted" },
  ])
  const [input, setInput] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    getMySecrets().then((s) => {
      if (s.names.includes("La page secrète")) setUnlocked(true)
    })
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [lines])

  const push = (...newLines: Line[]) => setLines((l) => [...l, ...newLines])

  const run = (raw: string) => {
    const cmd = raw.trim()
    push({ text: `$ ${cmd}`, tone: "muted" })
    const [name, ...args] = cmd.split(/\s+/)

    switch (name) {
      case "":
        break
      case "help":
        push(...HELP.map((t) => ({ text: t })))
        break
      case "ls":
        push({ text: "indice.txt  .lock  banner.txt" })
        break
      case "cat":
        if (args[0] === "indice.txt") {
          push({ text: "Le code est ce que tout hacker veut obtenir, séparé par un tiret." })
          push({ text: "Indice : r___-a_____ (accès total).", tone: "muted" })
        } else {
          push({ text: `cat: ${args[0] ?? ""}: fichier introuvable`, tone: "err" })
        }
        break
      case "whoami":
        push({ text: user?.pseudo ?? "anonyme (connecte-toi pour enregistrer ta trouvaille)" })
        break
      case "unlock":
        if (args[0]?.toLowerCase() === UNLOCK_CODE) {
          if (!user) {
            push({ text: ">>> ACCÈS ACCORDÉ <<<", tone: "accent" })
            push({ text: "Connecte-toi pour enregistrer ce secret et gagner des points.", tone: "muted" })
            setUnlocked(true)
            break
          }
          redeemSecret("SIN-PROF").then((res) => {
            setUnlocked(true)
            if (res.ok) {
              push({ text: ">>> ACCÈS ACCORDÉ <<<", tone: "accent" })
              push({ text: `Secret « ${res.name} » validé : +${res.points} pts.`, tone: "accent" })
            } else {
              push({ text: ">>> ACCÈS ACCORDÉ <<<", tone: "accent" })
              push({ text: res.error ?? "", tone: "muted" })
            }
          })
        } else {
          push({ text: `unlock: code invalide : ${args[0] ?? "(vide)"}`, tone: "err" })
        }
        break
      // Deliberately absent from HELP: the way to learn about `life` is the
      // hidden ~/.vie file in the /terminal sandbox, not a list on this page.
      case "life":
        push({ text: "ouverture de /vie — le jeu de la vie de Conway…", tone: "accent" })
        router.push("/vie")
        break
      case "clear":
        setLines([])
        break
      case "exit":
        window.location.href = "/accueil"
        break
      default:
        push({ text: `commande inconnue : ${name} — tape \`help\``, tone: "err" })
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    run(input)
    setInput("")
  }

  return (
    <div className="min-h-screen bg-foreground text-background font-mono p-4 lg:p-8" onClick={() => inputRef.current?.focus()}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-widest text-background/60">/secret — tty1</span>
          <Link href="/accueil" className="text-[10px] uppercase tracking-widest text-accent hover:underline">
            exit
          </Link>
        </div>

        <div className="text-xs leading-relaxed">
          {lines.map((l, i) => (
            <pre
              key={i}
              className={
                l.tone === "accent"
                  ? "text-accent whitespace-pre-wrap"
                  : l.tone === "muted"
                    ? "text-background/50 whitespace-pre-wrap"
                    : l.tone === "err"
                      ? "text-destructive whitespace-pre-wrap"
                      : "text-background whitespace-pre-wrap"
              }
            >
              {l.text}
            </pre>
          ))}
          {unlocked && (
            <pre className="text-accent whitespace-pre-wrap mt-2">
              {"[ zone secrète ] Tu fais désormais partie des initié·es. Reviens quand tu veux."}
            </pre>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="flex items-center gap-2 mt-2 text-xs">
          <span className="text-accent">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent outline-none text-background caret-accent"
            aria-label="Entrée de commande"
          />
        </form>
      </div>
    </div>
  )
}
