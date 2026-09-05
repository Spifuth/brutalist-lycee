"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TocEntry {
  id: string
  text: string
}

export function ArticleToc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string>(entries[0]?.id ?? "")

  useEffect(() => {
    if (entries.length === 0) return
    const observer = new IntersectionObserver(
      (obsEntries) => {
        const visible = obsEntries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    )
    entries.forEach((e) => {
      const el = document.getElementById(e.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [entries])

  if (entries.length === 0) return null

  return (
    <nav aria-label="Sur cette page" className="hidden xl:block sticky top-6 self-start w-52 shrink-0">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent mb-3">
        {"// sur cette page"}
      </p>
      <ul className="flex flex-col gap-2 border-l-2 border-border">
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              className={cn(
                "block -ml-0.5 border-l-2 pl-3 text-[11px] font-mono leading-snug transition-colors",
                active === e.id
                  ? "border-l-accent text-foreground"
                  : "border-l-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {e.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
