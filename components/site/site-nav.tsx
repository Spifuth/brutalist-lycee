"use client"

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
