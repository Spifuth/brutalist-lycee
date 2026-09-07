# Contribuer à LYCEE.SIN

Ce dépôt est le site pédagogique de la spécialité **STI2D SIN**. Tu peux y
contribuer, et ce fichier est le mode d'emploi.

**Tu n'as pas besoin de savoir coder pour être utile ici.** La plus grande
partie du site — quiz, badges, secrets, cours — est du **texte** dans des
fichiers. Tu peux en ajouter depuis ton navigateur, sans rien installer, en dix
minutes. C'est la section 1.

> **Git te fait peur ?** Le site contient un cours **Git & GitHub** écrit
> exactement pour ça : `/docs` → *Git & GitHub*. Sept articles, en français.
> Tu peux aussi le lire après, ce fichier se suffit à lui-même.

### Par où commencer

| Tu veux… | Va à |
|---|---|
| corriger une faute, ajouter une question de quiz | **§1** — dans le navigateur, rien à installer |
| comprendre les mots que tout le monde utilise | **§2** — le vocabulaire |
| lancer le site sur ton ordi | **§4** — l'installation |
| coder une vraie fonctionnalité | **§4** puis **§5** à **§8** |

---

## 1. Ta première contribution, sans rien installer

GitHub sait modifier un fichier directement dans le navigateur, et il crée la
branche et la pull request **à ta place**. Pour une faute d'orthographe ou une
question de quiz, c'est tout ce dont tu as besoin.

1. Ouvre le dépôt sur GitHub et clique sur le fichier à modifier. Par exemple
   `db/seeds/quizzes.ts` pour les quiz.
2. Clique sur l'icône **crayon** ✏️ en haut à droite du fichier.
   - Si un message dit que tu ne peux pas modifier directement, clique quand
     même : GitHub crée automatiquement ta **copie** du dépôt (un *fork*) et
     continue. C'est normal, ce n'est pas une erreur.
3. Modifie le texte. Regarde comment sont écrites les lignes autour de la
   tienne et copie leur forme — virgules et guillemets compris.
4. Descends jusqu'au bouton vert **Commit changes…**.
5. Dans la fenêtre qui s'ouvre :
   - **première ligne** : ce que tu as fait, court. Exemple :
     `feat(quiz): ajoute une question sur le DNS`
   - **deuxième case** : pourquoi, en une phrase.
   - laisse coché **Create a new branch… and start a pull request**.
6. Clique **Propose changes**, puis **Create pull request** sur l'écran suivant.

C'est fini. Ta proposition part vers la branche `dev` automatiquement — tu n'as
rien à choisir. Va lire **§11** pour savoir ce qui se passe ensuite.

> [!TIP]
> **Tu ne peux rien casser en faisant ça.** Une pull request est une
> *proposition* : rien n'arrive sur le site tant que quelqu'un ne l'a pas
> relue et acceptée. Le pire résultat possible est qu'on te demande de
> corriger quelque chose.

Si tu modifies plusieurs fichiers, refais l'opération pour chacun **en
choisissant la même branche** à l'étape 5 (GitHub te la propose une fois
qu'elle existe).

---

## 2. Le vocabulaire

Tu vas croiser ces mots partout. Ils ne veulent dire que ça :

| Mot | Ce que ça veut dire ici |
|---|---|
| **dépôt** (*repo*) | le dossier du projet, avec tout son historique |
| **commit** | une modification enregistrée, avec un message qui l'explique |
| **branche** | une version parallèle du projet où tu travailles sans gêner les autres |
| **`dev`** | la branche de travail commune. **Toutes** les propositions vont là |
| **`main`** | la branche mise en ligne. Seul le prof y touche |
| **fork** | ta copie personnelle du dépôt, sur ton compte GitHub |
| **pull request** (*PR*) | « voilà ce que je propose, regardez » — une demande de fusion |
| **review** | la relecture de ta PR, avec des commentaires |
| **merge** (*fusionner*) | intégrer ta PR dans `dev`. C'est le prof qui le fait |
| **CI** | les vérifications automatiques qui tournent sur chaque PR |
| **issue** | un ticket : un bug signalé, une idée proposée |
| **seed** | le contenu de départ du site, dans `db/seeds/` |
| **idempotent** | qu'on peut relancer autant de fois qu'on veut sans rien casser |

---

## 3. Trois façons de contribuer

