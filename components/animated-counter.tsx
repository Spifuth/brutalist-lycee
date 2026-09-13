"use client"

// A number that counts up to its value the first time it scrolls into view.
//
// Two browser APIs do all of it, and the pair is reusable for any
// animate-on-scroll effect. An *IntersectionObserver* answers "is this
// element on screen" without a scroll listener: the browser does the geometry
// and calls back only when the threshold is crossed. A
// *requestAnimationFrame loop* then drives the animation from elapsed time
// (`performance.now()`) rather than from a count of frames, so the run takes
// `duration` milliseconds on a 60 Hz laptop and on a 120 Hz phone alike.
//
// `started` is a ref and not state on purpose: it has to survive re-renders
// without causing one. Flipping it inside the observer callback is what makes
// the count-up happen once, instead of replaying every time the element
// scrolls back into view.
//
// Contract: `to` is read once, when the animation starts. This is built for a
// value fixed for the lifetime of the mount -- app/accueil/page.tsx renders
// it from server-side stats -- and it will not re-animate toward a new `to`.

import { useEffect, useRef, useState } from "react"

interface AnimatedCounterProps {
  to: number
  duration?: number
  suffix?: string
  decimals?: number
}

export function AnimatedCounter({ to, duration = 1400, suffix = "", decimals = 0 }: AnimatedCounterProps) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1)
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3)
            setValue(to * eased)
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [to, duration])

  return (
    <span ref={ref}>
      {value.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}
