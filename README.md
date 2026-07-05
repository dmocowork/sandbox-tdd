# sandbox-tdd

Projet pilote et jetable de la software factory — voir `AGENTS.md` (conventions SDLC
tdd-v2) et `software-factory/playbooks/tdd-loop.md`.

## Développement local

```bash
npm run dev
```

http://localhost:3000

## Vérifications (ce que joue la CI)

```bash
npm run lint
npx tsc --noEmit
npm run build
BASE_URL=http://localhost:3000 npx playwright test   # tests/acceptance
```