| Niveau | Ce que tu fais | Où | Ce qu'il faut savoir |
|---|---|---|---|
| **Contenu** | ajouter un quiz, un badge, un secret, un article de cours | `db/seeds/`, `lib/docs-*.ts` | écrire du texte entre guillemets |
| **Correction** | réparer un bug, une faute, un lien mort | partout | lire le code autour |
| **Fonctionnalité** | une nouvelle page, un nouveau mécanisme | `app/`, `components/`, `lib/` | React + TypeScript + [STYLE.md](./STYLE.md) |

**Pour autre chose qu'une petite correction, commence par une issue.** Onglet
*Issues* → *New issue* → décris ce que tu veux faire. Ça évite que deux
personnes fassent le même travail, et ça permet de te dire « oui, mais plutôt
comme ça » avant que tu y aies passé trois heures.

---

## 4. Installer le projet

> Utile seulement si tu veux **faire tourner le site** sur ton ordinateur.
> Pour ajouter du contenu, la §1 suffit.

### Ce qu'il faut installer

| Outil | Où le prendre | Pour quoi |
|---|---|---|
| **Git** | <https://git-scm.com/downloads> | récupérer et envoyer le code |
| **Node.js 22.9+** | <https://nodejs.org> (version LTS) | faire tourner le site |
| **Docker Desktop** | <https://docs.docker.com/get-started/get-docker/> | la base de données, sans l'installer à la main |

Sous **Windows**, Docker Desktop demande WSL2 ; son installateur le propose, dis
oui. Si Docker refuse de démarrer, tu peux tout de même travailler sur le
contenu avec la §1.

Ensuite, active `pnpm` (le gestionnaire de paquets du projet) :

```bash
corepack enable
corepack prepare pnpm@11.22.0 --activate
```

`npm install` et `yarn` **ne marcheront pas** ici : le projet est verrouillé sur
pnpm par son fichier `pnpm-lock.yaml`.

### Chemin A — tout en Docker (le plus simple)

**macOS / Linux**

```bash
git clone https://github.com/Spifuth/brutalist-lycee.git
cd brutalist-lycee
cp .env.example .env
docker compose up --build
```

**Windows (PowerShell)** — mêmes commandes, sauf la copie du fichier :

```powershell
git clone https://github.com/Spifuth/brutalist-lycee.git
cd brutalist-lycee
copy .env.example .env
docker compose up --build
```

Le site est sur <http://localhost:3000>. Le conteneur `init` crée la base,
remplit le contenu de départ et affiche **une seule fois** la phrase de passe du
compte admin dans ses logs — copie-la tout de suite, elle ne sera pas
réaffichée.

### Chemin B — Node en local, base en Docker

C'est le mode confortable pour développer : la page se recharge toute seule
quand tu enregistres un fichier. **Les mêmes commandes sur Windows, macOS et
Linux**, à la première près :

```bash
cp .env.example .env        # Windows PowerShell : copy .env.example .env
docker compose up -d db     # la base seule, en arrière-plan
pnpm install
pnpm db:setup               # crée les tables et met le contenu de départ
pnpm dev                    # http://localhost:3000
```

Tu n'as **aucune variable à taper** : `pnpm db:setup` et `pnpm dev` lisent
l'adresse de la base dans ton fichier `.env`, à la ligne `DATABASE_URL` — que
`.env.example` remplit déjà pour ce cas précis. Si tu as changé
`POSTGRES_PASSWORD` ou `POSTGRES_PORT` dans `.env`, corrige-la pour qu'elle
corresponde.

> [!TIP]
> **`docker compose up -d db` refuse de démarrer ?** Si le message parle du
> port `5432`, c'est qu'un autre PostgreSQL tourne déjà sur ta machine. Mets
> `POSTGRES_PORT=5433` dans `.env`, remplace `5432` par `5433` dans
> `DATABASE_URL`, et relance.

`pnpm db:setup` est *idempotent* : relance-le autant de fois que tu veux, il ne
casse rien et il remet le contenu des seeds à jour. C'est la commande à lancer
après chaque modification d'un fichier de `db/seeds/`.

Pour tout le reste (variables d'environnement, base externe, administration,
sauvegarde), lis [SELF_HOSTING.md](./SELF_HOSTING.md).

---

## 5. Le workflow git en ligne de commande

**Règle unique et non négociable : on ne pousse jamais sur `dev` ni sur `main`.**
Les deux branches sont protégées, GitHub refusera. Tout passe par une pull
request.

```
main   ← les versions en ligne. Seul le prof y fusionne, depuis dev.
dev    ← la branche de travail. C'est la cible de TOUTES les PR.
  └── feat/ma-fonctionnalite   ← ta branche
```

