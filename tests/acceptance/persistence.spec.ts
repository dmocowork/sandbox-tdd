import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

import { openEditor, importModel, TWO_PIECES, THREE_COLOURS } from "./fixtures";

test.describe("Persistance des créations", () => {
  // AC-1 (persistence) — perdre son travail est la façon la plus sûre de le dégoûter
  test("la construction survit à un rechargement de la page", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "trois-couleurs", THREE_COLOURS);

    await page.reload();
    await expect(page.getByTestId("canvas-wrap")).toHaveAttribute("data-ready", "true", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("block-count")).toHaveText("3");
    await expect(page.getByTestId("color-count")).toHaveText("3");
  });

  // AC-2 (persistence)
  test("la sauvegarde fichier écrit un .cubo.json fidèle", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "deux-morceaux", TWO_PIECES);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("save-file").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.cubo\.json$/);

    const parsed = JSON.parse(readFileSync(await download.path(), "utf8"));
    expect(parsed.version).toBe(1);
    expect(parsed.voxels).toHaveLength(TWO_PIECES.length);
    expect(parsed.voxelSizeMm).toBe(8);
  });

  // AC-3 (persistence)
  test("l'import restitue exactement le modèle décrit par le fichier", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "trois-couleurs", THREE_COLOURS);

    await expect(page.getByTestId("block-count")).toHaveText("3");
    await expect(page.getByTestId("color-count")).toHaveText("3");
    await expect(page.getByTestId("model-size-mm")).toHaveText("24 × 8 × 8 mm");
  });

  // AC-4 (persistence) — un fichier abîmé ne doit jamais détruire le travail en cours
  test("un fichier invalide affiche une erreur sans casser la scène", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "trois-couleurs", THREE_COLOURS);

    await page.getByTestId("open-file").setInputFiles({
      name: "casse.cubo.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ ceci n'est pas du JSON"),
    });

    await expect(page.getByTestId("import-error")).toBeVisible();
    await expect(page.getByTestId("block-count")).toHaveText("3");
  });
});
