// The docs shell -- nav, sidebar, article column, footer -- wrapped around
// every page under /docs.
//
// A nested layout, and the thing to know is what it does *not* do: it does not
// re-run when you move from one article to the next. The App Router keeps a
// layout mounted for as long as you stay inside its segment and swaps only the
// `children` underneath. That is mostly the point -- the sidebar does not
// flash, the scroll position holds, the subject list is fetched here once
// instead of once per article -- and it is also a trap, because any state a
// child of this layout holds survives navigation too. The sidebar mounted
// below has exactly that bug; it is described in full at the top of
// components/docs/docs-sidebar.tsx.

import type { ReactNode } from "react"
import { SiteNav } from "@/components/site/site-nav"
import { SiteFooter } from "@/components/site/site-footer"
import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { getDocSubjects } from "@/lib/content"

export const dynamic = "force-dynamic"

export default async function DocsLayout({ children }: { children: ReactNode }) {
  const subjects = await getDocSubjects()
  return (
    <div className="min-h-screen flex flex-col dot-grid-bg">
      <SiteNav />
      <div className="flex-1 w-full px-4 py-6 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside>
            <DocsSidebar
              subjects={subjects.map((s) => ({
                slug: s.slug,
                title: s.title,
                articles: s.articles.map((a) => ({ slug: a.slug, title: a.title })),
              }))}
            />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
