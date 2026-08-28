# Spec — Éditeur voxel (Cubo)

## Objectif

Donner à un enfant de 8 ans, joueur de Minecraft, un bac à sable où il construit un objet
en cubes à la souris, sur PC, en français. C'est le socle : toutes les autres features
(export, imprimabilité, persistance) s'appuient sur ce modèle.

## Décisions structurantes

- **Grille libre** : aucune borne fixe, la zone de construction grandit avec l'enfant.
  La seule limite est physique — le plateau de la Bambu Lab X1C, 256×256×256 mm — matérialisé
  dans la scène et signalé quand on le dépasse.
- **Outils explicites** plutôt que combinaisons de touches : un enfant de 8 ans ne doit rien
  mémoriser. Quatre gros boutons `Poser` / `Casser` / `Peindre`, le clic gauche applique
  l'outil actif. Clic droit glissé = tourner la caméra, molette = zoom.
- **Voxel = 8 mm par défaut** (réglable 4/6/8/10/12). À 8 mm, une construction de 15 blocs de
  long donne un objet de 12 cm : assez gratifiant pour justifier l'attente de l'impression,
  assez petit pour qu'un raté ne coûte pas cher.
- **Caméra initiale fixe** et un voxel de départ à l'origine : le centre du canvas vise
  déterministement la face du dessus de ce voxel, ce qui rend l'interaction 3D testable.

## Critères d'acceptation

- **AC-1** (`e2e`) — Given l'éditeur au chargement, When il s'affiche, Then il montre
  `1` bloc et l'outil `Poser` est actif.
- **AC-2** (`e2e`) — Given l'éditeur au repos, When je clique au centre du canvas, Then le
  modèle compte `2` blocs (le nouveau se pose sur la face visée).
- **AC-3** (`e2e`) — Given un modèle de 2 blocs, When je choisis `Casser` et clique au centre,
  Then le modèle compte `1` bloc.
- **AC-4** (`e2e`, cas d'erreur) — Given un modèle d'un seul bloc, When je choisis `Casser` et
  clique dessus, Then le modèle compte toujours `1` bloc (on ne vide jamais la scène : un
  écran noir n'apprend rien et décourage).
- **AC-5** (`e2e`) — Given l'outil `Peindre` et la couleur n°4 sélectionnée, When je clique sur
  un bloc, Then le nombre de blocs est inchangé et le modèle utilise `2` couleurs.
- **AC-6** (`e2e`) — Given une action de pose effectuée, When je clique sur `Annuler`, Then le
  modèle revient à son état précédent ; When je clique sur `Refaire`, Then il revient à l'état
  d'après.
- **AC-7** (`e2e`) — Given un modèle, When je consulte le bandeau d'état, Then il affiche les
  dimensions réelles en mm, cohérentes avec la taille de voxel choisie.
- **AC-8** (`unit`) — Given un modèle, When on change la taille de voxel, Then les dimensions
  affichées suivent, sans modifier la géométrie logique.

## Hors-scope

- Pas de mobile ni de tactile (cible : PC + souris).
- Pas de compte, pas de serveur, pas de base de données, aucune donnée personnelle.
- Pas de formes non cubiques (pentes, arrondis).

## Impact

- `src/lib/voxel/model.ts`, `palette.ts`, `mesh.ts` (nouveaux)
- `src/components/editor/*` (nouveaux)
- `src/app/page.tsx` (remplace la page compteur du pilote)
- `tests/unit/voxel.spec.ts`, `tests/acceptance/editor.spec.ts` (nouveaux)
