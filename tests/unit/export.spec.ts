import { test, expect } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";

import { createModel } from "@/lib/voxel/model";
import { buildMesh } from "@/lib/voxel/mesh";
import { buildModelXml, to3mf } from "@/lib/export/to3mf";
import { toBinaryStl } from "@/lib/export/toStl";

/** Volume signé du maillage : positif si et seulement si les normales sortent. */
function signedVolume(xml: string): number {
  const vertices = [...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
    Number(m[3]),
  ]);
  const triangles = [...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
    Number(m[3]),
  ]);

  let volume = 0;
  for (const [i, j, k] of triangles) {
    const [a, b, c] = [vertices[i], vertices[j], vertices[k]];
    volume +=
      (a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])) /
      6;
  }
  return volume;
}

/** Vrai si chaque arête dirigée a exactement une jumelle inverse (2-manifold fermé). */
function isClosedManifold(xml: string): boolean {
  const triangles = [...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].map((m) => [
    m[1],
    m[2],
    m[3],
  ]);

  const edges = new Map<string, number>();
  for (const t of triangles) {
    for (let i = 0; i < 3; i++) {
      const edge = `${t[i]}>${t[(i + 1) % 3]}`;
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
    }
  }
  for (const [edge, count] of edges) {
    const [a, b] = edge.split(">");
    if (count !== 1 || edges.get(`${b}>${a}`) !== 1) return false;
  }
  return true;
}

const twoBlocks = createModel([
  [0, 0, 0, 0],
  [1, 0, 0, 0],
]);

test.describe("Export 3MF", () => {
  test("le paquet contient les trois pièces exigées par OPC", () => {
    const files = unzipSync(to3mf(twoBlocks, 8, "test"));
    expect(Object.keys(files)).toContain("[Content_Types].xml");
    expect(Object.keys(files)).toContain("_rels/.rels");
    expect(Object.keys(files)).toContain("3D/3dmodel.model");
  });

  // AC-7 (export) — les slots AMS doivent rester compacts et déterministes
  test("le colorgroup ne contient que les couleurs utilisées, réindexées à partir de 0", () => {
    const model = createModel([
      [0, 0, 0, 0],
      [2, 0, 0, 7],
    ]);
    const xml = buildModelXml(model, 8);

    const colours = [...xml.matchAll(/<m:color color="#([0-9A-F]{8})"/g)];
    expect(colours).toHaveLength(2);

    const refs = new Set([...xml.matchAll(/p1="(\d+)"/g)].map((m) => m[1]));
    expect(refs).toEqual(new Set(["0", "1"]));
  });

  test("les couleurs sont écrites en majuscules, sans quoi Bambu Studio les ignore", () => {
    const xml = buildModelXml(twoBlocks, 8);
    for (const [, hex] of xml.matchAll(/<m:color color="#([0-9A-Fa-f]{8})"/g)) {
      expect(hex).toBe(hex.toUpperCase());
    }
  });

  test("chaque triangle référence le colorgroup par pid et p1/p2/p3", () => {
    const xml = buildModelXml(twoBlocks, 8);
    const triangles = [...xml.matchAll(/<triangle [^>]*\/>/g)].map((m) => m[0]);
    expect(triangles.length).toBeGreaterThan(0);
    for (const triangle of triangles) {
      expect(triangle).toMatch(/pid="\d+"/);
      expect(triangle).toMatch(/p1="\d+" p2="\d+" p3="\d+"/);
    }
  });

  // AC-4 (export) — un maillage ouvert ou inversé est refusé par le slicer
  test("le maillage exporté est fermé et orienté vers l'extérieur", () => {
    const xml = buildModelXml(twoBlocks, 8);
    expect(isClosedManifold(xml)).toBe(true);
    expect(signedVolume(xml)).toBeGreaterThan(0);
  });

  // AC-8 (export)
  test("le volume correspond exactement aux blocs posés", () => {
    expect(signedVolume(buildModelXml(twoBlocks, 8))).toBeCloseTo(2 * 8 ** 3, 6);
    expect(signedVolume(buildModelXml(twoBlocks, 4))).toBeCloseTo(2 * 4 ** 3, 6);
  });

  test("le modèle est posé dans l'octant positif, coin en (0,0,0)", () => {
    const model = createModel([
      [-5, -5, -5, 0],
      [-4, -5, -5, 0],
    ]);
    const xml = buildModelXml(model, 8);
    const coords = [...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)];
    const all = coords.flatMap((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
    expect(Math.min(...all)).toBe(0);
  });

  test("le paquet est un ZIP lisible et son XML est bien formé", () => {
    const files = unzipSync(to3mf(twoBlocks, 8, "test"));
    const xml = strFromU8(files["3D/3dmodel.model"]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("</model>");
  });
});

test.describe("Export STL", () => {
  // AC-5 (export)
  test("l'en-tête binaire annonce le nombre exact de triangles", () => {
    const stl = toBinaryStl(twoBlocks, 8);
    const view = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);
    const declared = view.getUint32(80, true);

    expect(declared).toBe(buildMesh(twoBlocks).triangles.length);
    // 80 octets d'en-tête + 4 de compteur + 50 par triangle
    expect(stl.byteLength).toBe(84 + declared * 50);
  });
});