### D'abord, ton fork

Tu n'as pas le droit d'écrire dans ce dépôt, et **c'est normal** : personne ne
l'a à part le prof. Tu travailles dans **ta copie**, et tu proposes ensuite.

1. Sur la page du dépôt, clique **Fork** en haut à droite, puis **Create fork**.
2. Clone **ta** copie — celle dont l'URL contient *ton* pseudo, pas `Spifuth` :

```bash
git clone https://github.com/TON-PSEUDO/brutalist-lycee.git
cd brutalist-lycee
git remote add upstream https://github.com/Spifuth/brutalist-lycee.git
```

Tu as maintenant deux adresses : `origin` est ta copie — c'est la seule où tu
peux **pousser** ; `upstream` est le dépôt commun — c'est là que tu **proposes**
et d'où tu récupères le travail des autres.

> Si le prof t'a ajouté comme collaborateur du dépôt, saute le fork et clone
> directement `https://github.com/Spifuth/brutalist-lycee.git`. Partout où on
> écrit `upstream` ci-dessous, écris `origin`.

### Se connecter à GitHub

Au premier `git push`, GitHub demande une identification. **Ton mot de passe de
compte ne marche pas** — c'est normal, il a été supprimé pour ça. Le plus simple
est d'installer [GitHub CLI](https://cli.github.com) puis :

```bash
gh auth login
```

Réponds *GitHub.com* → *HTTPS* → *Login with a web browser*, et colle le code
affiché. C'est à faire une seule fois sur ton ordinateur.

### Le cycle, à chaque fois

```bash
git checkout dev                      # revenir sur la branche commune
git pull upstream dev                 # récupérer les nouveautés des autres
git checkout -b feat/quiz-reseaux     # créer TA branche, une par sujet

# ... tu modifies des fichiers ...

git status                            # regarde ce que tu t'apprêtes à envoyer
git add -A                            # prendre toutes tes modifications
git commit -m "feat(quiz): ajoute le quiz sur les réseaux"
git push -u origin feat/quiz-reseaux  # les envoyer sur TA copie
```

GitHub répond avec un lien : clique-le, ou va sur le dépôt et clique
**Compare & pull request**. Sur l'écran suivant, vérifie la ligne du haut :
la cible doit être **`Spifuth/brutalist-lycee`, branche `dev`**.

> [!TIP]
> `git add -A` prend **tout** ce que tu as modifié, y compris des fichiers que
> tu ne voulais pas envoyer. `git status` juste avant te montre la liste — un
> coup d'œil, une seconde. Ton `.env` n'y apparaîtra pas : il est ignoré exprès
> (voir §12), et un test du dépôt vérifie qu'il le reste.

### Nommer sa branche

| Préfixe | Pour quoi |
|---|---|
| `feat/` | une nouveauté |
| `fix/` | une correction de bug |
| `docs/` | de la documentation, du contenu de cours |
| `chore/` | de la maintenance (dépendances, config, CI) |
| `test/` | uniquement des tests |

Le reste du nom est en minuscules avec des tirets : `fix/badge-jamais-obtenable`.

### Écrire un message de commit

```
type(portée): ce que fait le commit, à l'impératif, en minuscule

Pourquoi ce changement existe. Pas ce qu'il fait — ça, le code le dit déjà.
Ce qui t'a surpris, ce que tu as essayé et qui ne marchait pas.
```

Un vrai exemple tiré de l'historique du projet :

```
fix(badges): four badges could never be earned
```

Un mauvais exemple :

```
update
```

---

## 6. Les cinq vérifications automatiques

Chaque pull request déclenche des tests automatiques (la *CI*).

En bas de ta PR, tu ne verras pas cinq lignes mais **deux** : `build`, qui
enchaîne les quatre contrôles ci-dessous, et `style-gate`, qui est le
cinquième (§7). **Les deux doivent être vertes** ou la PR ne peut pas être
fusionnée — clique sur *Details* pour voir lequel des contrôles a lâché.

Tu peux lancer les quatre premiers chez toi avant de pousser, ça évite les
allers-retours (dans cet ordre : `check:origins` relit ce que `build` vient de
produire) :

```bash
pnpm build          # 1. le site compile
pnpm check:origins  # 2. aucune ressource chargée depuis Internet
pnpm typecheck      # 3. TypeScript est content
pnpm test           # 4. les tests passent
```

La cinquième, `style-gate`, tourne uniquement sur GitHub : c'est la §7.

