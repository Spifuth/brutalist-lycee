"use client"

// Types a string out one character at a time, with a blinking cursor until it
// is done.
//
// One habit to take from it: the interval is created inside the effect and
// cleared in the function the effect returns. Drop that return and changing
// `text`, or navigating away, leaves a timer running that keeps calling
// setState on a component nobody is looking at -- forever, and invisibly.
// Every setInterval, setTimeout, event listener and subscription started in
// an effect owes a matching teardown in its cleanup.

import { useEffect, useState } from "react"

interface TypewriterProps {
  text: string
  speed?: number
  className?: string
}

export function Typewriter({ text, speed = 40, className }: TypewriterProps) {
  const [displayed, setDisplayed] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    setDisplayed("")
    setDone(false)

    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        setDone(true)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-blink">{"_"}</span>}
    </span>
  )
}
