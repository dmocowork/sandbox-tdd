# Spec — Judo : mes 3 premières prises et mes 3 chutes

## Objectif

Une mini-application mobile-first, consultable depuis un téléphone, pour apprendre et
réviser :

- les **3 premières prises** enseignées au judo débutant (o-goshi, ippon-seoi-nage,
  o-soto-gari) : nom japonais, prononciation, traduction, les 3 temps de la technique
  (kuzushi / tsukuri / kake) et le point de sécurité ;
- le **vocabulaire des 3 chutes** (ukemi) : ushiro-ukemi, yoko-ukemi,
  mae-mawari-ukemi, avec les mots-racines japonais (mae, ushiro, yoko, mawari, ukemi) ;
- un **quiz** de 6 questions (3 prises + 3 chutes) pour s'auto-tester.

Route dédiée `/judo` : le compteur pilote reste sur `/` et ses critères d'acceptation
restent inchangés.

> Contenu pédagogique : les noms, traductions et repères suivent la progression
> française classique (ceinture blanche-jaune). Ils restent à valider par le professeur
> du club, qui peut enseigner un ordre ou des variantes différents.

## Critères d'acceptation

- **AC-1** (`e2e`) — Given la route `/judo`, When la page charge, Then l'onglet
  `Prises` est actif et les 3 prises sont listées : `O-goshi`, `Ippon-seoi-nage`,
  `O-soto-gari`.
- **AC-2** (`e2e`) — Given l'onglet `Prises`, When je touche la carte `O-goshi`, Then
  son détail s'ouvre et affiche sa traduction (`grande hanche`) et les 3 temps
  `Kuzushi`, `Tsukuri`, `Kake`.
- **AC-3** (`e2e`) — Given la carte `O-goshi` ouverte, When je la touche à nouveau,
  Then son détail se referme (une seule carte ouverte à la fois, accordéon).
- **AC-4** (`e2e`) — Given la route `/judo`, When je touche l'onglet `Chutes`, Then les
  3 chutes sont listées avec leur traduction : `chute arrière`, `chute latérale`,
  `chute avant roulée`.
- **AC-5** (`e2e`) — Given l'onglet `Chutes`, When il est affiché, Then le bloc
  vocabulaire donne le sens des mots-racines `ukemi`, `mae`, `ushiro`, `yoko`,
  `mawari`.
- **AC-6** (`e2e`) — Given l'onglet `Quiz` sur la 1re question, When je choisis la
  bonne réponse, Then le retour affiche `Exact !` et le score passe à `Score : 1 / 6`.
- **AC-7** (`e2e`, cas d'erreur) — Given l'onglet `Quiz` sur la 1re question, When je
  choisis une mauvaise réponse, Then le retour nomme la bonne réponse et le score reste
  `Score : 0 / 6`.
- **AC-8** (`e2e`, mobile) — Given un écran de téléphone (390 × 844), When la page
  charge, Then aucun élément ne dépasse la largeur de l'écran et chaque onglet offre
  une cible tactile d'au moins 44 px de haut.

## Hors-scope

- Pas de persistance : le score et l'onglet courant sont perdus au refresh (state
  client uniquement, pas de DB — cf. AGENTS.md).
- Pas d'images ni de vidéos des techniques (texte seulement), pas de son.
- Pas d'ordre aléatoire dans le quiz : l'ordre des questions et des réponses est fixe
  (déterminisme des tests d'acceptation).
- Pas de compte, pas de suivi de progression entre sessions.

## Impact

- `specs/judo.md` (ce fichier, nouveau).
- `tests/acceptance/judo.spec.ts` (nouveau).
- `src/app/judo/page.tsx` (nouveau) — Server Component : `metadata` + `viewport`.
- `src/app/judo/judo-app.tsx` (nouveau) — Client Component : onglets, accordéon, quiz.
- `src/app/judo/data.ts` (nouveau) — contenu pédagogique typé.
- `src/app/judo/judo.module.css` (nouveau) — styles mobile-first.
- `src/app/page.tsx` (modifié) — un lien vers `/judo` ; le compteur et ses testids
  restent inchangés (AC-1..AC-4 de `specs/counter.md` toujours verts).
