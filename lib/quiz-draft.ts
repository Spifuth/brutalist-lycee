// The one piece of the admin quiz form worth testing: dropping the blank
// option boxes without losing track of which option was the right one.
//
// The form always shows four boxes, so a saved question nearly always carries
// empties to discard. Discarding an element from a list renumbers every
// element after it -- and `correctIndex` is a number that only means anything
// next to the exact list it indexes. Filter the list and forward the old
// index and the question now marks a different option correct, with nothing
// thrown and nothing logged. That pairing is the general lesson: an index and
// its array are one value, so they get rebuilt together or not at all.
//
// Pure on purpose -- no React, no database -- the same shape as
// lib/live-session.ts, so `tests/quiz-draft.test.ts` can pin the behaviour
// without rendering anything.

/** A blank box is one the student would never see: empty or whitespace only. */
function isBlank(option: string): boolean {
  return option.trim() === ""
}

/**
 * Drops blank options and returns `correctIndex` remapped onto the list that
 * actually gets saved.
 *
 * Returns `correctIndex: -1` when the box marked correct is itself blank: the
 * question has no answer at all, and the caller must refuse the save. The
 * tempting shortcut -- quietly promoting the next surviving option -- is the
 * very bug this function exists to remove, just wearing a different hat.
 */
export function compactOptions(
  options: string[],
  correctIndex: number,
): { options: string[]; correctIndex: number } {
  const kept: string[] = []
  let remapped = -1
  for (let i = 0; i < options.length; i++) {
    if (isBlank(options[i])) continue
    if (i === correctIndex) remapped = kept.length
    kept.push(options[i])
  }
  return { options: kept, correctIndex: remapped }
}
