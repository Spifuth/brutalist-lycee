// What the terminal page is allowed to do right now, answered per request.
//
// Two different people can each veto this feature -- the operator decides
// whether it is wired up at all, the teacher decides whether the class is
// using it this hour -- and this endpoint is the one place their two answers
// are combined into something a browser can act on.
//
// The generalisable part is the shape of the reply: it returns the result
// *and* one of the inputs, because "you cannot connect" has more than one
// cause and the page has to say different things about them. A toggle that
// renders itself disabled for the wrong reason is a lie the user cannot
// debug. When one outcome has several causes, return the cause too.
//
// Public, like the page it serves, and it carries no credential.

import { isTerminalOpen } from "@/lib/settings"

// Read at request time, not build time: NEXT_PUBLIC_* is inlined by
// `next build`, which would make "enable the gateway" require a rebuild and
// redeploy of the image instead of a compose edit plus a restart. This
// route reads the plain server env var per request, so the browser can
// discover the current wiring without ever seeing a baked-in value.
export const dynamic = "force-dynamic"

export async function GET() {
  // Two keys, deliberately never merged into one:
  //   - TERMINAL_WS_URL (env var, operator): does the gateway
  //     infrastructure exist at all? Unset today — nothing is listening.
  //   - terminal_open (settings row, teacher): is the class using it right
  //     now? Defaults closed when the row is absent (lib/settings.ts).
  // Infrastructure availability and classroom intent are different
  // decisions made by different people, and the operator's has to win: a
  // teacher flipping this on while no gateway is deployed must fall back
  // to the in-browser simulator, never get a WebSocket that hangs forever
  // against a URL nothing serves.
  const gatewayConfigured = Boolean(process.env.TERMINAL_WS_URL)
  const terminalOpen = await isTerminalOpen()
  const wsUrl = gatewayConfigured && terminalOpen ? (process.env.TERMINAL_WS_URL as string) : null

  // `gatewayConfigured` is exposed so the admin toggle can render its own
  // disabled state truthfully instead of the client inferring "is there a
  // gateway?" from a null wsUrl that also means "teacher hasn't opened it
  // yet" — those are different reasons and only the server knows which.
  return Response.json({ wsUrl, gatewayConfigured })
}