**1. `pnpm build`** — Next.js compile le site. Si ça casse ici, c'est en général
une virgule oubliée ou un import vers un fichier qui n'existe pas.

**2. `pnpm check:origins`** — le site est **auto-hébergé et ne parle à
personne** : aucun CDN, aucune police Google, aucun script de statistiques. Ce
contrôle relit le site compilé et échoue s'il trouve une adresse extérieure. Si
tu as besoin d'une bibliothèque, installe-la avec `pnpm add` : elle sera
embarquée dans le site, pas chargée depuis Internet.

**3. `pnpm typecheck`** — TypeScript vérifie que les types collent. N'écris pas
`any` pour faire taire une erreur : si le type te résiste, demande de l'aide
dans ta PR, c'est fait pour.

**4. `pnpm test`** — les tests du dossier `tests/`. Voir §10.

> `pnpm lint` existe dans `package.json` mais **aucune configuration ESLint
> n'est présente** : la commande échoue. Elle n'est pas dans la CI, donc ce
> n'est jamais la faute de ta PR. La brancher est une bonne première
> contribution `chore/`.

---

## 7. STYLE.md, ou pourquoi ta PR peut être refusée

[STYLE.md](./STYLE.md) est un **contrat**, pas une suggestion. Le site a une
identité visuelle *brutaliste* : angles vifs, bordures épaisses, pas d'ombres.
Un seul coin arrondi et la page ressemble à un autre site.

Trois règles sont vérifiées automatiquement (`style-gate`) et te bloqueront :

| Interdit | À la place |
|---|---|
| `rounded-md`, `rounded-lg`, `rounded-full`, `shadow-*` | rien. Les angles sont carrés, point. |
| une couleur écrite en dur (`#f1efe9`, `bg-blue-500`) | un nom : `bg-background`, `text-foreground`, `border-foreground`, `text-accent`, `text-muted-foreground` |
| `bg-white`, `bg-black` | `bg-background` / `text-foreground`. Le papier est chaud, l'encre n'est pas noire. |

La seule exception est `lib/theme-tokens.ts`, pour une raison technique
expliquée dans le fichier. **Ne l'élargis pas.**

En cas de doute sur l'allure d'un composant, ouvre
`components/vote/vote-board.tsx` ou `components/site/page-shell.tsx` et copie
leur forme. Avant de pousser, lis la checklist de [STYLE.md §10](./STYLE.md).

---

## 8. Où vivent les choses

```
app/               les pages du site et les actions serveur
  admin/           la console d'administration
  api/             les quelques routes techniques (temps réel, config)
components/        les composants d'interface
  ui/              briques standard — NE PAS y changer le style, voir STYLE.md §5
  site/            l'ossature des pages, la navigation
db/
  schema.sql       la structure de la base de données
  seed.ts          remplit le contenu de départ
  seeds/           LE CONTENU : badges.ts, quizzes.ts, secrets.ts
lib/               la logique du site (connexion, points, badges, quiz, secrets)
  docs.ts          l'index des matières du cours
  docs-git.ts      le cours « Git & GitHub » — le modèle à suivre
tests/             les tests
gateway/           service séparé : le terminal des élèves
scripts/           les contrôles lancés par la CI
```

---

## 9. Ajouter du contenu

C'est la contribution la plus utile et la plus facile. Tout le contenu du site
vit dans la base de données, mais les fichiers de `db/seeds/` en sont la
**source** : ils sont réappliqués à chaque démarrage. Ce qui n'y est pas peut
disparaître — donc ajoute-le ici, pas seulement dans la console d'admin.

Après chaque modification d'un seed : `pnpm db:setup` pour la voir apparaître.

### Un quiz — `db/seeds/quizzes.ts`

```ts
{
  slug: "reseaux-bases",              // unique, en minuscules avec des tirets
  title: "Les bases des réseaux",
  topic: "Réseaux",
  level: "tous",
  description: "IP, DNS, et ce qui se passe quand tu tapes une adresse.",
  badgeSlug: "quiz-first",            // facultatif, doit exister dans badges.ts
  questions: [
    {
      prompt: "À quoi sert le DNS ?",
      options: ["Chiffrer", "Traduire un nom en adresse IP", "Router", "Compresser"],
      correct: 1,                     // position dans options — on compte à partir de 0 !
      explanation: "Le DNS est l'annuaire : il transforme exemple.fr en 93.184.x.x.",
    },
  ],
}
```

⚠️ `correct: 1` désigne la **deuxième** réponse. En informatique on compte à
partir de zéro : la première option est `0`.

