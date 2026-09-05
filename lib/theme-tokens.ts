/**
 * Raw hex mirrors of the design tokens defined in `app/globals.css`.
 *
 * `globals.css` is the source of truth for colour — everything in components
 * and pages should reach for a semantic Tailwind class (`bg-background`,
 * `text-accent`, ...) instead of a literal. This file exists only because a
 * couple of third-party APIs cannot consume a CSS variable and must be given
 * a literal value at call time:
 *
 *   - xterm.js's `Terminal({ theme: ... })` option takes plain colour strings.
 *   - Next.js's `viewport.themeColor` metadata is serialised into a
 *     `<meta>` tag and cannot reference `hsl(var(--foo))`.
 *
 * If a token in `globals.css` changes, the matching constant here MUST be
 * updated in the same commit — the CI style gate exempts only this file
 * precisely because it is the one place raw hex is allowed, and that
 * exemption only holds if the two stay in sync.
 */

// Paper — `--background` / `--primary-foreground`
export const PAPER_LIGHT = "#f1efe9"
export const PAPER_DARK = "#0f0f0f"

// Ink — `--foreground` / `--primary`
export const INK_LIGHT = "#0a0a0a"
export const INK_DARK = "#f1efe9"

// Accent — `--accent`
export const ACCENT_LIGHT = "#da500b"
export const ACCENT_DARK = "#f2590d"
