"use client"

// The console's own small design system: card, field, text input, textarea,
// button, stat grid, confirm button, flash. Eight components, no dependency
// but `cn`, and every admin tab is built out of them.
//
// The shape worth stealing is the wrapper. TextInput, TextArea and Btn spread
// `{...props}` onto a real <input>/<textarea>/<button>, so they stay ordinary
// DOM elements: `type`, `disabled`, `aria-label`, `onChange` and everything
// else keep working without ever being declared here, and this file does not
// grow a prop each time a caller needs one. Note the order -- the spread comes
// first and `className` is assigned after it, so a caller cannot accidentally
// drop the styling, while `cn()` (clsx + tailwind-merge) folds
// `props.className` back in. tailwind-merge is the part that makes a caller's
// `bg-muted` actually beat the base `bg-background`, instead of both landing
// in the class list and the stylesheet order deciding who wins.
//
// ConfirmBtn is the second idea: "are you sure?" as one boolean of local state
// rather than a modal or window.confirm(). The button replaces itself with
// Oui/Non and the caller passes a single `onConfirm`, knowing nothing about
// the two steps. A confirmation that lives inside the button composes -- it
// fits anywhere a button fits, in a table row or a toolbar -- where a modal
// has to be hoisted to a parent and told which row it is about.

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export function AdminCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-2 border-foreground bg-card">
      <header className="flex items-center justify-between gap-2 border-b-2 border-foreground bg-foreground px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-background">{title}</span>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "border-2 border-foreground bg-background px-3 py-2 font-mono text-sm outline-none focus:bg-muted",
        props.className,
      )}
    />
  )
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "border-2 border-foreground bg-background px-3 py-2 font-mono text-sm outline-none focus:bg-muted",
        props.className,
      )}
    />
  )
}

export function Btn({
  children,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "accent" | "danger" | "ghost" }) {
  return (
    <button
      {...props}
      className={cn(
        "border-2 border-foreground px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50",
        variant === "default" && "bg-background hover:bg-muted",
        variant === "accent" && "bg-accent text-accent-foreground hover:bg-foreground hover:text-background",
        variant === "danger" && "border-destructive bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
        variant === "ghost" && "border-transparent hover:bg-muted",
        props.className,
      )}
    >
      {children}
    </button>
  )
}

export function StatGrid({ stats }: { stats: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 border-2 border-foreground lg:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="border-b-2 border-r-2 border-foreground p-5 [&:nth-child(3n)]:lg:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-last-child(-n+1)]:border-b-0"
        >
          <p className="font-pixel text-3xl">{typeof s.value === "number" ? s.value.toLocaleString("fr-FR") : s.value}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

/** Inline "are you sure?" confirmation button. */
export function ConfirmBtn({
  label,
  onConfirm,
  children,
}: {
  label: string
  onConfirm: () => void
  children: ReactNode
}) {
  const [armed, setArmed] = useState(false)
  if (armed) {
    return (
      <span className="flex items-center gap-1">
        <Btn variant="danger" onClick={() => { onConfirm(); setArmed(false) }}>
          Oui
        </Btn>
        <Btn variant="ghost" onClick={() => setArmed(false)}>
          Non
        </Btn>
      </span>
    )
  }
  return (
    // title as well as aria-label: these sit in rows of identical ghost icon
    // buttons, and aria-label alone shows a sighted user nothing on hover.
    <Btn variant="ghost" aria-label={label} title={label} onClick={() => setArmed(true)}>
      {children}
    </Btn>
  )
}

export function Flash({ msg, ok }: { msg: string; ok?: boolean }) {
  return (
    <p
      className={cn(
        "mt-3 border-2 px-3 py-2 font-mono text-[11px]",
        ok ? "border-accent bg-accent/10 text-accent" : "border-destructive bg-destructive/10 text-destructive",
      )}
    >
      {msg}
    </p>
  )
}
