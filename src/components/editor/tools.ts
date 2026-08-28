export type Tool = "place" | "break" | "paint" | "orbit";

export interface ToolDefinition {
  id: Tool;
  label: string;
  icon: string;
  /** Phrase d'aide, écrite pour un enfant de 8 ans qui lit encore lentement. */
  hint: string;
}

/**
 * Des modes d'outil explicites plutôt que des combinaisons de touches : à 8 ans,
 * rien ne doit être à mémoriser pour commencer à construire.
 */
export const TOOLS: readonly ToolDefinition[] = [
  { id: "place", label: "Poser", icon: "▢", hint: "Clique sur un bloc pour en poser un nouveau à côté." },
  { id: "break", label: "Casser", icon: "✕", hint: "Clique sur un bloc pour l'enlever." },
  { id: "paint", label: "Peindre", icon: "◍", hint: "Choisis une couleur, puis clique sur un bloc." },
  { id: "orbit", label: "Tourner", icon: "↻", hint: "Glisse la souris pour tourner autour de ta création." },
];
