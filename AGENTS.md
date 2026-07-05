<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# sandbox-tdd

Projet PILOTE et JETABLE de la software factory : il existe uniquement pour valider en
réel le SDLC v2 « TDD-loop » (`software-factory/playbooks/tdd-loop.md`). Une fois la
checklist § 7 du playbook cochée, ce projet passe en `status: archived` dans le registre.

## Stack

- Next.js 16 (App Router, TypeScript, `src/`), déployé sur Vercel (team `dmocowork113`).
- Tests d'acceptation : Playwright, `tests/acceptance/`, exécutés par le job `acceptance`
  contre la preview Vercel (`BASE_URL`), bypass SSO via `VERCEL_AUTOMATION_BYPASS_SECRET`.
- Pas de DB.

## Commandes

- `npm run dev` — serveur local (http://localhost:3000)
- `npm run lint` / `npx tsc --noEmit` / `npm run build` — ce que joue le job `verify`
- `BASE_URL=http://localhost:3000 npx playwright test` — acceptation en local

## Conventions (SDLC tdd-v2)

- Critères d'acceptation Given/When/Then dans `specs/<slug>.md`, AVANT le code.
- Premier commit d'une feature = tests d'acceptation rouges (`test: add failing acceptance tests for <slug>`).
- Chaque test référence son critère : commentaire `// AC-<n>`.
- Merge uniquement par auto-merge (`gh pr merge --auto --squash`), gates requis :
  `verify` + `acceptance`. Prod automatique + smoke.
