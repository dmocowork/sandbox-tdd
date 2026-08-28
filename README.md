# Cubo

Atelier de construction en cubes pour un enfant de 8 ans : il bâtit bloc par bloc, comme
dans le mode créatif qu'il connaît, puis exporte sa création en **3MF multicolore** que son
père ouvre dans Bambu Studio et imprime sur la Bambu Lab X1C.

L'intérêt STEM n'est pas d'empiler des cubes — c'est la rencontre avec le réel. Un objet en
deux morceaux tombe en pièces, deux blocs qui se touchent par un coin cassent, une partie
qui flotte s'effondre. Cubo rend ces contraintes visibles **avant** l'impression, en français
simple, et sans jamais interdire l'export : rater et comprendre pourquoi fait partie de
l'apprentissage.

## Ce que fait l'application

- Éditeur voxel à la souris, grille libre, bornée par le plateau réel de la X1C (256 mm).
- Palette des 16 couleurs de laine de Minecraft, conservées jusque dans le fichier imprimé.
- Vérificateur d'imprimabilité : morceaux séparés, liaisons par un coin, parties en surplomb.
- Dimensions réelles en millimètres affichées en permanence, taille de bloc réglable.
- Sauvegarde automatique dans le navigateur, plus export/import de fichiers `.cubo.json`.
- Aucun compte, aucun serveur, aucune base de données : rien ne quitte la machine.

## Développement local

```bash
npm install
npm run dev
```

http://localhost:3000

## Vérifications (ce que joue la CI)

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:unit                                    # logique pure, sans navigateur
BASE_URL=http://localhost:3000 npm run test:e2e      # parcours réels
```

Sur une machine où Chromium est déjà installé à une révision différente de celle attendue
par Playwright, ajoutez `PLAYWRIGHT_CHROMIUM_PATH=/chemin/vers/chromium`.

## Note sur le format 3MF

Bambu Studio lit les couleurs d'un 3MF standard via son module « Standard 3MF Color
Parsing », et trois contraintes ne sont documentées nulle part de façon évidente :

- les couleurs vivent dans un `<m:colorgroup>`, chaque triangle y renvoyant par `pid` et
  `p1/p2/p3` ;
- le mapping vers les slots AMS se fait **par ordre d'apparition**, pas par valeur hex —
  c'est pourquoi l'ordre de `src/lib/voxel/palette.ts` est un contrat, pas un détail ;
- le hex doit être en **MAJUSCULES**, faute de quoi la couleur est ignorée sans message.

Ces trois points sont verrouillés par des tests, dans `tests/unit/export.spec.ts` et
`tests/acceptance/export.spec.ts`.

## Conventions

Voir `AGENTS.md` : critères d'acceptation Given/When/Then dans `specs/<slug>.md` avant le
code, premier commit d'une feature = tests d'acceptation rouges, chaque test référence son
critère par un commentaire `// AC-<n>`.
