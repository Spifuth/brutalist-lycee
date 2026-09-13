// The root layout: the one file every single page of this site is rendered
// inside of.
//
// A layout in the App Router is not a page, it is a wrapper. It owns the
// <html> and <body> tags -- which is why no page in this folder writes them --
// and whatever it mounts, every page may assume already exists: the JetBrains
// Mono and Geist Pixel fonts as CSS variables, a theme, a session, and one
// global error listener.
//
// It is also a Server Component rendering two Client Components
// (ThemeProvider, AuthProvider), which sounds like it should be forbidden and
// is not. The restriction is about *imports*, not about nesting: a client file
// may never import a server file, but `children` is a prop, and by the time it
// reaches AuthProvider it is already-rendered output rather than code the
// browser has to run. That is the "children slot" pattern, and it is what
// keeps every page inside a client provider server-rendered. Reach for it each
// time a provider from npm threatens to turn a whole subtree into client code.
//
// `suppressHydrationWarning` on <html> is required rather than a workaround:
// next-themes writes the theme class onto that element before React hydrates,
// precisely so the page never flashes the wrong colour, so the server HTML and
// the first client render genuinely differ on that one attribute and React has
// to be told to accept it. On that element only -- it is not a general mute
// button for hydration mismatches.
//
// The metadata `template` below ("%s -- LYCEE.SIN") is why every page in this
// directory sets only its own short title and gets the suffix for free.
//
// <StaleActionGuard /> arrived with commit 0c98134, "stale Server Action
// errors reload instead of showing a stack trace"; what it catches, and why
// reloading is the whole fix, are in components/site/stale-action-guard.tsx.

import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth/auth-provider'
import { PAPER_LIGHT, PAPER_DARK } from '@/lib/theme-tokens'
import { StaleActionGuard } from "@/components/site/stale-action-guard"

import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: "LYCEE.SIN — Informatique & Cybersécurité au lycée (STI2D SIN)",
    template: "%s — LYCEE.SIN",
  },
  description:
    "Site d'accompagnement d'une intervention informatique et cybersécurité au lycée (STI2D SIN). Cyber, IA, métiers, parcours, quiz, terminal et documentation pour les lycéennes et lycéens.",
  keywords: [
    "cybersécurité lycée",
    "STI2D SIN",
    "informatique lycée",
    "intelligence artificielle",
    "métiers du numérique",
    "quiz cybersécurité",
    "terminal linux",
    "orientation numérique",
  ],
  authors: [{ name: "Intervention STI2D SIN" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "LYCEE.SIN — Informatique & Cybersécurité au lycée",
    description:
      "Cyber, IA, métiers, parcours, quiz et terminal : découvre l'informatique et la cybersécurité en STI2D SIN.",
    siteName: "LYCEE.SIN",
  },
  category: "education",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PAPER_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: PAPER_DARK },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${jetbrainsMono.variable} ${GeistPixelGrid.variable} bg-background`} suppressHydrationWarning>
      <body className="font-mono antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
              <StaleActionGuard />
      </body>
    </html>
  )
}
