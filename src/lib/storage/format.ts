import { createModel, toEntries, type VoxelEntry, type VoxelModel } from "@/lib/voxel/model";
import { isColourIndex } from "@/lib/voxel/palette";

/**
 * Format `.cubo.json`, versionné dès la v1 : les créations d'un enfant doivent survivre
 * aux évolutions de l'application, pas devenir illisibles au premier changement de schéma.
 *
 * Tout fichier lu vient de l'extérieur et n'est donc jamais présumé valide : chaque champ
 * est vérifié, et un fichier abîmé échoue avec un message compréhensible plutôt que de
 * casser la scène.
 */

export const SCHEMA_VERSION = 1;

/** Tailles de voxel proposées, en millimètres. */
export const VOXEL_SIZES = [4, 6, 8, 10, 12] as const;

export const DEFAULT_VOXEL_MM = 8;

export interface CuboDocument {
  name: string;
  model: VoxelModel;
  voxelSizeMm: number;
}

export function serialise(name: string, model: VoxelModel, voxelSizeMm: number): string {
  return JSON.stringify(
    {
      version: SCHEMA_VERSION,
      name,
      voxelSizeMm,
      voxels: toEntries(model),
    },
    null,
    2,
  );
}

export function deserialise(json: string): CuboDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return fail("Ce fichier n'est pas lisible : ce n'est pas du JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    return fail("Ce fichier ne contient pas un modèle Cubo.");
  }

  const document = parsed as Record<string, unknown>;

  if (document.version !== SCHEMA_VERSION) {
    return fail(`Version de fichier inconnue : ${String(document.version)}.`);
  }

  const voxelSizeMm = document.voxelSizeMm;
  if (typeof voxelSizeMm !== "number" || !Number.isFinite(voxelSizeMm) || voxelSizeMm <= 0) {
    return fail("Taille de voxel invalide dans le fichier.");
  }

  if (!Array.isArray(document.voxels) || document.voxels.length === 0) {
    return fail("Ce fichier ne contient aucun bloc.");
  }

  const voxels: VoxelEntry[] = [];
  for (const raw of document.voxels) {
    if (!Array.isArray(raw) || raw.length !== 4) {
      return fail("Bloc mal formé dans le fichier.");
    }
    const [x, y, z, colour] = raw as unknown[];
    if (![x, y, z].every((value) => typeof value === "number" && Number.isInteger(value))) {
      return fail("Coordonnées de bloc invalides dans le fichier.");
    }
    if (!isColourIndex(colour)) {
      return fail("Index de couleur inconnu dans le fichier.");
    }
    voxels.push([x as number, y as number, z as number, colour]);
  }

  return {
    name: typeof document.name === "string" && document.name.trim() ? document.name : "Ma création",
    voxelSizeMm,
    model: createModel(voxels),
  };
}

function fail(message: string): never {
  throw new Error(message);
}
