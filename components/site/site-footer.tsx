import Link from "next/link"
import { SITEMAP } from "@/lib/nav"

export function SiteFooter() {
  return (
    <footer className="w-full border-t-2 border-foreground mt-16">
      <div className="grid grid-cols-1 md:grid-cols-3">
        {SITEMAP.map((group, i) => (
          <div
            key={group.title}
            className={`px-6 py-8 lg:px-8 ${i < SITEMAP.length - 1 ? "border-b-2 md:border-b-0 md:border-r-2 border-foreground" : ""}`}
          >
            <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent mb-4">
              {`// ${group.title}`}
            </h2>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-t-2 border-foreground px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">LYCEE.SIN</span>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground">
            Intervention STI2D SIN — Informatique &amp; Cybersécurité
          </span>
        </div>
        <span className="text-[10px] font-mono tracking-widest text-muted-foreground">
          {"// PROTOTYPE PEDAGOGIQUE — DONNEES LOCALES"}
        </span>
      </div>
    </footer>
  )
}
