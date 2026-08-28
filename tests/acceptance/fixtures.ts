import { expect, type Page } from "@playwright/test";

/** Un voxel du fichier `.cubo.json` : x, y, z, index de couleur. */
export type Voxel = [number, number, number, number];

export function cuboFile(name: string, voxels: Voxel[], voxelSizeMm = 8): string {
  return JSON.stringify({ version: 1, name, voxelSizeMm, voxels });
}

export async function openEditor(page: Page) {
  await page.goto("/");
  await expect(page.getByTestId("canvas-wrap")).toHaveAttribute("data-ready", "true", {
    timeout: 30_000,
  });
}

/**
 * Charge un modèle connu via l'import de fichier plutôt qu'en cliquant dans la scène 3D :
 * l'état de départ est alors exactement reproductible, sans dépendre du rendu WebGL.
 */
export async function importModel(page: Page, name: string, voxels: Voxel[], voxelSizeMm = 8) {
  await page.getByTestId("open-file").setInputFiles({
    name: `${name}.cubo.json`,
    mimeType: "application/json",
    buffer: Buffer.from(cuboFile(name, voxels, voxelSizeMm)),
  });
  await expect(page.getByTestId("block-count")).toHaveText(String(voxels.length));
}

/** Deux blocs collés : un modèle sain, sans aucun avertissement attendu. */
export const SOLID_PAIR: Voxel[] = [
  [0, 0, 0, 0],
  [1, 0, 0, 0],
];

/** Deux groupes sans contact : tombera en pièces à la sortie de l'imprimante. */
export const TWO_PIECES: Voxel[] = [
  [0, 0, 0, 0],
  [1, 0, 0, 0],
  [8, 0, 0, 0],
  [9, 0, 0, 0],
];

/** Trois couleurs, modèle sain : sert à vérifier le colorgroup du 3MF. */
export const THREE_COLOURS: Voxel[] = [
  [0, 0, 0, 0],
  [1, 0, 0, 3],
  [2, 0, 0, 9],
];
