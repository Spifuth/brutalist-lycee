#!/usr/bin/env node
// The header gate: every source file of 80 lines or more must open with a
// comment. Sibling of scripts/check-no-external-origins.mjs, and deliberately
// as dumb as it: it checks that an explanation is *present*, never that it is
// good. A gate that tried to judge writing would either pass everything or
// block honest work, and reviewers are better at that question than a regex.
//
// Eighty lines is the threshold because below it a good name usually carries
// the file, and a mandatory header on a six-line utility is noise that teaches
// contributors to write noise.
//
// See CONTRIBUTING.md §11 for what a header should actually say.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs"
import { join, extname } from "node:path"
import { pathToFileURL } from "node:url"

const ROOTS = ["app", "components", "lib", "db", "hooks", "scripts", "tests", "gateway"]
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "backup.bak"])
const EXTS = new Set([".ts", ".tsx", ".mjs", ".js"])
const MIN_LINES = 80

// A directive prologue ("use client" / "use server") has to stay on line 1, so
// the header sits underneath it. Anything the parser treats as a prologue, the
// gate skips past.
const DIRECTIVE = /^(["'])use (client|server|strict)\1;?$/

// A shebang has the same constraint for the same reason: the OS only honours
// it as the very first line, so it sits above the header instead of under it.
// Skip it the same way a directive is skipped.
const SHEBANG = /^#!/

/** True when the first thing that is not a blank line, a directive, or a shebang is a comment. */
export function hasHeader(source) {
  for (const raw of source.split("\n")) {
    const line = raw.trim()
    if (line === "") continue
    if (DIRECTIVE.test(line)) continue
    if (SHEBANG.test(line)) continue
    return line.startsWith("//") || line.startsWith("/*")
  }
  return false
}

function* walk(dir) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

/** Every file over the threshold that opens without a comment, worst first. */
export function collectOffenders(roots = ROOTS) {
  const offenders = []
  for (const root of roots) {
    for (const file of walk(root)) {
      if (!EXTS.has(extname(file))) continue
      if (file.endsWith(".d.ts")) continue
      const source = readFileSync(file, "utf8")
      const loc = source.split("\n").length
      if (loc < MIN_LINES) continue
      if (!hasHeader(source)) offenders.push({ file, loc })
    }
  }
  return offenders.sort((a, b) => b.loc - a.loc)
}

function main() {
  const offenders = collectOffenders()
  if (offenders.length === 0) {
    console.log("header gate clean")
    return
  }
  console.error(`${offenders.length} file(s) of ${MIN_LINES}+ lines open without a comment:\n`)
  for (const { file, loc } of offenders) {
    console.error(`  ${String(loc).padStart(4)} LOC  ${file}`)
  }
  console.error("\nSee CONTRIBUTING.md §11 — the header says what the file makes and what a reader could rebuild from it.")
  process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
