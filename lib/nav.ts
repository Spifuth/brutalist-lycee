// Central navigation config. Each nav item carries a fake terminal-command label.

export interface NavItem {
  label: string
  cmd: string
  href: string
}

// Primary nav shown in the top bar.
export const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", cmd: "cd ~", href: "/accueil" },
  { label: "Vote", cmd: "vote", href: "/vote" },
  { label: "Cyber", cmd: "nmap", href: "/cyber" },
  { label: "IA", cmd: "ollama", href: "/ia" },
  { label: "Métiers", cmd: "jobs", href: "/metiers" },
  { label: "Parcours", cmd: "paths", href: "/parcours" },
  { label: "Docs", cmd: "man", href: "/docs" },
  { label: "Terminal", cmd: "ssh", href: "/terminal" },
  { label: "Quiz", cmd: "quiz", href: "/quiz" },
  { label: "Chasse", cmd: "sudo find", href: "/chasse" },
  { label: "Profil", cmd: "whoami", href: "/profil" },
]

// Full sitemap for the footer — grouped.
export interface SitemapGroup {
  title: string
  links: { label: string; href: string }[]
}

export const SITEMAP: SitemapGroup[] = [
  {
    title: "Sections",
    links: [
      { label: "Accueil", href: "/accueil" },
      { label: "Cyber", href: "/cyber" },
      { label: "IA", href: "/ia" },
      { label: "Métiers", href: "/metiers" },
      { label: "Comment ça marche", href: "/comment-ca-marche" },
      { label: "Le voyage d'une donnée", href: "/voyage" },
      { label: "Parcours", href: "/parcours" },
      { label: "Pour aller plus loin", href: "/pour-aller-plus-loin" },
    ],
  },
  {
    title: "Participer",
    links: [
      { label: "Vote", href: "/vote" },
      { label: "Quiz", href: "/quiz" },
      { label: "Quiz en direct", href: "/live" },
      { label: "Questions", href: "/questions" },
      { label: "Questions en direct", href: "/questions-live" },
      { label: "Chasse aux secrets", href: "/chasse" },
      { label: "Classement", href: "/classement" },
    ],
  },
  {
    title: "Outils",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Terminal", href: "/terminal" },
      { label: "Profil", href: "/profil" },
      { label: "Console admin", href: "/admin" },
    ],
  },
]
