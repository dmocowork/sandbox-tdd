import { test, expect } from "@playwright/test";

import { PALETTE } from "@/lib/voxel/palette";
import {
  PLATE_MM,
  createModel,
  dimensionsMm,
  dimensionsInVoxels,
  fitsOnPlate,
  key,
  parseKey,
  usedColors,
} from "@/lib/voxel/model";
import { buildMesh } from "@/lib/voxel/mesh";

test.describe("Modèle voxel", () => {
  test("clé et coordonnées font l'aller-retour", () => {
    expect(parseKey(key(3, -2, 7))).toEqual([3, -2, 7]);
  });

  test("dimensions en voxels d'un modèle 2x1x3", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 2, 0],
    ]);
    expect(dimensionsInVoxels(model)).toEqual([2, 1, 3]);
  });

  // AC-8 (voxel-editor) — la taille de voxel change l'objet réel, pas la géométrie logique
  test("les dimensions en mm suivent la taille de voxel", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [1, 0, 0, 0],
    ]);
    expect(dimensionsMm(model, 8)).toEqual([16, 8, 8]);
    expect(dimensionsMm(model, 4)).toEqual([8, 4, 4]);
    expect(dimensionsInVoxels(model)).toEqual([2, 1, 1]);
  });

  test("un modèle vide n'a pas de dimensions", () => {
    expect(dimensionsInVoxels(createModel([]))).toEqual([0, 0, 0]);
  });

  test("dépasser le plateau de la X1C est détecté", () => {
    const wide = createModel([
      [0, 0, 0, 0],
      [100, 0, 0, 0],
    ]);
    // 101 voxels de 8 mm = 808 mm, très au-delà des 256 mm du plateau
    expect(fitsOnPlate(wide, 8)).toBe(false);
    expect(fitsOnPlate(wide, 1)).toBe(true);
    expect(PLATE_MM).toBe(256);
  });

  test("les couleurs utilisées sont listées triées et sans doublon", () => {
    const model = createModel([
      [0, 0, 0, 7],
      [1, 0, 0, 0],
      [2, 0, 0, 7],
    ]);
    expect(usedColors(model)).toEqual([0, 7]);
  });

  test("la palette tient sous la limite de 32 couleurs de Bambu Studio", () => {
    expect(PALETTE.length).toBeLessThanOrEqual(32);
    for (const colour of PALETTE) {
      // Bambu Studio ignore silencieusement les hex en minuscules
      expect(colour.hex).toMatch(/^[0-9A-F]{6}$/);
    }
  });
});

test.describe("Génération de maillage", () => {
  test("un voxel isolé donne 6 faces = 12 triangles et 8 sommets", () => {
    const mesh = buildMesh(createModel([[0, 0, 0, 0]]));
    expect(mesh.triangles).toHaveLength(12);
    expect(mesh.vertices).toHaveLength(8);
  });

  // AC-6 (export) — le culling est ce qui garde le maillage fermé et léger
  test("deux voxels adjacents n'émettent pas leur face commune", () => {
    const mesh = buildMesh(
      createModel([
        [0, 0, 0, 0],
        [1, 0, 0, 0],
      ]),
    );
    // 12 faces au total moins les 2 faces qui se touchent = 10 faces = 20 triangles
    expect(mesh.triangles).toHaveLength(20);
  });

  test("un bloc plein 2x2x2 ne garde que sa surface", () => {
    const entries: [number, number, number, number][] = [];
    for (let x = 0; x < 2; x++)
      for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) entries.push([x, y, z, 0]);

    const mesh = buildMesh(createModel(entries));
    // 6 côtés x 4 faces de voxel = 24 faces = 48 triangles ; le sommet central
    // du cube n'est référencé par aucune face, d'où 27 - 1 = 26 sommets
    expect(mesh.triangles).toHaveLength(48);
    expect(mesh.vertices).toHaveLength(26);
  });

  test("chaque triangle hérite de la couleur de son voxel", () => {
    const mesh = buildMesh(
      createModel([
        [0, 0, 0, 3],
        [5, 0, 0, 9],
      ]),
    );
    expect(new Set(mesh.triangles.map((t) => t.color))).toEqual(new Set([3, 9]));
  });
});