`explanation` est facultative pour le code mais pas en vrai : elle s'affiche
après la réponse, c'est le moment où l'élève apprend quelque chose. Écris-la.

### Un badge — `db/seeds/badges.ts`

```ts
{ slug: "net-pro", name: "Réseauteur·se", description: "Quiz réseau sans faute.",
  icon: "network", points: 20, kind: "manual" }
```

- `icon` est un nom d'icône **lucide-react** — cherche-le sur
  <https://lucide.dev/icons> (`network`, `terminal`, `vote`…).
- `kind` vaut `"manual"` (le prof l'attribue depuis `/admin`) ou
  `"auto:<événement>"`. **Un `auto:` que `lib/awards.ts` n'envoie jamais est un
  badge que personne ne pourra obtenir** — c'était un vrai bug de ce dépôt
  (commit `fix(badges): four badges could never be earned`). Si tu ajoutes un
  `auto:`, ajoute aussi le code qui le déclenche, sinon mets `"manual"`.

### Un secret — `db/seeds/secrets.ts`

Lis l'en-tête du fichier avant d'y toucher : il décrit **quatre familles** de
secrets qui ne se traitent pas pareil. En particulier, les secrets
`"Connaissance — …"` nomment une vraie faille que ce site **n'a pas** : il ne
faut surtout pas la créer pour rendre le secret « trouvable ».

Attention au **palier automatique** : sa valeur `unlockAt` doit correspondre au
nombre de secrets ordinaires. Si tu en ajoutes un sans mettre le palier final à
jour, la récompense « tu as tout trouvé » se déclenche trop tôt.
`tests/secret-seeds.test.ts` le vérifie et fera échouer ta PR — c'est voulu, pas
une brimade.

### Un article de cours — `lib/docs-*.ts`

La plupart des matières sont encore du texte d'exemple. Les remplacer par du
vrai cours est **la contribution la plus précieuse du dépôt**.

Suis exactement la forme de `lib/docs-git.ts` : une matière = un fichier,
importé dans `lib/docs.ts`. Les types de blocs disponibles sont listés en haut
de `lib/docs.ts` (`para`, `section`, `code`, `callout`, `keylist`, `list`).

Deux pièges :

- **L'import s'écrit avec l'extension `.ts`** (`from "./docs-git.ts"`). Sans
  elle, les tests ne trouvent pas le fichier.
- **Les `slug` d'articles et les `id` de sections doivent être uniques.** Un
  doublon écrase l'autre sans prévenir. `tests/docs-content.test.ts` le détecte.

---

## 10. Écrire un test

Quand tu corriges un bug, écris le test **avant** le correctif : un test qui
échoue prouve que tu as compris le problème, et le même test qui passe prouve
que tu l'as réglé.

```ts
// tests/mon-sujet.test.ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { maFonction } from "../lib/mon-sujet.ts"   // extension .ts obligatoire

test("décris le comportement attendu, pas le nom de la fonction", () => {
  assert.equal(maFonction(2), 4)
})
```

Puis `pnpm test`.

Tout n'a pas besoin d'un test. Ce qui en mérite un : une règle de calcul
(points, badges, paliers), un cas limite que tu as trouvé à la main, un bug que
tu corriges.

---

## 11. Après avoir ouvert ta PR

**1. Les vérifications tournent** (2–3 minutes). En bas de la page de ta PR
tu verras des ✅ ou des ❌.

> **À ta toute première PR**, GitHub ne les lance pas tout seul : il affiche
> *« 1 workflow awaiting approval »* et attend que le prof clique. C'est une
> sécurité de GitHub pour les dépôts publics, pas une erreur de ta part, et ça
> n'arrive qu'une fois. Si ça traîne, dis-le en commentaire de ta PR.

**Une croix rouge n'est pas une punition** — c'est une machine qui te dit où
regarder. Clique sur **Details** à côté de la ligne rouge, descends jusqu'à la
ligne surlignée en rouge : c'est l'erreur. Corrige, recommite, repousse — la PR
se met à jour toute seule.

**2. Quelqu'un relit.** Ta PR sera commentée. Ce n'est pas un jugement sur toi,
c'est comme ça que le code s'améliore. Ce qui est regardé, dans l'ordre :

1. Est-ce que ça résout bien le problème annoncé ? Pas plus, pas moins.
2. Est-ce que les cinq vérifications sont vertes ?
3. Est-ce que ça respecte STYLE.md ?
4. Est-ce que le message de commit explique le **pourquoi** ?
5. Est-ce qu'un cas limite mériterait un test ?

**3. Tu réponds.** Si tu n'es pas d'accord, dis-le et explique — tu as
peut-être raison. Sinon corrige, pousse un nouveau commit **sur la même
branche**, et clique *Resolve conversation* sur la remarque traitée. Toutes les
conversations doivent être résolues pour fusionner.

**4. Si GitHub dit « This branch has conflicts »** : quelqu'un a modifié les
mêmes lignes que toi entre-temps. Ne panique pas et ne recommence pas tout —
demande de l'aide dans la PR, c'est une manipulation qu'on fait à deux la
première fois.

**5. Fusion.** Une fois approuvée, ta PR est intégrée à `dev` et ta branche est
supprimée automatiquement. Ton travail sera en ligne au prochain déploiement.

---

## 12. Ce qu'il ne faut jamais faire

- **Enregistrer un `.env`, un mot de passe, une clé ou un jeton.** Le dépôt est
  public. `.env` et ses variantes sont ignorés par git (`.gitignore`), et
  `tests/repo-hygiene.test.ts` échoue si quelqu'un défait cette protection —
  mais ==ne compte pas là-dessus pour un secret collé ailleurs==, dans un test
  ou un commentaire : GitHub ne bloque que les jetons qu'il sait reconnaître,
  pas un mot de passe ordinaire. Si un secret est déjà parti quelque part :
  préviens, et considère-le comme grillé — il faut le changer, pas seulement
  l'effacer du fichier.
- **Charger quelque chose depuis Internet** (CDN, police, script de
  statistiques). `pnpm check:origins` refusera.
- **Mettre une donnée personnelle d'un camarade** dans le code, un test ou une
  capture d'écran : pas de vrai nom, pas de photo, pas d'adresse mail.
- **Changer le style dans `components/ui/`** : ces fichiers sont volontairement
  laissés tels quels. Le style vit dans `styles/globals.css` et dans tes
  propres composants.
- **Pousser directement sur `dev` ou `main`.** GitHub refusera, mais l'intention
  compte.
- **Mélanger dix sujets dans une seule PR.** Une PR = une idée.

---

## 13. Signaler quelque chose

Tu n'as pas besoin de savoir corriger un problème pour le signaler. Un bon
rapport vaut souvent plus qu'un correctif approximatif.

**Le plus simple : la page [`/bug-report`](https://lycee-next.nebulahost.tech/bug-report) du site.**
Tu remplis un formulaire une fois, et tu obtiens les deux choses à faire : le
message à coller dans `#bug-report` sur le Discord de la classe, et un lien qui
ouvre une issue GitHub **déjà remplie**.

Quatre types, quatre destinations :

| Ce que tu as trouvé | Ça part dans |
|---|---|
| une page qui plante, un bouton qui ne fait rien | `bug.yml` |
| une faute, une réponse de quiz fausse, un cours à écrire | `contenu.yml` |
| du code dupliqué, du code mort, un truc incohérent | `code.yml` |
| une fonctionnalité qui manque | `idee.yml` |

**Fais les deux canaux, pas un seul.** Le message Discord est vu tout de suite
par toute la classe, mais il descend dans le fil et disparaît. L'issue ne
disparaît pas : elle porte un numéro, elle se ferme quand c'est réparé, et
c'est elle qu'on relit dans trois semaines.

Un rapport utile tient en trois règles : **une seule chose à la fois**, **les
étapes exactes dans l'ordre**, et **le message d'erreur en texte** (F12 →
Console) et non en capture d'écran. Et jamais le nom, la photo ou l'adresse
d'un camarade : le dépôt est public.

---

## 14. Bloqué ?

- Une erreur que tu ne comprends pas → passe par [`/bug-report`](https://lycee-next.nebulahost.tech/bug-report)
  (§13) et colle le message **en entier, en texte** — pas une capture d'écran illisible.
- Une question sur le fonctionnement du site → la page `/comment-ca-marche`, puis
  [SELF_HOSTING.md](./SELF_HOSTING.md).
- Git t'embrouille → le cours **Git & GitHub** du site, `/docs`.
- Tu ne sais pas par quoi commencer → les issues marquées
  [`good first issue`](https://github.com/Spifuth/brutalist-lycee/labels/good%20first%20issue).

Rien de ce que tu peux faire ici n'est irréparable : tant qu'une PR n'est pas
fusionnée, elle ne touche à rien. Le pire scénario est une PR refusée — et une
PR refusée t'aura quand même appris quelque chose.
