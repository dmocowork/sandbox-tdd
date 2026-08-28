import { key, parseKey, type VoxelModel } from "./model";

export interface MeshTriangle {
  /** Index dans `vertices`. */
  a: number;
  b: number;
  c: number;
  /** Index de palette hérité du voxel dont vient la face. */
  color: number;
}

export interface VoxelMesh {
  /** Coordonnées entières, en unités de voxel. La mise à l'échelle en mm a lieu à l'export. */
  vertices: Array<[number, number, number]>;
  triangles: MeshTriangle[];
}

/**
 * Les 6 faces d'un cube unité : la direction du voisin à tester, et les 4 coins
 * (i,j,k ∈ {0,1}) dans l'ordre anti-horaire vu de l'extérieur.
 *
 * Cet ordre n'est pas cosmétique : il détermine le sens des normales. Une seule face
 * inversée et le slicer refuse le modèle ou l'imprime à l'envers.
 */
const FACES: ReadonlyArray<{
  dir: readonly [number, number, number];
  corners: ReadonlyArray<readonly [number, number, number]>;
}> = [
  { dir: [0, 0, -1], corners: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { dir: [0, 1, 0], corners: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { dir: [1, 0, 0], corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
];

/**
 * Construit le maillage de surface du modèle.
 *
 * Deux propriétés en découlent, toutes deux vérifiées par les tests :
 *  - **culling** : une face n'est émise que si la cellule voisine est vide, si bien que
 *    l'intérieur d'un bloc massif ne coûte rien ;
 *  - **fermeture** : comme chaque face séparant le plein du vide est émise exactement une
 *    fois, le maillage est 2-manifold fermé — la condition qu'un slicer exige.
 */
export function buildMesh(model: VoxelModel): VoxelMesh {
  const vertices: Array<[number, number, number]> = [];
  const triangles: MeshTriangle[] = [];
  const vertexIndex = new Map<string, number>();

  const cornerIndex = (x: number, y: number, z: number): number => {
    const cornerKey = key(x, y, z);
    let index = vertexIndex.get(cornerKey);
    if (index === undefined) {
      index = vertices.length;
      vertices.push([x, y, z]);
      vertexIndex.set(cornerKey, index);
    }
    return index;
  };

  for (const [voxelKey, colour] of model) {
    const [x, y, z] = parseKey(voxelKey);

    for (const { dir, corners } of FACES) {
      if (model.has(key(x + dir[0], y + dir[1], z + dir[2]))) continue;

      const [a, b, c, d] = corners.map(([i, j, k]) => cornerIndex(x + i, y + j, z + k));
      triangles.push({ a, b, c, color: colour });
      triangles.push({ a, b: c, c: d, color: colour });
    }
  }

  return { vertices, triangles };
}
