# Contribuer à LYCEE.SIN

Ce dépôt est le site pédagogique de la spécialité **STI2D SIN**. Tu peux y
contribuer, et ce fichier est le mode d'emploi complet : de l'installation à la
pull request fusionnée.

Tu n'as **pas** besoin d'être bon en Next.js pour contribuer utilement. La
majorité du site (quiz, badges, secrets, cours) est du **contenu** : des
fichiers de données que tu peux modifier sans écrire une ligne de React.

---

## 1. Trois façons de contribuer

| Niveau | Ce que tu fais | Où | Prérequis |
|---|---|---|---|
| **Contenu** | ajouter un quiz, un badge, un secret, un article de cours | `db/seeds/`, `lib/docs-*.ts` | savoir écrire du texte entre guillemets |
| **Correction** | réparer un bug, une faute, un lien mort | partout | lire le code autour |
| **Fonctionnalité** | une nouvelle page, un nouveau mécanisme | `app/`, `components/`, `lib/` | React + TypeScript + [STYLE.md](./STYLE.md) |

**Commence par une issue.** Avant d'écrire du code, ouvre une issue (onglet
*Issues*) et décris ce que tu veux faire. Ça évite que deux personnes fassent le
même travail, et ça permet de te dire « oui, mais plutôt comme ça » avant que tu
aies passé trois heures dessus.

---

## 2. Installer le projet

### Prérequis

- **Node.js 22** ou plus récent
- **pnpm 11.22.0** — le projet le fixe dans `package.json` (`packageManager`).
  Installe-le avec `corepack enable && corepack prepare pnpm@11.22.0 --activate`
- **PostgreSQL 16**, ou **Docker** (le plus simple, voir ci-dessous)

`npm` et `yarn` ne fonctionneront pas correctement : le lockfile est un
`pnpm-lock.yaml`.

### Chemin A — tout en Docker (recommandé pour démarrer)

```bash
git clone https://github.com/Spifuth/brutalist-lycee.git
cd brutalist-lycee
cp .env.example .env      # à éditer si tu veux
docker compose up --build
```

Le site est sur <http://localhost:3000>. Le conteneur `init` crée le schéma,
remplit le contenu de départ et affiche **une seule fois** la phrase de passe du
compte admin dans ses logs — copie-la.

### Chemin B — Node en local, Postgres en Docker

C'est le mode confortable pour développer : le rechargement à chaud fonctionne.

```bash
docker compose up -d db                       # juste la base
pnpm install
export DATABASE_URL=postgres://lycee:lycee@localhost:5432/lycee_sin
pnpm db:setup                                 # schéma + contenu de départ
pnpm dev                                      # http://localhost:3000
```

`pnpm db:setup` est **idempotent** : tu peux le relancer autant de fois que tu
veux, il ne casse rien et il remet le contenu des seeds à jour.

Pour tout le reste (variables d'environnement, base externe, administration,
sauvegarde), lis [SELF_HOSTING.md](./SELF_HOSTING.md).

---

## 3. Le workflow git

**Règle unique et non négociable : on ne pousse jamais sur `dev` ni sur `main`.**
Les deux branches sont protégées, GitHub refusera. Tout passe par une pull
request.

```
main   ← les versions déployées. Seul le prof y fusionne, depuis dev.
dev    ← la branche de travail. C'est la cible de TOUTES tes PR.
  └── feat/ma-fonctionnalite   ← ta branche
```

### Si tu es collaborateur du dépôt

```bash
git checkout dev
git pull
git checkout -b feat/quiz-reseaux     # une branche par sujet
# ... tu travailles ...
git add -A
git commit -m "feat(quiz): ajoute le quiz sur les réseaux"
git push -u origin feat/quiz-reseaux
```

Puis sur GitHub : *Compare & pull request* → **cible `dev`**, jamais `main`.

### Si tu n'es pas collaborateur

