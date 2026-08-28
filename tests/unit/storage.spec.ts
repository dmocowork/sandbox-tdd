import { test, expect } from "@playwright/test";

import { createModel } from "@/lib/voxel/model";
import { deserialise, serialise } from "@/lib/storage/format";

test.describe("Format de fichier .cubo.json", () => {
  // AC-5 (persistence)
  test("un modèle survit à un aller-retour sans perte", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [1, 2, 3, 7],
      [-4, 0, 1, 15],
    ]);

    const restored = deserialise(serialise("Mon épée", model, 8));

    expect(restored.name).toBe("Mon épée");
    expect(restored.voxelSizeMm).toBe(8);
    expect([...restored.model.entries()].sort()).toEqual([...model.entries()].sort());
  });

  test("le fichier écrit porte une version de schéma", () => {
    const parsed = JSON.parse(serialise("x", createModel([[0, 0, 0, 0]]), 8));
    expect(parsed.version).toBe(1);
    expect(parsed.voxels).toHaveLength(1);
  });

  // AC-6 (persistence) — un fichier venu de l'extérieur n'est jamais digne de confiance
  test("des coordonnées non numériques sont rejetées explicitement", () => {
    const bad = JSON.stringify({
      version: 1,
      name: "x",
      voxelSizeMm: 8,
      voxels: [["a", 0, 0, 0]],
    });
    expect(() => deserialise(bad)).toThrow(/coordonn/i);
  });

  test("un JSON qui n'est pas un fichier Cubo est rejeté", () => {
    expect(() => deserialise('{"hello":"world"}')).toThrow();
    expect(() => deserialise("pas du json")).toThrow();
  });

  test("un index de couleur hors palette est rejeté", () => {
    const bad = JSON.stringify({
      version: 1,
      name: "x",
      voxelSizeMm: 8,
      voxels: [[0, 0, 0, 999]],
    });
    expect(() => deserialise(bad)).toThrow(/couleur/i);
  });

  test("une taille de voxel aberrante est rejetée", () => {
    const bad = JSON.stringify({
      version: 1,
      name: "x",
      voxelSizeMm: 0,
      voxels: [[0, 0, 0, 0]],
    });
    expect(() => deserialise(bad)).toThrow(/taille/i);
  });

  test("un modèle vide est rejeté : l'éditeur ne doit jamais se retrouver sans rien", () => {
    const bad = JSON.stringify({ version: 1, name: "x", voxelSizeMm: 8, voxels: [] });
    expect(() => deserialise(bad)).toThrow();
  });
});
