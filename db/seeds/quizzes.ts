// Canonical quiz content (seed source of truth). The app reads quizzes from the
// database; this file defines the starting set and is re-run by db/seed.ts.
// Add quizzes here for version-controlled defaults, or create them live in the
// admin console (Quiz tab).

export interface QuizQuestionSeed {
  prompt: string
  options: string[]
  correct: number
  explanation: string
}

export interface QuizSeed {
  slug: string
  title: string
  topic: string
  level: string
  description: string
  badgeSlug?: string
  questions: QuizQuestionSeed[]
}

export const QUIZ_SEEDS: QuizSeed[] = [
  {
    slug: "cyber-bases",
    title: "Les bases de la cyber",
    topic: "Cybersécurité",
    level: "tous",
    description: "Mots de passe, phishing et bons réflexes du quotidien.",
    badgeSlug: "quiz-first",
    questions: [
      {
        prompt: "Quel mot de passe est le plus solide ?",
        options: ["Azerty123", "P@ss!", "orage-cobalt-lynx-ardoise", "ton prénom + année"],
        correct: 2,
        explanation:
          "Une phrase de passe longue de plusieurs mots est bien plus difficile à casser qu'un mot court, même compliqué.",
      },
      {
        prompt: "Tu reçois un mail « urgent » de ta banque avec un lien. Que fais-tu ?",
        options: [
          "Je clique tout de suite",
          "Je vais sur le site de la banque en tapant l'adresse moi-même",
          "Je réponds avec mon numéro de carte",
          "Je transfère à mes amis",
        ],
        correct: 1,
        explanation: "On n'utilise jamais le lien d'un message suspect. On se rend directement sur le site officiel.",
      },
      {
        prompt: "À quoi sert la double authentification (2FA) ?",
        options: [
          "À rendre le site plus rapide",
          "À ajouter une 2e preuve d'identité en plus du mot de passe",
          "À changer de mot de passe automatiquement",
          "À supprimer les pubs",
        ],
        correct: 1,
        explanation: "La 2FA demande une seconde preuve (code, appli) : même volé, ton mot de passe ne suffit plus.",
      },
      {
        prompt: "Lequel est un signe fréquent de phishing ?",
        options: ["Un ton calme", "Une adresse officielle", "Un sentiment d'urgence", "Aucune faute"],
        correct: 2,
        explanation: "Les arnaques jouent sur l'urgence pour t'empêcher de réfléchir.",
      },
      {
        prompt: "Tu trouves une clé USB inconnue dans la cour du lycée. Que fais-tu ?",
        options: [
          "Je la donne à la vie scolaire sans la brancher",
          "Je la branche sur mon PC pour voir ce qu'il y a",
          "Je la garde et l'utilise",
          "Je la formate direct",
        ],
        correct: 0,
        explanation:
          "Une clé USB inconnue peut contenir un programme malveillant qui s'exécute dès qu'elle est branchée : mieux vaut la remettre à un adulte sans la brancher.",
      },
      {
        prompt: "Pourquoi faut-il installer les mises à jour de son système et de ses applis ?",
        options: [
          "Elles ajoutent toujours de la pub",
          "Elles ralentissent l'appareil exprès",
          "Elles corrigent des failles de sécurité connues",
          "Elles ne servent à rien",
        ],
        correct: 2,
        explanation:
          "Les mises à jour corrigent des vulnérabilités que des attaquants pourraient exploiter : les repousser laisse la porte ouverte.",
      },
      {
        prompt: "Qu'est-ce qu'un rançongiciel (ransomware) ?",
        options: [
          "Un logiciel qui accélère l'ordinateur",
          "Un antivirus gratuit",
          "Un jeu vidéo piraté",
          "Un programme qui bloque ou chiffre tes fichiers puis réclame de l'argent",
        ],
        correct: 3,
        explanation:
          "Un rançongiciel chiffre tes données et exige une rançon pour les débloquer ; la meilleure protection reste une sauvegarde régulière hors ligne.",
      },
      {
        prompt: "Ton meilleur ami te demande ton mot de passe pour « juste vérifier un truc ». Que fais-tu ?",
        options: [
          "Je lui donne, c'est mon ami",
          "Je refuse : un mot de passe ne se partage jamais, même avec un proche",
          "Je lui donne un mot de passe différent du vrai",
          "Je le change juste après lui avoir donné",
        ],
        correct: 1,
        explanation:
          "Un mot de passe reste strictement personnel : le partager casse la sécurité même si l'intention est bonne, et tu ne contrôles plus qui le connaît ensuite.",
      },
    ],
  },
  {
    slug: "ia-comprendre",
    title: "Comprendre l'IA",
    topic: "Intelligence artificielle",
    level: "tous",
    description: "Fonctionnement, limites et usages d'une IA générative.",
    badgeSlug: "ia-aware",
    questions: [
      {
        prompt: "Une IA générative, en simplifiant, ça fait quoi ?",
        options: [
          "Elle réfléchit comme un humain",
          "Elle prédit le mot suivant le plus probable",
          "Elle copie Internet en direct",
          "Elle dit toujours la vérité",
        ],
        correct: 1,
        explanation: "Un modèle de langage calcule des probabilités de mots ; il ne « comprend » pas comme nous.",
      },
      {
        prompt: "Comment appelle-t-on une info fausse inventée par une IA ?",
        options: ["Un bug", "Une hallucination", "Un virus", "Un cache"],
        correct: 1,
        explanation: "On parle d'hallucination : l'IA peut affirmer une fausseté avec assurance.",
      },
      {
        prompt: "Quel est le meilleur réflexe avec une réponse d'IA ?",
        options: ["La recopier telle quelle", "La vérifier avec une source fiable", "Toujours la refuser", "La partager vite"],
        correct: 1,
        explanation: "On garde son esprit critique : on recoupe avec une source de confiance.",
      },
      {
        prompt: "Une IA de génération d'images a été entraînée sur…",
        options: [
          "Un immense ensemble d'images existantes analysées pendant l'entraînement",
          "Rien, elle invente à partir de zéro",
          "Une seule photo que tu lui donnes",
          "Une base de données mise à jour en temps réel pendant que tu discutes",
        ],
        correct: 0,
        explanation:
          "Le modèle apprend des motifs statistiques à partir de millions d'images vues pendant l'entraînement ; il ne se connecte pas à Internet en direct pour créer.",
      },
      {
        prompt: "Pourquoi une IA peut-elle donner des réponses biaisées ?",
        options: [
          "Parce qu'elle est méchante",
          "Parce qu'elle est trop lente",
          "Parce qu'elle reflète les biais présents dans ses données d'entraînement",
          "Parce qu'elle manque de mémoire vive",
        ],
        correct: 2,
        explanation:
          "Une IA apprend à partir de données produites par des humains : si ces données contiennent des biais, le modèle peut les reproduire.",
      },
      {
        prompt: "Qu'est-ce qui distingue une IA générative d'un moteur de recherche classique ?",
        options: [
          "Ils fonctionnent exactement pareil",
          "L'IA ne peut jamais se tromper contrairement au moteur de recherche",
          "Le moteur de recherche est plus récent que l'IA",
          "Le moteur de recherche renvoie des pages existantes, l'IA génère un texte nouveau à partir de probabilités",
        ],
        correct: 3,
        explanation:
          "Un moteur de recherche indexe et renvoie des pages qui existent déjà ; une IA générative produit un texte inédit en prédisant, mot après mot, la suite la plus probable.",
      },
      {
        prompt: "Qu'est-ce que le « prompt » dans une conversation avec une IA ?",
        options: ["Le nom du modèle", "L'instruction ou la question que tu tapes pour obtenir une réponse", "Un bug d'affichage", "La note donnée à la réponse"],
        correct: 1,
        explanation: "Le prompt est ton texte d'entrée : sa formulation influence beaucoup la qualité de la réponse générée.",
      },
      {
        prompt: "Ton IA préférée te donne un conseil de santé précis. Quel est le bon réflexe ?",
        options: [
          "Suivre le conseil immédiatement",
          "Le partager comme vérité à tes amis",
          "Le confronter à l'avis d'un professionnel de santé avant d'agir",
          "Changer d'IA pour avoir un deuxième avis automatique",
        ],
        correct: 2,
        explanation:
          "Une IA générative n'est pas un médecin : pour tout sujet important (santé, droit, argent), on vérifie toujours auprès d'un professionnel humain.",
      },
    ],
  },
  {
    slug: "reseaux",
    title: "Internet & réseaux",
    topic: "Comment ça marche",
    level: "tous",
    description: "Du clic au serveur : le vocabulaire essentiel.",
    badgeSlug: "net-explorer",
    questions: [
      {
        prompt: "À quoi sert le DNS ?",
        options: ["À chiffrer les messages", "À traduire un nom de site en adresse IP", "À bloquer les pubs", "À accélérer le Wi-Fi"],
        correct: 1,
        explanation: "Le DNS est l'annuaire d'Internet : il relie un nom (exemple.fr) à une adresse IP.",
      },
      {
        prompt: "Que garantit le « https » avec le cadenas ?",
        options: ["Que le site est honnête", "Que la connexion est chiffrée", "Que le site est français", "Que le site est gratuit"],
        correct: 1,
        explanation: "HTTPS chiffre la connexion, mais ne prouve pas que le site est fiable.",
      },
      {
        prompt: "Une donnée qui voyage sur le réseau est découpée en…",
        options: ["Pixels", "Paquets", "Cookies", "Tokens"],
        correct: 1,
        explanation: "Les données circulent en petits paquets réassemblés à l'arrivée.",
      },
      {
        prompt: "Qu'est-ce qu'une adresse IP ?",
        options: [
          "Le nom de ton ordinateur",
          "Un mot de passe réseau",
          "Le nom du site que tu visites",
          "Un identifiant numérique qui permet de localiser un appareil sur un réseau",
        ],
        correct: 3,
        explanation: "Chaque appareil connecté a une adresse IP qui sert à l'identifier et à router les données vers lui.",
      },
      {
        prompt: "Que fait un routeur Wi-Fi à la maison ?",
        options: [
          "Il relie tes appareils entre eux et à Internet",
          "Il chiffre automatiquement tout ton trafic Internet",
          "Il bloque tous les virus",
          "Il stocke tes mots de passe",
        ],
        correct: 0,
        explanation: "Le routeur distribue la connexion Internet à tes appareils et fait circuler les données entre eux et le réseau extérieur.",
      },
      {
        prompt: "Quelle est la différence entre le Wi-Fi et la 4G/5G ?",
        options: [
          "Aucune, c'est pareil",
          "La 4G/5G est toujours plus rapide que le Wi-Fi",
          "Le Wi-Fi utilise un réseau local (box), la 4G/5G passe par le réseau de l'opérateur mobile",
          "Le Wi-Fi ne fonctionne qu'en intérieur",
        ],
        correct: 2,
        explanation: "Le Wi-Fi te connecte à une box locale reliée à Internet, tandis que la 4G/5G utilise directement les antennes de ton opérateur mobile.",
      },
      {
        prompt: "À quoi sert un VPN ?",
        options: [
          "À augmenter la vitesse de ton forfait mobile",
          "À créer un tunnel chiffré entre ton appareil et un serveur, masquant ton adresse IP",
          "À supprimer les virus de ton ordinateur",
          "À obtenir du Wi-Fi gratuit partout",
        ],
        correct: 1,
        explanation: "Un VPN chiffre ta connexion et la fait transiter par un serveur intermédiaire, ce qui masque ton adresse IP réelle.",
      },
      {
        prompt: "Que signifie un ping élevé quand tu joues en ligne ?",
        options: [
          "Le temps que met un signal pour faire l'aller-retour vers le serveur est long",
          "Ta connexion a un fichier corrompu",
          "Ton mot de passe est faible",
          "Ton adresse IP a changé",
        ],
        correct: 0,
        explanation: "Le ping mesure le temps de trajet aller-retour des données ; plus il est élevé, plus tu ressens de délai (lag).",
      },
    ],
  },
  {
    slug: "vie-privee",
    title: "Vie privée en ligne",
    topic: "Données personnelles",
    level: "tous",
    description: "Traces, réseaux sociaux et empreinte numérique.",
    badgeSlug: "net-explorer",
    questions: [
      {
        prompt: "Qu'est-ce que l'empreinte numérique ?",
        options: ["Ton mot de passe", "L'ensemble des traces que tu laisses en ligne", "Un type de virus", "Ta vitesse de connexion"],
        correct: 1,
        explanation: "Publications, recherches, achats, position… tout cela compose ton empreinte.",
      },
      {
        prompt: "Avant de publier une photo, le meilleur réflexe est de…",
        options: ["Ne penser à rien", "Se demander qui pourra la voir et plus tard", "Ajouter sa localisation", "Taguer tout le monde"],
        correct: 1,
        explanation: "Ce qui est publié peut rester et être partagé : on réfléchit avant.",
      },
      {
        prompt: "Que sont les cookies d'un site web ?",
        options: [
          "Des fichiers qui gâtent ton disque dur",
          "Un virus léger",
          "De petits fichiers qui mémorisent des infos sur ta visite (préférences, connexion, pub)",
          "Un type de mot de passe",
        ],
        correct: 2,
        explanation: "Les cookies stockent des informations sur ta navigation ; certains servent au confort du site, d'autres au suivi publicitaire.",
      },
      {
        prompt: "Le RGPD (règlement européen sur les données) te donne notamment le droit de…",
        options: [
          "Demander à une entreprise quelles données elle a sur toi et de les faire supprimer",
          "Obtenir gratuitement le mot de passe d'un site",
          "Obliger un site à être gratuit",
          "Empêcher tout site de fonctionner",
        ],
        correct: 0,
        explanation: "Le RGPD te donne un droit d'accès, de rectification et de suppression sur les données personnelles que détient une entreprise.",
      },
      {
        prompt: "Une appli te demande l'accès à ta localisation, tes contacts et ton micro. Le bon réflexe est de…",
        options: [
          "Tout accepter, c'est plus simple",
          "Désinstaller le téléphone",
          "Accepter puis ne plus jamais y penser",
          "Vérifier si chaque accès est utile à la fonction de l'appli avant d'accepter",
        ],
        correct: 3,
        explanation:
          "Une appli ne devrait demander que les accès nécessaires à son usage réel ; un accès injustifié (ex. lampe de poche qui veut tes contacts) est un signal d'alerte.",
      },
      {
        prompt: "La navigation privée d'un navigateur (mode incognito) protège de quoi exactement ?",
        options: [
          "Elle rend invisible sur Internet aux yeux de ton fournisseur d'accès",
          "Elle évite que l'historique et les cookies soient gardés sur ton appareil après la session",
          "Elle bloque tous les sites qui te suivent",
          "Elle chiffre tout ton trafic comme un VPN",
        ],
        correct: 1,
        explanation:
          "Le mode privé évite juste de garder une trace locale (historique, cookies) sur ton appareil : ton fournisseur d'accès et les sites visités peuvent encore te voir.",
      },
      {
        prompt: "Qu'est-ce qu'un « data broker » (courtier en données) ?",
        options: [
          "Une entreprise qui collecte et revend des données personnelles à d'autres entreprises",
          "Un antivirus",
          "Un type de mot de passe",
          "Un protocole réseau",
        ],
        correct: 0,
        explanation:
          "Ces entreprises rassemblent des données issues de multiples sources (achats, navigation, réseaux sociaux) puis les revendent, souvent pour du ciblage publicitaire.",
      },
      {
        prompt:
          "Pourquoi limiter les informations personnelles partagées publiquement en ligne (date de naissance, adresse, établissement) ?",
        options: [
          "Ça n'a aucune importance, tout le monde le fait",
          "Ça ralentit ta connexion",
          "Ces infos peuvent servir à usurper ton identité ou deviner tes mots de passe / réponses de sécurité",
          "Ça empêche seulement de recevoir de la pub",
        ],
        correct: 2,
        explanation:
          "Des infos en apparence anodines (date de naissance, ville, établissement) permettent souvent de deviner des réponses de sécurité ou de construire une usurpation d'identité crédible.",
      },
    ],
  },
  {
    slug: "phishing",
    title: "Repérer les arnaques & le phishing",
    topic: "Ingénierie sociale",
    level: "tous",
    description: "SMS, mails piégés, faux sites : apprendre à repérer l'arnaque avant de cliquer.",
    questions: [
      {
        prompt: "Tu reçois un SMS : « Colis bloqué, réglez 1,99 € ici » avec un lien. C'est probablement…",
        options: [
          "Un vrai message de La Poste",
          "Une pub normale",
          "Un message de ton opérateur mobile",
          "Un smishing (phishing par SMS) qui vise à voler tes coordonnées bancaires",
        ],
        correct: 3,
        explanation: "Ce scénario classique de « colis bloqué » est une arnaque très répandue par SMS : le petit montant sert à récupérer ta carte bancaire.",
      },
      {
        prompt: "Comment vérifier si un lien reçu par mail mène vraiment au bon site, sans cliquer dessus ?",
        options: [
          "Survoler le lien avec la souris pour voir l'adresse réelle qui s'affiche",
          "Impossible à savoir avant de cliquer",
          "Regarder la couleur du texte du lien",
          "Compter le nombre de mots du mail",
        ],
        correct: 0,
        explanation:
          "Survoler (sans cliquer) affiche l'URL réelle en bas du navigateur ou dans une info-bulle : elle révèle souvent un domaine qui n'a rien à voir avec l'expéditeur annoncé.",
      },
      {
        prompt: "Un mail te dit avoir gagné un iPhone et demande tes informations personnelles pour le recevoir. Que fais-tu ?",
        options: [
          "Je remplis le formulaire, c'est ma chance",
          "Je transfère mes informations bancaires pour les frais de port",
          "Je le signale comme spam/phishing et je ne réponds pas",
          "Je partage l'offre à toute ma classe",
        ],
        correct: 2,
        explanation: "Un gain que tu n'as pas demandé, contre des informations personnelles, est une arnaque classique : plus l'offre paraît trop belle, plus il faut se méfier.",
      },
      {
        prompt: "Tu as cliqué par erreur sur un lien de phishing et entré ton mot de passe. Quelle est la meilleure réaction immédiate ?",
        options: [
          "Ne rien faire, ce n'est pas grave",
          "Changer immédiatement ce mot de passe (et partout où il était réutilisé) puis activer la 2FA",
          "Attendre une semaine pour voir",
          "Supprimer le mail seulement",
        ],
        correct: 1,
        explanation:
          "Changer le mot de passe compromis tout de suite limite les dégâts ; si tu l'utilisais ailleurs, il faut le changer partout car les attaquants testent les mots de passe volés sur d'autres comptes.",
      },
      {
        prompt: "Qu'est-ce que le « vishing » ?",
        options: ["Un phishing qui passe par un appel téléphonique", "Un virus qui efface les photos", "Un type de mot de passe", "Une extension de navigateur"],
        correct: 0,
        explanation: "Le vishing (voice + phishing) utilise un appel téléphonique, parfois avec une voix imitée, pour te pousser à révéler des informations ou à payer.",
      },
      {
        prompt: "Un site de connexion à ta messagerie a une adresse du type « mail-secure-login.info » au lieu de l'adresse habituelle. Que dois-tu penser ?",
        options: [
          "C'est une nouvelle version officielle du site",
          "Le mot « secure » garantit que c'est fiable",
          "Aucune importance, seul le design compte",
          "C'est un signal fort de faux site (typosquatting), il ne faut rien y entrer",
        ],
        correct: 3,
        explanation: "Un nom de domaine inhabituel qui imite le vrai (typosquatting) est un des signaux les plus fiables de faux site, même si la page ressemble à l'originale.",
      },
      {
        prompt: "Scanner un QR code trouvé collé sur un parcmètre ou une affiche dans la rue, sans vérifier, comporte quel risque ?",
        options: [
          "Aucun, un QR code est toujours sûr",
          "Il ralentit ton téléphone",
          "Il peut rediriger vers un faux site de paiement qui vole tes données bancaires",
          "Il vide la batterie du téléphone",
        ],
        correct: 2,
        explanation:
          "Un QR code peut être recouvert par un autocollant piégé menant vers un faux site de paiement : on vérifie l'URL affichée avant de continuer, comme pour un lien classique.",
      },
      {
        prompt: "Pourquoi les arnaques par phishing utilisent-elles souvent le nom de grandes marques connues (banque, livraison, impôts) ?",
        options: [
          "Par hasard",
          "Parce que la confiance déjà accordée à ces marques rend le message plus crédible et pousse à agir vite",
          "Parce que ces marques envoient elles-mêmes ces mails",
          "Parce que c'est plus facile à écrire",
        ],
        correct: 1,
        explanation: "En usurpant une marque de confiance, l'arnaque profite des réflexes déjà en place chez la victime pour faire baisser sa vigilance.",
      },
    ],
  },
  {
    slug: "reseaux-sociaux",
    title: "Sécuriser ses réseaux sociaux",
    topic: "Réseaux sociaux",
    level: "tous",
    description: "Paramètres, traces et réputation : garder le contrôle sur ce que tu partages.",
    questions: [
      {
        prompt: "Ton compte est en « public » sur un réseau social. Concrètement, ça veut dire…",
        options: [
          "N'importe qui, même sans compte, peut voir ton profil et tes publications",
          "Seuls tes amis peuvent voir tes publications",
          "Le compte est payant",
          "Rien ne change par rapport au privé",
        ],
        correct: 0,
        explanation: "Un compte public rend ton contenu visible par défaut à n'importe qui, y compris des personnes que tu ne connais pas.",
      },
      {
        prompt: "Un inconnu t'envoie une demande d'ami en te proposant de « discuter en privé, juste toi et moi ». Quel est le bon réflexe ?",
        options: [
          "Accepter, ça fait toujours plaisir",
          "Donner son numéro de téléphone pour continuer ailleurs",
          "Accepter et envoyer une photo pour vérifier qu'il est sympa",
          "Rester méfiant·e, ne pas accepter et en parler à un adulte de confiance si ça insiste",
        ],
        correct: 3,
        explanation:
          "L'insistance à isoler la conversation « juste toi et moi » est un signal classique d'approche malveillante en ligne : on n'est jamais obligé d'accepter et on peut en parler.",
      },
      {
        prompt: "Publier ta localisation en temps réel sur tes stories comporte quel risque principal ?",
        options: [
          "Aucun, c'est juste pour le fun",
          "Ça révèle où tu es (ou où tu n'es pas, donc chez toi vide) à qui peut voir la story",
          "Ça consomme plus de batterie",
          "Ça améliore la qualité de la photo",
        ],
        correct: 1,
        explanation: "Partager sa position en direct informe aussi sur les lieux où tu n'es pas, comme ton domicile inoccupé au même moment.",
      },
      {
        prompt: "Que veut dire « réputation numérique » ?",
        options: [
          "Le nombre d'amis que tu as",
          "Le nombre de likes reçus",
          "L'image que les autres se font de toi à partir de ce que tu publies et de ce qu'on publie sur toi",
          "Ton pseudonyme en ligne",
        ],
        correct: 2,
        explanation:
          "Ta réputation numérique se construit avec tes propres publications, mais aussi avec ce que d'autres partagent sur toi : elle peut te suivre longtemps, y compris pour des recruteurs plus tard.",
      },
      {
        prompt: "Une photo ou vidéo gênante de toi a été publiée sans ton accord par quelqu'un d'autre. Que peux-tu faire ?",
        options: [
          "Utiliser les outils de signalement de la plateforme et en parler à un adulte ou à la police si besoin",
          "Rien, une fois en ligne c'est définitif et il faut l'accepter",
          "Créer un faux compte pour te venger",
          "Supprimer uniquement ton propre compte",
        ],
        correct: 0,
        explanation:
          "Les plateformes ont des procédures de signalement pour le contenu publié sans consentement, et cela peut aussi relever du droit à l'image : il ne faut pas rester seul·e face à ça.",
      },
      {
        prompt: "Pourquoi vaut-il mieux éviter d'accepter tous les inconnus dans ses amis/abonnés ?",
        options: [
          "Parce que ça ralentit l'appli",
          "Parce que c'est interdit par la loi",
          "Parce que ça coûte de l'argent",
          "Parce que chaque personne acceptée peut voir les infos et publications réservées à tes contacts",
        ],
        correct: 3,
        explanation: "Accepter un inconnu élargit ton cercle de confiance à quelqu'un dont tu ne connais pas les intentions, avec accès à tout ce que tu réserves à tes contacts.",
      },
      {
        prompt: "Un « faux profil » qui te contacte en usurpant l'identité d'un camarade de classe cherche le plus souvent à…",
        options: [
          "Te faire une blague sans conséquence",
          "Gagner ta confiance pour te soutirer des informations, des photos ou de l'argent",
          "Améliorer son score sur l'application",
          "Rien, c'est un bug du réseau social",
        ],
        correct: 1,
        explanation: "L'usurpation d'identité d'une personne connue est une technique d'ingénierie sociale qui exploite la confiance déjà existante pour arriver à ses fins.",
      },
      {
        prompt:
          "Avant d'ajouter une nouvelle application ou un nouveau jeu qui demande de se connecter avec ton compte réseau social, il est utile de…",
        options: [
          "Accepter directement, c'est plus rapide",
          "Changer immédiatement de mot de passe après",
          "Vérifier quelles informations et quels droits cette appli va obtenir sur ton compte",
          "Créer un deuxième compte réseau social juste pour ça, sans vérifier",
        ],
        correct: 2,
        explanation:
          "Se connecter via un réseau social donne souvent accès à ton profil, ta liste de contacts ou tes publications à l'application tierce : mieux vaut vérifier les permissions demandées.",
      },
    ],
  },
  {
    slug: "deepfake",
    title: "Deepfakes & fausses images",
    topic: "Désinformation & médias",
    level: "tous",
    description: "Détecter le contenu truqué généré par IA et adopter les bons réflexes.",
    questions: [
      {
        prompt: "Qu'est-ce qu'un deepfake ?",
        options: [
          "Une photo prise avec un filtre classique",
          "Un type de virus informatique",
          "Un contenu (image, vidéo, audio) truqué ou généré par IA pour faire croire qu'il est réel",
          "Une compression vidéo qui abîme la qualité",
        ],
        correct: 2,
        explanation: "Un deepfake utilise l'IA pour fabriquer ou modifier un contenu (souvent un visage ou une voix) et le faire passer pour authentique.",
      },
      {
        prompt: "Tu vois une vidéo où une personnalité connue semble dire quelque chose de choquant et hors de son discours habituel. Le bon réflexe est de…",
        options: [
          "Vérifier auprès de sources d'information fiables avant de la croire ou de la partager",
          "La partager immédiatement, l'info est trop importante pour attendre",
          "La croire car la vidéo a l'air très réaliste",
          "Ne rien faire car de toute façon on ne peut jamais vérifier",
        ],
        correct: 0,
        explanation: "Le réalisme visuel ne prouve rien : on recoupe avec des médias fiables avant de croire ou de relayer un contenu surprenant.",
      },
      {
        prompt: "Quel indice peut trahir un deepfake vidéo, même s'il n'est jamais garanti ?",
        options: [
          "Une vidéo trop courte",
          "Des détails bizarres autour des yeux, des dents, ou un clignement d'yeux et une synchronisation labiale peu naturels",
          "Une vidéo en noir et blanc",
          "Une vidéo tournée en extérieur",
        ],
        correct: 1,
        explanation:
          "Les générateurs actuels ont encore souvent du mal avec certains détails fins (regard, dents, bords du visage) et la synchronisation précise du son et des lèvres, même si la technologie progresse vite.",
      },
      {
        prompt: "Pourquoi les deepfakes audio (voix clonées) sont-ils particulièrement utilisés dans les arnaques téléphoniques ?",
        options: [
          "Parce qu'ils sont interdits donc rares",
          "Parce qu'ils coûtent très cher à produire",
          "Parce qu'ils ne fonctionnent qu'en vidéo",
          "Parce qu'ils imitent une voix connue (proche, patron) pour créer une fausse urgence et pousser à agir sans réfléchir",
        ],
        correct: 3,
        explanation: "Entendre une voix qu'on reconnaît (famille, direction) désactive une partie de la méfiance : c'est justement ce que ces arnaques exploitent.",
      },
      {
        prompt: "Un deepfake utilisé pour humilier ou nuire à quelqu'un (ex. visage collé sur une image dégradante) est…",
        options: [
          "Juste une blague sans conséquence légale",
          "Autorisé si le contenu original était public",
          "Potentiellement un délit (atteinte à l'image, harcèlement) qui peut être signalé et poursuivi",
          "Seulement un problème si la personne visée est majeure",
        ],
        correct: 2,
        explanation:
          "Utiliser l'image d'une personne pour créer un contenu dégradant sans son consentement peut constituer une atteinte à la vie privée ou du harcèlement, punissable par la loi, y compris entre mineurs.",
      },
      {
        prompt: "Quel est le meilleur réflexe si tu doutes de l'authenticité d'une image partagée sur les réseaux sociaux ?",
        options: [
          "Chercher si l'image ou l'info est reprise par des médias fiables ou des outils de vérification",
          "La croire si elle a beaucoup de likes",
          "L'ignorer complètement sans jamais vérifier",
          "Se fier uniquement au pseudo du compte qui l'a postée",
        ],
        correct: 0,
        explanation: "Le nombre de likes ou de partages ne dit rien sur la véracité : croiser l'info avec des sources reconnues reste le réflexe le plus fiable.",
      },
      {
        prompt: "Pourquoi les deepfakes sont-ils devenus plus difficiles à repérer ces dernières années ?",
        options: [
          "Parce que les écrans sont plus petits",
          "Parce que les modèles d'IA génératifs se sont beaucoup améliorés en réalisme",
          "Parce que les vidéos sont plus courtes",
          "Parce que personne ne les regarde attentivement",
        ],
        correct: 1,
        explanation: "Les progrès des modèles génératifs réduisent les artefacts visibles (visage, voix), ce qui rend la détection à l'œil nu de plus en plus difficile.",
      },
      {
        prompt:
          "Recevoir un message vidéo « urgent » d'un proche qui demande de l'argent immédiatement, avec une voix et un visage qui semblent être les siens, doit surtout te faire penser à…",
        options: [
          "Envoyer l'argent tout de suite, c'est un proche",
          "Répondre par vidéo pour vérifier",
          "Ignorer complètement sans jamais vérifier avec la personne",
          "Vérifier par un autre moyen de contact (appel classique, message séparé) avant d'agir, car cela peut être un deepfake",
        ],
        correct: 3,
        explanation:
          "Face à une urgence financière inhabituelle, on vérifie toujours par un canal indépendant (appeler la personne directement) avant d'agir, car voix et visage peuvent désormais être imités.",
      },
    ],
  },
  {
    slug: "ia-triche",
    title: "IA et devoirs : où est la limite ?",
    topic: "Intelligence artificielle",
    level: "tous",
    description: "Usage honnête vs triche : utiliser l'IA sans se tromper de ligne rouge.",
    questions: [
      {
        prompt:
          "Ton professeur autorise l'IA pour reformuler des idées mais pas pour rédiger le devoir entier. Tu utilises un chatbot pour écrire tout ton devoir et le rends tel quel. C'est…",
        options: [
          "Une fraude, car ça ne respecte pas la consigne donnée par le professeur",
          "Autorisé puisque tu as quand même lu le texte",
          "Sans importance tant que la note est bonne",
          "Acceptable si personne ne le remarque",
        ],
        correct: 0,
        explanation: "La règle donnée par l'enseignant définit la limite : la dépasser, même si le résultat semble correct, reste une fraude scolaire.",
      },
      {
        prompt: "Utiliser une IA pour t'expliquer une notion que tu n'as pas comprise en cours, puis refaire l'exercice toi-même, est…",
        options: [
          "Toujours interdit",
          "Aussi grave que copier un devoir entier",
          "Un usage qui t'aide à apprendre, tant que le travail final reste le tien",
          "Utile seulement pour les mathématiques",
        ],
        correct: 2,
        explanation: "Utiliser l'IA comme un outil d'explication, avant de produire soi-même le travail demandé, reste un usage qui sert l'apprentissage plutôt que de le contourner.",
      },
      {
        prompt: "Pourquoi rendre un devoir entièrement écrit par une IA, même si le texte est correct, pose un problème pour toi ?",
        options: [
          "Aucun problème, seul le résultat compte",
          "L'IA écrit toujours de meilleurs textes que les élèves",
          "C'est plus rapide donc c'est mieux",
          "Tu n'apprends pas la compétence que l'exercice était censé développer",
        ],
        correct: 3,
        explanation: "Un devoir sert à développer une compétence : la faire faire entièrement par l'IA prive de l'entraînement que l'exercice visait, même si le rendu semble bon.",
      },
      {
        prompt: "Un enseignant peut-il détecter qu'un texte a été généré par une IA ?",
        options: [
          "Jamais, c'est totalement indétectable",
          "Pas toujours de façon certaine, mais des indices existent (style trop uniforme, écart avec le niveau habituel de l'élève) et des outils de détection existent aussi, avec des limites",
          "Oui, à coup sûr et sans erreur possible",
          "Seulement si l'élève l'avoue",
        ],
        correct: 1,
        explanation:
          "La détection n'est pas fiable à 100 % (ni pour confirmer ni pour innocenter), mais un décalage de style avec le travail habituel de l'élève ou l'usage d'outils dédiés peut éveiller les soupçons.",
      },
      {
        prompt: "Si les règles d'un devoir ne précisent rien sur l'IA, le bon réflexe est de…",
        options: [
          "Demander explicitement au professeur ce qui est autorisé avant d'utiliser une IA",
          "Supposer que tout est permis",
          "Utiliser l'IA en secret",
          "Ne jamais utiliser l'IA sans exception",
        ],
        correct: 0,
        explanation: "En cas de doute sur une règle, la clarifier avec l'enseignant évite un malentendu qui peut coûter cher (devoir annulé, sanction).",
      },
      {
        prompt: "Demander à une IA de vérifier l'orthographe et la grammaire de ton propre texte, sans lui faire écrire les idées, est généralement considéré comme…",
        options: [
          "Une triche grave dans tous les cas",
          "Interdit par la loi française",
          "Comparable à l'utilisation d'un correcteur orthographique classique, donc généralement acceptable",
          "Impossible techniquement",
        ],
        correct: 2,
        explanation:
          "Corriger la forme d'un texte dont les idées viennent de toi se rapproche d'un correcteur orthographique, un outil déjà largement toléré ; le cœur du travail intellectuel reste le tien.",
      },
      {
        prompt: "Quel est le risque principal si tu t'habitues à laisser l'IA réfléchir à ta place pendant toute ta scolarité ?",
        options: [
          "Aucun, l'IA continuera toujours d'exister pour t'aider",
          "Ça coûte cher en abonnement",
          "Tes professeurs seront remplacés par l'IA",
          "Tu risques de ne pas développer certaines compétences (rédaction, raisonnement) dont tu auras besoin sans IA, par exemple à l'examen",
        ],
        correct: 3,
        explanation: "Un examen ou une situation professionnelle sans accès à l'IA nécessite des compétences qu'on ne construit qu'en s'exerçant soi-même, pas en délégant systématiquement.",
      },
      {
        prompt: "Utiliser l'IA pour t'aider à structurer un plan avant de rédiger toi-même chaque partie est…",
        options: [
          "Une triche déguisée dans tous les cas",
          "Un usage d'aide à l'organisation qui reste généralement acceptable si la rédaction et les idées restent les tiennes",
          "Interdit uniquement en français",
          "Interdit uniquement en mathématiques",
        ],
        correct: 1,
        explanation: "S'aider pour organiser ses idées avant de rédiger soi-même son propre texte relève de l'aide méthodologique, différente du fait de faire écrire le contenu par l'IA.",
      },
    ],
  },
  {
    slug: "metiers",
    title: "Les métiers de la cyber",
    topic: "Orientation & métiers",
    level: "tous",
    description: "Pentester, analyste SOC, forensic : découvrir les métiers de la cybersécurité.",
    questions: [
      {
        prompt: "Quel est le rôle d'un·e pentester (testeur d'intrusion) ?",
        options: [
          "Attaquer un système avec l'autorisation de son propriétaire pour trouver ses failles avant un vrai attaquant",
          "Créer des virus pour les revendre",
          "Réparer les ordinateurs cassés",
          "Surveiller les réseaux sociaux des employés",
        ],
        correct: 0,
        explanation: "Un pentester agit avec un mandat légal et écrit du client : il simule une attaque pour révéler les failles avant qu'un attaquant malveillant ne les exploite.",
      },
      {
        prompt: "Que fait un·e analyste SOC (Security Operations Center) ?",
        options: [
          "Il/elle développe des jeux vidéo",
          "Il/elle installe uniquement des câbles réseau",
          "Il/elle surveille en continu les systèmes pour détecter et réagir aux incidents de sécurité",
          "Il/elle rédige les conditions d'utilisation des sites web",
        ],
        correct: 2,
        explanation: "Un SOC surveille en permanence les alertes de sécurité d'une organisation pour repérer une attaque en cours et déclencher la réponse adaptée.",
      },
      {
        prompt: "L'expert·e en forensic numérique (investigation numérique) intervient surtout…",
        options: [
          "Avant qu'un incident n'ait lieu, pour le prévenir uniquement",
          "Après un incident, pour reconstituer ce qui s'est passé à partir des traces numériques",
          "Uniquement pour créer des mots de passe",
          "Uniquement pour vendre du matériel informatique",
        ],
        correct: 1,
        explanation: "L'investigation numérique (forensic) analyse les traces laissées sur les systèmes après un incident pour comprendre comment il s'est produit et par qui.",
      },
      {
        prompt: "Qu'est-ce qu'un « bug bounty » ?",
        options: [
          "Un jeu vidéo de combat",
          "Un virus qui répare les ordinateurs",
          "Un abonnement antivirus",
          "Un programme où une entreprise récompense financièrement toute personne qui lui signale une faille de sécurité",
        ],
        correct: 3,
        explanation: "Les entreprises proposent des primes à qui découvre et signale une vulnérabilité de façon responsable, plutôt que de la voir exploitée par un attaquant.",
      },
      {
        prompt: "Quelle formation mène le plus directement vers les métiers de la cybersécurité après un bac STI2D SIN ?",
        options: [
          "Uniquement une école de commerce",
          "Aucune, ces métiers ne recrutent pas de jeunes diplômés",
          "Un BTS, une licence ou une école d'ingénieur en informatique/cybersécurité",
          "Uniquement un doctorat en physique",
        ],
        correct: 2,
        explanation: "Après un bac STI2D SIN, les BTS SIO, licences informatique ou écoles d'ingénieur en cybersécurité sont des voies directes vers ces métiers, souvent en alternance.",
      },
      {
        prompt: "Que veut dire « RSSI » dans une entreprise ?",
        options: ["Responsable de la sécurité des systèmes d'information", "Réseau social spécialisé en informatique", "Un type de virus", "Un langage de programmation"],
        correct: 0,
        explanation: "Le RSSI pilote la stratégie de sécurité informatique de l'organisation : politique de sécurité, gestion des risques, réponse aux incidents.",
      },
      {
        prompt: "Un « hacker éthique » (white hat) se distingue d'un cybercriminel principalement par…",
        options: [
          "La marque de son ordinateur",
          "Le nombre d'années d'expérience",
          "Le langage de programmation utilisé",
          "Le fait d'agir avec autorisation et dans un cadre légal, pour améliorer la sécurité",
        ],
        correct: 3,
        explanation: "C'est le cadre légal et l'autorisation qui séparent un hacker éthique d'un cybercriminel, pas les techniques employées, qui peuvent être similaires.",
      },
      {
        prompt: "Pourquoi les métiers de la cybersécurité recrutent-ils actuellement beaucoup, en France comme ailleurs ?",
        options: [
          "Parce que ces métiers vont bientôt disparaître",
          "Parce que la dépendance au numérique augmente et la pénurie de profils qualifiés est importante",
          "Parce que ces métiers ne demandent aucune compétence technique",
          "Parce qu'ils sont réservés à un très petit nombre de pays",
        ],
        correct: 1,
        explanation: "Plus les organisations dépendent du numérique, plus les besoins en sécurité augmentent, alors que le nombre de professionnels formés reste insuffisant face à la demande.",
      },
    ],
  },
  {
    slug: "crypto",
    title: "Chiffrement & messages secrets",
    topic: "Cryptographie",
    level: "tous",
    description: "Comment on protège un message : les grands principes du chiffrement, sans jargon inutile.",
    questions: [
      {
        prompt: "Que fait le chiffrement à un message ?",
        options: [
          "Il le supprime définitivement",
          "Il le traduit dans une autre langue",
          "Il le transforme selon une règle secrète (clé) pour le rendre illisible sans la bonne clé",
          "Il le rend plus court",
        ],
        correct: 2,
        explanation: "Chiffrer transforme un message lisible en texte incompréhensible grâce à une clé ; seul celui qui possède la bonne clé peut le déchiffrer.",
      },
      {
        prompt: "Quelle est la différence principale entre chiffrement symétrique et asymétrique ?",
        options: [
          "Le symétrique utilise la même clé pour chiffrer et déchiffrer, l'asymétrique utilise une paire clé publique/clé privée",
          "Le symétrique n'existe plus aujourd'hui",
          "L'asymétrique ne fonctionne que pour les images",
          "Il n'y a aucune différence",
        ],
        correct: 0,
        explanation:
          "En chiffrement symétrique, l'expéditeur et le destinataire partagent la même clé secrète ; en asymétrique, une clé publique chiffre et seule la clé privée correspondante déchiffre.",
      },
      {
        prompt: "Pourquoi le cadenas HTTPS d'un site utilise-t-il le chiffrement ?",
        options: [
          "Pour rendre le site plus joli",
          "Pour accélérer le chargement des pages",
          "Pour bloquer les publicités",
          "Pour empêcher qu'une personne interceptant la connexion puisse lire les données échangées",
        ],
        correct: 3,
        explanation: "HTTPS chiffre les échanges entre ton navigateur et le site, empêchant un tiers sur le même réseau de lire tes données au passage.",
      },
      {
        prompt: "Dans une messagerie avec « chiffrement de bout en bout » (end-to-end), qui peut lire le contenu d'un message ?",
        options: [
          "L'entreprise qui édite l'application, à tout moment",
          "Seuls l'expéditeur et le ou les destinataires prévus",
          "N'importe quel autre utilisateur de l'application",
          "Uniquement les opérateurs téléphoniques",
        ],
        correct: 1,
        explanation:
          "Le chiffrement de bout en bout fait que même l'entreprise qui gère le service ne peut normalement pas lire le contenu, seuls les appareils des interlocuteurs détiennent les clés nécessaires.",
      },
      {
        prompt: "Qu'est-ce qu'une fonction de hachage (comme celle utilisée pour stocker un mot de passe) ?",
        options: [
          "Un synonyme de chiffrement réversible",
          "Un type de virus",
          "Une fonction qui transforme une donnée en une empreinte de taille fixe, difficile à inverser",
          "Une clé qu'on peut retrouver facilement à partir du résultat",
        ],
        correct: 2,
        explanation: "Le hachage produit une empreinte à sens unique : on ne stocke jamais le mot de passe en clair, seulement son empreinte, difficile à retrouver à l'envers.",
      },
      {
        prompt: "Pourquoi ne faut-il jamais partager sa clé privée (dans un système de chiffrement asymétrique) ?",
        options: [
          "Parce qu'elle ne sert à rien",
          "Parce qu'elle expire au bout d'une heure",
          "Parce qu'elle est publique par nature",
          "Parce que quiconque la possède peut déchiffrer tes messages ou usurper ton identité numérique",
        ],
        correct: 3,
        explanation: "La clé privée est la seule pièce secrète du système : sa divulgation permet à quelqu'un d'autre de déchiffrer tes messages ou de signer numériquement à ta place.",
      },
      {
        prompt: "Un message chiffré avec un algorithme solide mais protégé par un mot de passe très faible est…",
        options: [
          "Vulnérable, car un attaquant peut essayer de deviner ou casser le mot de passe faible plutôt que l'algorithme lui-même",
          "Totalement inviolable quoi qu'il arrive",
          "Impossible à déchiffrer même avec le bon mot de passe",
          "Automatiquement renforcé par l'algorithme",
        ],
        correct: 0,
        explanation: "La robustesse d'un système de chiffrement dépend aussi du maillon le plus faible : un mot de passe trop simple peut être deviné, rendant inutile un excellent algorithme.",
      },
      {
        prompt: "Pourquoi la cryptographie est-elle essentielle bien au-delà des messages secrets entre espions ?",
        options: [
          "Elle ne sert qu'aux gouvernements",
          "Elle protège au quotidien les paiements en ligne, les mots de passe stockés et les communications privées de tout le monde",
          "Elle est obsolète depuis l'invention d'Internet",
          "Elle ne concerne que les professionnels de l'informatique",
        ],
        correct: 1,
        explanation: "Chaque paiement en ligne, connexion à un compte ou message privé repose sur des mécanismes cryptographiques qui protègent des millions d'utilisateurs ordinaires chaque jour.",
      },
    ],
  },
  {
    slug: "hack-demo",
    title: "Comment fonctionne une cyberattaque ?",
    topic: "Cybersécurité",
    level: "tous",
    description: "Voir une attaque expliquée, comprendre le principe et surtout comment s'en protéger.",
    questions: [
      {
        prompt: "Dans une attaque par « force brute », un attaquant essaie de…",
        options: [
          "Deviner le mot de passe en essayant énormément de combinaisons automatiquement",
          "Convaincre la victime par téléphone de donner son mot de passe",
          "Intercepter physiquement le câble réseau",
          "Envoyer un virus par clé USB",
        ],
        correct: 0,
        explanation:
          "La force brute teste automatiquement un grand nombre de mots de passe possibles ; un mot de passe long et un nombre limité de tentatives (verrouillage de compte) rendent cette attaque beaucoup plus difficile.",
      },
      {
        prompt: "Qu'est-ce qu'une attaque par déni de service (DDoS), en principe ?",
        options: [
          "Voler des mots de passe un par un",
          "Modifier discrètement le contenu d'un site",
          "Submerger un serveur de très nombreuses requêtes pour le rendre indisponible aux utilisateurs normaux",
          "Chiffrer les fichiers d'une victime contre rançon",
        ],
        correct: 2,
        explanation: "Un DDoS ne vole rien : il sature les ressources d'un serveur avec un flot de requêtes venant souvent de nombreuses machines, jusqu'à le rendre inutilisable.",
      },
      {
        prompt: "Le principe de « l'ingénierie sociale » dans une attaque consiste à…",
        options: [
          "Exploiter une faille purement technique du logiciel",
          "Manipuler psychologiquement une personne pour qu'elle donne une information ou effectue une action",
          "Casser physiquement un ordinateur",
          "Créer un nouveau langage de programmation",
        ],
        correct: 1,
        explanation: "L'ingénierie sociale vise l'humain plutôt que la machine : confiance, urgence ou autorité sont utilisées pour obtenir une action ou une information sans exploiter de faille technique.",
      },
      {
        prompt: "Pourquoi un logiciel non mis à jour est-il une cible privilégiée pour une attaque ?",
        options: [
          "Parce qu'il est plus rapide",
          "Parce qu'il coûte plus cher",
          "Parce qu'il n'a pas d'interface graphique",
          "Parce que des failles déjà connues et corrigées dans les versions récentes restent exploitables dessus",
        ],
        correct: 3,
        explanation: "Une fois qu'une faille est publiée et corrigée, les attaquants savent exactement quels systèmes non mis à jour restent vulnérables et les ciblent en priorité.",
      },
      {
        prompt:
          "Dans une démonstration d'attaque « Man-in-the-Middle » (l'attaquant s'interpose sur le réseau), le risque principal est que l'attaquant peut…",
        options: [
          "Améliorer la vitesse de la connexion pour la victime",
          "Supprimer physiquement le routeur",
          "Intercepter ou modifier les données qui transitent entre la victime et le vrai destinataire",
          "Changer la couleur de l'écran de la victime",
        ],
        correct: 2,
        explanation:
          "En se plaçant entre la victime et sa destination (souvent sur un réseau non sécurisé), l'attaquant peut lire ou altérer les échanges ; le chiffrement (HTTPS, VPN) limite fortement ce risque.",
      },
      {
        prompt: "Quelle est la meilleure protection générale contre la plupart des attaques présentées dans ce type de démonstration ?",
        options: [
          "Combiner mots de passe solides, 2FA, mises à jour régulières et vigilance face aux messages suspects",
          "Débrancher définitivement Internet",
          "Changer d'ordinateur chaque mois",
          "Ne jamais utiliser de mot de passe",
        ],
        correct: 0,
        explanation: "Aucune protection unique ne suffit : ce sont plusieurs bonnes pratiques combinées (mots de passe, 2FA, mises à jour, vigilance) qui réduisent le plus efficacement le risque.",
      },
      {
        prompt: "Pourquoi un·e pentester présente-t-il/elle son intrusion dans un rapport détaillé après une démonstration d'attaque autorisée ?",
        options: [
          "Pour se vanter publiquement",
          "Parce que la loi l'interdit de le faire oralement",
          "Pour vendre le rapport à des concurrents",
          "Pour que l'organisation corrige précisément les failles identifiées",
        ],
        correct: 3,
        explanation: "Le but d'un test d'intrusion autorisé est de fournir un rapport exploitable qui permette de corriger les failles trouvées, pas de nuire à l'organisation testée.",
      },
      {
        prompt:
          "Reproduire chez toi, sans autorisation, une technique d'attaque vue dans une démonstration contre un site ou un réseau qui n'est pas le tien est…",
        options: [
          "Sans danger tant que c'est « pour apprendre »",
          "Illégal, même à titre d'entraînement, car cela touche un système qui ne t'appartient pas",
          "Autorisé si personne ne s'en aperçoit",
          "Autorisé si tu es mineur·e",
        ],
        correct: 1,
        explanation:
          "Accéder ou tenter d'accéder à un système informatique sans autorisation est puni par la loi (notamment l'article 323-1 du code pénal en France), indépendamment de l'intention ou de l'âge ; s'entraîner légalement se fait sur des plateformes dédiées (CTF, labs autorisés).",
      },
    ],
  },
  {
    slug: "jeux",
    title: "Sécurité dans les jeux en ligne",
    topic: "Jeux vidéo",
    level: "tous",
    description: "Comptes, arnaques et triche : les bons réflexes pour jouer en ligne sereinement.",
    questions: [
      {
        prompt: "Un joueur inconnu te propose un skin ou objet rare gratuit si tu te connectes sur un site externe avec ton identifiant de jeu. Que fais-tu ?",
        options: [
          "Je refuse : c'est une arnaque classique pour voler ton compte",
          "Je me connecte, c'est une bonne affaire",
          "Je donne mon mot de passe mais pas mon email",
          "J'accepte si le site a un joli design",
        ],
        correct: 0,
        explanation: "Les faux sites de « skins gratuits » ou de « boost » servent surtout à voler les identifiants de compte, avec un design souvent très soigné pour paraître crédibles.",
      },
      {
        prompt: "Pourquoi faut-il activer la double authentification (2FA) sur ton compte de jeu, surtout s'il a de la valeur (skins, progression) ?",
        options: [
          "Parce que ça améliore les graphismes",
          "Parce que c'est obligatoire pour jouer en ligne",
          "Parce que ça empêche quelqu'un qui aurait volé ton mot de passe de se connecter sans le second facteur",
          "Parce que ça débloque des objets gratuits",
        ],
        correct: 2,
        explanation: "Un compte de jeu avec beaucoup d'heures ou d'objets rares est une cible ; la 2FA bloque la connexion même si le mot de passe a fuité ailleurs.",
      },
      {
        prompt: "Un logiciel de triche (« cheat ») téléchargé sur un site non officiel comporte quel risque, en plus du bannissement du jeu ?",
        options: [
          "Aucun autre risque",
          "Il améliore automatiquement les performances du PC",
          "Il est toujours gratuit et sans contrepartie",
          "Il peut contenir un logiciel malveillant qui vole des données ou prend le contrôle de l'ordinateur",
        ],
        correct: 3,
        explanation: "Les logiciels de triche téléchargés hors des canaux officiels sont un vecteur fréquent de malware, car ils demandent souvent de désactiver l'antivirus pour « fonctionner ».",
      },
      {
        prompt: "Que risques-tu si tu communiques ton mot de passe de compte de jeu à un « coéquipier » pour qu'il t'aide à monter de niveau (boosting) ?",
        options: [
          "Rien du tout, c'est courant et sans danger",
          "Il peut changer les identifiants et te voler définitivement le compte",
          "Ton niveau de jeu double automatiquement",
          "Le jeu te rembourse en cas de perte",
        ],
        correct: 1,
        explanation: "Partager son mot de passe donne un accès total au compte : la personne peut changer l'email et le mot de passe pour se l'approprier.",
      },
      {
        prompt: "Une transaction d'échange d'objets en jeu (trade) qui semble trop avantageuse pour toi doit surtout te faire penser à…",
        options: [
          "Vérifier attentivement les objets échangés, une arnaque insère souvent un objet de moindre valeur au dernier moment",
          "Accepter vite avant que l'autre change d'avis",
          "Faire confiance car le pseudo a l'air sérieux",
          "Partager ton mot de passe pour accélérer l'échange",
        ],
        correct: 0,
        explanation:
          "Les arnaques aux échanges reposent souvent sur une substitution de dernière seconde ou une confusion visuelle entre objets similaires : on vérifie toujours le détail final avant de valider.",
      },
      {
        prompt:
          "Pourquoi les jeux en ligne demandent-ils souvent de ne jamais partager son code d'authentification à usage unique (reçu par SMS ou appli), même à un support technique ?",
        options: [
          "Parce que ce code ne sert à rien",
          "Parce que le code expire après un an",
          "Parce qu'un vrai support ne le demande jamais : le demander est un signe d'arnaque cherchant à contourner la 2FA",
          "Parce que c'est interdit par la loi sur le jeu vidéo",
        ],
        correct: 2,
        explanation: "Un support légitime n'a jamais besoin de ton code temporaire ; le demander est une technique pour contourner la double authentification à ta place.",
      },
      {
        prompt: "Acheter de la monnaie virtuelle de jeu à prix cassé sur un site tiers non officiel comporte quel risque principal ?",
        options: [
          "Aucun, c'est juste moins cher",
          "Le jeu devient automatiquement plus facile",
          "C'est toujours plus sûr que le site officiel",
          "Le compte utilisé peut être suspendu par l'éditeur, et le site tiers peut voler tes informations de paiement",
        ],
        correct: 3,
        explanation: "Ces plateformes non officielles violent en général les conditions d'utilisation (risque de bannissement) et servent parfois de façade pour récupérer des données bancaires.",
      },
      {
        prompt: "Si un autre joueur te harcèle ou te menace dans le chat d'un jeu, le bon réflexe est de…",
        options: [
          "Répondre par d'autres insultes",
          "Utiliser les outils de signalement et de blocage du jeu, et en parler à un adulte si nécessaire",
          "Donner tes informations personnelles pour « régler ça en privé »",
          "Quitter définitivement tous les jeux en ligne",
        ],
        correct: 1,
        explanation: "Les jeux proposent des outils de signalement et de blocage justement pour ce genre de situation ; en parler à un adulte reste toujours une option légitime, surtout en cas de menace.",
      },
    ],
  },
]