Clique sur **Fork** en haut à droite, travaille dans ton fork, puis ouvre la PR
depuis ton fork vers `Spifuth/brutalist-lycee` branche `dev`. C'est le même
travail, GitHub s'occupe du reste.

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

On suit les **Conventional Commits**, comme tout l'historique du dépôt :

```
type(portée): ce que fait le commit, à l'impératif, en minuscule

Pourquoi ce changement existe. Pas ce qu'il fait — ça, le diff le dit déjà.
Ce qui t'a surpris, ce que tu as essayé et qui ne marchait pas, la contrainte
que le lecteur ne devinera pas.
```

Un vrai exemple tiré de l'historique :

```
fix(badges): four badges could never be earned
```

Un mauvais exemple :

```
update
```

---

## 4. Les cinq portes de la CI

Chaque pull request déclenche `.github/workflows/ci.yml`. **Les cinq doivent
passer** ou la PR ne peut pas être fusionnée. Lance-les en local avant de
pousser, ça t'évitera des allers-retours :

```bash
pnpm build          # 1. le site compile
pnpm check:origins  # 2. aucune ressource externe dans le build
pnpm typecheck      # 3. TypeScript est content
pnpm test           # 4. les tests passent
```

Et la cinquième, `style-gate`, est un `grep` : voir la section suivante.

### 1. `pnpm build`
Next.js compile. Si ça casse ici, c'est en général une erreur de syntaxe ou un
import qui n'existe pas.

### 2. `pnpm check:origins`
Le site est **auto-hébergé et ne parle à personne**. Aucun CDN, aucune police
Google, aucune balise d'analytics. Ce script relit le build et échoue s'il
trouve une URL externe. Si tu as besoin d'une bibliothèque, installe-la avec
`pnpm add` : elle sera empaquetée dans le build, pas chargée depuis Internet.

### 3. `pnpm typecheck`
`tsc --noEmit`. Pas de `any` pour faire taire une erreur : si le type te résiste,
demande plutôt de l'aide dans la PR.

### 4. `pnpm test`
`node --test`, les fichiers sont dans `tests/`. Voir §7.

> `pnpm lint` existe dans `package.json` mais aucune config ESLint n'est encore
> présente : la commande échoue, elle n'est pas dans la CI, et ce n'est pas un
> problème de ta PR. Si tu veux la brancher, c'est une bonne première
> contribution `chore/`.

### 5. `style-gate`
Voir tout de suite en dessous.

---

## 5. STYLE.md, ou pourquoi ta PR va être refusée

[STYLE.md](./STYLE.md) est un **contrat**, pas une suggestion. Le site a une
identité visuelle brutaliste : angles vifs, bordures épaisses, pas d'ombres. Un
seul coin arrondi et la page ressemble à un autre site.

Trois règles sont vérifiées automatiquement par la CI (`style-gate`) et te
bloqueront :

| Interdit | À la place |
|---|---|
| `rounded-md`, `rounded-lg`, `rounded-full`, `shadow-*` | rien. `--radius: 0rem`. Les angles sont carrés. |
| une couleur en dur (`#f1efe9`, `bg-blue-500`, `text-white`) | un token sémantique : `bg-background`, `text-foreground`, `border-foreground`, `text-accent`, `text-muted-foreground` |
| `bg-white`, `bg-black` | `bg-background` / `text-foreground`. Le papier est chaud, l'encre n'est pas noire. |

La seule exception documentée est `lib/theme-tokens.ts` (xterm et
`viewport.themeColor` ne savent pas lire une variable CSS). **N'élargis pas
cette exception.**

Avant de pousser, lis au minimum la [checklist de revue, STYLE.md §10](./STYLE.md).
En cas de doute sur l'allure d'un composant, ouvre
`components/vote/vote-board.tsx` ou `components/site/page-shell.tsx` et copie
leur forme.

---

## 6. Où vivent les choses

