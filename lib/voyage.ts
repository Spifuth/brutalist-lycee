// What actually happens between "tu tapes une adresse" and "la page s'affiche",
// and — the part that matters — who can see what at each moment.
//
// The visibility matrix is data rather than prose because it is the thing that
// can quietly become false. tests/voyage.test.ts asserts the two claims this
// page exists to make: after the TLS handshake nobody but the destination can
// read the content, and your provider still knows WHICH site you opened. A
// page that loses the second half oversells encryption, which is exactly the
// misunderstanding that sells VPNs.

export type ObserverKey = "voisin" | "fai" | "dns" | "site"

/** What an observer can make of the traffic at a given moment. */
export type Visibility = "rien" | "domaine" | "ip" | "contenu"

export const OBSERVERS: Record<ObserverKey, { label: string; detail: string }> = {
  voisin: {
    label: "Quelqu'un sur le même Wi-Fi",
    detail: "Le Wi-Fi du lycée, d'un café, d'une gare. Il capte les ondes, comme toi.",
  },
  fai: {
    label: "Ton opérateur",
    detail: "Orange, Free, SFR, Bouygues, ou le réseau de l'établissement. Tout passe par lui.",
  },
  dns: {
    label: "Le résolveur DNS",
    detail: "L'annuaire à qui ton appareil demande l'adresse. Souvent celui de ton opérateur.",
  },
  site: {
    label: "Le site visité",
    detail: "Le serveur au bout du voyage.",
  },
}

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  rien: "rien",
  domaine: "le nom du site",
  ip: "l'adresse IP",
  contenu: "tout le contenu",
}

export interface Sighting {
  observer: ObserverKey
  sees: Visibility
  note: string
}

export interface Step {
  id: string
  /** Short label for the timeline. */
  label: string
  title: string
  what: string
  /** What is literally on the wire at this moment. */
  wire: string[]
  encrypted: boolean
  sees: Sighting[]
}

