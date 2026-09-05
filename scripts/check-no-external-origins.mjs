#!/usr/bin/env node
// Fails the build if compiled output references an origin we do not control.
// Rationale: this site serves minors. Two generated bundles on this estate have
// shipped external beacons (unpkg React, @vercel/analytics). A grep in CI is
// cheaper than finding out from a network tab.
//
// Scope: defaults to .next/static, not .next. The threat is a fetch made by
// the browser, and browser code lives in .next/static. The rest of .next
// (server chunks, vendored node_modules) is server-side dependency code that
// never runs in a client — scanning it is pure noise. Widen this back only if
// you have a matching threat model for server-side fetches.
//
// Usage: node scripts/check-no-external-origins.mjs [dir ...]
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, extname } from "node:path"

const ALLOWED = new Set([
  "localhost",
  "127.0.0.1",
  "nebulahost.tech",
  "lycee.nebulahost.tech",
  "lycee-next.nebulahost.tech",

  // The three entries below are framework doc/error/license strings, not
  // origins the app fetches. Trade-off: allow-listing them means a genuine
  // beacon disguised as one of these three hosts would NOT be caught. That is
  // accepted because the threat model here is third-party analytics/CDN
  // loads shipped in generated bundles (the unpkg/vercel-analytics incidents
  // this script exists for), not an exfiltration channel hiding behind a
  // React docs link. If that threat model ever changes, remove these and
  // filter by string content (e.g. "/errors/", "/docs/messages/") instead of
  // by host.
  "nextjs.org", // Next.js's own dev-time warning/error messages link here,
                // e.g. "Read more: https://nextjs.org/docs/messages/...".
                // Static string in the framework's client bundle, never fetched.
  "react.dev", // React's minified production error decoder embeds
               // "https://react.dev/errors/<code>" as a literal prefix.
               // Static string, never fetched.
  "github.com", // core-js (bundled polyfill dependency) carries its license
                // header as a comment: a
                // "https://github.com/zloirock/core-js/blob/.../LICENSE" URL.
                // Static string in a license comment, never fetched.
])

// Origins that are fine in comments/docs but must never be fetched at runtime.
const IGNORE_SUBSTRINGS = ["schema.org", "www.w3.org"]

const EXTS = new Set([".js", ".mjs", ".cjs", ".css", ".html", ".json"])
const roots = process.argv.slice(2)
if (roots.length === 0) roots.push(".next/static")

const findings = []

function walk(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const e of entries) {
    const p = join(dir, e)
    const st = statSync(p)
    if (st.isDirectory()) {
      walk(p)
    } else if (EXTS.has(extname(p))) {
      const text = readFileSync(p, "utf8")
      for (const m of text.matchAll(
        /https?:\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})/gi,
      )) {
        const host = m[1].toLowerCase()
        if (ALLOWED.has(host)) continue
        if (IGNORE_SUBSTRINGS.some((s) => host.includes(s))) continue
        findings.push(`${p}: ${host}`)
      }
    }
  }
}

for (const r of roots) walk(r)

if (findings.length > 0) {
  const uniq = [...new Set(findings)].sort()
  console.error("[check-origins] external origins found in build output:")
  for (const f of uniq) console.error("  " + f)
  console.error(
    "\nIf one of these is legitimate, add its host to ALLOWED in this file " +
      "with a comment saying why. Do not delete the check.",
  )
  process.exit(1)
}
console.log("[check-origins] clean — no external origins in build output")
