import { FACE_NEIGHBOURS, key, parseKey, type VoxelKey, type VoxelModel } from "./model";

/**
 * Le cœur pédagogique de Cubo.
 *
 * Dans Minecraft, un bloc flotte sans rien dessous et deux blocs qui se touchent par un
 * coin tiennent ensemble. Dans la matière, non. Ces trois règles rendent l'écart visible
 * avant l'impression, avec des mots qu'un enfant de 8 ans comprend.
 *
 * Aucune de ces règles n'interdit quoi que ce soit : on informe. Un enfant qui ne peut pas
 * tenter, rater et regarder pourquoi n'apprend rien.
 */

export type WarningKind = "pieces" | "fragile" | "overhang";

export interface Warning {
  kind: WarningKind;
  /** Phrase destinée à l'enfant, pas au parent. */
  message: string;
  /** Blocs à surligner dans la scène : le lien phrase ↔ objet doit être immédiat. */
  voxels: VoxelKey[];
  count?: number;
}

/** Au-delà de cette largeur en blocs, un porte-à-faux ne se franchit plus en pont. */
const MAX_BRIDGE_VOXELS = 3;

/** Composantes connexes par les faces — la seule connexité qui tient à l'impression. */
function faceComponents(model: VoxelModel): VoxelKey[][] {
  const seen = new Set<VoxelKey>();
  const components: VoxelKey[][] = [];

  for (const start of model.keys()) {
    if (seen.has(start)) continue;

    const component: VoxelKey[] = [];
    const queue = [start];
    seen.add(start);

    while (queue.length > 0) {
      const current = queue.pop()!;
      component.push(current);
      const [x, y, z] = parseKey(current);

      for (const [dx, dy, dz] of FACE_NEIGHBOURS) {
        const neighbour = key(x + dx, y + dy, z + dz);
        if (model.has(neighbour) && !seen.has(neighbour)) {
          seen.add(neighbour);
          queue.push(neighbour);
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Deux blocs en diagonale sont-ils reliés par un chemin de faces **local** ?
 * On restreint la recherche à la boîte englobant les deux blocs (4 ou 8 cellules) :
 * un détour de trois mètres à l'autre bout du modèle ne solidifie pas ce coin-là.
 */
function locallyJoined(
  model: VoxelModel,
  from: readonly [number, number, number],
  to: readonly [number, number, number],
): boolean {
  const min = [0, 1, 2].map((axis) => Math.min(from[axis], to[axis]));
  const max = [0, 1, 2].map((axis) => Math.max(from[axis], to[axis]));
  const target = key(to[0], to[1], to[2]);

  const seen = new Set<VoxelKey>([key(from[0], from[1], from[2])]);
  const queue: Array<[number, number, number]> = [[...from] as [number, number, number]];

  while (queue.length > 0) {
    const [x, y, z] = queue.pop()!;
    for (const [dx, dy, dz] of FACE_NEIGHBOURS) {
      const next: [number, number, number] = [x + dx, y + dy, z + dz];
      if (next.some((value, axis) => value < min[axis] || value > max[axis])) continue;

      const nextKey = key(next[0], next[1], next[2]);
      if (!model.has(nextKey) || seen.has(nextKey)) continue;
      if (nextKey === target) return true;

      seen.add(nextKey);
      queue.push(next);
    }
  }
  return false;
}

function fragilePairs(model: VoxelModel): VoxelKey[] {
  const involved = new Set<VoxelKey>();

  for (const voxelKey of model.keys()) {
    const position = parseKey(voxelKey);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          // On ne regarde que les diagonales : arête (2 axes) ou coin (3 axes)
          if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < 2) continue;

          const neighbour: [number, number, number] = [
            position[0] + dx,
            position[1] + dy,
            position[2] + dz,
          ];
          const neighbourKey = key(neighbour[0], neighbour[1], neighbour[2]);
          // Chaque paire n'est examinée qu'une fois
          if (!model.has(neighbourKey) || neighbourKey < voxelKey) continue;

          if (!locallyJoined(model, position, neighbour)) {
            involved.add(voxelKey);
            involved.add(neighbourKey);
          }
        }
      }
    }
  }
  return [...involved];
}

interface OverhangReport {
  floating: VoxelKey[];
  tooWide: VoxelKey[];
}

/**
 * Un bloc est porté s'il repose sur la première couche (que le slicer pose sur le plateau)
 * ou sur un autre bloc. Les blocs non portés sont regroupés par couche : un groupe étroit
 * accroché des deux côtés est un pont, que la X1C franchit sans support.
 */
function overhangs(model: VoxelModel): OverhangReport {
  const report: OverhangReport = { floating: [], tooWide: [] };
  if (model.size === 0) return report;

  const baseZ = Math.min(...[...model.keys()].map((voxelKey) => parseKey(voxelKey)[2]));

  const isSupported = (voxelKey: VoxelKey): boolean => {
    const [x, y, z] = parseKey(voxelKey);
    return z === baseZ || model.has(key(x, y, z - 1));
  };

  const unsupported = new Set([...model.keys()].filter((voxelKey) => !isSupported(voxelKey)));
  const seen = new Set<VoxelKey>();

  for (const start of unsupported) {
    if (seen.has(start)) continue;

    // Groupe de blocs non portés, connectés latéralement dans la même couche
    const group: VoxelKey[] = [];
    const queue = [start];
    seen.add(start);

    while (queue.length > 0) {
      const current = queue.pop()!;
      group.push(current);
      const [x, y, z] = parseKey(current);

      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const neighbour = key(x + dx, y + dy, z);
        if (unsupported.has(neighbour) && !seen.has(neighbour)) {
          seen.add(neighbour);
          queue.push(neighbour);
        }
      }
    }

    // Le groupe s'appuie-t-il sur un bloc porté de la même couche ?
    const anchored = group.some((voxelKey) => {
      const [x, y, z] = parseKey(voxelKey);
      return [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => {
        const neighbour = key(x + dx, y + dy, z);
        return model.has(neighbour) && isSupported(neighbour);
      });
    });

    if (!anchored) {
      report.floating.push(...group);
      continue;
    }

    const positions = group.map(parseKey);
    const width = Math.max(
      ...[0, 1].map((axis) => {
        const values = positions.map((position) => position[axis]);
        return Math.max(...values) - Math.min(...values) + 1;
      }),
    );
    if (width > MAX_BRIDGE_VOXELS) report.tooWide.push(...group);
  }

  return report;
}

