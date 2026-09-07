# brutalist-lycee

Site pédagogique STI2D SIN — votes, quiz, questions, badges, chasse aux secrets
et classement, avec une console d'administration.

Next.js 16 (App Router, Server Actions) + PostgreSQL 16. Auto-hébergé, sans
aucune dépendance chargée depuis Internet.

## Tu veux contribuer ?

**Lis [`CONTRIBUTING.md`](./CONTRIBUTING.md).** Tout y est : le vocabulaire,
l'installation, le workflow git, comment ajouter un quiz ou un cours, et ce qui
se passe après ta pull request.

**Tu n'as rien à installer pour commencer.** Ajouter une question de quiz ou
corriger une faute se fait depuis le navigateur, en dix minutes : GitHub crée la
branche et la pull request à ta place — voir
[CONTRIBUTING.md §1](./CONTRIBUTING.md#1-ta-première-contribution-sans-rien-installer).

Pas besoin de savoir faire du React non plus : la plus grande partie du site est
du **contenu** (`db/seeds/`, `lib/docs-*.ts`). Regarde les issues marquées
[`good first issue`](https://github.com/Spifuth/brutalist-lycee/labels/good%20first%20issue).

## Démarrer en une commande

    cp .env.example .env
    docker compose up --build     # http://localhost:3000

La phrase de passe du compte admin s'affiche **une seule fois** dans les logs du
conteneur `init`.

## Développement

    cp .env.example .env          # Windows PowerShell : copy .env.example .env
    docker compose up -d db
    pnpm install
    pnpm db:setup
    pnpm dev                      # http://localhost:3000

`DATABASE_URL` est déjà dans `.env.example` : rien à exporter. La base est
publiée sur `127.0.0.1:5432` seulement — change `POSTGRES_PORT` si ce port est
déjà pris chez toi.

## Contrôles avant de pousser

    pnpm build && pnpm check:origins && pnpm typecheck && pnpm test

Les mêmes tournent en CI sur chaque pull request, avec en plus un `style-gate`
qui refuse les coins arrondis, les ombres et les couleurs en dur.

## Les documents du dépôt

| Fichier | Pour quoi |
|---|---|
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | comment contribuer — à lire en premier |
| [`STYLE.md`](./STYLE.md) | le contrat de style, vérifié par la CI |
| [`SELF_HOSTING.md`](./SELF_HOSTING.md) | héberger, administrer, sauvegarder |
| [`SECURITY.md`](./SECURITY.md) | signaler une faille (jamais dans une issue publique) |
| [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) | les règles de vie du dépôt |
| [`gateway/README.md`](./gateway/README.md) | le terminal des élèves, service séparé |

## Branches

`dev` est la branche de travail et la cible de toutes les pull requests.
`main` ne reçoit que les versions déployées. Les deux sont protégées.

## Licence

[MIT](./LICENSE) — sers-t'en, modifie-le, republie-le.