export const STEPS: Step[] = [
  {
    id: "saisie",
    label: "Saisie",
    title: "Tu tapes une adresse",
    what: "Ton navigateur a un nom, « lycee.nebulahost.tech », et rien d'autre. Un nom ne sert à rien pour router quoi que ce soit : le réseau ne sait acheminer que vers des numéros. Il faut d'abord traduire.",
    wire: ["(rien n'est encore parti de ta machine)"],
    encrypted: false,
    sees: [
      { observer: "voisin", sees: "rien", note: "Rien n'a encore été émis." },
      { observer: "fai", sees: "rien", note: "Rien n'a encore été émis." },
      { observer: "dns", sees: "rien", note: "Pas encore sollicité." },
      { observer: "site", sees: "rien", note: "Il ignore ton existence." },
    ],
  },
  {
    id: "dns",
    label: "DNS",
    title: "L'annuaire traduit le nom",
    what: "Ta machine demande à un résolveur : « c'est quoi l'adresse de lycee.nebulahost.tech ? ». Par défaut cette question part en clair. C'est la première fuite du voyage, et elle a lieu avant même que la connexion au site existe.",
    wire: ["QUESTION  lycee.nebulahost.tech  A", "RÉPONSE   lycee.nebulahost.tech  A  51.68.xx.xx"],
    encrypted: false,
    sees: [
      { observer: "voisin", sees: "domaine", note: "La question passe en clair sur le Wi-Fi : il lit le nom." },
      { observer: "fai", sees: "domaine", note: "C'est souvent lui le résolveur ; sinon il voit quand même passer la question." },
      { observer: "dns", sees: "domaine", note: "C'est littéralement son métier : il apprend chaque site que tu ouvres." },
      { observer: "site", sees: "rien", note: "Il n'est pas dans la boucle." },
    ],
  },
  {
    id: "tcp",
    label: "TCP",
    title: "La poignée de main",
    what: "Ton appareil et le serveur se mettent d'accord sur le fait de se parler, en trois messages. Rien d'utile n'a encore été échangé — c'est un « allô ? / oui ? / on y va ».",
    wire: ["→ SYN      ton IP → 51.68.xx.xx:443", "← SYN-ACK  51.68.xx.xx → ton IP", "→ ACK      ton IP → 51.68.xx.xx"],
    encrypted: false,
    sees: [
      { observer: "voisin", sees: "ip", note: "Il voit à quelle adresse tu te connectes, et à quel port." },
      { observer: "fai", sees: "ip", note: "Il achemine les paquets : impossible qu'il ignore la destination." },
      { observer: "dns", sees: "rien", note: "Son travail est terminé." },
      { observer: "site", sees: "ip", note: "Il découvre ton adresse IP." },
    ],
  },
  {
    id: "tls",
    label: "TLS",
    title: "On ferme l'enveloppe",
    what: "Le serveur présente son certificat, les deux camps fabriquent une clé commune, et à partir d'ici tout ce qui passe est chiffré. C'est le « s » de HTTPS et le cadenas du navigateur. Le nom du site, lui, voyage encore en clair au début de cette étape pour que le serveur sache quel certificat présenter.",
    wire: [
      "→ ClientHello   sni=lycee.nebulahost.tech",
      "← Certificate   CN=nebulahost.tech  (signé par une autorité)",
      "→ Finished      [chiffré à partir d'ici]",
    ],
    encrypted: true,
    sees: [
      { observer: "voisin", sees: "domaine", note: "Le nom demandé passe en clair dans le ClientHello — mais plus rien après." },
      { observer: "fai", sees: "domaine", note: "Même chose : il sait OÙ tu vas, il ne saura pas ce que tu y fais." },
      { observer: "dns", sees: "rien", note: "Hors circuit." },
      { observer: "site", sees: "contenu", note: "C'est lui qui détient l'autre moitié de la clé." },
    ],
  },
  {
    id: "requete",
    label: "Requête",
    title: "La demande part, sous enveloppe",
    what: "Le navigateur envoie enfin sa vraie question : quelle page, avec quels cookies, depuis quel navigateur. Tout cela est dans l'enveloppe chiffrée. Un observateur ne voit qu'un bloc d'octets illisible de la bonne taille.",
    wire: [
      "GET /profil HTTP/2",
      "host: lycee.nebulahost.tech",
      "cookie: session=…",
      "(le tout chiffré : sur le câble, c'est du bruit)",
    ],
    encrypted: true,
    sees: [
      { observer: "voisin", sees: "ip", note: "Un bloc chiffré vers une IP connue. Ni la page, ni le cookie." },
      { observer: "fai", sees: "domaine", note: "Il sait que tu parles à ce site, pas que tu as ouvert /profil." },
      { observer: "dns", sees: "rien", note: "Hors circuit." },
      { observer: "site", sees: "contenu", note: "Il lit la requête entière : page, cookies, navigateur." },
    ],
  },
  {
    id: "reponse",
    label: "Réponse",
    title: "La page revient",
    what: "Le serveur répond avec le HTML, puis le navigateur redemande le CSS, les polices, les images. Chaque ressource est un aller-retour de plus, dans la même enveloppe chiffrée.",
    wire: ["HTTP/2 200", "content-type: text/html; charset=utf-8", "<!doctype html> …", "(chiffré, comme la requête)"],
    encrypted: true,
    sees: [
      { observer: "voisin", sees: "ip", note: "Il mesure la taille et le rythme, pas le contenu." },
      { observer: "fai", sees: "domaine", note: "Toujours le même savoir : la destination, pas la conversation." },
      { observer: "dns", sees: "rien", note: "Hors circuit." },
      { observer: "site", sees: "contenu", note: "Il sait exactement ce qu'il t'a envoyé." },
    ],
  },
  {
    id: "rendu",
    label: "Rendu",
    title: "Le navigateur dessine",
    what: "Le HTML devient une structure, le CSS l'habille, le JavaScript l'anime. Tout se passe sur ta machine — et c'est aussi là que les traceurs éventuels s'exécutent, avec les droits que la page leur donne.",
    wire: ["(plus rien sur le réseau : le travail est local)"],
    encrypted: true,
    sees: [
      { observer: "voisin", sees: "rien", note: "Il n'y a plus de trafic à écouter." },
      { observer: "fai", sees: "rien", note: "Plus rien ne passe pour cette page." },
      { observer: "dns", sees: "rien", note: "Hors circuit." },
      { observer: "site", sees: "contenu", note: "Ses scripts tournent chez toi et peuvent le lui rapporter." },
    ],
  },
]
