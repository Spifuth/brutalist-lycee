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

## 3. Variables d'environnement

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

## 4. Développement local (sans Docker)

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

## 5. Administration (console `/admin`)

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

## 6. Sécurité

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

## 7. Sauvegarde & restauration

Les données vivent dans le volume `db_data`. Sauvegarde logique :

```bash
docker compose exec db pg_dump -U lycee lycee_sin > backup.sql
# restauration
cat backup.sql | docker compose exec -T db psql -U lycee lycee_sin
```
