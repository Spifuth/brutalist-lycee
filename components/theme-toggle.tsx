"use client"

// The sun/moon button in the top bar.
//
// `mounted` is why this file is longer than a button should be, and it is the
// standard answer to a *hydration mismatch*. The server renders the page
// without knowing which theme this browser has stored, so if the real icon
// were rendered on the server, React's first client render would produce a
// different one -- and React either warns or keeps the server's wrong answer.
// Rendering a placeholder until `useEffect` has run (which only ever happens
// in the browser) makes the server and the first client render agree, and
// lets the truth arrive one frame later. The same guard fits anything whose
// value only exists client-side: localStorage, the current time, a random id.
//
// The placeholder is a box of exactly the button's size rather than `null`,
// because the alternative is the whole nav row shifting sideways the instant
// the button appears. Reserve the space, then fill it.
//
// One coupling to know: this compares `theme`, not `resolvedTheme`. That is
// only correct because app/layout.tsx passes `enableSystem={false}`. Turn
// system themes back on and `theme` becomes the literal string "system",
// `isDark` is false, and the button shows the wrong icon to everyone whose
// machine is in dark mode.

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="w-8 h-8 border border-foreground/20" aria-hidden="true" />
    )
  }

  const isDark = theme === "dark"

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-8 h-8 flex items-center justify-center border border-foreground/20 bg-background/50 hover:bg-foreground/5 transition-colors duration-200"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Sun size={14} strokeWidth={1.5} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Moon size={14} strokeWidth={1.5} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
