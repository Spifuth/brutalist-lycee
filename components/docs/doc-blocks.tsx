// Renders one docs article: a list of content blocks turned into components.
//
// Articles are stored as data, never as HTML -- a `DocBlock[]` (lib/docs.ts)
// where every element carries a `type`. This file is the single place that
// maps a type to a component, which is what a *discriminated union* buys:
// add a variant to the type and TypeScript comes and points at this switch.
// Keeping markup out of the database is also why nothing a contributor writes
// can inject into the page; a block's text arrives as a React child, and
// React escapes those.
//
// The trap is `default: return null`. A block whose `type` is not listed here
// does not throw and does not leave a gap -- it simply never appears, which
// is the worst way for content to be wrong. tests/docs-content.test.ts fails
// when an article contains a type this switch does not handle, and that test
// is the only reason the silence is safe.

import type { DocBlock } from "@/lib/docs"
import { CodeBlock, Callout, KeyList, List, P, Table } from "@/components/primitives"

export function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "para":
            return <P key={i}>{block.text}</P>
          case "section":
            return (
              <h2
                key={i}
                id={block.id}
                className="scroll-mt-24 font-mono text-lg font-bold uppercase tracking-wide border-b-2 border-foreground pb-2 mt-4"
              >
                {block.text}
              </h2>
            )
          case "code":
            return <CodeBlock key={i} code={block.code} label={block.label} prompt={block.prompt} />
          case "callout":
            return (
              <Callout key={i} tone={block.tone} title={block.title}>
                {block.text}
              </Callout>
            )
          case "keylist":
            return <KeyList key={i} items={block.items} />
          case "list":
            return <List key={i} items={block.items} ordered={block.ordered} />
          case "table":
            return <Table key={i} headers={block.headers} rows={block.rows} caption={block.caption} />
          default:
            return null
        }
      })}
    </div>
  )
}
