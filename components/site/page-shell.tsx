// The frame every ordinary page sits in: nav on top, footer underneath,
// content between.
//
// A shell *component* rather than a Next.js layout.tsx, and the difference is
// worth knowing. A layout wraps a whole route segment whether the page wants
// it or not; a shell is opted into, page by page. This site needs both:
// app/docs/layout.tsx rebuilds the same frame around a sidebar for every docs
// URL, while /secret drops the chrome entirely because the joke needs a bare
// screen. Use a layout when the frame is a property of the URL, and a
// component when it is a choice the page makes.
//
// PageHeader lives here rather than in components/primitives because it
// renders the page <h1>, and a page gets exactly one of those.

import type { ReactNode } from "react"
import { SiteNav } from "@/components/site/site-nav"
import { SiteFooter } from "@/components/site/site-footer"

interface PageShellProps {
  children: ReactNode
  /** Disable the dot-grid background if a page needs a flat surface. */
  flat?: boolean
}

export function PageShell({ children, flat = false }: PageShellProps) {
  return (
    <div className={`min-h-screen flex flex-col ${flat ? "" : "dot-grid-bg"}`}>
      <SiteNav />
      <main className="flex-1 w-full">{children}</main>
      <SiteFooter />
    </div>
  )
}

interface PageHeaderProps {
  index: string
  command: string
  title: string
  description?: string
}

/** Standard brutalist page header: section index + terminal command + title. */
export function PageHeader({ index, command, title, description }: PageHeaderProps) {
  return (
    <header className="w-full px-6 pt-10 pb-8 lg:px-12">
      <div className="flex items-center gap-4 mb-6">
        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
          {`$ ${command}`}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
          {index}
        </span>
      </div>
      <h1 className="font-pixel text-4xl sm:text-5xl lg:text-6xl tracking-tight text-balance">
        {title}
      </h1>
      {description && (
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </header>
  )
}
