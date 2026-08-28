import { zipSync, strToU8 } from "fflate";

import { buildMesh } from "@/lib/voxel/mesh";
import { PALETTE } from "@/lib/voxel/palette";
import { bounds, usedColors, type VoxelModel } from "@/lib/voxel/model";

/**
 * Génération du 3MF que Bambu Studio sait ouvrir en couleur.
 *
 * Contraintes vérifiées sur le terrain, à ne pas re-deviner :
 *  - les couleurs vivent dans un `<m:colorgroup>` de l'extension Materials, et chaque
 *    triangle y renvoie par `pid` + `p1/p2/p3` (index 0-based) ;
 *  - Bambu Studio mappe les couleurs aux slots AMS **par ordre d'apparition**, pas par
 *    valeur hex : l'ordre doit donc être déterministe, sinon les slots changeraient d'un
 *    export à l'autre pour le même modèle ;
 *  - le hex doit être en MAJUSCULES, sinon la couleur est ignorée sans le moindre message.
 */

const NS_CORE = "http://schemas.microsoft.com/3dmanufacturing/core/2015/02";
const NS_MATERIAL = "http://schemas.microsoft.com/3dmanufacturing/material/2015/02";

const COLORGROUP_ID = 1;
const OBJECT_ID = 2;

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
</Types>
`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Target="/3D/3dmodel.model" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
</Relationships>
`;

/** Arrondi à 4 décimales, puis nettoyé du `-0` et des zéros de queue. */
function coordinate(value: number): string {
  const rounded = Number(value.toFixed(4));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    switch (character) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

export function buildModelXml(model: VoxelModel, voxelMm: number, name = "Cubo"): string {
  const mesh = buildMesh(model);
  const box = bounds(model);
  // Le modèle est ramené dans l'octant positif, coin en (0,0,0) : c'est ce qu'attendent
  // les slicers, et cela évite qu'une construction faite en coordonnées négatives
  // atterrisse hors du plateau.
  const offset = box?.min ?? [0, 0, 0];

  // Les couleurs sont réindexées en 0..n-1 pour que les slots AMS restent compacts :
  // un modèle bleu + marron n'occupe pas les slots 11 et 15.
  const colours = usedColors(model);
  const slotOf = new Map(colours.map((paletteIndex, slot) => [paletteIndex, slot]));

  const colourXml = colours
    .map((index) => `      <m:color color="#${PALETTE[index].hex.toUpperCase()}FF" />`)
    .join("\n");

  const vertexXml = mesh.vertices
    .map(([x, y, z]) => {
      const scaled = [x - offset[0], y - offset[1], z - offset[2]].map((v) => coordinate(v * voxelMm));
      return `        <vertex x="${scaled[0]}" y="${scaled[1]}" z="${scaled[2]}" />`;
    })
    .join("\n");

  const triangleXml = mesh.triangles
    .map(({ a, b, c, color }) => {
      // Les 3 sommets d'un triangle appartiennent au même voxel, donc à la même couleur.
      const slot = slotOf.get(color) ?? 0;
      return `        <triangle v1="${a}" v2="${b}" v3="${c}" pid="${COLORGROUP_ID}" p1="${slot}" p2="${slot}" p3="${slot}" />`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="fr-FR" xmlns="${NS_CORE}" xmlns:m="${NS_MATERIAL}">
  <metadata name="Title">${escapeXml(name)}</metadata>
  <metadata name="Application">Cubo</metadata>
  <resources>
    <m:colorgroup id="${COLORGROUP_ID}">
${colourXml}
    </m:colorgroup>
    <object id="${OBJECT_ID}" type="model" pid="${COLORGROUP_ID}" pindex="0">
      <mesh>
        <vertices>
${vertexXml}
        </vertices>
        <triangles>
${triangleXml}
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="${OBJECT_ID}" />
  </build>
</model>
`;
}

/** Paquet OPC complet, prêt à être ouvert dans Bambu Studio. */
export function to3mf(model: VoxelModel, voxelMm: number, name = "Cubo"): Uint8Array {
  // L'ordre d'insertion des clés est conservé : `[Content_Types].xml` reste la première
  // entrée de l'archive, comme le veut la convention OPC.
  return zipSync({
    "[Content_Types].xml": strToU8(CONTENT_TYPES_XML),
    "_rels/.rels": strToU8(RELS_XML),
    "3D/3dmodel.model": strToU8(buildModelXml(model, voxelMm, name)),
  });
}
