// The "Ce site, sous le capot" course.
//
// Real written content, not lorem — same arrangement as ./docs-git: one
// subject, one file, imported into ./docs so the subject index stays readable.
// Import type-only so there is no runtime import cycle.
//
// This subject is the odd one out: its object of study is the repository it
// lives in. That is deliberate — a student who has just painted a pixel and
// answered a live question already has the traces in front of them, and an
// explanation they can check beats one they have to believe.
//
// Two rules kept while writing it, worth keeping while editing it:
//
//  1. Every number was measured, never estimated. The byte counts below come
//     from `curl` against the running site on 2026-09-09; the tick rate and
//     the shape of a frame come from reading the stream, not from the source.
//  2. Every file path is named in full, so `tests/docs-ce-site.test.ts` can
//     check it still exists. Rename a route and CI says the article is wrong —
//     which is the only way a doc like this does not quietly rot.
import type { DocSubject } from "./docs"

export const CE_SITE_SUBJECT: DocSubject = {
  slug: "ce-site",
  title: "Ce site, sous le capot",
  command: "man ce-site",
  description: "Le site que tu es en train de lire, expliqué avec ses propres traces.",
  articles: [
    // -----------------------------------------------------------------------
    {
      slug: "chargement",
      title: "Ce que ton navigateur reçoit vraiment",
      summary:
        "Cette page est arrivée déjà écrite. Celle du PixelWar est arrivée vide. Les deux ont raison.",
      blocks: [
        {
          type: "para",
          text:
            "On dit « charger une page » comme si c'était une seule chose. En réalité, un site a le choix entre deux stratégies opposées : envoyer une page déjà remplie, ou envoyer une page vide que le navigateur remplira ensuite. Ce site utilise les deux, sur deux pages différentes — ce qui permet de les comparer sans quitter le site.",
        },
        { type: "section", id: "deux-pages-deux-strategies", text: "Deux pages, deux stratégies" },
        {
          type: "para",
          text:
            "Voici ce que le serveur a réellement renvoyé pour deux pages de ce site, mesuré le 9 septembre 2026. Les chiffres bougent — le classement grossit, la toile se remplit — mais l'écart, lui, ne bouge pas.",
        },
        {
          type: "table",
          caption: "Ce que contient le tout premier fichier reçu",
          headers: ["Page", "Taille du HTML", "Les données sont-elles dedans ?"],
          rows: [
            ["/classement", "environ 140 ko", "Oui — les pseudos et les points sont écrits dans le HTML"],
            ["/pixelwar", "environ 43 ko", "Non — une seule balise <canvas>, et pas un seul pixel"],
          ],
        },
        {
          type: "para",
          text:
            "La page du classement est fabriquée par le serveur : il interroge la base de données, écrit le tableau dans le HTML, et envoie le tout. Quand le fichier arrive chez toi, les noms sont déjà dedans. La page du PixelWar, elle, arrive avec un rectangle vide ; la toile est peinte ensuite, par le navigateur.",
        },
        { type: "section", id: "pourquoi-pas-le-meme-choix", text: "Pourquoi ce n'est pas le même choix" },
        {
          type: "para",
          text:
            "Un classement change lentement et tient en cinquante lignes : l'écrire dans le HTML coûte presque rien et rend la page lisible immédiatement, même si le JavaScript arrive en retard ou ne marche pas. Une toile de 300 × 300, c'est 90 000 cases qui changent plusieurs fois par seconde : l'écrire dans le HTML reviendrait à envoyer une photo déjà périmée, et il faudrait de toute façon la mettre à jour juste après.",
        },
        {
          type: "keylist",
          items: [
            {
              term: "Ce qui est vrai au moment de la requête",
              desc: "Ça part dans le HTML. Le classement, le contenu d'un cours, ton pseudo dans le menu.",
            },
            {
              term: "Ce qui n'arrête pas de changer",
              desc: "Ça part dans un flux séparé, après. La toile du PixelWar, le quiz en direct, le mur de questions.",
            },
          ],
        },
        { type: "section", id: "le-js-ne-construit-pas-la-page", text: "Le JavaScript ne construit pas la page" },
        {
          type: "para",
          text:
            "C'est le contresens le plus fréquent : croire que le navigateur reçoit du code et fabrique la page à partir de rien. Ici, le texte que tu lis n'a jamais été fabriqué par du JavaScript. Il a été écrit par le serveur, dans le HTML, avant de partir. Le JavaScript sert à faire bouger trois choses : la toile, les flux en direct, et les boutons qui envoient quelque chose.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Le test qui tranche",
          text:
            "Coupe le JavaScript dans ton navigateur et recharge le classement : il s'affiche quand même. Fais pareil sur le PixelWar : tu obtiens un rectangle vide. Ce n'est pas un bug, c'est la conséquence directe des deux stratégies ci-dessus.",
        },
        { type: "section", id: "personne-dautre-nest-invite", text: "Personne d'autre n'est invité" },
        {
          type: "para",
          text:
            "Ouvre l'onglet Réseau et regarde la colonne du domaine : toutes les requêtes partent vers le même endroit. Pas de police téléchargée chez Google, pas de bibliothèque prise sur un CDN, pas de script de statistiques. Ce n'est pas un hasard : c'est vérifié à chaque construction du site, et la construction échoue si quelque chose d'extérieur s'est glissé dedans.",
        },
        {
          type: "para",
          text:
            "L'enjeu n'est pas la performance. Une police chargée depuis un serveur tiers, c'est ton adresse IP envoyée à ce tiers, sur chaque page, pour chaque élève de la classe, sans que personne ait rien demandé. Un site qui s'adresse à des mineurs n'a pas les moyens de laisser traîner ça.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Ça arrive vraiment",
          text:
            "La vérification automatique n'a pas été écrite par précaution théorique. Deux interfaces générées par des outils en ligne, sur ce même serveur, sont arrivées avec du code qui appelait Internet en douce — une bibliothèque chargée depuis un CDN dans un cas, un mouchard de statistiques dans l'autre. Personne ne l'avait décidé ; c'était livré avec.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Pour aller plus loin",
          text:
            "Le mécanisme s'appelle le rendu côté serveur, et la version utilisée ici (React Server Components, avec Next.js) permet de mélanger les deux stratégies dans une même page. Regarde app/classement/page.tsx : c'est une fonction qui attend la base de données avant de rendre du HTML. Compare avec components/pixelwar/pixel-canvas.tsx, qui commence par « use client » et dessine dans un canvas. La vérification des domaines extérieurs est dans scripts/check-no-external-origins.mjs, et son commentaire d'en-tête raconte les deux incidents.",
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "rafraichir",
      title: "Ce qui se passe quand tu appuies sur F5",
      summary:
        "La page n'est pas ressortie d'un tiroir : elle est refabriquée, requête à la base comprise.",
      blocks: [
        {
          type: "para",
          text:
            "Beaucoup de sites gardent une copie toute faite de leurs pages et la ressortent telle quelle : c'est rapide, et c'est le bon choix pour un article de blog qui ne changera pas. Ici, presque aucune page n'est gardée en copie. Chaque F5 déclenche une vraie reconstruction, base de données comprise.",
        },
        { type: "section", id: "rien-nest-garde", text: "Rien n'est gardé" },
        {
          type: "para",
          text:
            "En haut des fichiers du classement et du PixelWar, une seule ligne dit au serveur de ne jamais mettre cette page en cache :",
        },
        {
          type: "code",
          label: "app/classement/page.tsx",
          code: 'export const dynamic = "force-dynamic"',
        },
        {
          type: "para",
          text:
            "La raison est simple à énoncer : un classement gardé en cache pendant soixante secondes, c'est un classement qui ment pendant soixante secondes. Personne ne voit d'erreur, la page s'affiche parfaitement — elle est juste fausse. Le coût d'une page fausse est ici plus élevé que le coût d'une requête de plus.",
        },
        { type: "section", id: "comment-la-page-sait-que-cest-toi", text: "Comment la page sait que c'est toi" },
        {
          type: "para",
          text:
            "Le protocole du Web ne se souvient de rien. Entre deux requêtes, le serveur t'a complètement oublié : il ne sait pas que c'est le même navigateur qui revient. Si ton pseudo apparaît quand même en haut de la page après un F5, c'est parce que quelque chose voyage avec chaque requête — un cookie, nommé ici lycee_session.",
        },
        {
          type: "para",
          text:
            "Ce cookie ne contient pas ton nom. Il contient un numéro tiré au hasard, qui ne veut rien dire tout seul. C'est le serveur qui va chercher dans sa table des sessions à qui ce numéro correspond. Un ticket de vestiaire, pas une carte d'identité : le ticket ne dit pas qui tu es, il dit seulement quel manteau te rendre.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Et si quelqu'un vole le ticket ?",
          text:
            "Il repart avec le manteau. C'est pour ça que ce cookie est marqué httpOnly : le JavaScript de la page, y compris un script malveillant qu'on aurait réussi à y glisser, ne peut pas le lire. Tu peux le vérifier toi-même — ouvre la console et tape document.cookie : lycee_session n'y est pas, alors qu'il part bien à chaque requête.",
        },
        { type: "section", id: "f5-nest-pas-un-clic-sur-un-lien", text: "F5 n'est pas un clic sur un lien" },
        {
          type: "para",
          text:
            "Les deux ont l'air de « changer de page », mais ce ne sont pas du tout les mêmes opérations.",
        },
        {
          type: "table",
          headers: ["Ce qui arrive à…", "F5 (rechargement)", "Clic sur un lien du menu"],
          rows: [
            ["Le document HTML", "Entièrement redemandé", "Pas redemandé"],
            ["Le JavaScript déjà chargé", "Jeté, puis rechargé", "Gardé"],
            ["Les flux en direct ouverts", "Coupés, puis rouverts", "Gardés quand la page les garde"],
            ["Ce qui transite", "Toute la page", "Seulement les morceaux qui changent"],
          ],
        },
        {
          type: "para",
          text:
            "C'est visible dans l'onglet Réseau : un F5 fait apparaître des dizaines de lignes, un clic sur un lien en fait apparaître une ou deux. Le rechargement est le seul cas où tout repart de zéro — et c'est aussi pour ça qu'il répare presque tout quand quelque chose semble bloqué.",
        },
        { type: "section", id: "sans-attendre-le-f5", text: "Se mettre à jour sans attendre le F5" },
        {
          type: "para",
          text:
            "Quand tu valides un quiz, tes points changent — et le profil et le classement les affichent. Le serveur ne se contente pas d'écrire en base : il signale que ces pages sont périmées. Elles sont donc refabriquées tout de suite, sans que tu recharges quoi que ce soit. Un F5 au bon moment n'est presque jamais nécessaire sur ce site ; s'il l'est, c'est en général le symptôme d'un oubli quelque part.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Pour aller plus loin",
          text:
            "La lecture du cookie et la recherche de la session sont dans lib/auth.ts, fonction getSessionUser() — appelée par les pages qui ont besoin de savoir qui tu es. Le signalement « cette page est périmée » est l'appel revalidatePath(), que tu retrouveras une trentaine de fois dans app/actions/, notamment dans app/actions/engage.ts après la validation d'un quiz.",
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "pixelwar-deux-chemins",
      title: "PixelWar : un pixel, deux chemins",
      summary:
        "Poser ton pixel et voir celui du voisin sont deux mécanismes séparés, qui ne se ressemblent pas.",
      blocks: [
        {
          type: "para",
          text:
            "Sur la page du PixelWar, deux choses se produisent en permanence : tes pixels partent vers le serveur, et ceux des autres arrivent. On imagine volontiers un aller-retour unique. C'est deux tuyaux distincts, qui ne fonctionnent pas de la même façon et n'ont pas les mêmes contraintes.",
        },
        { type: "section", id: "laller-ton-pixel-part", text: "L'aller : ton pixel part" },
        {
          type: "para",
          text:
            "Tu cliques. La case change de couleur immédiatement — avant que le serveur ait répondu quoi que ce soit. Ce n'est pas de la triche : c'est un pari. Le navigateur affiche tout de suite le résultat le plus probable, puis envoie la demande. Sans ce pari, il y aurait un blanc perceptible entre le clic et la couleur.",
        },
        {
          type: "code",
          label: "l'ordre réel des opérations",
          code: `1. tu cliques
2. la case prend la couleur         <- tout de suite, en local
3. la demande part vers le serveur
4. le serveur revérifie tout
5a. accepté  -> rien à faire, l'écran disait déjà vrai
5b. refusé   -> la case reprend sa couleur d'avant`,
        },
        {
          type: "para",
          text:
            "Le cas 5b est celui qu'on oublie d'écrire, et c'est celui qui compte : si le serveur refuse et que personne ne défait le pari, tu restes avec un pixel qui n'existe que sur ton écran. Tu le vois, personne d'autre ne le voit, et rien ne te prévient.",
        },
        { type: "section", id: "pourquoi-le-serveur-reverifie", text: "Pourquoi le serveur revérifie tout" },
        {
          type: "para",
          text:
            "Le navigateur vérifie déjà que la case est dans la grille, que la couleur existe et que ton délai d'attente est écoulé. Le serveur revérifie exactement les trois mêmes choses. Ce n'est pas de la redondance inutile.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "La règle qui vaut pour tous les sites du monde",
          text:
            "Les vérifications faites dans le navigateur sont là pour le confort de l'utilisateur, jamais pour la sécurité du serveur. Le code qui tourne chez toi t'appartient : tu peux le modifier, le contourner, ou envoyer la requête à la main sans passer par la page. Tout ce qui arrive d'un navigateur est une affirmation, pas un fait — et un serveur ne doit jamais croire une affirmation qu'il peut vérifier lui-même.",
        },
        {
          type: "para",
          text:
            "C'est aussi pour ça que le délai de cinq secondes entre deux pixels n'est pas stocké dans ton navigateur mais dans une table de la base de données, associée à ton compte. Fermer l'onglet ne le remet pas à zéro. Ouvrir le site sur ton téléphone en même temps non plus : c'est le même compte, donc le même compteur.",
        },
        { type: "section", id: "le-retour-un-tuyau-ouvert", text: "Le retour : un tuyau qui reste ouvert" },
        {
          type: "para",
          text:
            "Pour recevoir les pixels des autres, la page ne redemande pas la toile toutes les secondes. Elle ouvre une seule requête, qui ne se termine jamais, et écoute. C'est le serveur qui parle quand il a quelque chose à dire — l'inverse de la logique habituelle du Web, où c'est toujours le navigateur qui demande.",
        },
        {
          type: "para",
          text:
            "Le premier message contient la toile entière. Ensuite, un message par seconde, qui ne contient que ce qui a changé. Voici de vrais messages, capturés sur le site en fonctionnement :",
        },
        {
          type: "code",
          label: "ce qui circule dans le flux",
          code: `event: full
data: {"pixels":[8,99,12,140,151,0,146,156,0, ...], "at":..., "clearedAt":...}

event: tick
data: {"pixels":[],"at":1788948737667,"clearedAt":1788793844345}`,
        },
        {
          type: "para",
          text:
            "Le second message est un tick pendant lequel personne n'a rien peint : la liste est vide. Le flux continue quand même de battre, une fois par seconde, pour que la page sache qu'elle est toujours connectée.",
        },
        { type: "section", id: "le-detail-qui-ne-se-repare-pas", text: "Le détail qui ne se répare pas" },
        {
          type: "para",
          text:
            "Entre le moment où ton navigateur s'abonne au flux et celui où le serveur lui envoie la toile complète, il s'écoule un très court instant. Un pixel posé exactement pendant cet instant serait absent de la toile envoyée, et absent des messages suivants puisqu'il ne serait plus « nouveau ».",
        },
        {
          type: "para",
          text:
            "Un pixel manqué n'est pas un scintillement qui se corrige tout seul. C'est une couleur fausse, qui reste fausse jusqu'à ce que quelqu'un repeigne cette case précise — ce qui peut ne jamais arriver. Alors chaque message regarde dix secondes en arrière au lieu d'une seule : renvoyer un pixel déjà correct ne coûte rien, en manquer un coûte définitivement.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Une idée qui dépasse le PixelWar",
          text:
            "Quand une perte est réparable, on optimise. Quand une perte est permanente, on préfère être redondant. Le choix ne se fait pas sur la fréquence de l'incident, mais sur ce qu'il coûte quand il arrive — un raisonnement qui sert bien au-delà d'une toile partagée.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Pour aller plus loin",
          text:
            "L'aller est une Server Action : la fonction placePixel() de app/actions/pixelwar.ts, écrite comme un appel de fonction ordinaire mais exécutée sur le serveur, et donc en réalité une requête HTTP. Le pari optimiste et son annulation sont dans components/pixelwar/pixel-canvas.tsx. Le retour utilise Server-Sent Events, côté serveur dans app/api/pixelwar/stream/route.ts (la fenêtre de rattrapage de dix secondes y est une constante commentée) et côté navigateur avec l'objet EventSource.",
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "quiz-direct-une-requete",
      title: "Le quiz en direct : une requête pour toute la classe",
      summary:
        "Trente élèves connectés, et le serveur interroge la base une seule fois par seconde.",
      blocks: [
        {
          type: "para",
          text:
            "Le quiz en direct doit montrer la même chose à toute la classe au même moment : la question en cours, le temps restant, le tableau des scores. La façon évidente de le faire est aussi celle qui s'effondre en salle de classe.",
        },
        { type: "section", id: "le-calcul-naif", text: "Le calcul naïf" },
        {
          type: "para",
          text:
            "Version évidente : chaque navigateur demande au serveur, une fois par seconde, où en est la partie. Avec trois personnes en train de tester, ça marche très bien. Avec une classe entière :",
        },
        {
          type: "table",
          headers: ["Élèves connectés", "Requêtes à la base par seconde", "Par heure de cours"],
          rows: [
            ["3 (en test)", "3", "10 800"],
            ["30 (en classe)", "30", "108 000"],
          ],
        },
        {
          type: "para",
          text:
            "C'est le piège classique : un site qui marche parfaitement chez son auteur et qui tombe le jour où il sert à quelque chose. Le coût ne dépend pas de ce que fait le site, il dépend du nombre de personnes qui regardent — et c'est exactement le nombre qui augmente le jour de la démonstration.",
        },
        { type: "section", id: "un-seul-sondeur", text: "Un seul sondeur pour tout le monde" },
        {
          type: "para",
          text:
            "La version utilisée ici inverse le sens. Ce n'est pas chaque navigateur qui interroge la base : c'est le serveur qui l'interroge une fois par seconde, obtient un instantané de la partie, et distribue ce même instantané à tous ceux qui écoutent. Trente élèves ne coûtent pas trente fois plus cher — ils coûtent la même chose que trois.",
        },
        {
          type: "keylist",
          items: [
            {
              term: "Version naïve",
              desc: "Le coût grandit avec le nombre de spectateurs. Trente élèves, trente requêtes.",
            },
            {
              term: "Version distribuée",
              desc: "Le coût ne dépend plus du nombre de spectateurs. Trente élèves, une requête.",
            },
          ],
        },
        {
          type: "para",
          text:
            "Détail élégant : le sondeur ne démarre qu'au premier abonné et s'arrête au dernier départ. Quand personne ne regarde le quiz, aucune requête n'est faite du tout. Un site qui interroge sa base pour un public vide est une facture, pas une fonctionnalité.",
        },
        { type: "section", id: "ce-qui-nest-pas-envoye", text: "Ce qui n'est PAS envoyé" },
        {
          type: "para",
          text:
            "L'instantané contient la question et les propositions. Contient-il aussi la bonne réponse ? Il faudrait bien qu'elle arrive un jour, pour afficher la correction. La réponse est non : tant que le professeur n'a pas révélé, ce champ vaut « rien ». Il est rempli au moment de la révélation, pas avant.",
        },
        {
          type: "para",
          text:
            "Ce n'est pas une question de confiance envers les élèves. Tout ce qui arrive dans un navigateur peut être lu par la personne devant ce navigateur — il suffit d'ouvrir l'onglet Réseau. Si la bonne réponse était envoyée avec la question, elle serait lisible en trois clics, et le quiz n'aurait plus aucun sens.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Cacher n'est pas protéger",
          text:
            "Un bouton grisé, un champ masqué, un élément rendu invisible par du style : rien de tout ça ne protège quoi que ce soit. C'est de la décoration, et la décoration se retire. La seule donnée réellement protégée est celle qui n'a jamais quitté le serveur.",
        },
        {
          type: "para",
          text:
            "Même logique pour les réponses des autres. Pour économiser des requêtes, le serveur récupère en une fois les réponses de toute la classe. Mais avant d'envoyer quoi que ce soit à un élève, il retire ce paquet et n'y remet que la réponse de cet élève-là. Une seule requête pour tout le monde, et malgré tout personne ne reçoit la réponse de son voisin.",
        },
        { type: "section", id: "le-chrono-est-une-decoration", text: "Le chrono est une décoration" },
        {
          type: "para",
          text:
            "Le compte à rebours qui défile pendant une question est calculé dans ton navigateur, à partir de l'heure de départ envoyée par le serveur. Il ne décide de rien. Changer l'heure de ta machine ne te donne pas de temps supplémentaire, et bloquer le décompte ne fige pas la question : le passage à l'étape suivante vient toujours du serveur, jamais du navigateur.",
        },
        {
          type: "para",
          text:
            "C'est le même principe que le pixel refusé de l'article précédent, appliqué au temps plutôt qu'à l'espace : ce qui est affiché chez toi est un reflet, ce qui fait autorité est ailleurs.",
        },
        { type: "section", id: "le-ping-toutes-les-quinze-secondes", text: "Le ping toutes les quinze secondes" },
        {
          type: "para",
          text:
            "Entre ton navigateur et le serveur, il y a des équipements intermédiaires. Une connexion ouverte mais totalement silencieuse leur ressemble à une connexion morte, et ils la coupent. Le serveur envoie donc, toutes les quinze secondes, une ligne qui ne veut strictement rien dire :",
        },
        {
          type: "code",
          label: "un battement de cœur",
          code: ": ping",
        },
        {
          type: "para",
          text:
            "Dans le format utilisé par ces flux, une ligne qui commence par deux-points est un commentaire : le navigateur l'ignore complètement. Mais elle constitue du trafic, et c'est tout ce qu'il faut pour que les équipements intermédiaires considèrent la connexion vivante. Une ligne inutile pour le destinataire, indispensable pour la route.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Pour aller plus loin",
          text:
            "Le mécanisme de distribution est dans lib/broadcast.ts, dont le commentaire d'en-tête raconte pourquoi il a fallu le transformer en usine à sondeurs le jour où le PixelWar est devenu un deuxième consommateur. La requête partagée, la retenue de la bonne réponse et le découpage par élève sont dans app/api/live/stream/route.ts. Le côté navigateur, y compris le chrono purement décoratif, est dans components/quiz/live-quiz.tsx.",
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      slug: "verifie-toi-meme",
      title: "Vérifie tout ça toi-même",
      summary:
        "Cinq mesures, cinq minutes, rien à installer. Ne crois pas les quatre articles précédents : mesure-les.",
      blocks: [
        {
          type: "para",
          text:
            "Tout ce qui est décrit dans cette matière est observable depuis n'importe quel navigateur, sans compte particulier et sans rien installer. C'est le seul article de la matière qui se fait avec les mains — et c'est celui qui rend les quatre autres crédibles ou non.",
        },
        { type: "section", id: "ouvrir-longlet-reseau", text: "Ouvrir l'onglet Réseau" },
        {
          type: "list",
          ordered: true,
          items: [
            "Appuie sur F12 (ou Ctrl + Maj + I).",
            "Va dans l'onglet « Réseau » (« Network » si ton navigateur est en anglais).",
            "Recharge la page.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "L'erreur de tout le monde la première fois",
          text:
            "L'onglet Réseau n'enregistre rien tant qu'il n'est pas ouvert. Si la liste est vide, ce n'est pas que la page n'a rien demandé : c'est qu'elle l'a demandé avant que tu regardes. Ouvre l'onglet d'abord, recharge ensuite.",
        },
        { type: "section", id: "mesure-1", text: "Mesure 1 — la page arrive-t-elle remplie ?" },
        {
          type: "list",
          ordered: true,
          items: [
            "Va sur /classement, onglet Réseau ouvert, et recharge.",
            "Clique sur la toute première ligne de la liste : c'est le document HTML.",
            "Ouvre le sous-onglet « Réponse » et cherche (Ctrl + F) un pseudo que tu vois à l'écran.",
            "Il est là. La page est arrivée déjà écrite.",
            "Recommence sur /pixelwar : cherche une couleur, une coordonnée, n'importe quoi. Tu ne trouveras qu'une balise <canvas> vide.",
          ],
        },
        {
          type: "para",
          text:
            "Compare enfin la colonne « Taille » des deux documents. L'écart n'est pas un détail d'implémentation : c'est la différence entre « le serveur a fait le travail » et « le serveur a délégué le travail ».",
        },
        { type: "section", id: "mesure-2", text: "Mesure 2 — la requête qui ne finit jamais" },
        {
          type: "list",
          ordered: true,
          items: [
            "Reste sur /pixelwar et tape « stream » dans le champ de filtre de l'onglet Réseau.",
            "Une seule ligne apparaît, et son statut reste « en attente ».",
            "Regarde sa taille : elle augmente toute seule, sans que rien ne se recharge.",
            "Ouvre-la. Dans Chrome, un sous-onglet « EventStream » liste les messages ; dans Firefox, ils s'empilent dans « Réponse ».",
            "Compte-les : environ un par seconde. Le premier s'appelle full, les suivants tick.",
          ],
        },
        {
          type: "para",
          text:
            "Tu regardes une requête HTTP qui a commencé il y a plusieurs minutes et qui n'est toujours pas terminée. C'est parfaitement légal, et c'est tout le mécanisme du direct sur ce site.",
        },
        { type: "section", id: "mesure-3", text: "Mesure 3 — poser un pixel" },
        {
          type: "list",
          ordered: true,
          items: [
            "Connecte-toi, garde l'onglet Réseau ouvert, enlève le filtre.",
            "Pose un pixel.",
            "Une requête POST apparaît — vers l'adresse de la page elle-même, pas vers une adresse en /api/. C'est la signature d'une Server Action.",
            "Reviens sur le flux : dans la seconde qui suit, un tick contient ton pixel.",
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Regarde l'ordre, pas seulement le contenu",
          text:
            "Ta case a changé de couleur avant que le POST ne soit terminé. C'est le pari optimiste de l'article sur le PixelWar, visible à l'œil nu. Pour voir l'annulation, pose deux pixels d'affilée : le second est refusé pour cause de délai, et tu verras la case revenir à sa couleur d'avant.",
        },
        { type: "section", id: "mesure-4", text: "Mesure 4 — deux fenêtres côte à côte" },
        {
          type: "para",
          text:
            "Ouvre /pixelwar dans deux fenêtres placées côte à côte, et pose un pixel dans l'une. Il apparaît dans l'autre en une seconde environ, sans que personne ait rechargé quoi que ce soit. Si tu as un camarade sous la main, faites-le sur deux machines : c'est plus convaincant que deux onglets du même navigateur.",
        },
        { type: "section", id: "mesure-5", text: "Mesure 5 — la colonne du domaine" },
        {
          type: "para",
          text:
            "Affiche la colonne « Domaine » dans l'onglet Réseau (clic droit sur l'en-tête du tableau). Sur ce site, toutes les lignes portent le même domaine. Refais exactement la même manipulation sur un grand site commercial que tu utilises tous les jours, et compte les domaines différents qui apparaissent sans que tu aies rien demandé. C'est la mesure la plus courte de la liste, et souvent la plus marquante.",
        },
        { type: "section", id: "ce-que-tu-ne-dois-pas-trouver", text: "Ce que tu ne dois PAS trouver" },
        {
          type: "list",
          items: [
            "Une requête vers un domaine qui n'est pas celui de ce site.",
            "La bonne réponse d'une question du quiz en direct avant que le professeur ne l'ait révélée.",
            "La réponse d'un autre élève dans le flux que ton navigateur reçoit.",
            "Le cookie de session dans la console : tape document.cookie, lycee_session ne doit pas y apparaître.",
          ],
        },
        {
          type: "callout",
          tone: "success",
          title: "Si tu en trouves un",
          text:
            "Ce n'est pas un piège de la chasse aux secrets : c'est un vrai défaut, et le signaler est une contribution à part entière. La page /bug-report est faite pour ça. Décris ce que tu as fait, ce que tu as vu, et sur quelle page — c'est exactement ce qu'on attend d'un rapport utile.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Pour aller plus loin",
          text:
            "Tout ce que tu viens de mesurer se relit dans le dépôt : app/api/pixelwar/stream/route.ts pour le flux de la toile, app/api/live/stream/route.ts pour celui du quiz, app/actions/pixelwar.ts pour la Server Action du POST. Le dépôt est public et les commentaires y expliquent surtout pourquoi les choses sont ainsi, ce que le code seul ne dit jamais. CONTRIBUTING.md explique comment y changer quelque chose.",
        },
      ],
    },
  ],
}
