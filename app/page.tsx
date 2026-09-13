// The landing page: the hero, a scrolling band of themes, and one tile per
// section of the site.
//
// A Server Component, and the build agrees: `pnpm build` prints "/" with a
// circle, meaning this HTML was produced once at build time and is served as a
// file. Nothing here reads the database, so nothing forces a rebuild per
// request. The rule that comes with that default is the one to remember: this
// file cannot use useState, useEffect or an onClick. The animated hero next
// door (components/landing/landing-hero.tsx) is a separate file carrying
// "use client" for exactly that reason, and the page stays static around it.
//
// The marquee is worth stealing. The list is rendered twice --
// `[...ROTATING, ...ROTATING]` -- and the keyframes in app/globals.css
// translate the strip by exactly -50%. Half of a doubled list is the original
// list, so at the instant the animation loops, the frame it jumps back to is
// identical to the frame it just left and the seam is invisible. That is the
// whole trick behind every seamless CSS marquee, whatever the content:
// duplicate, then move by 50%.
//
// The tiles are built from NAV_ITEMS (lib/nav.ts), the same list the top bar
// reads, so the count printed above the grid and the grid itself cannot drift
// apart. components/site/site-nav.tsx explains what that single source buys.

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
