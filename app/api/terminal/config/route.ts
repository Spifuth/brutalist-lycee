// Read at request time, not build time: NEXT_PUBLIC_* is inlined by
// `next build`, which would make "enable the gateway" require a rebuild and
// redeploy of the image instead of a compose edit plus a restart. This
// route reads the plain server env var per request, so the browser can
// discover the current wiring without ever seeing a baked-in value.
export const dynamic = "force-dynamic"

export async function GET() {
  const wsUrl = process.env.TERMINAL_WS_URL || null
  return Response.json({ wsUrl })
}
