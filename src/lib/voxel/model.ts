/**
 * Le modèle voxel : une grille creuse, sans bornes fixes.
 *
 * Le choix d'une `Map` plutôt que d'un tableau 3D dimensionné à l'avance découle
 * directement de la promesse faite à l'enfant — la zone de construction grandit avec lui.
 * La seule limite est physique : le plateau de la X1C.
 */

/** Coordonnées entières sérialisées, `"x,y,z"`. */
export type VoxelKey = string;

/** Clé de voxel → index dans la palette. */
export type VoxelModel = Map<VoxelKey, number>;

/** `[x, y, z, index de couleur]` — la forme utilisée dans les fichiers `.cubo.json`. */
export type VoxelEntry = [number, number, number, number];

/** Volume utile de la Bambu Lab X1C, en millimètres. */
export const PLATE_MM = 256;

export function key(x: number, y: number, z: number): VoxelKey {
  return `${x},${y},${z}`;
}

export function parseKey(voxelKey: VoxelKey): [number, number, number] {
  const [x, y, z] = voxelKey.split(",").map(Number);
  return [x, y, z];
}

export function createModel(entries: readonly VoxelEntry[]): VoxelModel {
  return new Map(entries.map(([x, y, z, colour]) => [key(x, y, z), colour]));
}

export function toEntries(model: VoxelModel): VoxelEntry[] {
  return [...model].map(([voxelKey, colour]) => {
    const [x, y, z] = parseKey(voxelKey);
    return [x, y, z, colour] as VoxelEntry;
  });
}

export interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

export function bounds(model: VoxelModel): Bounds | null {
  if (model.size === 0) return null;

  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  for (const voxelKey of model.keys()) {
    const position = parseKey(voxelKey);
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], position[axis]);
      max[axis] = Math.max(max[axis], position[axis]);
    }
  }
  return { min, max };
}

export function dimensionsInVoxels(model: VoxelModel): [number, number, number] {
  const box = bounds(model);
  if (!box) return [0, 0, 0];
  return [
    box.max[0] - box.min[0] + 1,
    box.max[1] - box.min[1] + 1,
    box.max[2] - box.min[2] + 1,
  ];
}

export function dimensionsMm(model: VoxelModel, voxelMm: number): [number, number, number] {
  const [x, y, z] = dimensionsInVoxels(model);
  return [x * voxelMm, y * voxelMm, z * voxelMm];
}

/** Le modèle rentre-t-il physiquement sur le plateau ? */
export function fitsOnPlate(model: VoxelModel, voxelMm: number): boolean {
  return dimensionsMm(model, voxelMm).every((size) => size <= PLATE_MM);
}

/** Index de palette réellement employés, triés et sans doublon. */
export function usedColors(model: VoxelModel): number[] {
  return [...new Set(model.values())].sort((a, b) => a - b);
}

/** Les 6 voisins partageant une face. */
export const FACE_NEIGHBOURS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
