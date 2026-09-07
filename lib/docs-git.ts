// The Git & GitHub course.
//
// Unlike the rest of lib/docs.ts, this subject is real written content, not
// generated lorem — it lives in its own file so the course can grow without
// burying the subject index. Import type-only from ./docs so there is no
// runtime import cycle.
import type { DocSubject } from "./docs"

export const GIT_SUBJECT: DocSubject = {
  slug: "git",
  title: "Git & GitHub",
  command: "man git",
  description: "Versionner son code et collaborer en équipe.",
  articles: [
    // ---------------------------------------------------------------------
    {
      slug: "git-vs-github",
      title: "Git vs GitHub",
      summary: "Deux outils qu'on confond tout le temps, et pourquoi tu as besoin des deux.",
      blocks: [
        {
          type: "para",
          text:
            "Git et GitHub sont deux outils essentiels pour tout développeur moderne. On les confond souvent parce qu'ils vont ensemble, mais ce sont deux choses bien différentes : l'un tourne sur ta machine, l'autre sur Internet.",
        },
        {
          type: "keylist",
          items: [
            {
              term: "Git",
              desc: "Un système de contrôle de version décentralisé, installé sur ta machine, qui suit les modifications de ton code.",
            },
            {
              term: "GitHub",
              desc: "Une plateforme cloud qui héberge tes dépôts Git et sert de point de rendez-vous pour collaborer.",
            },
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "Git marche sans GitHub",
          text:
            "Tu peux utiliser Git seul, hors ligne, sans jamais créer de compte nulle part. GitHub n'est qu'un endroit où déposer une copie de ton dépôt pour la partager. Il existe d'ailleurs des alternatives : GitLab, Codeberg, ou un serveur que tu héberges toi-même.",
        },
        { type: "section", id: "le-controle-de-version", text: "Le contrôle de version" },
        {
          type: "para",
          text:
            "Sans contrôle de version, on sauvegarde à la main : projet_final.zip, projet_final_v2.zip, projet_final_VRAI_FINAL.zip. Ça marche jusqu'au jour où il faut retrouver ce qui a changé entre deux versions, ou travailler à plusieurs sur le même fichier.",
        },
        {
          type: "para",
          text: "Le contrôle de version règle ce problème. Concrètement, il te permet de :",
        },
        {
          type: "list",
          items: [
            "Revenir à une version précédente de ton code, même vieille de six mois.",
            "Collaborer avec d'autres personnes sans écraser leur travail.",
            "Créer des branches pour tester une idée sans casser ce qui marche.",
            "Garder un historique complet : qui a changé quoi, quand, et pourquoi.",
          ],
        },
        { type: "section", id: "dou-vient-git", text: "D'où vient Git" },
        {
          type: "para",
          text:
            "Git a été créé en 2005 par Linus Torvalds, celui-là même qui avait lancé Linux. Il en avait besoin pour gérer le noyau Linux, un projet énorme avec des milliers de contributeurs éparpillés dans le monde.",
        },
        {
          type: "para",
          text:
            "D'où son point fort : Git est décentralisé. Chaque développeur possède une copie complète du projet et de tout son historique sur sa machine. Pas besoin d'être connecté à un serveur pour consulter l'historique, créer une branche ou faire un commit.",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Une image pour retenir",
          text:
            "Git, c'est la machine à remonter le temps de ton projet : elle vit sur ton ordinateur. GitHub, c'est le lieu public où tout le monde gare sa machine à remonter le temps pour comparer les trajets.",
        },
      ],
    },
    // ---------------------------------------------------------------------
    {
      slug: "installation",
      title: "Installer et configurer Git",
      summary: "L'installation, la configuration initiale et le vocabulaire de base.",
      blocks: [
        {
          type: "para",
          text:
            "Avant la première commande, deux choses à faire une seule fois dans ta vie : installer Git, et lui dire qui tu es. Sans ça, Git refusera de créer ton premier commit.",
        },
        { type: "section", id: "installer", text: "Installer Git" },
        {
          type: "para",
          text:
            "Télécharge et installe Git depuis git-scm.com. Sous Linux, il est presque toujours déjà là, ou disponible via le gestionnaire de paquets. Pour vérifier que l'installation a marché, demande sa version.",
        },
        {
          type: "code",
          label: "vérifier l'installation",
          prompt: true,
          code: "git --version",
        },
        { type: "section", id: "se-presenter", text: "Se présenter à Git" },
        {
          type: "para",
          text:
            "Chaque commit est signé avec un nom et une adresse e-mail. Ce n'est pas de l'authentification — c'est juste une étiquette collée sur ton travail, pour qu'on sache qui a écrit quoi.",
        },
        {
          type: "code",
          label: "bash",
          code:
            'git config --global user.name "Ton Nom"\ngit config --global user.email "ton.email@exemple.com"\n\n# Vérifie la configuration\ngit config --global --list',
        },
        {
          type: "callout",
          tone: "warning",
          title: "Cette adresse sera publique",
          text:
            "Si tu pousses un jour ton code sur GitHub, ton nom et ton e-mail seront visibles dans l'historique par tout le monde, pour toujours. Utilise une adresse que ça ne te dérange pas d'exposer. GitHub propose aussi une adresse de redirection anonyme dans les paramètres du compte.",
        },
        { type: "section", id: "le-vocabulaire", text: "Le vocabulaire de base" },
        {
          type: "para",
          text:
            "Cinq mots reviennent en permanence. Les comprendre maintenant t'évitera beaucoup de confusion plus tard.",
        },
        {
          type: "keylist",
          items: [
            { term: "Repository", desc: "Le dépôt : le dossier de ton projet, avec tout son historique Git." },
            { term: "Commit", desc: "Une photo de ton projet à un instant donné, accompagnée d'un message." },
            { term: "Branch", desc: "Une branche : une ligne de développement indépendante du reste du projet." },
            { term: "Working dir", desc: "Le répertoire de travail : les fichiers tels que tu les vois et que tu modifies." },
            { term: "Staging area", desc: "La zone de préparation : ce que tu as choisi de mettre dans le prochain commit." },
          ],
        },
      ],
    },
    // ---------------------------------------------------------------------
    {
      slug: "workflow",
      title: "Le workflow Git",
      summary: "Les trois états d'un fichier, et le cycle add → commit → push.",
      blocks: [
        {
          type: "para",
          text:
            "Le quotidien avec Git tient en une boucle courte que tu vas répéter des centaines de fois : tu modifies des fichiers, tu choisis lesquels enregistrer, tu enregistres, tu envoies. Tout le reste n'est que variation autour de ça.",
        },
        { type: "section", id: "les-trois-etats", text: "Les trois états" },
        {
          type: "para",
          text:
            "Un fichier suivi par Git se trouve toujours dans l'un de ces trois endroits. Deux commandes le font passer de l'un à l'autre.",
        },
        {
          type: "code",
          label: "les trois états",
          code:
            "Working Directory      tes fichiers, tels que tu les modifies\n        |\n        |  git add\n        v\nStaging Area           ce que tu as choisi pour le prochain commit\n        |\n        |  git commit\n        v\nRepository (.git)      l'historique, gravé",
        },
        {
          type: "callout",
          tone: "info",
          title: "Pourquoi une zone intermédiaire ?",
          text:
            "Parce qu'une session de travail touche souvent à plusieurs choses en même temps. La staging area te laisse commiter la correction du bug maintenant, et garder la nouvelle fonctionnalité à moitié écrite pour plus tard. Un commit doit raconter une seule idée.",
        },
        { type: "section", id: "creer-un-depot", text: "Créer un dépôt" },
        {
          type: "para",
          text:
            "Deux points de départ possibles : tu démarres un projet neuf, ou tu récupères un projet qui existe déjà.",
        },
        {
          type: "code",
          label: "bash",
          code:
            "# Initialise un nouveau dépôt Git dans le dossier courant\ngit init\n\n# Ou récupère un dépôt existant, avec tout son historique\ngit clone https://github.com/utilisateur/projet.git",
        },
        { type: "section", id: "preparer-les-fichiers", text: "Préparer les fichiers" },
        {
          type: "para",
          text:
            "git status est la commande la plus utile de tout Git. En cas de doute, tape-la : elle te dit où tu en es et te suggère la commande suivante.",
        },
        {
          type: "code",
          label: "bash",
          code:
            "# Où en suis-je ?\ngit status\n\n# Prépare un fichier précis pour le prochain commit\ngit add nom-du-fichier.js\n\n# Prépare tous les fichiers modifiés\ngit add .\n\n# Retire un fichier de la zone de préparation\ngit restore --staged nom-du-fichier.js",
        },
        { type: "section", id: "commiter", text: "Créer un commit" },
        {
          type: "para",
          text:
            "Le commit grave dans l'historique ce que tu as préparé. Le message n'est pas une formalité : c'est ce que toi, dans six mois, liras pour comprendre pourquoi cette ligne a changé.",
        },
        {
          type: "code",
          label: "bash",
          code:
            '# Crée un commit avec un message\ngit commit -m "Ajoute la fonction de calcul"\n\n# Prépare et commite les fichiers déjà suivis en une fois\ngit commit -am "Modifie la fonction de calcul"\n\n# Corrige le dernier commit (message ou contenu)\ngit commit --amend',
        },
        {
          type: "callout",
          tone: "success",
          title: "Un bon message de commit",
          text:
            "Écris à l'impératif, sois précis, dis ce que le commit fait et non ce que tu as fait. « Ajoute la validation du formulaire » est utile ; « fix stuff », « update », « ça marche enfin » ne servent à personne, surtout pas à toi.",
        },
        { type: "section", id: "echanger-avec-le-serveur", text: "Échanger avec le serveur" },
        {
          type: "para",
          text:
            "Tes commits restent sur ta machine tant que tu ne les as pas poussés. push envoie, pull récupère et fusionne, fetch récupère sans rien fusionner.",
        },
        {
          type: "code",
          label: "bash",
          code:
            "# Envoie tes commits vers le serveur\ngit push origin main\n\n# Récupère les changements du serveur et les fusionne\ngit pull origin main\n\n# Récupère les changements sans les fusionner (pour regarder d'abord)\ngit fetch origin",
        },
      ],
    },
    // ---------------------------------------------------------------------
    {
      slug: "branches",
      title: "Les branches",
      summary: "Travailler sur une idée sans casser ce qui marche déjà.",
      blocks: [
        {
          type: "para",
          text:
            "Une branche est une ligne de développement indépendante. Elle te permet de travailler sur plusieurs fonctionnalités en parallèle sans qu'aucune n'affecte le code principal tant qu'elle n'est pas prête.",
        },
        { type: "section", id: "a-quoi-ca-sert", text: "À quoi ça sert" },
        {
          type: "para",
          text:
            "Imagine que tu veuilles tester une refonte complète de la page d'accueil. Sans branche, tu casses la version qui marche pendant tout le temps de l'expérience. Avec une branche, tu bricoles à côté ; si l'idée est mauvaise, tu supprimes la branche et il ne reste aucune trace.",
        },
        {
          type: "para",
          text:
            "C'est aussi ce qui rend le travail à plusieurs possible : chacun sur sa branche, personne ne se marche dessus.",
        },
        { type: "section", id: "gerer-les-branches", text: "Gérer les branches" },
        {
          type: "code",
          label: "bash",
          code:
            "# Liste les branches locales\ngit branch\n\n# Liste toutes les branches, locales et distantes\ngit branch -a\n\n# Crée une nouvelle branche\ngit branch ma-nouvelle-feature\n\n# Bascule vers une branche\ngit checkout ma-nouvelle-feature\n\n# Crée et bascule en une seule commande\ngit checkout -b ma-nouvelle-feature\n\n# Supprime une branche (une fois fusionnée)\ngit branch -d ma-nouvelle-feature",
        },
        { type: "section", id: "fusionner", text: "Fusionner" },
        {
          type: "para",
          text:
            "Quand ta fonctionnalité est terminée, tu ramènes ton travail dans la branche principale. Place-toi d'abord sur la branche qui doit recevoir, puis fusionne.",
        },
        {
          type: "code",
          label: "bash",
          code:
            "# Place-toi sur la branche qui reçoit\ngit checkout main\n\n# Fusionne ta branche dedans\ngit merge ma-nouvelle-feature",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Les conflits de fusion",
          text:
            "Si deux branches ont modifié les mêmes lignes du même fichier, Git ne peut pas décider à ta place et s'arrête sur un conflit. Ce n'est pas une erreur, c'est une question : il marque les deux versions dans le fichier et attend que tu choisisses. Tu édites, tu retires les marqueurs, tu fais git add puis git commit.",
        },
        { type: "section", id: "bien-nommer-ses-branches", text: "Bien nommer ses branches" },
        {
          type: "list",
          items: [
            "Utilise des noms explicites et préfixés : feature/systeme-de-connexion, fix/bug-calcul.",
            "Une branche = une fonctionnalité. Si tu ne peux pas la résumer en trois mots, elle est trop grosse.",
            "Crée toujours tes branches à partir d'une base à jour (main ou develop).",
            "Supprime les branches une fois fusionnées : une liste de quarante branches mortes ne sert personne.",
          ],
        },
      ],
    },
    // ---------------------------------------------------------------------
    {
      slug: "github",
      title: "GitHub",
      summary: "Héberger ses dépôts en ligne et rejoindre l'écosystème.",
      blocks: [
        {
          type: "para",
          text:
            "GitHub est une plateforme cloud qui héberge des dépôts Git. C'est devenu le plus grand rassemblement de code au monde, et accessoirement une sorte de réseau social pour développeurs : on y suit des projets, on y lit du code, on y montre le sien.",
        },
        { type: "section", id: "les-concepts", text: "Les concepts GitHub" },
        {
          type: "para",
          text:
            "Attention : ces quatre notions n'existent pas dans Git. Elles sont ajoutées par GitHub par-dessus.",
        },
        {
          type: "keylist",
          items: [
            { term: "Fork", desc: "Une copie d'un dépôt dans ton propre compte, pour bricoler un projet dont tu n'es pas membre." },
            { term: "Pull request", desc: "Une demande de fusion de tes changements, ouverte à la discussion et à la relecture." },
            { term: "Issue", desc: "Un ticket : signaler un bug, proposer une fonctionnalité, poser une question." },
            { term: "Star", desc: "Un marque-page public. C'est la mesure de popularité d'un projet." },
          ],
        },
        { type: "section", id: "creer-un-depot", text: "Créer un dépôt" },
        {
          type: "list",
          ordered: true,
          items: [
            "Va sur github.com et connecte-toi.",
            "Clique sur New repository.",
            "Donne un nom, une description, et choisis public ou privé.",
            "Clique sur Create repository.",
          ],
        },
        { type: "section", id: "relier-ton-depot-local", text: "Relier ton dépôt local" },
        {
          type: "para",
          text:
            "Ton dépôt local et le dépôt GitHub ne se connaissent pas encore. On présente l'un à l'autre en ajoutant une adresse distante, appelée origin par convention.",
        },
        {
          type: "code",
          label: "bash",
          code:
            "# Ajoute l'adresse du dépôt distant\ngit remote add origin https://github.com/utilisateur/mon-projet.git\n\n# Envoie ton code et mémorise le lien entre les deux branches\ngit push -u origin main",
        },
        {
          type: "callout",
          tone: "info",
          title: "Le -u ne sert qu'une fois",
          text:
            "L'option -u relie ta branche locale à la branche distante. Après ce premier push, un simple git push suffira : Git saura tout seul où envoyer.",
        },
      ],
    },
    // ---------------------------------------------------------------------
    {
      slug: "pull-requests",
      title: "Les Pull Requests",
      summary: "Le rituel de la collaboration : proposer, relire, fusionner.",
      blocks: [
        {
          type: "para",
          text:
            "Une Pull Request — PR pour les intimes — est une demande de fusion de tes changements dans une branche principale. C'est le cœur de la collaboration sur GitHub : au lieu d'écrire directement dans le code commun, tu proposes, et on en discute.",
        },
        { type: "section", id: "le-principe", text: "Le principe" },
        {
          type: "para",
          text:
            "Techniquement, une PR ne fait rien que git merge ne saurait faire. Ce qu'elle ajoute, c'est le moment de la conversation : une page où l'on voit ligne par ligne ce qui change, où l'on commente, où l'on demande une correction, et où les tests automatiques tournent avant que quoi que ce soit ne touche au code principal.",
        },
        { type: "section", id: "le-processus", text: "Le processus, étape par étape" },
        {
          type: "list",
          ordered: true,
          items: [
            "Fork le projet — seulement si tu n'es pas membre du dépôt.",
            "Clone le dépôt sur ta machine.",
            "Crée une branche dédiée à ta fonctionnalité.",
            "Fais tes commits, petits et lisibles.",
            "Push ta branche vers GitHub.",
            "Ouvre une Pull Request depuis l'interface GitHub.",
            "Réponds aux commentaires et pousse des corrections sur la même branche.",
            "Fusionne une fois la PR approuvée, puis supprime la branche.",
          ],
        },
        { type: "section", id: "exemple-complet", text: "Un exemple complet" },
        {
          type: "code",
          label: "bash",
          code:
            "# 1. Clone le dépôt\ngit clone https://github.com/utilisateur/projet.git\ncd projet\n\n# 2. Crée une branche\ngit checkout -b feature/nouvelle-fonctionnalite\n\n# 3. Fais tes changements, puis commite\ngit add .\ngit commit -m \"Ajoute la nouvelle fonctionnalité\"\n\n# 4. Push la branche vers GitHub\ngit push origin feature/nouvelle-fonctionnalite\n\n# 5. Ouvre la Pull Request sur github.com\n#    (GitHub affiche un bouton dès qu'il voit la nouvelle branche)",
        },
        {
          type: "callout",
          tone: "tip",
          title: "La revue de code",
          text:
            "Recevoir des commentaires sur son code n'est pas une sanction, c'est le but de l'exercice. Une relecture attrape les erreurs avant les utilisateurs, et c'est la façon la plus rapide de progresser. De ton côté, relis les PR des autres : on apprend autant à lire du code qu'à en écrire.",
        },
      ],
    },
    // ---------------------------------------------------------------------
    {
      slug: "bonnes-pratiques",
      title: "Bonnes pratiques",
      summary: "Les réflexes à prendre, les pièges à éviter, et un aide-mémoire.",
      blocks: [
        {
          type: "para",
          text:
            "Git pardonne presque tout, mais certaines habitudes rendent la vie beaucoup plus simple — à toi comme aux gens qui liront ton historique.",
        },
        { type: "section", id: "a-faire", text: "À faire" },
        {
          type: "list",
          items: [
            "Commite souvent, par changements cohérents.",
            "Écris des messages de commit clairs, à l'impératif.",
            "Fais un git pull avant de commencer à travailler.",
            "Crée une branche par fonctionnalité.",
            "Relis ton propre diff avant de pousser.",
            "Ajoute un .gitignore dès le début du projet.",
          ],
        },
        { type: "section", id: "a-eviter", text: "À éviter" },
        {
          type: "list",
          items: [
            "Commiter directement sur main.",
            "Pousser du code qui ne compile pas.",
            "Les commits géants de mille lignes que personne ne peut relire.",
            "Oublier de pull avant de push.",
            "Commiter des secrets : mots de passe, clés d'API, fichiers .env.",
          ],
        },
        {
          type: "callout",
          tone: "warning",
          title: "Un secret commité est un secret brûlé",
          text:
            "Supprimer un mot de passe dans un commit suivant ne le supprime pas : il reste dans l'historique, et l'historique est ce qu'on distribue. Si ça t'arrive, considère la clé comme compromise et change-la immédiatement. C'est précisément à ça que sert le .gitignore.",
        },
        { type: "section", id: "gitignore", text: "Le fichier .gitignore" },
        {
          type: "para",
          text:
            "Placé à la racine du projet, ce fichier liste ce que Git doit ignorer : les dépendances réinstallables, les fichiers générés, et surtout tout ce qui est sensible.",
        },
        {
          type: "code",
          label: ".gitignore",
          code:
            "# Dépendances\nnode_modules/\nvenv/\n__pycache__/\n\n# Fichiers sensibles\n.env\n.env.local\nsecrets.json\n\n# Fichiers de build\ndist/\nbuild/\n*.pyc\n\n# IDE\n.vscode/\n.idea/\n\n# Fichiers système\n.DS_Store\nThumbs.db",
        },
        { type: "section", id: "le-workflow-standard", text: "Le workflow standard" },
        {
          type: "para",
          text: "Neuf fois sur dix, une journée de travail ressemble exactement à ça.",
        },
        {
          type: "code",
          label: "bash",
          code:
            "git pull origin main\ngit checkout -b feature/ma-fonctionnalite\n\n# ... tu travailles ...\n\ngit add .\ngit commit -m \"Description claire de ce que fait le changement\"\ngit push origin feature/ma-fonctionnalite\n\n# Puis tu ouvres une Pull Request sur GitHub",
        },
        { type: "section", id: "aide-memoire", text: "Aide-mémoire" },
        {
          type: "code",
          label: "les commandes essentielles",
          code:
            "git init                 Initialise un nouveau dépôt\ngit clone URL            Clone un dépôt distant\ngit status               Affiche l'état du dépôt\ngit add .                Prépare tous les fichiers\ngit commit -m \"msg\"      Crée un commit\ngit push                 Envoie les commits au serveur\ngit pull                 Récupère et fusionne les changements\ngit log                  Affiche l'historique\ngit branch               Liste les branches\ngit merge branche        Fusionne une branche\ngit revert COMMIT        Annule un commit, proprement\ngit reset --hard         Jette tous les changements  /!\\ DANGER",
        },
        {
          type: "callout",
          tone: "warning",
          title: "git reset --hard",
          text:
            "Cette commande supprime définitivement tes modifications non commitées, sans confirmation et sans corbeille. Contrairement à presque tout le reste de Git, ce qu'elle détruit n'est pas récupérable. Préfère git revert, qui annule un commit en en créant un nouveau : l'historique reste honnête.",
        },
        { type: "section", id: "recapitulatif", text: "Récapitulatif" },
        {
          type: "keylist",
          items: [
            { term: "Git", desc: "Le contrôle de version, sur ta machine." },
            { term: "GitHub", desc: "L'hébergement et la collaboration, en ligne." },
            { term: "Commit", desc: "Une version du code, datée et signée." },
            { term: "Branche", desc: "Une ligne de développement indépendante." },
            { term: "Pull request", desc: "La proposition de fusion, et sa relecture." },
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "Prochaine étape",
          text:
            "Crée un dépôt de test dont tu te fiches complètement, et casse-le. Fais des branches, provoque un conflit exprès, essaie de le résoudre. C'est en cassant un dépôt sans enjeu qu'on apprend à ne pas casser les autres.",
        },
      ],
    },
  ],
}
