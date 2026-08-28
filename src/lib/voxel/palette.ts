export interface PaletteColour {
  /** Hex RRGGBB SANS '#', en MAJUSCULES : Bambu Studio ignore silencieusement les minuscules. */
  readonly hex: string;
  readonly name: string;
}

/**
 * Les 16 teintes de laine de Minecraft. Un enfant qui joue à Minecraft les reconnaît
 * immédiatement, ce qui évite d'avoir à expliquer un sélecteur de couleur.
 *
 * L'ordre est un contrat : Bambu Studio mappe les couleurs aux slots AMS par ordre
 * d'apparition dans le colorgroup, pas par valeur hex. Réordonner cette liste
 * changerait donc les slots de tous les fichiers exportés ensuite.
 */
export const PALETTE: readonly PaletteColour[] = [
  { hex: "F2F2F2", name: "Blanc" },
  { hex: "9D9D97", name: "Gris clair" },
  { hex: "474F52", name: "Gris" },
  { hex: "1D1C21", name: "Noir" },
  { hex: "B02E26", name: "Rouge" },
  { hex: "F9801D", name: "Orange" },
  { hex: "FED83D", name: "Jaune" },
  { hex: "80C71F", name: "Vert clair" },
  { hex: "5E7C16", name: "Vert" },
  { hex: "169C9C", name: "Cyan" },
  { hex: "3AB3DA", name: "Bleu ciel" },
  { hex: "3C44AA", name: "Bleu" },
  { hex: "8932B8", name: "Violet" },
  { hex: "C74EBD", name: "Magenta" },
  { hex: "F38BAA", name: "Rose" },
  { hex: "835432", name: "Marron" },
];

export function isColourIndex(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) < PALETTE.length;
}

/** `#RRGGBB`, pour le CSS et three.js. */
export function cssColour(index: number): string {
  return `#${PALETTE[index]?.hex ?? PALETTE[0].hex}`;
}
