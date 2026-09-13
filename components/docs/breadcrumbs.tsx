// The "Docs > Reseaux > this article" trail at the top of a docs page.
//
// Worth one line: the `aria-label`. A docs article carries four <nav>
// elements (this trail, the top bar, the sidebar, the table of contents), and
// a screen reader announces an unlabelled one as just "navigation". Once a
// page has more than one, each needs a name.

import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center flex-wrap gap-1.5 mb-6 text-[10px] font-mono uppercase tracking-widest">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {item.href ? (
            <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight size={11} className="text-muted-foreground" />}
        </span>
      ))}
    </nav>
  )
}
