# STYLE.md — the brutalist contract

**This file is a review gate, not a suggestion.** Every component added to this app must be
indistinguishable in style from the ones the bundle already shipped. If a diff introduces a token,
a radius, a shadow or a button that is not described here, the diff is wrong.

The rules below were **extracted by reading the existing components**, not invented. The reference
implementations are `components/quiz/live-quiz.tsx`, `components/vote/vote-board.tsx` and
`components/site/page-shell.tsx`. When in doubt, open one of those and copy its shape.

---

## 1. The one rule that defines the look

```
--radius: 0rem;
```

**Nothing is rounded. Ever.** No `rounded-md`, no `rounded-lg`, no `rounded-full`, no `shadow-*`.
Corners are square and edges are hard. A single stray `rounded-md` reads as a different website.

## 2. Borders carry the design

`border-2 border-foreground` is the primary structural element — it replaces the shadows and
radii a normal UI would use.

| Use | Class |
|---|---|
| Panel / card | `border-2 border-foreground` |
| Internal divider | `border-b-2 border-foreground` |
| List | `divide-y-2 divide-border border-2 border-foreground` |
| Callout / explanation | `border-l-4 border-l-accent border-2 border-foreground bg-muted/40 px-4 py-3` |

## 3. Typography — three fonts, three jobs

| Font | Class | Used for |
|---|---|---|
| Pixel grid | `font-pixel` | Page titles and panel headings only. `text-3xl` → `text-6xl`. |
| Mono | `font-mono` | Everything functional: labels, questions, scores, names, buttons. |
| Sans (default) | — | Body prose and descriptions only. |

**The micro-label is the signature element.** It appears on nearly every panel:

```
text-[10px] font-mono uppercase tracking-widest text-muted-foreground
```

Accent variants use `text-accent` and are often written as a code comment:
`// salle d'attente`, `// classement`.

## 4. Colour — the part that carries the whole look

Brutalism here is **three colours, not a palette**. Almost every surface is paper or ink;
orange is the only chromatic thing on the page and it is rationed. If a screenshot of your
component has four colours in it, it is wrong.

| Role | Token | Light | Dark |
|---|---|---|---|
| **Paper** | `background` / `primary-foreground` | `hsl(43 23% 93%)` `#f1efe9` — warm bone, **not white** | `hsl(0 0% 6%)` `#0f0f0f` |
| **Ink** | `foreground` / `primary` | `hsl(0 0% 4%)` `#0a0a0a` — near-black, **not black** | `hsl(43 23% 93%)` `#f1efe9` |
| **Accent** | `accent` | `hsl(20 90% 45%)` `#da500b` — burnt orange | `hsl(20 90% 50%)` `#f2590d` |
| Muted surface | `muted` | `hsl(40 10% 85%)` `#dddad5` | `hsl(0 0% 15%)` `#262626` |
| Muted text | `muted-foreground` | `hsl(0 0% 40%)` `#666666` | `hsl(0 0% 60%)` `#999999` |
| Border | `border` | `hsl(0 0% 75%)` `#bfbfbf` | `hsl(0 0% 25%)` `#404040` |
| Error | `destructive` | `hsl(0 84% 60%)` `#ef4343` | same |
| Dot grid | (CSS only) | `#c4c2b8` | `hsl(0 0% 20%)` |

Two details that are easy to get wrong and instantly visible:

- **The paper is warm** (`43°` hue), not `#ffffff` and not a cool grey. Dropping a `bg-white`
  panel onto it reads as a hole in the page.
- **The ink is `4%`, not `0%`.** Pure `#000` next to it looks like a rendering bug.
- `card` is the **same colour as `background`** in light mode. There is no elevation in this
  design — depth comes from borders, never from a lighter or darker surface.

### Hard rules

1. **Semantic tokens only.** `bg-accent`, `text-foreground`, `border-border`.
   **Never** a Tailwind palette colour (`bg-orange-500`, `text-zinc-400`, `bg-red-600`) and
   **never** a raw hex in a component. The palette colours do not match these tokens, and they
   do not flip for dark mode.
2. **Emphasis is inversion, not colour.** The primary way this design says "important" is
   `bg-foreground text-background` — a solid ink block. Reach for that before reaching for orange.
3. **One accent per panel.** Orange means exactly one of: *live now*, *correct*, *the current
   selection*, *the one action*. A panel with three orange things has said nothing.
4. **`destructive` is only ever wrong-answer or destructive-action.** It is not "red for emphasis".
5. **Both modes, every time.** Tokens are defined for `:root` and `.dark`. Anything hardcoded
   breaks one of them, and you will only notice in the other.

### Contrast — measured, and it constrains you

