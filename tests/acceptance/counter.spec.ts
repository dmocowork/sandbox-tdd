import { test, expect } from "@playwright/test";

test.describe("Compteur", () => {
  // AC-1
  test("affiche 0 au chargement", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("counter-value")).toHaveText("Compteur : 0");
  });

  // AC-2
  test("incrémente de 1 au clic sur +1", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "+1" }).click();
    await expect(page.getByTestId("counter-value")).toHaveText("Compteur : 1");
  });

  // AC-3
  test("incrémente 3 fois de suite", async ({ page }) => {
    await page.goto("/");
    const plus = page.getByRole("button", { name: "+1" });
    await plus.click();
    await plus.click();
    await plus.click();
    await expect(page.getByTestId("counter-value")).toHaveText("Compteur : 3");
  });

  // AC-4
  test("ne descend jamais sous 0", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "-1" }).click();
    await expect(page.getByTestId("counter-value")).toHaveText("Compteur : 0");
  });
});
