"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import { deleteAvatarFile, writeAvatarFile } from "@/lib/avatar-storage"
import { MAX_AVATAR_UPLOAD_BYTES, detectImageFormat } from "@/lib/avatar-format"
import { reencodeAvatar } from "@/lib/avatar-reencode"

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
  if (previous?.avatar_file) {
    await deleteAvatarFile(previous.avatar_file).catch(() => {})
  }

  revalidatePath("/profil")
  revalidatePath("/classement")
  return { ok: true }
}
