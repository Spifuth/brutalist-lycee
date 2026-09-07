import { test } from "node:test"
import assert from "node:assert/strict"
import { SimShell, GOTO_PREFIX } from "../lib/sim-shell.ts"

test("ls hides dotfiles, ls -a shows them", () => {
  // The whole discovery chain for /vie depends on this: `.vie` must NOT be in
  // a plain `ls`, or there is nothing left to find.
  const shell = new SimShell()
  const plain = shell.run("ls").join(" ")
  assert.ok(!plain.includes(".vie"), "a plain `ls` is showing the hidden file — nothing is hidden any more")
  assert.ok(plain.includes("notes.md"), "`ls` stopped listing ordinary files")

  const all = shell.run("ls -a").join(" ")
  assert.ok(all.includes(".vie"), "`ls -a` does not show the hidden file — the trail is broken")
})

test("ls -a still accepts a path after the flag", () => {
  const shell = new SimShell()
  const out = shell.run("ls -a /etc").join(" ")
  assert.ok(out.includes("motd.txt"), "the flag ate the path argument")
})

test("the hidden file names the command", () => {
  // A hint that does not contain the word a student has to type is a dead end.
  const shell = new SimShell()
  const hint = shell.run("cat .vie").join(" ")
  assert.ok(hint.includes("life"), `.vie does not name the command: "${hint}"`)
})

test("life asks the caller to navigate, and says where", () => {
  // SimShell has no router and must not grow one. It returns a sentinel, the
  // same way `clear` already does, and the playground acts on it.
  const shell = new SimShell()
  const out = shell.run("life")
  assert.ok(
    out.some((l) => l.startsWith(GOTO_PREFIX)),
    `life returned no navigation sentinel: ${JSON.stringify(out)}`,
  )
  const target = out.find((l) => l.startsWith(GOTO_PREFIX))!.slice(GOTO_PREFIX.length)
  assert.equal(target, "/vie")
})

test("life stays out of help", () => {
  // It is meant to be found through `ls -a`, not read off a list.
  const shell = new SimShell()
  assert.ok(!shell.run("help").join(" ").includes("life"), "`help` gives away the secret command")
})

test("help mentions the -a flag", () => {
  // Without this, `ls -a` is unguessable and the hidden file is unreachable.
  assert.ok(new SimShell().run("help").join(" ").includes("-a"), "nothing tells the student that `ls -a` exists")
})

test("an unknown command still reports itself", () => {
  assert.match(new SimShell().run("lifee").join(" "), /introuvable/)
})
