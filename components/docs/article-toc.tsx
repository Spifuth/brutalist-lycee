"use client"

// The "on this page" rail beside a docs article, with the heading you are
// reading lit up.
//
// This is a *scroll-spy*, and the whole trick is the `rootMargin`. An
// IntersectionObserver fires on "touching the viewport at all", which on a
// long article means six headings are intersecting at once and the answer is
// useless. Shrinking the observation box to a band near the top (-80px off
// the top edge, -70% off the bottom) turns "is it visible" into "is it the
// heading under your eyes", which is the question a table of contents is
// really asking. Tune those two numbers and you have tuned the feel of the
// whole thing.
//
// It is also cheaper than the obvious scroll listener: the browser does the
// geometry itself and calls back only when a boundary is crossed, instead of
// running your code on every scroll event.
//
// Contract for callers: `entries` must keep a stable identity across renders,
// because the effect re-subscribes whenever it changes. That holds here
// because a server component builds the array once
// (app/docs/[subject]/[article]/page.tsx); a client parent rebuilding it
// inline would tear down and rebuild the observer on every render.

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
