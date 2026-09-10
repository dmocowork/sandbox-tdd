import { test, expect } from "@playwright/test";

test.describe("Judo — 3 premières prises et 3 chutes", () => {
  // AC-1
  test("affiche les 3 prises, onglet Prises actif au chargement", async ({ page }) => {
    await page.goto("/judo");

    await expect(page.getByRole("tab", { name: "Prises" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    const list = page.getByTestId("throw-list");
    await expect(list).toContainText("O-goshi");
    await expect(list).toContainText("Ippon-seoi-nage");
    await expect(list).toContainText("O-soto-gari");
  });

  // AC-2
  test("ouvre le détail d'une prise avec sa traduction et ses 3 temps", async ({ page }) => {
    await page.goto("/judo");
    await page.getByTestId("throw-toggle-o-goshi").click();

    const detail = page.getByTestId("throw-detail-o-goshi");
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("grande hanche");
    await expect(detail).toContainText("Kuzushi");
    await expect(detail).toContainText("Tsukuri");
    await expect(detail).toContainText("Kake");
  });

  // AC-3
  test("referme le détail au second appui (accordéon)", async ({ page }) => {
    await page.goto("/judo");
    const toggle = page.getByTestId("throw-toggle-o-goshi");

    await toggle.click();
    await expect(page.getByTestId("throw-detail-o-goshi")).toBeVisible();

    await toggle.click();
    await expect(page.getByTestId("throw-detail-o-goshi")).toBeHidden();
  });

  // AC-4
  test("onglet Chutes : les 3 ukemi et leur traduction", async ({ page }) => {
    await page.goto("/judo");
    await page.getByRole("tab", { name: "Chutes" }).click();

    const list = page.getByTestId("fall-list");
    await expect(list).toContainText("Ushiro-ukemi");
    await expect(list).toContainText("chute arrière");
    await expect(list).toContainText("Yoko-ukemi");
    await expect(list).toContainText("chute latérale");
    await expect(list).toContainText("Mae-mawari-ukemi");
    await expect(list).toContainText("chute avant roulée");
  });

  // AC-5
  test("onglet Chutes : vocabulaire des mots-racines", async ({ page }) => {
    await page.goto("/judo");
    await page.getByRole("tab", { name: "Chutes" }).click();

    const vocab = page.getByTestId("vocab");
    await expect(vocab).toBeVisible();
    for (const word of ["ukemi", "mae", "ushiro", "yoko", "mawari"]) {
      await expect(vocab).toContainText(word);
    }
  });

  // AC-6
  test("quiz : bonne réponse → « Exact ! » et score 1 / 6", async ({ page }) => {
    await page.goto("/judo");
    await page.getByRole("tab", { name: "Quiz" }).click();

    await expect(page.getByTestId("quiz-score")).toHaveText("Score : 0 / 6");
    await page.getByRole("button", { name: "O-goshi", exact: true }).click();

    await expect(page.getByTestId("quiz-feedback")).toContainText("Exact !");
    await expect(page.getByTestId("quiz-score")).toHaveText("Score : 1 / 6");
  });

  // AC-7
  test("quiz : mauvaise réponse → la bonne réponse est nommée, score inchangé", async ({
    page,
  }) => {
    await page.goto("/judo");
    await page.getByRole("tab", { name: "Quiz" }).click();

    await page.getByRole("button", { name: "O-soto-gari", exact: true }).click();

    await expect(page.getByTestId("quiz-feedback")).toContainText("O-goshi");
    await expect(page.getByTestId("quiz-score")).toHaveText("Score : 0 / 6");
  });

  // AC-8
  test("tient dans un écran de téléphone, cibles tactiles ≥ 44 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/judo");
    await expect(page.getByTestId("throw-list")).toBeVisible();

    for (const name of ["Prises", "Chutes", "Quiz"]) {
      const box = await page.getByRole("tab", { name }).boundingBox();
      expect(box, `onglet ${name} introuvable`).not.toBeNull();
      expect(box!.height, `onglet ${name} trop bas`).toBeGreaterThanOrEqual(44);
    }

    const overflowing = await page.evaluate(() =>
      [...document.body.querySelectorAll("*")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1);
        })
        .map((el) => el.tagName + "." + el.className)
        .slice(0, 5),
    );
    expect(overflowing, "éléments qui dépassent l'écran").toEqual([]);
  });
});
