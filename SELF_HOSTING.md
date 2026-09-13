# LYCEE.SIN — Guide d'hébergement & d'administration

Application pédagogique (STI2D SIN) : votes, quiz, questions, badges, chasse aux
secrets et classement, avec une console d'administration. Backend Postgres,
authentification par session maison (pseudo + phrase de passe), packagée pour
tourner en autonomie avec Docker.

---

## 1. Architecture

| Élément            | Détail                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router, Server Actions)                                |
| Base de données    | PostgreSQL 16 (accès via `pg`, requêtes paramétrées — pas d'ORM)       |
| Auth               | Sessions maison : cookie httpOnly, table `sessions`, hash de la phrase |
| Contenu dynamique  | docs, quiz, badges, secrets, votes, questions — tout en base           |
| Rôles              | `is_admin` sur `users` → accès à `/admin`                              |

Fichiers clés :

- `db/schema.sql` — schéma complet (idempotent, `CREATE ... IF NOT EXISTS`).
- `db/migrate.mjs` — applique le schéma. Lit `DATABASE_URL`.
- `db/seed.ts` — remplit le contenu de départ + garantit un compte admin.
- `db/seeds/*` — données de départ éditables (badges, quiz, secrets).
- `lib/db.ts` — pool Postgres + helpers `query` / `queryOne`.
- `lib/auth.ts` — sessions, `getSessionUser`, `requireUser`, `requireAdmin`.
- `app/actions/*` — Server Actions (toute l'écriture passe ici).

---

## 2. Démarrage rapide (Docker)

Prérequis : Docker + Docker Compose.

```bash
cp .env.example .env         # puis éditez les secrets
docker compose up --build
```

Ce que fait le stack :

1. `db` — Postgres 16 avec un volume persistant (`db_data`).
2. `init` — applique la migration puis le seed, **une fois**, et s'arrête.
3. `app` — le serveur Next.js, démarre après `init`.

Ouvrez ensuite <http://localhost:3000>.

### Récupérer la phrase de passe admin

Si `SEED_ADMIN_PASSPHRASE` est vide dans `.env`, le seed en génère une
aléatoire et **l'affiche une seule fois** dans les logs du conteneur `init` :

```bash
docker compose logs init | grep -A4 "ADMIN CREATED"
```

Notez-la. Vous pourrez ensuite la réinitialiser depuis la console admin
(onglet Utilisateurs → icône clé).

---

## 3. Mettre à jour le site déployé

Le site public sert le code de la branche **`dev`** : c'est là que sont
fusionnées les pull requests. Mettre à jour, c'est donc récupérer `dev`,
reconstruire l'image, laisser `init` rejouer migration et seed, et recréer
`app`.

```bash
git checkout dev && git pull
docker compose up -d --build
```

Ce que fait cette seule commande, dans l'ordre :

1. reconstruit l'image à partir du code fraîchement récupéré ;
2. relance `init`, qui applique `db/schema.sql` puis rejoue `db/seed.ts`, et
   s'arrête — **c'est ce passage qui fait apparaître le contenu ajouté par les
   pull requests** ;
3. recrée `app`, qui n'accepte de démarrer qu'après un `init` terminé avec
   succès (`service_completed_successfully` dans le compose).

Le volume `db_data` n'est pas touché : les comptes, les scores et les secrets
trouvés traversent le déploiement.

> [!NOTE]
> Ces deux commandes de `init` — `db/migrate.mjs` puis `db/seed.ts` — sont
> exactement ce que lance `pnpm db:setup` en local (§5). Un contributeur qui a
> vu son quiz apparaître sur sa machine a déjà vu le déploiement en miniature.

### Les trois contrôles après un déploiement

**1. Le site répond.**

```bash
docker compose ps        # app "running", init "exited (0)"
curl -sI http://localhost:3000 | head -1
```

**2. `init` est sorti en 0, et son log dit ce qu'il a semé.**

```bash
docker compose logs init
```

Vous devez y lire les lignes `[seed] badges: …`, `[seed] quizzes: …`,
`[seed] docs: … subjects, … articles`, `[seed] secrets: …` et le rappel du
palier final. Si le seed a élagué des articles, il l'écrit aussi
(`[seed] docs: pruned … article(s)`) — lisez cette ligne, elle est la seule
trace d'une suppression. Un `init` en échec empêche `app` de démarrer : le
déploiement s'arrête là, il ne passe pas à la nouvelle version à moitié.

**3. Les compteurs n'ont pas chuté.** ← c'est le contrôle qui compte

Le seed est rejoué à **chaque** déploiement, et le travail des élèves vit dans
la même base que le contenu semé. Relevez les compteurs avant, comparez après :

```bash
docker compose exec db psql -U lycee -d lycee_sin -c "
  SELECT 'quiz', count(*) FROM quizzes
  UNION ALL SELECT 'questions de quiz', count(*) FROM quiz_questions
  UNION ALL SELECT 'secrets',           count(*) FROM secrets
  UNION ALL SELECT 'badges',            count(*) FROM badges
  UNION ALL SELECT 'comptes',           count(*) FROM users
  UNION ALL SELECT 'secrets trouvés',   count(*) FROM secret_redemptions;"
```

(Adaptez `-U` / `-d` si vous avez changé `POSTGRES_USER` / `POSTGRES_DB`. Les
mêmes chiffres s'affichent sans ligne de commande dans la console `/admin`,
onglet **Vue d'ensemble** — §6.)

Ces nombres montent, ils ne descendent pas. En particulier :

- **les comptes et les secrets trouvés ne bougent jamais** à cause d'un
  déploiement ; s'ils baissent, vous avez repris une base vide — arrêtez-vous
  et restaurez (§8) avant que les élèves ne se reconnectent ;
- **le nombre de badges est normalement supérieur** au nombre de badges du
  seed : ceux créés depuis `/admin` s'y ajoutent et survivent aux
  déploiements ;
- une baisse des **quiz**, **questions** ou **articles de cours** signifie que
  le seed a élagué quelque chose, ou qu'un `slug` a été renommé (pour le seed,
  un renommage est une suppression suivie d'une création). Le comportement
  exact de l'élagage est décrit à la ligne `pnpm db:seed` du §5.

---

## 4. Variables d'environnement

| Variable                | Requis | Rôle                                                         |
| ----------------------- | ------ | ------------------------------------------------------------ |
| `DATABASE_URL`          | oui    | Connexion Postgres (app, migrate, seed).                     |
| `POSTGRES_USER/PASSWORD/DB` | Compose | Identifiants du Postgres embarqué.                      |
| `SEED_ADMIN_PSEUDO`     | non    | Pseudo du compte enseignant (défaut `prof`).                 |
| `SEED_ADMIN_PASSPHRASE` | non    | Phrase de passe admin ; vide = générée + affichée une fois.  |
| `APP_PORT`              | non    | Port hôte exposé (défaut 3000).                              |

### Utiliser une base externe (ex. Neon)

Renseignez simplement `DATABASE_URL` dans `.env` et retirez (ou ignorez) le
service `db` du compose. Le SSL est activé automatiquement quand l'URL contient
`sslmode=require` ou `neon.tech`.

---

## 5. Développement local (sans Docker)

```bash
pnpm install
export DATABASE_URL=postgres://...      # une base Postgres accessible
pnpm db:setup                           # migrate + seed
pnpm dev
```

Scripts utiles :

| Script            | Effet                                          |
| ----------------- | ---------------------------------------------- |
| `pnpm db:migrate` | applique `db/schema.sql`                       |
| `pnpm db:seed`    | (re)remplit le contenu, garantit l'admin, **et supprime** les sujets/articles de doc absents de `lib/docs.ts` — uniquement ceux plantés par le seed, jamais ceux créés depuis `/admin` |
| `pnpm db:setup`   | migrate puis seed                              |
| `pnpm dev`        | serveur de développement                       |
| `pnpm build`      | build de production (sortie `standalone`)      |

---

## 6. Administration (console `/admin`)

Connectez-vous avec le compte admin puis ouvrez **Console admin**. Onglets :

- **Vue d'ensemble** — statistiques réelles (comptes, quiz, votes, secrets…).
- **Utilisateurs** — recherche, réinitialiser la phrase de passe, suspendre /
  réactiver, promouvoir/rétrograder admin, réinitialiser la progression,
  supprimer. (Vous ne pouvez ni vous suspendre, ni vous supprimer, ni retirer
  votre propre accès admin.)
- **Badges** — créer / modifier / supprimer des badges (slug, points, type).
- **Secrets** — gérer la chasse aux secrets : code, indice public, emplacement
  privé, points, badge lié, activation.
- **Quiz** — gérer les quiz et leurs questions (bonne réponse, explication).
- **Docs** — sujets et articles (contenu en blocs JSON).
- **Questions** — modération (valider / rejeter / supprimer).

### Chasse aux secrets

Un secret = un `code` à saisir sur `/chasse`. Cachez le code où vous voulez
(terminal, source HTML, `/robots.txt`, page 404, `console.log`, page cachée…),
donnez un `hint` public et notez l'`emplacement` (privé) pour vous. Les élèves
gagnent les `points` en validant, et le badge `hunter` (+ un badge optionnel).
Trouver tous les secrets actifs débloque le badge `legend`.

---

## 7. Sécurité

- Phrases de passe hachées (jamais stockées en clair) — voir `lib/crypto.ts`.
- Sessions en cookie **httpOnly** ; suspendre ou réinitialiser un compte
  invalide immédiatement ses sessions.
- Toutes les mutations passent par des Server Actions ; les actions admin
  vérifient `requireAdmin()` côté serveur.
- Requêtes SQL **paramétrées** partout (pas de concaténation).
- En-têtes de sécurité (`X-Frame-Options`, `nosniff`, HSTS, `Permissions-Policy`)
  définis dans `next.config.mjs`.

En production : changez `POSTGRES_PASSWORD`, fixez une `SEED_ADMIN_PASSPHRASE`
forte, et servez le site en HTTPS (l'HSTS ne prend effet que sur HTTPS).

---

## 8. Sauvegarde & restauration

Les données vivent dans le volume `db_data`. Sauvegarde logique :

```bash
docker compose exec db pg_dump -U lycee lycee_sin > backup.sql
# restauration
cat backup.sql | docker compose exec -T db psql -U lycee lycee_sin
```