export function analyse(model: VoxelModel): Warning[] {
  const warnings: Warning[] = [];
  if (model.size === 0) return warnings;

  const components = faceComponents(model);
  if (components.length > 1) {
    // On surligne tout sauf le plus gros morceau : ce sont les bouts qui se détacheront
    const sorted = [...components].sort((a, b) => b.length - a.length);
    warnings.push({
      kind: "pieces",
      count: components.length,
      voxels: sorted.slice(1).flat(),
      message: `Ton modèle est en ${components.length} morceaux séparés. Ils ne tiendront pas ensemble en sortant de l'imprimante.`,
    });
  }

  const fragile = fragilePairs(model);
  if (fragile.length > 0) {
    warnings.push({
      kind: "fragile",
      count: fragile.length,
      voxels: fragile,
      message:
        "Ces blocs ne se touchent que par un coin. Dans la vraie vie, ça casse tout seul : ajoute un bloc entre les deux.",
    });
  }

  const { floating, tooWide } = overhangs(model);
  if (floating.length > 0 || tooWide.length > 0) {
    warnings.push({
      kind: "overhang",
      count: floating.length + tooWide.length,
      voxels: [...floating, ...tooWide],
      message:
        floating.length > 0
          ? "Cette partie flotte dans le vide. L'imprimante ne peut rien poser sur du vide : mets des blocs en dessous."
          : "Cette partie avance trop loin sans rien dessous. Elle va s'affaisser pendant l'impression.",
    });
  }

  return warnings;
}
