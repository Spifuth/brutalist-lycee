# brutalist-lycee

Site pédagogique STI2D SIN — votes, quiz, questions, badges, chasse aux secrets
et classement, avec une console d'administration.

Next.js 16 (App Router, Server Actions) + PostgreSQL 16. Auto-hébergé.

- **Hébergement et administration :** [`SELF_HOSTING.md`](./SELF_HOSTING.md)
- **Contrat de style (obligatoire avant toute PR) :** [`STYLE.md`](./STYLE.md)
- **Spécifications et plans :** `docs/superpowers/`

## Développement

    pnpm install
    export DATABASE_URL=postgres://...
    pnpm db:setup
    pnpm dev
