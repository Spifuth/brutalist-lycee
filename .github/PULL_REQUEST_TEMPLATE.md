## Ce que fait cette PR

<!-- Une ou deux phrases. Le « quoi », en français, sans jargon. -->

## Pourquoi

<!-- Le problème que ça résout, ou l'issue liée. Ferme l'issue avec : Closes #12 -->

## Comment tester

<!-- Les étapes exactes pour vérifier. Ex :
1. pnpm db:setup && pnpm dev
2. aller sur /quiz
3. le nouveau quiz « réseaux » apparaît et se termine sans erreur
-->

## Avant de demander la revue

- [ ] Cette PR cible **`dev`** (jamais `main`).
- [ ] `pnpm build` passe.
- [ ] `pnpm typecheck` passe.
- [ ] `pnpm test` passe.
- [ ] `pnpm check:origins` passe (aucune ressource chargée depuis Internet).
- [ ] Je n'ai ajouté ni coin arrondi, ni ombre, ni couleur en dur — voir
      [STYLE.md](../STYLE.md).
- [ ] Aucun mot de passe, clé, token ni `.env` dans le diff.
- [ ] Aucune donnée personnelle d'élève (nom, photo, mail).
- [ ] Le message de commit explique **pourquoi**, pas seulement quoi.
- [ ] Une seule idée par PR.

## Captures d'écran

<!-- Si tu as touché à l'interface. Sinon, supprime cette section. -->
