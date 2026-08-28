import { test, expect } from "@playwright/test";

import { createModel } from "@/lib/voxel/model";
import { analyse } from "@/lib/voxel/printability";

const kinds = (model: Parameters<typeof analyse>[0]) => analyse(model).map((w) => w.kind);

test.describe("Vérificateur d'imprimabilité", () => {
  // AC-1 — le cas normal ne doit surtout pas générer de bruit
  test("un modèle en un seul tenant ne remonte aucun avertissement", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 0, 1, 0],
      [0, 0, 1, 0],
    ]);
    expect(analyse(model)).toEqual([]);
  });

  // AC-2
  test("deux groupes sans contact sont signalés comme morceaux séparés", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [8, 0, 0, 0],
      [9, 0, 0, 0],
    ]);
    const pieces = analyse(model).find((w) => w.kind === "pieces");
    expect(pieces).toBeDefined();
    expect(pieces!.count).toBe(2);
    expect(pieces!.message).toContain("morceaux");
  });

  // AC-3
  test("deux blocs se touchant par une arête sont signalés comme liaison fragile", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [1, 0, 1, 0], // diagonale en x/z : contact par une arête seulement
    ]);
    const fragile = analyse(model).find((w) => w.kind === "fragile");
    expect(fragile).toBeDefined();
    expect(fragile!.voxels).toContain("0,0,0");
    expect(fragile!.voxels).toContain("1,0,1");
  });

  test("un coude rempli par les faces n'est pas fragile", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [1, 0, 0, 0], // le bloc intermédiaire rend la liaison solide
      [1, 0, 1, 0],
    ]);
    expect(kinds(model)).not.toContain("fragile");
  });

  // AC-4 — un bloc qui flotte dans le vide, comme en mode créatif Minecraft
  test("un bloc isolé en hauteur est signalé comme flottant", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 2, 0],
      [5, 5, 4, 0], // rien dessous, rien à côté
    ]);
    const overhang = analyse(model).find((w) => w.kind === "overhang");
    expect(overhang).toBeDefined();
    expect(overhang!.voxels).toContain("5,5,4");
  });

  // AC-5 — un pont court, la X1C sait le franchir : ne pas crier au loup
  test("un porte-à-faux de 2 blocs entre deux piliers ne déclenche rien", () => {
    const model = createModel([
      // deux piliers de hauteur 2, espacés de 2 cases
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [3, 0, 0, 0],
      [3, 0, 1, 0],
      // le tablier du pont
      [1, 0, 1, 0],
      [2, 0, 1, 0],
    ]);
    expect(kinds(model)).not.toContain("overhang");
  });

  test("un porte-à-faux de 5 blocs de large est signalé", () => {
    const entries: [number, number, number, number][] = [
      [0, 0, 0, 0],
      [0, 0, 1, 0],
    ];
    // un plateau de 5 blocs partant du sommet du pilier, sans rien dessous
    for (let x = 1; x <= 5; x++) entries.push([x, 0, 1, 0]);

    const overhang = analyse(createModel(entries)).find((w) => w.kind === "overhang");
    expect(overhang).toBeDefined();
  });

  test("chaque avertissement porte un message en français et des blocs à surligner", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [9, 9, 0, 0],
    ]);
    for (const warning of analyse(model)) {
      expect(warning.message.length).toBeGreaterThan(10);
      expect(warning.voxels.length).toBeGreaterThan(0);
    }
  });
});
