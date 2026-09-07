# Signaler un problème de sécurité

Ce site héberge des comptes d'élèves (pseudo + phrase de passe) et un terminal.
Si tu trouves une faille, on veut le savoir — c'est utile, et ce n'est pas
puni.

## Comment signaler

**N'ouvre pas d'issue publique.** Une issue est lisible par tout le monde, y
compris par quelqu'un qui voudrait s'en servir avant qu'on ait corrigé.

Utilise l'onglet **Security → Report a vulnerability** du dépôt (signalement
privé), ou préviens directement @Spifuth.

Dans ton message, mets :

- ce que tu as fait, étape par étape, pour reproduire ;
- ce que tu as obtenu ;
- ce que tu penses qu'un attaquant pourrait en faire.

## Ce qui compte comme une faille

Accéder au compte d'un autre élève, contourner l'authentification, obtenir des
droits d'admin, lire des données qui ne te sont pas destinées, sortir du
terminal vers le serveur, faire tomber le site.

## Ce qui n'en est pas une

- **Les secrets de la chasse au trésor.** Les trouver est le jeu, et certains
  codes désignent volontairement des failles que ce site **n'a pas**. Lis
  l'en-tête de `db/seeds/secrets.ts` : il ne faut surtout pas rendre le site
  vulnérable pour rendre un secret « trouvable ».
- Un rapport de scanner automatique recopié sans l'avoir compris ni reproduit.

## Les règles du jeu

Teste sur **ton propre compte** et sur ton installation locale. Ne touche pas
aux comptes des autres, n'efface rien, ne dégrade pas le service pour la classe.
Laisse le temps de corriger avant d'en parler publiquement.