| Pair | Ratio | Verdict |
|---|---:|---|
| ink on paper | **17.22** | the design's backbone — use it for anything that must be read |
| paper on ink (inverted bars) | 17.22 | same, inverted |
| `muted-foreground` on paper | 4.99 | fine for body text |
| accent on dark background | 5.67 | fine |
| **white on accent (light)** | **4.09** | ⚠️ large/bold text only |
| **white on accent (dark)** | **3.38** | ⚠️ large/bold text only |
| accent text on paper | 3.56 | ⚠️ large/bold only |
| destructive text on paper | 3.29 | ⚠️ large/bold only |

Two rules follow, and they are not negotiable on a site whose users are teenagers reading a
projected screen from the back of a classroom:

- **Accent is a surface and a marker, not a text colour for anything that must be read.**
  `bg-accent text-accent-foreground` on a small-text element fails AA. The existing correct-answer
  buttons in `live-quiz.tsx` do exactly this — copy their *shape*, and where you add new
  accent-backed text make it **bold or ≥18px**.
- **Never encode meaning in colour alone.** The reveal state pairs orange with a `<Check>` icon and
  red with an `<X>` for exactly this reason. Keep the icon.

The `text-[10px] font-mono uppercase text-accent` micro-labels are the house idiom and stay —
but they are **decoration**. Never put information there that appears nowhere else.

## 5. Buttons — do NOT use `components/ui/button.tsx`

The shadcn `Button` ships `rounded-md` and is **off-style**. The app uses raw `<button>`:

```tsx
// primary
className="bg-foreground text-background px-6 py-3 text-xs font-mono uppercase
           tracking-widest hover:bg-accent hover:text-accent-foreground transition-colors"

// secondary
className="border-2 border-foreground px-4 py-3 text-xs font-mono uppercase
           tracking-widest hover:bg-muted transition-colors"
```

## 6. Panel anatomy

Every interactive panel follows the same three-part shape:

```tsx
<div className="border-2 border-foreground max-w-3xl">
  {/* inverted header bar */}
  <div className="border-b-2 border-foreground bg-foreground text-background
                  px-4 py-2.5 flex items-center gap-3">
    <Radio size={15} className="text-accent animate-blink" />
    <span className="text-[10px] font-mono uppercase tracking-widest">…</span>
    <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono">…</span>
  </div>
  {/* body */}
  <div className="p-6">…</div>
</div>
```

## 7. Page scaffolding

```tsx
<PageShell>
  <PageHeader
    index="LIVE / 071"                    // SECTION / three digits
    command="quiz --live --room classe"   // rendered as `$ <command>`
    title="Quiz en direct"
    description="…"
  />
  <section className="w-full px-6 pb-8 lg:px-12">…</section>
</PageShell>
```

`index` and `command` are decorative but mandatory — they are the terminal conceit that ties the
site together. Pick a plausible shell command; never leave them blank.

## 8. Motion

- `framer-motion`, `<AnimatePresence mode="wait">`, simple opacity fades.
  `initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}` is the house transition.
- Three CSS animations exist and are the only ones: `animate-glitch`, `animate-marquee`,
  `animate-blink`. `animate-blink` marks live state.
- **Do not add a `prefers-reduced-motion` suppression to content animations.** This estate has been
  bitten three times by blanking out an explanation instead of a decoration. Decoration may honour
  it; anything carrying meaning must not.

## 9. Icons and language

- `lucide-react` only, sized inline `size={12}`–`size={15}`, never larger inside a panel.
- **All user-facing copy is French, correctly accented.** `numérique`, `données`, `réponse`,
  `sécurité`. Unaccented French is a bug — the previous migration lost 282 accented characters
  this way and restoring them was the expensive part of the work.
- Inclusive forms match the existing copy: `Curieux·se`, `Électeur·rice`, `Actif·ve`.

## 10. Review checklist

Before any PR:

- [ ] `grep -rn "rounded-" components/ app/` returns nothing new
- [ ] `grep -rn "shadow-" components/ app/` returns nothing new
- [ ] `grep -rnE '#[0-9a-fA-F]{3,6}\b' components/ app/ --include='*.tsx'` returns nothing new
- [ ] `grep -rnE '(bg|text|border)-(red|orange|amber|zinc|slate|gray|neutral|stone|blue|green)-[0-9]' components/ app/` returns nothing
- [ ] No `bg-white` / `bg-black` / `text-white` / `text-black` — the paper is warm and the ink is 4%
- [ ] At most one accent element per panel; emphasis uses `bg-foreground text-background`
- [ ] Any text on `bg-accent` is bold or >=18px (white on accent is 4.09:1)
- [ ] No state is communicated by colour alone — it has an icon or a label too
- [ ] No import of `@/components/ui/button` in a new component
- [ ] New panels have the inverted header bar and a `text-[10px] font-mono uppercase` label
- [ ] Copy is French and accented
- [ ] Renders correctly in both light and dark
