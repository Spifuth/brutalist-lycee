"use client"

// Dead code: the template's marketing navbar, never rendered anywhere.
//
// Nothing imports it. It came in with commit 827d40e ("chore: import v0
// brutalist bundle unmodified") and was never edited -- the links all point
// at "#" and the wording is a software company's ("Request Demo",
// "Enterprise"). The bar the site really uses is
// components/site/site-nav.tsx. Reported rather than deleted.
//
// Worth one look before it goes, as a contrast with its replacement: this
// navbar hard-codes its four links in the JSX, site-nav.tsx reads them from
// lib/nav.ts. That is most of the difference between a mock-up and a site.

import { Cpu } from "lucide-react"
import { motion } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full px-4 pt-4 lg:px-6 lg:pt-6"
    >
      <nav className="w-full border border-foreground/20 bg-background/80 backdrop-blur-sm px-6 py-3 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <Cpu size={16} strokeWidth={1.5} />
            <span className="text-xs font-mono tracking-[0.15em] uppercase font-bold">
              SYS.INT
            </span>
          </motion.div>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-8">
            {["Platform", "Enterprise", "Resources", "Company"].map((link, i) => (
              <motion.a
                key={link}
                href="#"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link}
              </motion.a>
            ))}
          </div>

          {/* Right side: Login + CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center gap-4"
          >
            <ThemeToggle />
            <a
              href="#"
              className="hidden sm:block text-xs font-mono tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Log In
            </a>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-foreground text-background px-4 py-2 text-xs font-mono tracking-widest uppercase"
            >
              Request Demo
            </motion.button>
          </motion.div>
        </div>
      </nav>
    </motion.div>
  )
}
