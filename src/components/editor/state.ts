import { createModel, type VoxelKey, type VoxelModel } from "@/lib/voxel/model";
import { DEFAULT_VOXEL_MM } from "@/lib/storage/format";
import type { Tool } from "./tools";

/**
 * L'état de l'éditeur vit dans un réducteur plutôt que dans une poignée de `useState`.
 *
 * La raison est concrète : poser un bloc doit modifier le modèle **et** empiler l'état
 * précédent dans l'historique en une seule transition. Enchaîner deux `setState` — a
 * fortiori en imbriquer un dans l'updater de l'autre — expose à un double enregistrement
 * quand React rejoue les mises à jour, et l'annulation se met alors à sauter un cran.
 */

/** Vert clair : couleur du bloc de départ et sélection initiale. */
export const START_COLOUR = 7;

export interface EditorState {
  name: string;
  model: VoxelModel;
  voxelMm: number;
  past: VoxelModel[];
  future: VoxelModel[];
  /** Incrémenté quand la caméra doit recadrer : chargement d'une création, remise à zéro. */
  focusToken: number;
}

export type EditorAction =
  | { type: "pick"; tool: Tool; colour: number; target: VoxelKey; neighbour: VoxelKey }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" }
  | { type: "voxelSize"; voxelMm: number }
  | { type: "rename"; name: string }
  | { type: "load"; name: string; model: VoxelModel; voxelMm: number };

export function startingModel(): VoxelModel {
  return createModel([[0, 0, 0, START_COLOUR]]);
}

export function initialState(): EditorState {
  return {
    name: "Ma création",
    model: startingModel(),
    voxelMm: DEFAULT_VOXEL_MM,
    past: [],
    future: [],
    focusToken: 0,
  };
}

/** Applique un changement de géométrie en empilant l'état courant dans l'historique. */
function withHistory(state: EditorState, model: VoxelModel): EditorState {
  return { ...state, model, past: [...state.past, state.model], future: [] };
}

export function reduce(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "pick": {
      const { tool, colour, target, neighbour } = action;
      const next = new Map(state.model);

      if (tool === "place") {
        if (state.model.has(neighbour)) return state;
        next.set(neighbour, colour);
      } else if (tool === "break") {
        // On ne vide jamais la scène : un écran noir n'apprend rien et décourage.
        if (state.model.size <= 1) return state;
        next.delete(target);
      } else if (tool === "paint") {
        if (state.model.get(target) === colour) return state;
        next.set(target, colour);
      } else {
        return state;
      }

      return withHistory(state, next);
    }

    case "undo": {
      if (state.past.length === 0) return state;
      return {
        ...state,
        model: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        future: [state.model, ...state.future],
      };
    }

    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { ...state, model: next, past: [...state.past, state.model], future: rest };
    }

    case "reset":
      return { ...withHistory(state, startingModel()), focusToken: state.focusToken + 1 };

    case "voxelSize":
      return { ...state, voxelMm: action.voxelMm };

    case "rename":
      return { ...state, name: action.name };

    // Charger une création remplace tout : conserver l'historique du modèle précédent
    // permettrait d'« annuler » vers une autre construction, ce qui n'a aucun sens.
    case "load":
      return {
        name: action.name,
        model: action.model,
        voxelMm: action.voxelMm,
        past: [],
        future: [],
        focusToken: state.focusToken + 1,
      };
  }
}
