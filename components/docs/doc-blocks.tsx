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
