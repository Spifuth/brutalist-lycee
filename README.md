# brutalist-lycee

Site pédagogique STI2D SIN — votes, quiz, questions, badges, chasse aux secrets
et classement, avec une console d'administration.

Next.js 16 (App Router, Server Actions) + PostgreSQL 16. Auto-hébergé, sans
aucune dépendance chargée depuis Internet.

## Tu veux contribuer ?

**Lis [`CONTRIBUTING.md`](./CONTRIBUTING.md).** Tout y est : installation,
workflow git, comment ajouter un quiz ou un cours, et ce qui est regardé en
revue.

Pas besoin de savoir faire du React : la plus grande partie du site est du
**contenu** (`db/seeds/`, `lib/docs-*.ts`), modifiable sans écrire une ligne de
composant. Regarde les issues marquées
[`good first issue`](https://github.com/Spifuth/brutalist-lycee/labels/good%20first%20issue).

## Démarrer en une commande

    cp .env.example .env
    docker compose up --build     # http://localhost:3000

La phrase de passe du compte admin s'affiche **une seule fois** dans les logs du
conteneur `init`.

## Développement

    docker compose up -d db
    pnpm install
    export DATABASE_URL=postgres://lycee:lycee@localhost:5432/lycee_sin
    pnpm db:setup
    pnpm dev

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
