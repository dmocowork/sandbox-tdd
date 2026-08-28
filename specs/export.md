# Spec — Export imprimable (3MF multicolore + STL)

## Objectif

Transformer la construction à l'écran en un fichier que le père ouvre dans Bambu Studio et
imprime sur la X1C. C'est la récompense qui donne du sens à tout le reste : sans objet réel
entre les mains, l'application n'est qu'un jeu de plus.

## Fait de recherche (validé, à ne pas re-deviner)

Bambu Studio lit le **3MF standard** via son module « Standard 3MF Color Parsing » :

- les couleurs vivent dans un `<m:colorgroup id="…">` contenant des `<m:color color="#RRGGBBFF"/>`,
  namespace `http://schemas.microsoft.com/3dmanufacturing/material/2015/02` ;
- chaque triangle pointe dedans : `<triangle v1 v2 v3 pid="<id colorgroup>" p1 p2 p3/>`, où
  `p1/p2/p3` sont des index **0-based** dans la liste des couleurs ;
- les 3 sommets d'un triangle appartenant au même voxel, `p1 = p2 = p3` ;
- **le mapping couleur → slot AMS se fait par ordre d'apparition dans le colorgroup, pas par
  valeur hex** → l'ordre doit être déterministe, sinon les slots changent d'un export à l'autre ;
- le hex doit être en **MAJUSCULES**, sinon Bambu ignore la couleur silencieusement ;
- 32 couleurs maximum → la palette de Cubo en compte 16, ce qui reste sous la limite.

## Décisions structurantes

- **Un seul générateur de maillage** (`src/lib/voxel/mesh.ts`) alimente le rendu three.js *et*
  l'export : impossible que l'objet imprimé diffère de l'objet vu à l'écran.
- **Culling de faces** : une face n'est émise que si le voxel voisin est vide. Le maillage reste
  fermé (2-manifold) et le nombre de triangles s'effondre sur les gros modèles.
- **STL binaire en filet de sécurité** : monochrome, mais accepté partout si le 3MF pose problème.

## Critères d'acceptation

- **AC-1** (`e2e`) — Given un modèle, When je clique sur `Exporter pour l'imprimante`, Then un
  fichier `.3mf` est téléchargé.
- **AC-2** (`e2e`) — Given le `.3mf` téléchargé, When on l'ouvre comme une archive, Then il
  contient `[Content_Types].xml`, `_rels/.rels` et `3D/3dmodel.model`.
- **AC-3** (`e2e`) — Given un modèle à 3 couleurs, When on lit `3D/3dmodel.model`, Then il
  contient un `m:colorgroup` de `3` couleurs, toutes en majuscules, et chaque triangle porte
  `pid` et `p1/p2/p3`.
- **AC-4** (`e2e`) — Given un modèle, When on lit le maillage exporté, Then il est 2-manifold
  fermé (chaque arête dirigée a exactement une jumelle inverse) et de volume signé positif.
- **AC-5** (`e2e`) — Given un modèle, When je clique sur `Exporter en STL`, Then un `.stl`
  binaire est téléchargé, dont l'en-tête annonce le bon nombre de triangles.
- **AC-6** (`unit`, cas d'erreur) — Given un modèle dont deux voxels sont adjacents, When on
  génère le maillage, Then la face commune n'est **pas** émise (culling effectif).
- **AC-7** (`unit`) — Given un modèle n'utilisant que les couleurs 0 et 7, When on exporte,
  Then le colorgroup contient exactement 2 couleurs et les triangles y réfèrent par 0 et 1
  (pas par 0 et 7) — les slots AMS restent compacts.
- **AC-8** (`unit`) — Given une taille de voxel de 8 mm, When on exporte un modèle de 2 blocs
  alignés, Then le volume signé vaut `2 × 8³ = 1024` mm³.

## Hors-scope

- Pas d'envoi direct à l'imprimante (l'app est déployée sur Vercel, la X1C est sur le réseau
  local du foyer) : le père slice et lance l'impression lui-même.
- Pas de génération de supports ni de G-code — c'est le travail de Bambu Studio.

## Impact

- `src/lib/export/{to3mf.ts,toStl.ts,zip.ts}` (nouveaux)
- `tests/unit/export.spec.ts`, `tests/acceptance/export.spec.ts` (nouveaux)
