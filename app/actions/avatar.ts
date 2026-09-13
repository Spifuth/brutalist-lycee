"use server"

// Avatar upload: the one path in this app that writes a student's own file to
// the server's disk.
//
// Four checks, in this order, and the order is the point. Declared size before
// the file is read into memory, real size after, magic bytes before anything
// decodes it, then a full re-encode through sharp. Nothing the browser *says*
// about a file is trusted — not the Content-Type, not the filename, not the
// extension — because a client picks all three. Only the first bytes of a file
// say what it actually is. The stored name is generated here with
// `randomUUID()`, so no user-controlled string ever reaches the filesystem;
// lib/avatar-storage.ts then refuses anything that is not exactly that shape.
//
// The split into `uploadAvatar` (reads the session) and `processAvatarUpload`
// (takes an id already authenticated) is a testability pattern worth copying,
// and the doc on the second function explains why.
//
// ⚠️ Known defect, found 2026-09-13 and not fixed here: inside
// `processAvatarUpload`, the three lines explaining why the old file is
// deleted *after* the new one is written are glued to the top of the "Badges."
// comment, above the badge block, instead of sitting above the deletion they
// describe. Same accident as issue #38 — a comment is attached to its
// position, not to its subject.

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { deleteAvatarFile, writeAvatarFile } from "@/lib/avatar-storage"
import { MAX_AVATAR_UPLOAD_BYTES, detectImageFormat } from "@/lib/avatar-format"
import { reencodeAvatar } from "@/lib/avatar-reencode"
import { awardBadge } from "@/lib/awards"

export interface UploadAvatarResult {
  ok: boolean
  error?: string
}

/** Server Action entry point: bound to the logged-in user, never callable on someone else's behalf. */
export async function uploadAvatar(formData: FormData): Promise<UploadAvatarResult> {
  const user = await requireUser()
  return processAvatarUpload(user.id, formData.get("avatar"))
}

/**
 * The security-carrying logic, factored out from `uploadAvatar` so it takes
 * an already-authenticated userId instead of reading the session itself.
 * `requireUser()` depends on Next's request-scoped `cookies()` and can only
 * run inside an actual request, which makes it untestable in isolation —
 * this function has no such dependency, so it can be (and is, in
 * tests/avatar-format.test.ts and the manual verification pass) exercised
 * directly against a real database and a real temp directory.
 */
export async function processAvatarUpload(userId: string, file: unknown): Promise<UploadAvatarResult> {
  if (!(file instanceof File)) {
    return { ok: false, error: "Aucun fichier reçu." }
  }

  // Reject over 4 Mo before the whole file is read into memory. `file.size`
  // comes from the browser's own account of the blob size, so this check is
  // free — it happens before the (potentially large) buffer read below.
  if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
    return { ok: false, error: "Image trop lourde : 4 Mo maximum." }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (buffer.byteLength > MAX_AVATAR_UPLOAD_BYTES) {
    return { ok: false, error: "Image trop lourde : 4 Mo maximum." }
  }

  // The client controls both the Content-Type header and the filename —
  // neither is verified here or anywhere upstream. Only the magic bytes say
  // what the file actually is. A text file renamed to end in ".png" fails
  // this check and never reaches sharp.
  const format = detectImageFormat(buffer)
  if (!format) {
    return { ok: false, error: "Format non reconnu : seuls JPEG, PNG et WebP sont acceptés." }
  }

  // Re-encoding (not just re-saving the container) strips EXIF — including
  // GPS coordinates a phone embeds by default — and neutralises anything
  // smuggled inside the original file. See lib/avatar-reencode.ts.
  let output: Buffer
  try {
    output = await reencodeAvatar(buffer)
  } catch {
    return { ok: false, error: "Image illisible ou corrompue." }
  }

  const previous = await queryOne<{ avatar_file: string | null }>(
    "SELECT avatar_file FROM users WHERE id = $1",
    [userId],
  )

  // Generated filename — never anything derived from user input (not even
  // sanitised), so there is nothing here for a crafted filename to attack.
  const filename = `${randomUUID()}.webp`
  await writeAvatarFile(filename, output)

  await query("UPDATE users SET avatar_file = $1, avatar_uploaded_at = now() WHERE id = $2", [
    filename,
    userId,
  ])

  // Delete the old file only after the new one is live, so a failure above
  // never leaves the user with no avatar file at all. A failure here is
  // non-fatal — worst case is one orphaned file, not a broken account.
  // Badges. `coquet` is the first upload, `pinceau-fou` is changing it again —
  // which is exactly what `previous` distinguishes, so no extra query.
  // Both were created during the SQLite migration to preserve 20 historical
  // unlocks from the old site, and both sat unearnable until now: their kind
  // says `auto:avatar` but nothing awarded them.
  if (previous?.avatar_file) {
    await awardBadge(userId, "pinceau-fou")
  } else {
    await awardBadge(userId, "coquet")
  }

  if (previous?.avatar_file) {
    await deleteAvatarFile(previous.avatar_file).catch(() => {})
  }

  revalidatePath("/profil")
  revalidatePath("/classement")
  return { ok: true }
}
