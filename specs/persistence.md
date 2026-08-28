# Spec — Persistance des créations

## Objectif

Un enfant construit sur plusieurs jours. Perdre son travail parce qu'un onglet s'est fermé est
la façon la plus sûre de le dégoûter du projet. Deux niveaux : une sauvegarde automatique
invisible, et un export fichier qui survit à tout.

## Décisions structurantes

- **Aucun compte, aucun serveur, aucune base de données.** Les créations d'un enfant de 8 ans
  ne partent pas sur Internet : tout reste dans son navigateur ou dans ses fichiers.
- **Autosave après chaque modification** dans `localStorage`, sans bouton à penser.
- **Format `.cubo.json` versionné** (`{ version, name, voxelSizeMm, voxels }`) : lisible, et
  le champ `version` permet de faire évoluer le schéma sans casser ses anciens fichiers.
- **Le fichier importé est traité comme des données non fiables** : tout champ manquant ou
  aberrant fait échouer l'import proprement avec un message, plutôt que de casser la scène.

## Critères d'acceptation

- **AC-1** (`e2e`) — Given une construction de 3 blocs, When je recharge la page, Then les
  3 blocs sont toujours là.
- **AC-2** (`e2e`) — Given une construction, When je clique sur `Sauvegarder dans un fichier`,
  Then un fichier `.cubo.json` est téléchargé, contenant le bon nombre de voxels.
- **AC-3** (`e2e`) — Given un fichier `.cubo.json`, When je l'ouvre via `Ouvrir un fichier`,
  Then l'éditeur affiche exactement le modèle qu'il décrit.
- **AC-4** (`e2e`, cas d'erreur) — Given un fichier JSON invalide, When je l'ouvre, Then un
  message d'erreur lisible s'affiche et le modèle en cours n'est pas détruit.
- **AC-5** (`unit`) — Given un modèle, When on le sérialise puis on le désérialise, Then on
  retrouve un modèle identique (aller-retour sans perte).
- **AC-6** (`unit`, cas d'erreur) — Given un JSON dont `voxels` contient des coordonnées non
  numériques, When on le désérialise, Then une erreur explicite est levée.

## Hors-scope

- Pas de partage entre appareils ni de galerie en ligne.
- Pas de vignettes de prévisualisation dans la v1.

## Impact

- `src/lib/storage/{format.ts,local.ts}` (nouveaux)
- `tests/unit/storage.spec.ts`, `tests/acceptance/persistence.spec.ts` (nouveaux)
