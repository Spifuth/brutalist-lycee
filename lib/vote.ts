// Static topic catalogue for the "vote for what we cover" board.
// User picks and tallies live in the DB (see app/actions/engage.ts); `base`
// is a display-only seed so the bars look populated for a fresh class.

export interface VoteTopic {
  id: string
  label: string
  desc: string
  base: number
}

export const VOTE_TOPICS: VoteTopic[] = [
  { id: "mdp", label: "Créer un mot de passe incassable", desc: "Phrases de passe, gestionnaires, 2FA.", base: 142 },
  { id: "phishing", label: "Repérer les arnaques & le phishing", desc: "SMS, mails piégés, faux sites.", base: 168 },
  { id: "hack-demo", label: "Démo de « hacking » en direct", desc: "Voir une attaque simple expliquée.", base: 203 },
  { id: "reseaux-sociaux", label: "Sécuriser ses réseaux sociaux", desc: "Paramètres, traces, réputation.", base: 155 },
  { id: "ia-fonctionne", label: "Comment fonctionne une IA", desc: "Modèles, données, hallucinations.", base: 176 },
  { id: "ia-triche", label: "IA et devoirs : où est la limite ?", desc: "Usage honnête vs triche.", base: 121 },
  { id: "deepfake", label: "Deepfakes & fausses images", desc: "Détecter le faux, se protéger.", base: 149 },
  { id: "vie-privee", label: "Vie privée & données personnelles", desc: "Qui collecte quoi, pourquoi.", base: 98 },
  { id: "metiers", label: "Les métiers de la cyber", desc: "Pentester, analyste SOC, forensic.", base: 110 },
  { id: "terminal", label: "Apprendre à utiliser un terminal", desc: "Commandes Linux de base.", base: 87 },
  { id: "code", label: "Écrire son premier programme", desc: "Python, logique, algorithmes.", base: 133 },
  { id: "jeux", label: "Sécurité dans les jeux en ligne", desc: "Comptes, arnaques, triche.", base: 164 },
  { id: "crypto", label: "Chiffrement & messages secrets", desc: "Comment on protège un message.", base: 76 },
  { id: "wifi", label: "Wi-Fi public : quels risques ?", desc: "Interception, faux réseaux.", base: 69 },
  { id: "objets", label: "Objets connectés & maison", desc: "Caméras, assistants, risques.", base: 58 },
]

export const MAX_PICKS = 3
