import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth/auth-provider'

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
  themeColor: "#111111",
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
      </body>
    </html>
  )
}
