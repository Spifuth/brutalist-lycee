import sharp from "sharp"
import { AVATAR_OUTPUT_PX } from "./avatar-format.ts"

/**
 * Re-encodes an already magic-byte-verified image buffer to a fixed-size
 * WebP. Kept separate from `lib/avatar-format.ts` (which has no
 * dependencies) because this one needs `sharp`; kept separate from
 * `app/actions/avatar.ts` so it can be exercised directly in
 * tests/avatar-format.test.ts without a database or a request context.
 *
 * Re-encoding from decoded pixels — not just re-saving the container — is
 * what strips EXIF, including GPS coordinates a phone embeds by default,
 * and discards anything smuggled inside the original file that isn't
 * actual image data. `.rotate()` bakes the EXIF orientation into the pixels
 * before that metadata is discarded, so a portrait phone photo still comes
 * out right-side up once it's gone.
 */
export async function reencodeAvatar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(AVATAR_OUTPUT_PX, AVATAR_OUTPUT_PX, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer()
}
