import { defineConfig } from "@playwright/test";

export default defineConfig({
  projects: [
    // Logique pure (modèle, maillage, imprimabilité, sérialisation) : aucun navigateur,
    // aucun déploiement requis. Joué par le job `verify`, donc sur chaque commit.
    {
      name: "unit",
      testDir: "tests/unit",
      retries: 0,
    },
    // Parcours réels contre la preview Vercel. Joué par le job `acceptance`.
    {
      name: "acceptance",
      testDir: "tests/acceptance",
      retries: 2, // absorbe la flakiness réseau des previews
      use: {
        baseURL: process.env.BASE_URL,
        trace: "retain-on-failure",
        extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
          ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
          : {},
      },
    },
  ],
});
