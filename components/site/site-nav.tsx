"use client"

// The top bar, on every ordinary page: the same links as a row on desktop and
// as a grid drawer on phones.
//
// The entries are not written here. They come from NAV_ITEMS in lib/nav.ts,
// and that matters more than it looks, because this file alone renders them
// twice -- the desktop row and the mobile drawer -- and app/page.tsx builds
// its index from the same list while site-footer.tsx next door reads the
// sitemap from the same module. Hard-code a <Link> into any one of them and
// the day a page is renamed you will fix the copies you can see, and the
// mobile drawer will 404 for weeks, because nobody working on a laptop ever
// opens it.
//
// "Which entry is the current one" is derived from `usePathname()`, and the
// matching rule is the interesting bit: prefix, not equality, so an article
// at /docs/reseaux/... still lights up "Docs". Prefix matching has a known
// price -- it also lights up a sibling that merely starts the same way, and
// /quiz-live lights up the /quiz entry today. Exact match is the escape
// hatch, used here for /accueil.
//
// Worth knowing for whoever edits this next: the three other <nav> elements
// on a docs page (breadcrumbs, sidebar, table of contents) each carry an
// aria-label and this one does not, so a screen reader reads the most
// important nav on the site as plain "navigation".

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Cpu, Menu, X } from "lucide-react"
import { NAV_ITEMS } from "@/lib/nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    href === "/accueil" ? pathname === "/accueil" : pathname.startsWith(href)

  return (
    <div className="w-full px-4 pt-4 lg:px-6 lg:pt-6">
      <nav className="w-full border-2 border-foreground bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Cpu size={16} strokeWidth={1.5} />
            <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">
              LYCEE.SIN
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex flex-col leading-none text-[10px] font-mono uppercase tracking-widest transition-colors",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="text-accent">{item.cmd}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="xl:hidden flex h-8 w-8 items-center justify-center border-2 border-foreground"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="xl:hidden border-t-2 border-foreground grid grid-cols-2 sm:grid-cols-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex flex-col gap-0.5 border-b border-r border-border px-4 py-3 text-[11px] font-mono uppercase tracking-widest",
                  isActive(item.href) ? "bg-foreground text-background" : "hover:bg-muted",
                )}
              >
                <span className={cn(isActive(item.href) ? "text-background/70" : "text-accent")}>
                  {item.cmd}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  )
}
