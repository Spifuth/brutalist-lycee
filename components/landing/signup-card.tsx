"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, Copy, Check, ArrowRight, LogIn } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { SurveyPicker } from "@/components/survey/survey-picker"

type Phase = "form" | "login" | "passphrase" | "survey" | "done"

export function SignupCard() {
  const { user, ready, signUp, login, lastPassphrase } = useAuth()
  const [pseudo, setPseudo] = useState("")
  const [loginPseudo, setLoginPseudo] = useState("")
  const [loginPass, setLoginPass] = useState("")
  const [phase, setPhase] = useState<Phase>("form")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pseudo.trim() || busy) return
    setBusy(true)
    setError("")
    const res = await signUp({ pseudo })
    setBusy(false)
    if (res.ok) setPhase("passphrase")
    else setError(res.error)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    const res = await login({ pseudo: loginPseudo, passphrase: loginPass })
    setBusy(false)
    if (res.ok) setPhase("done")
    else setError(res.error)
  }

  const copyPass = async () => {
    if (!lastPassphrase) return
    try {
      await navigator.clipboard.writeText(lastPassphrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="border-2 border-foreground bg-background w-full max-w-md">
      <div className="flex items-center gap-2 border-b-2 border-foreground bg-muted px-4 py-2">
        <Terminal size={13} className="text-accent" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {phase === "login" ? "login --pseudo" : phase === "form" ? "create_identity" : "identity"}
        </span>
        <span className="ml-auto h-2 w-2 bg-accent animate-blink" />
      </div>

      <div className="p-6">
        {error && (
          <p className="mb-4 border-2 border-destructive bg-destructive/10 px-3 py-2 text-xs font-mono text-destructive">
            {error}
          </p>
        )}
        <AnimatePresence mode="wait">
          {ready && user && phase === "form" ? (
            <motion.div key="existing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">
                {"// session active"}
              </p>
              <h2 className="font-mono text-lg font-bold mb-1">Bonjour {user.pseudo}</h2>
              <p className="text-xs text-muted-foreground mb-5">
                Ton identité est enregistrée. Reprends là où tu t&apos;étais arrêté·e.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setPhase("survey")}
                  className="flex items-center justify-between bg-foreground text-background px-4 py-3 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Compléter les questionnaires <ArrowRight size={14} />
                </button>
                <Link
                  href="/accueil"
                  className="flex items-center justify-between border-2 border-foreground px-4 py-3 text-xs font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Entrer sur le site <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ) : phase === "form" ? (
            <motion.form key="form" onSubmit={handleSignup} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">
                {"// choisis un pseudo unique"}
              </p>
              <h2 className="font-mono text-lg font-bold mb-1">Crée ton identité</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Une phrase de passe de 4 mots te sera donnée pour te reconnecter depuis n&apos;importe quel appareil.
              </p>
              <label htmlFor="pseudo" className="sr-only">Pseudo</label>
              <div className="flex items-center border-2 border-foreground mb-4">
                <span className="px-3 text-accent font-mono text-sm select-none">{">"}</span>
                <input
                  id="pseudo"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="ex: nova_42"
                  maxLength={24}
                  className="flex-1 bg-transparent py-3 pr-3 text-sm font-mono outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="submit"
                disabled={!pseudo.trim() || busy}
                className="flex w-full items-center justify-between bg-foreground text-background px-4 py-3 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {busy ? "Création…" : "Générer mon identité"} <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("")
                  setPhase("login")
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
              >
                <LogIn size={12} /> J&apos;ai déjà un compte
              </button>
            </motion.form>
          ) : phase === "login" ? (
            <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">
                {"// reconnecte-toi"}
              </p>
              <h2 className="font-mono text-lg font-bold mb-1">Connexion</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Entre ton pseudo et ta phrase de passe de 4 mots.
              </p>
              <label htmlFor="loginPseudo" className="sr-only">Pseudo</label>
              <div className="flex items-center border-2 border-foreground mb-3">
                <span className="px-3 text-accent font-mono text-sm select-none">{">"}</span>
                <input
                  id="loginPseudo"
                  value={loginPseudo}
                  onChange={(e) => setLoginPseudo(e.target.value)}
                  placeholder="pseudo"
                  maxLength={24}
                  className="flex-1 bg-transparent py-3 pr-3 text-sm font-mono outline-none placeholder:text-muted-foreground"
                />
              </div>
              <label htmlFor="loginPass" className="sr-only">Phrase de passe</label>
              <div className="flex items-center border-2 border-foreground mb-4">
                <span className="px-3 text-accent font-mono text-sm select-none">{"#"}</span>
                <input
                  id="loginPass"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="mot-mot-mot-mot"
                  className="flex-1 bg-transparent py-3 pr-3 text-sm font-mono outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-between bg-foreground text-background px-4 py-3 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-40"
              >
                {busy ? "Connexion…" : "Se connecter"} <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("")
                  setPhase("form")
                }}
                className="mt-3 flex w-full items-center justify-center text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
              >
                Créer une identité à la place
              </button>
            </motion.form>
          ) : phase === "passphrase" && user ? (
            <motion.div key="pass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">
                {"// note ta phrase de passe"}
              </p>
              <h2 className="font-mono text-lg font-bold mb-1">Identité créée : {user.pseudo}</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Voici ta phrase de passe. Note-la : elle te permet de retrouver ton profil depuis
                n&apos;importe quel appareil. Elle ne sera plus affichée.
              </p>
              <div className="flex items-center justify-between gap-2 border-2 border-foreground bg-foreground text-background px-4 py-3 mb-4">
                <code className="text-sm font-mono tracking-wide break-all">{lastPassphrase}</code>
                <button
                  onClick={copyPass}
                  aria-label="Copier la phrase de passe"
                  className="shrink-0 text-background/70 hover:text-accent transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <button
                onClick={() => setPhase("survey")}
                className="flex w-full items-center justify-between bg-foreground text-background px-4 py-3 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Continuer <ArrowRight size={14} />
              </button>
            </motion.div>
          ) : phase === "survey" ? (
            <motion.div key="survey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SurveyPicker
                completed={[]}
                onComplete={() => setPhase("done")}
                onSkip={() => setPhase("done")}
              />
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-accent mb-2">{"// pret"}</p>
              <h2 className="font-mono text-lg font-bold mb-1">Tout est prêt</h2>
              <p className="text-xs text-muted-foreground mb-5">
                Explore le site, vote pour les sujets, teste les quiz, le terminal… et pars à la chasse
                aux secrets cachés pour grimper dans le classement.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/accueil"
                  className="flex items-center justify-between bg-foreground text-background px-4 py-3 text-xs font-mono uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Entrer sur le site <ArrowRight size={14} />
                </Link>
                <Link
                  href="/profil"
                  className="flex items-center justify-between border-2 border-foreground px-4 py-3 text-xs font-mono uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Voir mon profil <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
