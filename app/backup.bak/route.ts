// The backup file we "forgot" at the site root.
//
// It is one of the most common deployment mistakes: you copy `config.php` to
// `config.php.bak` before editing it, and the server -- which does not know
// how to interpret a `.bak` -- serves it as it is, in the clear. The secret
// `SIN-BACKUP-FILE` is learned by trying the address.
//
// Nothing real is exposed here: this is not a file but a route that contains
// only the code, read from the database. The flaw is illustrated, never
// created.
//
// The `.bak` extension is the lesson, not an oversight: this directory is a
// hunt placement. `lib/secret-placements.ts` declares the `backup-file` slug,
// db/seeds/secrets.ts advertises `/backup.bak` to players as the address of
// SIN-BACKUP-FILE, and scripts/check-file-headers.mjs skips this directory by
// name. Deleting it would 404 an address the game hands out.
import { getPlacedCodes } from "@/lib/secret-placements"

export const dynamic = "force-dynamic"

export async function GET() {
  const codes = await getPlacedCodes(["backup-file"])
  const body = [
    "# sauvegarde — laissée là par erreur, comme sur beaucoup de vrais serveurs",
    "# (ici c'est une démonstration : il n'y a aucune vraie donnée dans ce fichier)",
    "",
    `SECRET=${codes["backup-file"] ?? "indisponible"}`,
    "",
  ].join("\n")
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  })
}