```
app/               les pages (App Router Next.js) et les Server Actions
  admin/           la console d'administration
  api/             les quelques routes HTTP (SSE temps réel, config)
components/        les composants React
  ui/              shadcn/ui brut — NE PAS suivre son style, voir STYLE.md §5
  site/            la coquille de page, la navigation
db/
  schema.sql       le schéma complet, idempotent (CREATE ... IF NOT EXISTS)
  migrate.mjs      applique le schéma
  seed.ts          remplit le contenu et garantit un compte admin
  seeds/           LE CONTENU : badges.ts, quizzes.ts, secrets.ts
lib/               toute la logique métier (auth, points, badges, quiz, secrets)
  docs.ts          l'index des matières du cours
  docs-git.ts      le cours « Git & GitHub » — le modèle à suivre
tests/             les tests (node:test)
gateway/           service séparé : le terminal des élèves. Voir gateway/README.md
scripts/           les contrôles maison lancés par la CI
```

---

## 7. Ajouter du contenu

C'est la contribution la plus utile et la plus facile. **Tout le contenu est
dans la base**, mais les fichiers `db/seeds/` en sont la source de vérité
versionnée : le seed les réapplique à chaque démarrage, donc ce qui n'y est pas
peut disparaître.

Après chaque modification d'un seed : `pnpm db:setup` pour la voir apparaître.

### Un quiz — `db/seeds/quizzes.ts`

```ts
{
  slug: "reseaux-bases",              // unique, en minuscules avec des tirets
  title: "Les bases des réseaux",
  topic: "Réseaux",
  level: "tous",
  description: "IP, DNS, et ce qui se passe quand tu tapes une adresse.",
  badgeSlug: "quiz-first",            // optionnel, doit exister dans badges.ts
  questions: [
    {
      prompt: "À quoi sert le DNS ?",
      options: ["Chiffrer", "Traduire un nom en adresse IP", "Router", "Compresser"],
      correct: 1,                     // index dans options, commence à 0
      explanation: "Le DNS est l'annuaire : il transforme exemple.fr en 93.184.x.x.",
    },
  ],
}
```

`explanation` n'est pas optionnelle en pratique : elle s'affiche après la
réponse, c'est là que l'élève apprend quelque chose. Écris-la.

### Un badge — `db/seeds/badges.ts`

```ts
{ slug: "net-pro", name: "Réseauteur·se", description: "Quiz réseau sans faute.",
  icon: "network", points: 20, kind: "manual" }
```

