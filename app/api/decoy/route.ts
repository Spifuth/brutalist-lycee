// A decoy request: it exists only to be seen.
//
// Two of the hunt's secrets live here. `SIN-NETWORK-SPY` is learned by
// opening the Network tab of the developer tools -- the /chasse page fires
// this request on load, and its body carries the code. `SIN-HEADER-CUSTOM`
// is learned by unfolding the headers of that same response: an HTTP
// response does not carry only the page.
//
// The codes come from the database, never from the repository (see
// lib/secret-placements).
import { getPlacedCodes } from "@/lib/secret-placements"

export const dynamic = "force-dynamic"

export async function GET() {
  const codes = await getPlacedCodes(["network", "header"])
  return new Response(
    JSON.stringify(
      {
        note: "Cette requête ne sert à rien d'autre qu'à être regardée. Tu viens de trouver une cachette.",
        secret: codes.network ?? null,
        indice: "Les en-têtes de cette réponse en cachent un deuxième.",
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        // The second secret. A custom header is nothing exotic: it is
        // exactly how an application carries information that the page
        // does not display.
        ...(codes.header ? { "x-custom-secret": codes.header } : {}),
      },
    },
  )
}
