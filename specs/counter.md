# Spec — Compteur (mini-feature pilote)

## Objectif

Feature jetable dont le seul but est de dérouler le SDLC v2 « TDD-loop » de bout en bout
sur `sandbox-tdd` : une page affiche un compteur avec un bouton `+1`, ne descend jamais
sous 0.

## Critères d'acceptation

- **AC-1** (`e2e`) — Given la page d'accueil, When elle charge, Then elle affiche
  `Compteur : 0`.
- **AC-2** (`e2e`) — Given la page d'accueil au repos, When je clique sur `+1`, Then
  elle affiche `Compteur : 1`.
- **AC-3** (`e2e`) — Given la page d'accueil au repos, When je clique 3 fois sur `+1`,
  Then elle affiche `Compteur : 3`.
- **AC-4** (`e2e`, cas d'erreur) — Given le compteur à 0, When je clique sur `-1`, Then
  il reste à `Compteur : 0` (jamais négatif).

## Hors-scope

- Pas de persistance (state client uniquement, perdu au refresh).
- Pas de style particulier.

## Impact

- `src/app/page.tsx` (remplace la page par défaut de create-next-app).
- `tests/acceptance/counter.spec.ts` (nouveau).
