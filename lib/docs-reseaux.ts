import type { DocSubject } from "./docs"

export const RESEAUX_SUBJECT: DocSubject = {
  slug: "reseaux",
  title: "Réseaux",
  command: "man network",
  description: "Comment les machines communiquent.",
  articles: [
    {
      slug: "du-nom-a-la-page",
      title: "Du nom de domaine à la page affichée",
      summary: "Ce qui se passe entre l'adresse tapée et la page visible dans ton navigateur.",
      blocks: [
        {
          type: "para",
          text:
            "Quand tu tapes une adresse dans ton navigateur, le réseau ne voit pas \"un site\" mais une suite d'étapes très concrètes : trouver une adresse IP, ouvrir une connexion, chiffrer, puis échanger des données. Comprendre ces étapes aide à savoir qui peut voir quoi.",
        },
        { type: "section", id: "adresse-ip-et-dns", text: "Adresse IP et DNS" },
        {
          type: "para",
          text:
            "Le nom de domaine (par exemple lycee.nebulahost.tech) est mémorisable pour un humain, mais les routeurs travaillent avec des adresses IP. Ton appareil commence donc par demander à un serveur DNS : \"quelle IP correspond à ce nom ?\".",
        },
        {
          type: "keylist",
          items: [
            { term: "Adresse IP", desc: "Le numéro qui permet d'acheminer les paquets vers la bonne machine." },
            { term: "DNS", desc: "L'annuaire qui traduit les noms de domaine en adresses IP." },
            { term: "Routeur", desc: "L'équipement qui choisit le prochain saut pour approcher la destination." },
          ],
        },
        { type: "section", id: "de-http-a-https", text: "De HTTP à HTTPS" },
        {
          type: "para",
          text:
            "Une fois l'IP connue, le navigateur envoie une requête HTTP. Aujourd'hui, c'est presque toujours HTTPS : le contenu de la requête et de la réponse est chiffré par TLS. Sans ce chiffrement, n'importe quel intermédiaire pourrait lire les pages, formulaires et mots de passe.",
        },
        {
          type: "code",
          label: "requête HTTP (simplifiée)",
          code: "GET /cours/reseaux HTTP/1.1\nHost: lycee.nebulahost.tech\nUser-Agent: navigateur",
        },
        {
          type: "callout",
          tone: "info",
          title: "Lien avec la page Voyage",
          text:
            "La page /voyage raconte cette chaîne pas à pas avec une frise et les observateurs. Ici, l'idée à retenir est simple : HTTPS protège le contenu, pas le fait que tu contactes tel site.",
        },
      ],
    },
    {
      slug: "wifi-et-traces-au-lycee",
      title: "Wi-Fi et traces : ce que le réseau du lycée voit",
      summary: "Même avec HTTPS, un réseau local et son opérateur observent encore certaines informations.",
      blocks: [
        {
          type: "para",
          text:
            "Se connecter au Wi-Fi du lycée, ce n'est pas \"être espionné en permanence\", mais ce n'est pas non plus \"être invisible\". Il faut distinguer le contenu de ce que tu fais, généralement chiffré, et les métadonnées, qui restent visibles pour faire fonctionner le réseau.",
        },
        { type: "section", id: "ce-qui-reste-visible", text: "Ce qui reste visible" },
        {
          type: "list",
          items: [
            "Ton adresse IP locale sur le réseau du lycée.",
            "Les adresses IP des services contactés.",
            "Le nom de domaine demandé au DNS (selon le protocole utilisé).",
            "Les horaires, volumes et fréquences de connexion.",
          ],
        },
        { type: "section", id: "ce-qui-est-cache", text: "Ce qui est caché par HTTPS" },
        {
          type: "list",
          items: [
            "Le contenu précis des pages lues.",
            "Les identifiants et mots de passe envoyés dans un formulaire HTTPS.",
            "Le texte des messages échangés dans une application web chiffrée.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "Un VPN ne rend pas invisible",
          text:
            "Un VPN chiffre entre toi et son serveur. Le lycée voit surtout \"tu parles à un VPN\" ; le fournisseur VPN voit ensuite tes destinations. Tu déplaces la confiance, tu ne supprimes pas l'observation réseau.",
        },
        { type: "section", id: "bons-reflexes", text: "Bons réflexes sur un réseau partagé" },
        {
          type: "keylist",
          items: [
            { term: "Toujours vérifier HTTPS", desc: "Cherche le cadenas et évite de te connecter à un service en HTTP." },
            { term: "Limiter les connexions sensibles", desc: "Évite les opérations critiques sur un Wi-Fi inconnu ou public." },
            { term: "Garder ses appareils à jour", desc: "Les mises à jour corrigent des failles exploitées sur les réseaux partagés." },
          ],
        },
      ],
    },
  ],
}
