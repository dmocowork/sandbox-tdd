import { test, expect, type Page } from "@playwright/test";

/**
 * Interagir avec une scène WebGL sous test est réputé fragile. La parade retenue ici :
 * ne jamais asserter sur des coordonnées déduites de la projection 3D, mais uniquement
 * sur le comportement observable (nombre de blocs, dimensions, couleurs).
 *
 * Deux propriétés géométriques rendent le clic au centre du canvas déterministe, quel
 * que soit l'angle de caméra :
 *   - la caméra vise le centre du voxel de départ, donc le rayon central le touche toujours ;
 *   - un bloc posé sur la face F occupe la cellule que le rayon traverse juste AVANT F,
 *     il devient donc automatiquement la cible du clic suivant.
 */
async function openEditor(page: Page) {
  await page.goto("/");
  // La scène signale elle-même qu'elle a rendu une première image
  await expect(page.getByTestId("canvas-wrap")).toHaveAttribute("data-ready", "true", {
    timeout: 30_000,
  });
}

const clickCanvas = (page: Page) => page.getByTestId("canvas-wrap").click();

test.describe("Éditeur voxel", () => {
  // AC-1
  test("démarre avec un bloc et l'outil Poser actif", async ({ page }) => {
    await openEditor(page);
    await expect(page.getByTestId("block-count")).toHaveText("1");
    await expect(page.getByTestId("tool-place")).toHaveAttribute("aria-pressed", "true");
  });

  // AC-2
  test("un clic pose un bloc sur la face visée", async ({ page }) => {
    await openEditor(page);
    await clickCanvas(page);
    await expect(page.getByTestId("block-count")).toHaveText("2");
  });

  // AC-3
  test("l'outil Casser retire le bloc visé", async ({ page }) => {
    await openEditor(page);
    await clickCanvas(page);
    await expect(page.getByTestId("block-count")).toHaveText("2");

    await page.getByTestId("tool-break").click();
    await clickCanvas(page);
    await expect(page.getByTestId("block-count")).toHaveText("1");
  });

  // AC-4 — un écran vide n'apprend rien et décourage : on garde toujours un bloc
  test("le dernier bloc ne peut pas être cassé", async ({ page }) => {
    await openEditor(page);
    await page.getByTestId("tool-break").click();
    await clickCanvas(page);
    await clickCanvas(page);
    await expect(page.getByTestId("block-count")).toHaveText("1");
  });

  // AC-5
  test("l'outil Peindre change la couleur sans changer le nombre de blocs", async ({ page }) => {
    await openEditor(page);
    await clickCanvas(page);
    await expect(page.getByTestId("color-count")).toHaveText("1");

    await page.getByTestId("tool-paint").click();
    await page.getByTestId("color-4").click();
    await clickCanvas(page);

    await expect(page.getByTestId("block-count")).toHaveText("2");
    await expect(page.getByTestId("color-count")).toHaveText("2");
  });

  // AC-6
  test("annuler et refaire rejouent l'historique", async ({ page }) => {
    await openEditor(page);
    await clickCanvas(page);
    await expect(page.getByTestId("block-count")).toHaveText("2");

    await page.getByTestId("undo").click();
    await expect(page.getByTestId("block-count")).toHaveText("1");

    await page.getByTestId("redo").click();
    await expect(page.getByTestId("block-count")).toHaveText("2");
  });

  // AC-7 — le lien avec l'objet réel doit être visible en permanence
  test("les dimensions réelles suivent la construction et la taille de voxel", async ({ page }) => {
    await openEditor(page);
    await expect(page.getByTestId("model-size-mm")).toHaveText("8 × 8 × 8 mm");

    await clickCanvas(page);
    await expect(page.getByTestId("model-size-mm")).toHaveText("8 × 8 × 16 mm");

    await page.getByTestId("voxel-size").selectOption("4");
    await expect(page.getByTestId("model-size-mm")).toHaveText("4 × 4 × 8 mm");
  });
});
