// Pure image-format detection from magic bytes. Deliberately has no
// filesystem or "server-only" import: this module is imported directly by
// `tests/avatar-format.test.ts` (node --test --experimental-strip-types)
// and must stay dependency-free so it runs in plain Node with no Next.js
// runtime around it.
//
// The one rule this file exists to enforce: never trust the client-supplied
// Content-Type header or the filename extension — both are attacker
// controlled (a browser will happily send `Content-Type: image/png` for a
// renamed .txt file, and the filename is just a string the client chose).
// The only truthful signal is what the first bytes of the file actually are.

export type ImageFormat = "jpeg" | "png" | "webp"

/** Reject anything over this before the whole file is read into memory. */
export const MAX_AVATAR_UPLOAD_BYTES = 4 * 1024 * 1024 // 4 MB

/** Fixed output dimensions for every re-encoded avatar (a square, not a circle). */
export const AVATAR_OUTPUT_PX = 512

const JPEG_MAGIC = [0xff, 0xd8, 0xff]
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46] // "RIFF"
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50] // "WEBP", at offset 8 in a RIFF container

function matchesAt(buf: Uint8Array, offset: number, magic: number[]): boolean {
  if (buf.length < offset + magic.length) return false
  for (let i = 0; i < magic.length; i++) {
    if (buf[offset + i] !== magic[i]) return false
  }
  return true
}

/**
 * Identifies the real image container from its magic bytes, ignoring
 * whatever Content-Type or filename the client sent along with it. Returns
 * null for anything that isn't JPEG, PNG or WebP — including a plain-text
 * file that was merely renamed to end in ".png".
 */
export function detectImageFormat(buf: Uint8Array): ImageFormat | null {
  if (matchesAt(buf, 0, JPEG_MAGIC)) return "jpeg"
  if (matchesAt(buf, 0, PNG_MAGIC)) return "png"
  if (matchesAt(buf, 0, RIFF_MAGIC) && matchesAt(buf, 8, WEBP_MAGIC)) return "webp"
  return null
}