- `icon` est un nom d'icône **lucide-react** (`network`, `terminal`, `vote`…).
- `kind` vaut `"manual"` (le prof l'attribue depuis `/admin`) ou
  `"auto:<événement>"`. **Un `auto:` que `lib/awards.ts` n'émet pas est un badge
  que personne ne pourra jamais obtenir** — c'était un vrai bug du dépôt
  (commit `fix(badges): four badges could never be earned`). Si tu ajoutes un
  `auto:`, ajoute aussi le code qui le déclenche, ou mets `"manual"`.

### Un secret — `db/seeds/secrets.ts`

Lis l'en-tête du fichier avant d'y toucher : il décrit quatre familles de
secrets et elles ne se traitent pas pareil. En particulier, les secrets
`"Connaissance — …"` nomment une vraie faille que ce site **n'a pas** :
il ne faut surtout pas l'implémenter pour rendre le secret « trouvable ».

Attention au **palier automatique** : sa valeur `unlockAt` doit correspondre au
nombre de secrets ordinaires. Si tu en ajoutes un sans mettre à jour le palier
final, la récompense « tu as tout trouvé » se déclenche trop tôt.
`tests/secret-seeds.test.ts` vérifie ça et fera échouer ta PR — c'est voulu.

### Un article de cours — `lib/docs-*.ts`

La plupart des matières sont encore du texte d'exemple généré par
`makeArticle()`. Les remplacer par du vrai cours est la contribution la plus
précieuse du dépôt.

Suis exactement la forme de `lib/docs-git.ts` : une matière = un fichier,
importée dans `lib/docs.ts`. Les blocs disponibles sont typés dans `lib/docs.ts`
(`para`, `section`, `code`, `callout`, `keylist`, `list`).

Deux pièges :

- **L'import porte l'extension `.ts` explicite.** Les tests tournent sous
  `node --test --experimental-strip-types`, qui ne résout pas un chemin sans
  extension.
- **Les `slug` d'articles et les `id` de sections doivent être uniques.** Un
  doublon écrase silencieusement l'autre au seed. `tests/docs-content.test.ts`
  le détecte.

---

## 8. Écrire un test

On écrit le test **avant** le correctif quand c'est un bug : un test qui échoue
prouve que tu as compris le problème ; le même test qui passe prouve que tu l'as
réglé.

```ts
// tests/mon-sujet.test.ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { maFonction } from "../lib/mon-sujet.ts"   // extension .ts obligatoire

test("décrit le comportement attendu, pas le nom de la fonction", () => {
  assert.equal(maFonction(2), 4)
})
```

```bash
pnpm test
```

Tout n'a pas besoin d'un test. Ce qui en mérite un : une règle de calcul
(points, badges, paliers), un cas limite que tu as trouvé à la main, un bug que
tu corriges.

---

## 9. Ce qu'il ne faut jamais faire

- **Commettre un `.env`, un mot de passe, une clé, un token.** Le dépôt est
  public et la protection anti-secrets de GitHub bloquera le push. Si tu as déjà
  poussé un secret quelque part : préviens, et considère-le comme compromis —
  il faut le changer, pas juste le supprimer du fichier.
- **Charger quoi que ce soit depuis Internet** (CDN, police, script d'analytics).
  `pnpm check:origins` refusera.
- **Mettre une donnée personnelle d'élève** dans le code, un test ou une capture
  d'écran : pas de vrai nom, pas de photo, pas d'adresse mail.
- **Toucher à `components/ui/`** pour changer le style : c'est du shadcn brut,
  volontairement laissé tel quel. Le style vit dans `styles/globals.css` et dans
  tes composants.
- **Élargir l'exception hex de `lib/theme-tokens.ts`.**
- **Pousser directement sur `dev` ou `main`.** GitHub refusera, mais l'intention
  compte.
- **Mélanger dix sujets dans une PR.** Une PR = une idée.

---

## 10. Ce qui est regardé en revue

Ta PR sera lue, et probablement commentée. Ce n'est pas une critique de toi,
c'est comment le code s'améliore. Ce qui est regardé, dans cet ordre :

1. **Est-ce que ça résout bien le problème annoncé ?** Pas plus, pas moins.
2. **Est-ce que les cinq portes de la CI sont vertes ?**
3. **Est-ce que ça respecte STYLE.md ?**
4. **Est-ce que le message de commit explique le *pourquoi* ?**
5. **Est-ce qu'un cas limite manque un test ?**

Pour répondre à une remarque : discute si tu n'es pas d'accord — argumente, tu
as peut-être raison. Sinon, corrige, pousse un nouveau commit sur la même
branche (la PR se met à jour toute seule), et marque la conversation comme
résolue. **Toutes les conversations doivent être résolues pour fusionner.**

Une fois approuvée, la PR est fusionnée en *squash* dans `dev` et ta branche est
supprimée automatiquement. Ton travail est en ligne au prochain déploiement.

---

## 11. Bloqué ?

- Une erreur que tu ne comprends pas → ouvre une issue *Bug*, colle le message
  d'erreur **en entier** (pas une capture d'écran illisible : du texte).
- Une question sur le fonctionnement du site → `SELF_HOSTING.md` d'abord, la
  page `/comment-ca-marche` du site ensuite.
- Git te fait peur → le cours **Git & GitHub** du site (`/docs`) a été écrit
  exactement pour ça.

Rien de ce que tu peux casser ici n'est irréparable. Le pire scénario est une PR
refusée, et une PR refusée t'aura quand même appris quelque chose.
