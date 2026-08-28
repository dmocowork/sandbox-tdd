# Spec — Vérificateur d'imprimabilité (cœur STEM)

## Objectif

C'est ici que l'application cesse d'être un jeu et devient un outil d'apprentissage. Dans
Minecraft, un bloc flotte sans rien dessous et deux blocs qui se touchent par un coin tiennent
ensemble. Dans le monde réel, non. Cubo rend cette différence visible **avant** l'impression,
avec des mots qu'un enfant de 8 ans comprend.

## Décisions structurantes

- **On informe, on n'interdit pas.** L'export reste possible même avec des avertissements.
  Un enfant qui ne peut pas tenter, rater et regarder pourquoi n'apprend rien ; c'est
  précisément l'écart entre la prédiction et le résultat qui installe la compréhension.
- **Chaque avertissement nomme les blocs fautifs**, qui sont surlignés dans la scène : le lien
  entre la phrase et l'objet doit être immédiat, sans lecture d'un paragraphe.
- **Fonctions pures sur le modèle**, sans dépendance au rendu : testables unitairement, donc
  vérifiables exhaustivement sur des cas construits à la main.

## Les trois règles

1. **Modèle en plusieurs morceaux** — composantes connexes en 6-connexité (faces uniquement).
   Plus d'une composante → *« Ton modèle est en N morceaux séparés. Ils ne tiendront pas
   ensemble en sortant de l'imprimante. »*
2. **Liaison fragile** — deux blocs voisins en diagonale (18/26-connexité) sans aucun chemin
   par les faces qui les relie localement → *« Ces blocs ne se touchent que par un coin.
   Dans la vraie vie, ça casse tout seul. »*
3. **Surplomb sans support** — un bloc sans voisin en dessous, dont la zone en porte-à-faux
   dépasse 3 blocs de large → *« Cette partie flotte dans le vide. L'imprimante a besoin
   d'un support en dessous. »* (Un porte-à-faux court est un pont : la X1C le franchit.)

## Critères d'acceptation

- **AC-1** (`unit`) — Given un modèle en un seul tenant, When on l'analyse, Then aucun
  avertissement n'est remonté.
- **AC-2** (`unit`) — Given deux groupes de blocs sans contact, When on l'analyse, Then un
  avertissement `pieces` signale `2` morceaux.
- **AC-3** (`unit`) — Given deux blocs se touchant uniquement par une arête ou un coin, When on
  l'analyse, Then un avertissement `fragile` nomme ces blocs.
- **AC-4** (`unit`) — Given un bloc posé dans le vide à 4 blocs du sol, When on l'analyse, Then
  un avertissement `overhang` le désigne.
- **AC-5** (`unit`, cas limite) — Given un porte-à-faux de 2 blocs seulement, When on l'analyse,
  Then aucun avertissement `overhang` (un pont court est imprimable).
- **AC-6** (`e2e`) — Given un fichier de modèle en deux morceaux importé dans l'éditeur, When
  la page l'affiche, Then le compteur d'avertissements vaut `1` et le panneau contient le mot
  `morceaux`.
- **AC-7** (`e2e`) — Given un modèle avec avertissements, When je clique sur
  `Exporter pour l'imprimante`, Then l'export réussit quand même (on informe, on n'interdit pas).

## Hors-scope

- Pas de simulation physique, pas de calcul de contraintes mécaniques.
- Pas de vérification d'épaisseur minimale : un voxel fait au moins 4 mm, toujours au-dessus
  de ce qu'une buse de 0,4 mm sait produire.

## Impact

- `src/lib/voxel/printability.ts` (nouveau)
- `src/components/editor/WarningPanel.tsx` (nouveau)
- `tests/unit/printability.spec.ts`, `tests/acceptance/printability.spec.ts` (nouveaux)
