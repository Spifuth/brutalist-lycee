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
