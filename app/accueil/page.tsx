// The hub: four counters read from Postgres, then one door per section.
//
// `export const dynamic = "force-dynamic"` is the line to understand here.
// Without it the App Router would prerender this page at build time, as it
// does for "/", and the four counters would be frozen on whatever the database
// said the day the site was built -- forever, and with no error to tell you.
// Opting out is what makes them true at the moment of the request; `pnpm
// build` prints /accueil with an f rather than a circle to confirm it. The
// general question, worth answering deliberately for any page that reads
// anything: is this content a function of the request, or of the build?
//
// Still a Server Component -- no useState, no onClick. <AnimatedCounter>
// carries the directive and does the counting animation.
//
// Caveat worth knowing before you copy this: that component starts at
// `useState(0)`, so the server HTML contains four zeros and the real figures
// only appear once JavaScript runs and the strip scrolls into view. The query
// happens on the server, the number travels as a prop, and the first paint
// still says 0. Nothing is broken, but "rendered on the server" and "visible
// without JavaScript" are not the same claim, and an animated counter is the
// standard way to lose the second one.
//
// getHomeStats() gets all four counts in a single round trip; lib/stats.ts
// says why that matters when a whole class loads the page at once.

import type { Metadata } from "next"
import Link from "next/link"
import {
  Shield,
  Brain,
  Briefcase,
  Cog,
  Route,
  Vote,
  HelpCircle,
  MessageSquare,
  TerminalSquare,
  ArrowRight,
} from "lucide-react"
import { PageShell, PageHeader } from "@/components/site/page-shell"
import { AnimatedCounter } from "@/components/animated-counter"
import { getHomeStats } from "@/lib/stats"

export const metadata: Metadata = {
  title: "Accueil",
  description: "Le hub de l'intervention : cyber, IA, métiers, parcours, vote, quiz, questions et terminal.",
}

export const dynamic = "force-dynamic"

const DOORS = [
  { icon: Shield, cmd: "nmap", label: "Cyber", href: "/cyber", desc: "Attaques, défense, mots de passe et phishing." },
  { icon: Brain, cmd: "ollama", label: "IA", href: "/ia", desc: "Comment fonctionne une IA, ses limites." },
  { icon: Briefcase, cmd: "jobs", label: "Métiers", href: "/metiers", desc: "Les métiers du numérique et de la cyber." },
  { icon: Cog, cmd: "how", label: "Comment ça marche", href: "/comment-ca-marche", desc: "Réseaux, données, du clic au serveur." },
  { icon: Route, cmd: "paths", label: "Parcours", href: "/parcours", desc: "Études et voies après le lycée." },
  { icon: Vote, cmd: "vote", label: "Vote", href: "/vote", desc: "Choisis les sujets de l'intervention." },
  { icon: HelpCircle, cmd: "quiz", label: "Quiz", href: "/quiz", desc: "Teste tes connaissances par thème." },
  { icon: MessageSquare, cmd: "ask", label: "Questions", href: "/questions", desc: "Pose tes questions anonymement." },
  { icon: TerminalSquare, cmd: "ssh", label: "Terminal", href: "/terminal", desc: "Un vrai terminal, en bac à sable." },
]

export default async function AccueilPage() {
  const stats = await getHomeStats()
  const STATS = [
    { label: "Élèves inscrits", value: stats.users, suffix: "" },
    { label: "Votes enregistrés", value: stats.votes, suffix: "" },
    { label: "Quiz terminés", value: stats.quizAttempts, suffix: "" },
    { label: "Questions posées", value: stats.questions, suffix: "" },
  ]

  return (
    <PageShell>
      <PageHeader
        index="HUB / 001"
        command="cd ~"
        title="Bienvenue au hub"
        description="Choisis une porte. Chaque section est indépendante : commence par ce qui t'intéresse le plus."
      />

      {/* Live stats */}
      <section className="w-full px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 border-2 border-foreground">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`p-5 lg:p-6 ${i < STATS.length - 1 ? "border-b-2 lg:border-b-0 lg:border-r-2 border-foreground" : ""} ${i < 2 ? "border-b-2 lg:border-b-0" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 bg-accent animate-blink" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  live
                </span>
              </div>
              <p className="font-pixel text-3xl lg:text-4xl">
                <AnimatedCounter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Doors */}
      <section className="w-full px-6 py-12 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-2 border-foreground">
          {DOORS.map((d) => {
            const Icon = d.icon
            return (
              <Link
                key={d.href}
                href={d.href}
                className="group flex flex-col gap-3 border-b-2 border-r-2 border-foreground p-6 hover:bg-foreground hover:text-background transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Icon size={22} strokeWidth={1.5} />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-accent">
                    {d.cmd}
                  </span>
                </div>
                <h2 className="font-mono text-lg font-bold uppercase tracking-wide">{d.label}</h2>
                <p className="text-xs text-muted-foreground group-hover:text-background/70 leading-relaxed">
                  {d.desc}
                </p>
                <ArrowRight
                  size={16}
                  className="mt-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                />
              </Link>
            )
          })}
        </div>
      </section>
    </PageShell>
  )
}
