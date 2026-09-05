import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageShell } from "@/components/site/page-shell"
import { LandingHero } from "@/components/landing/landing-hero"
import { NAV_ITEMS } from "@/lib/nav"

const ROTATING = [
  "CYBERSECURITE",
  "INTELLIGENCE ARTIFICIELLE",
  "RESEAUX",
  "MOTS DE PASSE",
  "PHISHING",
  "VIE PRIVEE",
  "TERMINAL",
  "METIERS DU NUMERIQUE",
]

export default function Page() {
  return (
    <PageShell>
      <LandingHero />

      {/* Themes marquee */}
      <section className="w-full py-8 border-y-2 border-foreground overflow-hidden">
        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {[...ROTATING, ...ROTATING].map((t, i) => (
            <div key={`${t}-${i}`} className="flex items-center gap-4 px-8 shrink-0">
              <span className="h-1.5 w-1.5 bg-accent" />
              <span className="text-sm font-mono uppercase tracking-[0.15em] whitespace-nowrap">
                {t}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick access grid */}
      <section className="w-full px-6 py-14 lg:px-12">
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
            {"// explorer"}
          </span>
          <div className="flex-1 border-t border-border" />
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
            {NAV_ITEMS.length} sections
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 border-2 border-foreground">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 border-b-2 border-r-2 border-foreground p-5 hover:bg-foreground hover:text-background transition-colors"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent">
                {item.cmd}
              </span>
              <span className="font-mono text-base font-bold uppercase tracking-wide">
                {item.label}
              </span>
              <ArrowRight
                size={16}
                className="mt-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              />
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
