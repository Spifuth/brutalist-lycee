import { query, queryOne } from "@/lib/db"
import { pixelBroadcast, type PixelSnapshot } from "@/lib/pixel-broadcast"
import { encodePixels, PIXELWAR_CLEARED_KEY, type Pixel } from "@/lib/pixelwar"

// Same constraints as /api/live/stream: Server Actions cannot stream, and the
// broadcaster relies on Node timers and module-scope state, so this must run
// on the Node runtime and must never be statically optimised or edge-rendered.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const TICK_MS = 1000
const HEARTBEAT_MS = 15_000

/**
 * How far back each tick looks.
 *
 * Deliberately several ticks wide rather than "since the previous tick". A
 * browser subscribes, we query the whole canvas, and the two are not atomic —
 * anything painted in that gap would be missed forever, and a missed pixel is
 * not a glitch that heals: it is a wrong colour that stays until somebody
 * paints that exact cell again. Re-sending a pixel that is already correct
 * costs one array write, so the window is generous on purpose.
 */
const CATCH_UP_MS = 10_000

async function readClearedAt(): Promise<number> {
  const row = await queryOne<{ value: unknown }>("SELECT value FROM settings WHERE key = $1", [
    PIXELWAR_CLEARED_KEY,
  ])
  const n = Number(row?.value)
  return Number.isFinite(n) ? n : 0
}

async function fullCanvas(): Promise<PixelSnapshot> {
  const rows = await query<{ x: number; y: number; color: number }>(
    "SELECT x, y, color FROM pixel_cells",
  )
  return { pixels: encodePixels(rows as Pixel[]), at: Date.now(), clearedAt: await readClearedAt() }
}

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null
  let unsubscribe: (() => void) | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null
  let closed = false

  const send = (chunk: string) => {
    if (closed || !streamController) return
    try {
      streamController.enqueue(encoder.encode(chunk))
    } catch {
      // The client vanished between the readyState check and the write.
      closed = true
    }
  }

  const sendEvent = (event: string, data: unknown) =>
    send(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  const cleanup = () => {
    if (closed) return
    closed = true
    if (heartbeat) clearInterval(heartbeat)
    // Without this the broadcaster keeps a subscriber — and therefore keeps
    // polling — for a browser that closed hours ago.
    unsubscribe?.()
    try {
      streamController?.close()
    } catch {
      /* already closed by the client going away */
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      streamController = controller
      request.signal.addEventListener("abort", cleanup)

      // One poller per process, shared by every connected canvas — that is the
      // point of the broadcaster. Registering it again is harmless.
      pixelBroadcast.setPoller(async (): Promise<PixelSnapshot> => {
        const rows = await query<{ x: number; y: number; color: number }>(
          `SELECT x, y, color FROM pixel_cells
            WHERE placed_at > now() - ($1::int * interval '1 millisecond')`,
          [CATCH_UP_MS],
        )
        return {
          pixels: encodePixels(rows as Pixel[]),
          at: Date.now(),
          clearedAt: await readClearedAt(),
        }
      }, TICK_MS)

      unsubscribe = pixelBroadcast.subscribe((snapshot) => sendEvent("tick", snapshot))

      // Proxies (Traefik fronts this) close an idle connection; a comment line
      // is a no-op for EventSource clients but keeps the socket alive.
      heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS)

      // The whole canvas once, after subscribing, so the catch-up window
      // covers the gap between the two instead of leaving one.
      sendEvent("full", await fullCanvas())
    },
    cancel() {
      // Fires when the consumer stops reading without a network-level abort
      // (EventSource.close()). cleanup() is idempotent, so whichever of this
      // and the abort listener runs first wins.
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
