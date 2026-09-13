"use client"

// The docs sidebar: subjects that fold open, articles inside them, the
// current page highlighted.
//
// Two kinds of state sit side by side here and telling them apart is the
// transferable idea. The highlight is *derived*: `active` is recomputed from
// `usePathname()` on every render, so it cannot go stale. The fold is
// *owned*: a group remembers that the reader opened it, and nothing in the
// URL could know that. Derive what the app already knows; store only what the
// user told you.
//
// Known bug, found while documenting this file and deliberately not fixed
// here: `useState(defaultOpen)` reads its argument only on the first render
// of the component. This sidebar is mounted by app/docs/layout.tsx, and the
// App Router keeps a layout mounted while you navigate inside it, so a group
// that was closed when the sidebar first appeared stays closed even once you
// are reading an article inside it. The shortest way to see it: click
// "Suivant" at the end of a subject's last article -- lib/content.ts
// flattens every subject into one list, so that lands you in the next subject
// -- and the group holding the article you are on is still shut, its
// highlighted link not rendered at all.
//
// The general shape of the mistake is "a prop copied into state": the copy
// stops tracking the prop the instant it is made. The two standard repairs
// are a `key` that changes when the prop does, forcing a remount, or lifting
// the open/closed set into the parent that already knows the pathname.

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
