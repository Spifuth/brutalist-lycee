import { queryOne } from "@/lib/db"
import { readAvatarFile } from "@/lib/avatar-storage"

// Reads a file from disk per request — must run on the Node runtime, and
// must never be statically optimised (the result depends on the current DB
// row and can change the moment an admin removes a photo).
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface AvatarRow {
  avatar_file: string | null
}

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  let row: AvatarRow | null
  try {
    row = await queryOne<AvatarRow>("SELECT avatar_file FROM users WHERE id = $1", [userId])
  } catch {
    // Malformed userId (not a UUID) fails the query rather than the lookup —
    // that's still "no avatar here", not a server error.
    return new Response(null, { status: 404 })
  }

  if (!row?.avatar_file) {
    return new Response(null, { status: 404 })
  }

  const data = await readAvatarFile(row.avatar_file)
  if (!data) {
    // DB says there's a file but it's not on disk (shouldn't happen — see
    // processAvatarUpload's write-then-update ordering — but a 404 is the
    // correct fallback if it ever does).
    return new Response(null, { status: 404 })
  }

  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(data.byteLength),
      // Deliberately NOT a long/immutable cache. Removal is the ONLY control
      // this feature has — there is no approval queue — so a stale cache
      // that keeps serving a removed photo out of a student's browser would
      // defeat that control. `no-store` means every request re-checks with
      // the server: a removal (or a replacement) is visible on the very
      // next load, at the cost of re-sending a small (512×512 WebP) file
      // each time, which is cheap at this scale.
      "Cache-Control": "private, no-store",
    },
  })
}
