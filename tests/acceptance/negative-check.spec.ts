import { test, expect } from "@playwright/test";

// Test délibérément faux — vérifie que le gate `acceptance` bloque bien le merge
// quand il échoue, même si `verify` est vert. Supprimé après vérification.
test("garde-fou pilote : ce test échoue volontairement", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ce texte n'existe pas")).toBeVisible({ timeout: 5000 });
});
