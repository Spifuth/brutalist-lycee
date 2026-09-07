<!--
Première PR ? Tu peux effacer tout ce modèle et écrire simplement ce que tu as
fait et pourquoi. Il vaut mieux une PR courte et honnête qu'un formulaire rempli
au hasard.
-->

## Ce que fait cette PR

<!-- Une ou deux phrases, en français. -->

## Pourquoi

<!-- Le problème que ça résout. Si une issue existe, écris : Closes #12 -->

## Comment tester

<!-- Les étapes exactes pour vérifier. Exemple :
1. pnpm db:setup && pnpm dev
2. aller sur /quiz
3. le nouveau quiz « réseaux » apparaît et se termine sans erreur

Si tu as contribué depuis le navigateur sans installer le projet, écris-le ici
et laisse le reste — c'est très bien comme ça.
-->

## Avant de demander la revue

**Pour tout le monde :**

- [ ] Cette PR cible **`dev`** (jamais `main`).
- [ ] Une seule idée dans cette PR.
- [ ] Aucun mot de passe, clé ou fichier `.env` dans le diff.
- [ ] Aucune donnée personnelle d'un camarade (nom, photo, adresse mail).

**Si tu as le projet installé sur ton ordinateur :**

- [ ] `pnpm build` passe.
- [ ] `pnpm typecheck` passe.
- [ ] `pnpm test` passe.
- [ ] `pnpm check:origins` passe.

**Si tu as touché à l'interface :**

- [ ] Ni coin arrondi, ni ombre, ni couleur écrite en dur — voir
      [STYLE.md](../STYLE.md).
- [ ] Capture d'écran ajoutée ci-dessous.

<!--
Les vérifications automatiques tournent toutes seules après l'ouverture de la
PR. Une croix rouge n'est pas grave : clique sur « Details » pour voir quoi
corriger, ou demande ici. Voir CONTRIBUTING.md §11.
-->
