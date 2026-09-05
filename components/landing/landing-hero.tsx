"use client"

import { motion } from "framer-motion"
import { Typewriter } from "@/components/typewriter"
import { SignupCard } from "@/components/landing/signup-card"

const ease = [0.22, 1, 0.36, 1] as const

export function LandingHero() {
  return (
    <section className="relative w-full px-6 pt-10 pb-16 lg:px-12 lg:pt-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Left: headline */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-accent">
              STI2D · SIN
            </span>
            <div className="flex-1 border-t border-border max-w-[120px]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              lycée
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease }}
            className="font-pixel text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[0.95] tracking-tight text-balance"
          >
            HACK. CODE.
            <br />
            COMPRENDS.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
            className="mt-6 max-w-md text-sm text-muted-foreground leading-relaxed"
          >
            Une intervention pour découvrir l'informatique, la cybersécurité et l'intelligence
            artificielle au lycée. Vote pour les sujets, teste tes réflexes, ouvre un vrai terminal.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 border-2 border-foreground bg-foreground text-background px-4 py-2 inline-block"
          >
            <span className="text-xs font-mono">
              <span className="text-accent">$</span>{" "}
              <Typewriter text="sudo apprendre --cyber --ia --metiers" speed={45} />
            </span>
          </motion.div>
        </div>

        {/* Right: signup */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="flex justify-center lg:justify-end"
        >
          <SignupCard />
        </motion.div>
      </div>
    </section>
  )
}
