"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Menu, X, BookText } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SidebarSubject {
  slug: string
  title: string
  articles: { slug: string; title: string }[]
}

export function DocsSidebar({ subjects }: { subjects: SidebarSubject[] }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen((o) => !o)}
        className="lg:hidden flex items-center gap-2 border-2 border-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest mb-4"
      >
        {mobileOpen ? <X size={14} /> : <Menu size={14} />} Sommaire
      </button>

      <nav
        className={cn(
          "lg:block border-2 border-foreground lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto",
          mobileOpen ? "block mb-4" : "hidden",
        )}
        aria-label="Sommaire de la documentation"
      >
        <div className="flex items-center gap-2 border-b-2 border-foreground bg-foreground text-background px-4 py-2.5">
          <BookText size={14} className="text-accent" />
          <span className="text-[10px] font-mono uppercase tracking-widest">docs / index</span>
        </div>
        <ul className="divide-y-2 divide-border">
          {subjects.map((subject) => {
            const subjectActive = pathname.startsWith(`/docs/${subject.slug}`)
            return (
              <li key={subject.slug}>
                <SubjectGroup subject={subject} defaultOpen={subjectActive} pathname={pathname} />
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

function SubjectGroup({
  subject,
  defaultOpen,
  pathname,
}: {
  subject: SidebarSubject
  defaultOpen: boolean
  pathname: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-muted transition-colors"
        aria-expanded={open}
      >
        <ChevronRight size={13} className={cn("transition-transform text-accent", open && "rotate-90")} />
        <span className="text-xs font-mono font-bold uppercase tracking-wide flex-1">{subject.title}</span>
        <span className="text-[9px] font-mono text-muted-foreground">{subject.articles.length}</span>
      </button>
      {open && (
        <ul className="pb-1">
          {subject.articles.map((a) => {
            const href = `/docs/${subject.slug}/${a.slug}`
            const active = pathname === href
            return (
              <li key={a.slug}>
                <Link
                  href={href}
                  className={cn(
                    "block pl-9 pr-4 py-1.5 text-[11px] font-mono transition-colors border-l-2 ml-4",
                    active
                      ? "border-l-accent text-foreground font-bold bg-muted"
                      : "border-l-transparent text-muted-foreground hover:text-foreground hover:border-l-foreground",
                  )}
                >
                  {a.title}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
