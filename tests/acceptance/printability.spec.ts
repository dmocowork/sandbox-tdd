import { test, expect } from "@playwright/test";

import { openEditor, importModel, SOLID_PAIR, TWO_PIECES } from "./fixtures";

test.describe("Vérificateur d'imprimabilité", () => {
  test("un modèle sain n'affiche aucun avertissement", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "paire", SOLID_PAIR);
    await expect(page.getByTestId("warning-count")).toHaveText("0");
  });

  // AC-6 (printability)
  test("un modèle en deux morceaux est signalé en français compréhensible", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "deux-morceaux", TWO_PIECES);

    await expect(page.getByTestId("warning-count")).toHaveText("1");
    await expect(page.getByTestId("warning-list")).toContainText("morceaux");
  });

  // AC-7 (printability) — on informe, on n'interdit pas : rater fait partie de l'apprentissage
  test("l'export reste possible malgré un avertissement", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "deux-morceaux", TWO_PIECES);
    await expect(page.getByTestId("warning-count")).toHaveText("1");

    await expect(page.getByTestId("export-3mf")).toBeEnabled();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-3mf").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.3mf$/);
  });
});
