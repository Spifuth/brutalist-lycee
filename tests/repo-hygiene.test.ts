// Guards on the repository itself, not on the app.
//
// These exist because CONTRIBUTING.md tells a first-time contributor to run
// `cp .env.example .env` and then `git add -A`. If `.env` is ever un-ignored
// again, that sequence commits a database password to a public repository —
// and GitHub's push protection does NOT catch a plain Postgres password.
import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"

/** git check-ignore exits 0 when the path IS ignored, 1 when it is not. */
function isIgnored(path: string): boolean {
  const r = spawnSync("git", ["check-ignore", "-q", "--no-index", path], { encoding: "utf8" })
  return r.status === 0
}

test(".env is ignored by git", () => {
  assert.ok(isIgnored(".env"), "`.env` must be in .gitignore — CONTRIBUTING.md teaches `git add -A`")
})

test(".env.local and .env.production are ignored by git", () => {
  assert.ok(isIgnored(".env.local"), "`.env.local` must be ignored")
  assert.ok(isIgnored(".env.production"), "`.env.production` must be ignored")
})

test(".env.example is NOT ignored — it is the template contributors copy", () => {
  assert.equal(isIgnored(".env.example"), false, "`.env.example` must stay tracked")
})
