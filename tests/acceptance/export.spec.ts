import { test, expect } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";
import { readFileSync } from "node:fs";

import { openEditor, importModel, SOLID_PAIR, THREE_COLOURS } from "./fixtures";

async function downloadBytes(
  page: Parameters<typeof openEditor>[0],
  testId: string,
): Promise<{ filename: string; bytes: Uint8Array }> {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId(testId).click(),
  ]);
  const path = await download.path();
  return { filename: download.suggestedFilename(), bytes: new Uint8Array(readFileSync(path)) };
}

test.describe("Export pour l'imprimante", () => {
  // AC-1 + AC-2 (export)
  test("produit un .3mf contenant les trois pièces OPC attendues", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "paire", SOLID_PAIR);

    const { filename, bytes } = await downloadBytes(page, "export-3mf");
    expect(filename).toMatch(/\.3mf$/);

    const files = Object.keys(unzipSync(bytes));
    expect(files).toContain("[Content_Types].xml");
    expect(files).toContain("_rels/.rels");
    expect(files).toContain("3D/3dmodel.model");
  });

  // AC-3 (export) — le contrat exact que Bambu Studio sait lire, verrouillé par la CI
  test("le 3MF porte un colorgroup et des triangles colorés", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "trois-couleurs", THREE_COLOURS);

    const { bytes } = await downloadBytes(page, "export-3mf");
    const xml = strFromU8(unzipSync(bytes)["3D/3dmodel.model"]);

    const colours = [...xml.matchAll(/<m:color color="#([0-9A-Fa-f]{8})"/g)].map((m) => m[1]);
    expect(colours).toHaveLength(3);
    // Bambu Studio ignore silencieusement les hex en minuscules
    for (const hex of colours) expect(hex).toBe(hex.toUpperCase());

    const triangles = [...xml.matchAll(/<triangle [^>]*\/>/g)].map((m) => m[0]);
    expect(triangles.length).toBeGreaterThan(0);
    for (const triangle of triangles) {
      expect(triangle).toMatch(/pid="\d+"/);
      expect(triangle).toMatch(/p1="\d+" p2="\d+" p3="\d+"/);
    }
  });

  // AC-4 (export) — un maillage ouvert ou inversé serait refusé par le slicer
  test("le maillage exporté est fermé et orienté vers l'extérieur", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "paire", SOLID_PAIR);

    const { bytes } = await downloadBytes(page, "export-3mf");
    const xml = strFromU8(unzipSync(bytes)["3D/3dmodel.model"]);

    const vertices = [...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
      Number(m[3]),
    ]);
    const triangles = [...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
      Number(m[3]),
    ]);

    const edges = new Map<string, number>();
    let volume = 0;
    for (const [i, j, k] of triangles) {
      const [a, b, c] = [vertices[i], vertices[j], vertices[k]];
      volume +=
        (a[0] * (b[1] * c[2] - b[2] * c[1]) -
          a[1] * (b[0] * c[2] - b[2] * c[0]) +
          a[2] * (b[0] * c[1] - b[1] * c[0])) /
        6;
      for (const [from, to] of [
        [i, j],
        [j, k],
        [k, i],
      ]) {
        edges.set(`${from}>${to}`, (edges.get(`${from}>${to}`) ?? 0) + 1);
      }
    }

    for (const [edge, count] of edges) {
      const [a, b] = edge.split(">");
      expect(count, `arête ${edge} émise plusieurs fois`).toBe(1);
      expect(edges.get(`${b}>${a}`), `arête ${edge} sans jumelle inverse`).toBe(1);
    }
    // 2 blocs de 8 mm
    expect(volume).toBeCloseTo(2 * 8 ** 3, 3);
  });

  // AC-5 (export)
  test("produit aussi un STL binaire, filet de sécurité monochrome", async ({ page }) => {
    await openEditor(page);
    await importModel(page, "paire", SOLID_PAIR);

    const { filename, bytes } = await downloadBytes(page, "export-stl");
    expect(filename).toMatch(/\.stl$/);

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const declared = view.getUint32(80, true);
    expect(bytes.byteLength).toBe(84 + declared * 50);
    // 2 blocs collés : 10 faces visibles, donc 20 triangles
    expect(declared).toBe(20);
  });
});
