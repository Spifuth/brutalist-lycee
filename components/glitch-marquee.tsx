"use client"

// Dead code: a scrolling "partners" band from the original template, never
// rendered anywhere.
//
// Nothing imports it. Same origin as components/navbar.tsx and
// components/footer.tsx -- commit 827d40e, "chore: import v0 brutalist bundle
// unmodified" -- and untouched since. Read the list it scrolls before reusing
// any of this: a school project has no partners, and a band of company logos
// that never agreed to appear is a claim, not a decoration. Reported rather
// than deleted.
//
// If you do want a marquee, the technique is here and it is two lines. The
// row is rendered twice ([...PARTNERS, ...PARTNERS]) and the CSS in
// app/globals.css slides it to translateX(-50%) before looping. At exactly
// half the width, the frame it jumps back to is pixel-identical to the one it
// left, so the seam is invisible. Any other percentage and you see the jump.

import { motion } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const PARTNERS = [
  "OPENAI",
  "ANTHROPIC",
  "GOOGLE",
  "META",
  "NVIDIA",
  "MISTRAL",
  "COHERE",
  "STABILITY",
  "DEEPMIND",
  "HUGGING FACE",
]

function LogoBlock({ name, glitch }: { name: string; glitch: boolean }) {
  return (
    <div
      className={`flex items-center justify-center px-8 py-4 border-r-2 border-foreground shrink-0 ${
        glitch ? "animate-glitch" : ""
      }`}
    >
      <span className="text-sm font-mono tracking-[0.15em] uppercase text-foreground whitespace-nowrap">
        {name}
      </span>
    </div>
  )
}

export function GlitchMarquee() {
  const glitchIndices = [2, 6]

  return (
    <section className="w-full py-16 px-6 lg:px-12">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease }}
        className="flex items-center gap-4 mb-8"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          {"// PARTNERS: MODEL_ECOSYSTEM"}
        </span>
        <div className="flex-1 border-t border-border" />
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">008</span>
      </motion.div>

      {/* Marquee */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease }}
        className="overflow-hidden border-2 border-foreground"
      >
        <div className="flex animate-marquee" style={{ width: "max-content" }}>
          {[...PARTNERS, ...PARTNERS].map((name, i) => (
            <LogoBlock
              key={`${name}-${i}`}
              name={name}
              glitch={glitchIndices.includes(i % PARTNERS.length)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
