import { buildMesh } from "@/lib/voxel/mesh";
import { bounds, type VoxelModel } from "@/lib/voxel/model";

/**
 * STL binaire : monochrome, mais accepté par absolument tous les slicers.
 * C'est le filet de sécurité si le 3MF coloré pose problème un jour.
 *
 * Format : 80 octets d'en-tête, un compteur uint32, puis 50 octets par triangle
 * (normale + 3 sommets en float32, plus 2 octets d'attribut inutilisés).
 */
export function toBinaryStl(model: VoxelModel, voxelMm: number): Uint8Array {
  const mesh = buildMesh(model);
  const offset = bounds(model)?.min ?? [0, 0, 0];

  const buffer = new ArrayBuffer(84 + mesh.triangles.length * 50);
  const view = new DataView(buffer);

  const header = "Cubo — modele voxel";
  for (let i = 0; i < header.length && i < 80; i++) view.setUint8(i, header.charCodeAt(i));
  view.setUint32(80, mesh.triangles.length, true);

  const vertexAt = (index: number): [number, number, number] => {
    const [x, y, z] = mesh.vertices[index];
    return [(x - offset[0]) * voxelMm, (y - offset[1]) * voxelMm, (z - offset[2]) * voxelMm];
  };

  let cursor = 84;
  for (const { a, b, c } of mesh.triangles) {
    const [p, q, r] = [vertexAt(a), vertexAt(b), vertexAt(c)];

    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const length = Math.hypot(...normal) || 1;

    for (const component of normal) {
      view.setFloat32(cursor, component / length, true);
      cursor += 4;
    }
    for (const vertex of [p, q, r]) {
      for (const component of vertex) {
        view.setFloat32(cursor, component, true);
        cursor += 4;
      }
    }
    view.setUint16(cursor, 0, true);
    cursor += 2;
  }

  return new Uint8Array(buffer);
}
