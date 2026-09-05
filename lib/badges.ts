// SWAP POINT: badge collection is planned but not yet earned for real.
// For now every badge is mocked with a deterministic "unlocked" flag derived
// from the profile so the collection looks alive.

export interface Badge {
  id: string
  label: string
  desc: string
  category: "cyber" | "ia" | "reseau" | "communaute" | "special"
}

export const BADGES: Badge[] = [
  { id: "first-login", label: "Première connexion", desc: "Tu as créé ton identité locale.", category: "communaute" },
  { id: "survey-court", label: "Sondé·e", desc: "Questionnaire court terminé.", category: "communaute" },
  { id: "survey-moyen", label: "Curieux·se", desc: "Questionnaire moyen terminé.", category: "communaute" },
  { id: "survey-complet", label: "À fond", desc: "Questionnaire complet terminé.", category: "communaute" },
  { id: "voter", label: "Électeur·rice", desc: "Tu as voté pour des sujets.", category: "communaute" },
  { id: "quiz-first", label: "Premier quiz", desc: "Un quiz terminé.", category: "cyber" },
  { id: "quiz-perfect", label: "Sans faute", desc: "100 % à un quiz.", category: "cyber" },
  { id: "quiz-all", label: "Encyclopédie", desc: "Tous les quiz terminés.", category: "cyber" },
  { id: "phishing-pro", label: "Anti-phishing", desc: "Repère les arnaques les yeux fermés.", category: "cyber" },
  { id: "password-master", label: "Coffre-fort", desc: "Expert·e des mots de passe.", category: "cyber" },
  { id: "crypto-init", label: "Chiffreur·se", desc: "Comprend le chiffrement.", category: "cyber" },
  { id: "ia-aware", label: "IA lucide", desc: "Connaît les limites des IA.", category: "ia" },
  { id: "prompt-artist", label: "Prompteur·se", desc: "Sait écrire de bonnes consignes.", category: "ia" },
  { id: "deepfake-hunter", label: "Détecteur", desc: "Repère les deepfakes.", category: "ia" },
  { id: "net-explorer", label: "Explorateur·rice", desc: "Comprend le voyage d'une donnée.", category: "reseau" },
  { id: "dns-whisper", label: "DNS", desc: "Maîtrise l'annuaire d'Internet.", category: "reseau" },
  { id: "https-guard", label: "Cadenas", desc: "Sait ce que garantit HTTPS.", category: "reseau" },
  { id: "terminal-init", label: "Shell", desc: "Première commande dans le terminal.", category: "reseau" },
  { id: "terminal-pro", label: "Ligne de commande", desc: "À l'aise dans le terminal.", category: "reseau" },
  { id: "asker", label: "Questionneur·se", desc: "A posé une question au mur.", category: "communaute" },
  { id: "helper", label: "Entraide", desc: "A voté pour des questions.", category: "communaute" },
  { id: "night-owl", label: "Noctambule", desc: "Actif·ve tard le soir.", category: "special" },
  { id: "secret", label: "Easter egg", desc: "A trouvé la page secrète.", category: "special" },
  { id: "legend", label: "Légende", desc: "A tout débloqué.", category: "special" },
]

// Avatars come from the self-hosted DiceBear instance, never from
// api.dicebear.com — this site serves minors and must not leak their
// browsing to a third party. scripts/check-no-external-origins.mjs
// enforces that, and this is currently the only finding it reports.
//
// The self-hosted instance is DiceBear v10 (verified from
// /app/package.json in the container: @dicebear/converter ^10.5.0).
// The bundle shipped "9.x", which 404s. Note the image tag
// `dicebear/api:4.11` is the API app version, NOT the DiceBear version.
//
// IMPORTANT: NEXT_PUBLIC_* variables are inlined by Next.js at BUILD time,
// not read at runtime. This expression is correct for local development
// via .env.local, but the compiled fallback is what ships in the Docker
// image (the Dockerfile passes no build ARG for NEXT_PUBLIC_DICEBEAR_URL).
// Setting NEXT_PUBLIC_DICEBEAR_URL in a compose file or container env has
// no effect. To change the DiceBear host: either edit this constant and
// rebuild the image, or add a Dockerfile ARG and pass it during build.
const DICEBEAR_BASE =
  process.env.NEXT_PUBLIC_DICEBEAR_URL || "https://lycee.nebulahost.tech/dicebear"

export function dicebearUrl(seed: string): string {
  const s = encodeURIComponent(seed || "anonyme")
  return `${DICEBEAR_BASE}/10.x/pixel-art/svg?seed=${s}&backgroundType=solid`
}
