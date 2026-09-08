// Requête leurre : elle n'existe que pour être vue.
//
// Deux secrets de la chasse tiennent ici. `SIN-NETWORK-SPY` s'apprend en
// ouvrant l'onglet Réseau des outils de développement — la page /chasse
// déclenche cette requête au chargement, et sa réponse porte le code.
// `SIN-HEADER-CUSTOM` s'apprend en dépliant les en-têtes de cette même
// réponse : une réponse HTTP ne transporte pas que la page.
//
// Les codes viennent de la base, jamais du dépôt (voir lib/secret-placements).
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
        // Le deuxième secret. Un en-tête maison n'a rien d'exotique : c'est
        // exactement comme ça qu'une application transporte des informations
        // que la page n'affiche pas.
        ...(codes.header ? { "x-custom-secret": codes.header } : {}),
      },
    },
  )
}
