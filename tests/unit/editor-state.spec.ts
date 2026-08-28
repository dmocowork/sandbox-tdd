import { test, expect } from "@playwright/test";

import { createModel } from "@/lib/voxel/model";
import { initialState, reduce, type EditorAction, type EditorState } from "@/components/editor/state";

const run = (state: EditorState, ...actions: EditorAction[]): EditorState =>
  actions.reduce(reduce, state);

const place = (target: string, neighbour: string, colour = 4): EditorAction => ({
  type: "pick",
  tool: "place",
  colour,
  target,
  neighbour,
});

test.describe("État de l'éditeur", () => {
  test("poser ajoute un bloc dans la cellule voisine, avec la couleur choisie", () => {
    const next = run(initialState(), place("0,0,0", "0,0,1", 4));

    expect(next.model.size).toBe(2);
    expect(next.model.get("0,0,1")).toBe(4);
    expect(next.past).toHaveLength(1);
  });

  test("poser sur une cellule déjà occupée ne fait rien et n'encombre pas l'historique", () => {
    const start = run(initialState(), place("0,0,0", "0,0,1"));
    const next = run(start, place("0,0,0", "0,0,1"));

    expect(next).toBe(start);
    expect(next.past).toHaveLength(1);
  });

  test("casser retire le bloc visé", () => {
    const start = run(initialState(), place("0,0,0", "0,0,1"));
    const next = run(start, {
      type: "pick",
      tool: "break",
      colour: 0,
      target: "0,0,1",
      neighbour: "0,0,2",
    });

    expect(next.model.size).toBe(1);
    expect(next.model.has("0,0,1")).toBe(false);
  });

  // Un écran vide n'apprend rien et décourage : il reste toujours de quoi repartir
  test("casser le dernier bloc est refusé", () => {
    const state = initialState();
    const next = run(state, {
      type: "pick",
      tool: "break",
      colour: 0,
      target: "0,0,0",
      neighbour: "0,0,1",
    });

    expect(next).toBe(state);
    expect(next.model.size).toBe(1);
  });

  test("peindre change la couleur sans changer le nombre de blocs", () => {
    const next = run(initialState(), {
      type: "pick",
      tool: "paint",
      colour: 11,
      target: "0,0,0",
      neighbour: "0,0,1",
    });

    expect(next.model.size).toBe(1);
    expect(next.model.get("0,0,0")).toBe(11);
  });

  test("l'outil Tourner ne modifie jamais le modèle", () => {
    const state = initialState();
    expect(
      run(state, {
        type: "pick",
        tool: "orbit",
        colour: 3,
        target: "0,0,0",
        neighbour: "0,0,1",
      }),
    ).toBe(state);
  });

  test("annuler puis refaire rejoue exactement l'historique", () => {
    const built = run(
      initialState(),
      place("0,0,0", "0,0,1"),
      place("0,0,1", "0,0,2"),
    );
    expect(built.model.size).toBe(3);

    const undone = run(built, { type: "undo" }, { type: "undo" });
    expect(undone.model.size).toBe(1);

    const redone = run(undone, { type: "redo" }, { type: "redo" });
    expect(redone.model.size).toBe(3);
    expect([...redone.model.entries()].sort()).toEqual([...built.model.entries()].sort());
  });

  test("une nouvelle action efface le futur", () => {
    const undone = run(initialState(), place("0,0,0", "0,0,1"), { type: "undo" });
    expect(undone.future).toHaveLength(1);

    expect(run(undone, place("0,0,0", "1,0,0")).future).toHaveLength(0);
  });

  test("annuler et refaire sans historique ne cassent rien", () => {
    const state = initialState();
    expect(run(state, { type: "undo" })).toBe(state);
    expect(run(state, { type: "redo" })).toBe(state);
  });

  // Pouvoir « annuler » vers une création précédente n'aurait aucun sens
  test("charger une création repart d'un historique vierge", () => {
    const built = run(initialState(), place("0,0,0", "0,0,1"));
    const loaded = run(built, {
      type: "load",
      name: "Épée",
      model: createModel([[0, 0, 0, 3]]),
      voxelMm: 10,
    });

    expect(loaded.name).toBe("Épée");
    expect(loaded.voxelMm).toBe(10);
    expect(loaded.past).toHaveLength(0);
    expect(loaded.future).toHaveLength(0);
    expect(loaded.focusToken).toBeGreaterThan(built.focusToken);
  });
});
