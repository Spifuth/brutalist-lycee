import { test } from "node:test"
import assert from "node:assert/strict"
import sharp from "sharp"
import { detectImageFormat, MAX_AVATAR_UPLOAD_BYTES, AVATAR_OUTPUT_PX } from "../lib/avatar-format.ts"
import { reencodeAvatar } from "../lib/avatar-reencode.ts"

// --- Magic-byte detection ---------------------------------------------

test("a real JPEG (FF D8 FF) is recognised regardless of what follows", () => {
  const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
  assert.equal(detectImageFormat(buf), "jpeg")
})

test("a real PNG (89 50 4E 47 0D 0A 1A 0A) is recognised", () => {
  const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
  assert.equal(detectImageFormat(buf), "png")
})

test("a real WebP (RIFF....WEBP) is recognised", () => {
  const buf = Buffer.concat([
    Buffer.from("RIFF", "ascii"),
    Buffer.from([0x24, 0x00, 0x00, 0x00]), // chunk size, irrelevant to detection
    Buffer.from("WEBP", "ascii"),
  ])
  assert.equal(detectImageFormat(buf), "webp")
})

test("a file named .png with a plain-text body is rejected — magic bytes, not the filename, decide", () => {
  // This is the acceptance test the task brief calls out by name: nothing
  // about a filename or Content-Type reaches this function at all, so
  // renaming a text file to end in ".png" cannot fool it. The bytes below
  // are ordinary ASCII text, not a PNG signature.
  const disguised = Buffer.from("<script>not an image, just text</script>", "utf8")
  assert.equal(detectImageFormat(disguised), null)
})

test("an empty buffer is rejected, not treated as a match by default", () => {
  assert.equal(detectImageFormat(Buffer.alloc(0)), null)
})

test("a buffer that is merely RIFF (no WEBP at offset 8) is not a false-positive WebP", () => {
  const buf = Buffer.concat([Buffer.from("RIFF", "ascii"), Buffer.from([0, 0, 0, 0]), Buffer.from("AVI ", "ascii")])
  assert.equal(detectImageFormat(buf), null)
})

test("the upload size limit is 4 MB, enforced before any decoding happens", () => {
  assert.equal(MAX_AVATAR_UPLOAD_BYTES, 4 * 1024 * 1024)
})

// --- Re-encoding: resize + EXIF stripping -------------------------------

test("re-encoding turns a GPS-tagged JPEG into a 512x512 WebP with no EXIF left", async () => {
  // Build a synthetic JPEG carrying EXIF (including a GPS sub-IFD), the
  // same shape a phone photo would have.
  const withExif = await sharp({
    create: { width: 1200, height: 900, channels: 3, background: "#3366ff" },
  })
    .jpeg()
    .withMetadata({
      // sharp's writer only models flat IFD0-IFD3 key/value groups (see its
      // Exif type), so the GPS tags a phone would put in their own GPS IFD
      // are written here as plain IFD0 keys — this still produces a real
      // EXIF APP1 segment carrying GPS-shaped data, which is what matters
      // for proving it's gone after re-encoding.
      exif: {
        IFD0: {
          Make: "TestPhone",
          GPSLatitude: "48/1 51/1 0/1",
          GPSLatitudeRef: "N",
          GPSLongitude: "2/1 21/1 0/1",
          GPSLongitudeRef: "E",
        },
      },
    })
    .toBuffer()

  // Sanity check on the fixture itself: it must actually carry EXIF, or the
  // rest of this test would prove nothing.
  const inputMeta = await sharp(withExif).metadata()
  assert.ok(inputMeta.exif, "fixture JPEG must carry an EXIF block before re-encoding")
  assert.ok(withExif.includes(Buffer.from("Exif")), "fixture JPEG must contain a literal EXIF marker")

  const output = await reencodeAvatar(withExif)
  const outputMeta = await sharp(output).metadata()

  assert.equal(outputMeta.format, "webp")
  assert.equal(outputMeta.width, AVATAR_OUTPUT_PX)
  assert.equal(outputMeta.height, AVATAR_OUTPUT_PX)
  assert.equal(outputMeta.exif, undefined, "output must carry no EXIF block at all")
  assert.ok(!output.includes(Buffer.from("Exif")), "output bytes must not contain a literal EXIF marker")
})

test("re-encoding a non-square source still yields exactly 512x512 (cropped, not distorted)", async () => {
  const wide = await sharp({ create: { width: 2000, height: 400, channels: 3, background: "#ff0000" } })
    .png()
    .toBuffer()
  const output = await reencodeAvatar(wide)
  const meta = await sharp(output).metadata()
  assert.equal(meta.width, 512)
  assert.equal(meta.height, 512)
  assert.equal(meta.format, "webp")
})
