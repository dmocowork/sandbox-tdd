import { deserialise, serialise, type CuboDocument } from "./format";

/**
 * Sauvegarde automatique dans le navigateur. Un enfant de 8 ans ne pense pas à sauvegarder,
 * et perdre trois soirs de construction est la façon la plus sûre de le dégoûter du projet.
 *
 * Toutes les opérations sont défensives : `localStorage` peut être indisponible (navigation
 * privée, quota atteint, rendu serveur). Dans ce cas on continue sans persistance plutôt
 * que de faire tomber l'éditeur.
 */

const STORAGE_KEY = "cubo:creation-courante";

export function saveCurrent(document: CuboDocument): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      serialise(document.name, document.model, document.voxelSizeMm),
    );
  } catch {
    // Quota dépassé ou stockage refusé : on préfère un éditeur qui marche sans mémoire
  }
}

export function loadCurrent(): CuboDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? deserialise(stored) : null;
  } catch {
    // Sauvegarde corrompue ou écrite par une version antérieure : on repart proprement
    return null;
  }
}
