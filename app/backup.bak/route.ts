// Le fichier de sauvegarde qu'on a « oublié » à la racine.
//
// C'est une des erreurs de mise en ligne les plus courantes : on copie
// `config.php` en `config.php.bak` avant de le modifier, et le serveur, qui ne
// sait pas interpréter un `.bak`, le sert tel quel — en clair. Le secret
// `SIN-BACKUP-FILE` s'apprend en essayant l'adresse.
//
// Ici, rien de réel n'est exposé : ce n'est pas un fichier mais une route qui
// ne contient que le code, lu en base. La faille est illustrée, jamais créée.
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
