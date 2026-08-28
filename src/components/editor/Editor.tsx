"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { PLATE_MM, dimensionsMm, fitsOnPlate, usedColors, type VoxelKey } from "@/lib/voxel/model";
import { PALETTE, cssColour } from "@/lib/voxel/palette";
import { analyse } from "@/lib/voxel/printability";
import { to3mf } from "@/lib/export/to3mf";
import { toBinaryStl } from "@/lib/export/toStl";
import { VOXEL_SIZES, deserialise, serialise } from "@/lib/storage/format";
import { loadCurrent, saveCurrent } from "@/lib/storage/local";

import Scene from "./Scene";
import { TOOLS, type Tool } from "./tools";
import { START_COLOUR, initialState, reduce, type EditorState } from "./state";
import styles from "./Editor.module.css";

/** Nom de fichier sûr, sans accents ni espaces, dérivé du nom de la création. */
function fileSafe(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "creation"
  );
}

function download(filename: string, data: string | Uint8Array, type: string) {
  // `Uint8Array` est un `BlobPart` parfaitement valide à l'exécution : l'écart vient du
  // paramètre générique `ArrayBufferLike` des types TS, que la signature de `Blob` refuse.
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Révoquer immédiatement interromprait le téléchargement dans certains navigateurs.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * La création de la veille est relue à l'initialisation du réducteur, et non dans un effet.
 *
 * C'est ce qui garantit que le tout premier rendu porte déjà le bon modèle : restaurer
 * après coup laisserait passer un rendu avec le modèle par défaut, que la sauvegarde
 * automatique s'empresserait d'écrire par-dessus le travail de l'enfant.
 * L'éditeur n'étant jamais rendu côté serveur, lire `localStorage` ici est sans risque.
 */
function restoreOrStart(): EditorState {
  const saved = loadCurrent();
  if (!saved) return initialState();

  return {
    ...initialState(),
    name: saved.name,
    model: saved.model,
    voxelMm: saved.voxelSizeMm,
  };
}

export default function Editor() {
  const [state, dispatch] = useReducer(reduce, undefined, restoreOrStart);
  const { name, model, voxelMm, past, future, focusToken } = state;

  const [tool, setTool] = useState<Tool>("place");
  const [colour, setColour] = useState(START_COLOUR);
  const [ready, setReady] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveCurrent({ name, model, voxelSizeMm: voxelMm });
  }, [name, model, voxelMm]);

  const handlePick = useCallback(
    (target: VoxelKey, neighbour: VoxelKey) => {
      dispatch({ type: "pick", tool, colour, target, neighbour });
    },
    [tool, colour],
  );

  const openFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Réinitialisé tout de suite pour que rouvrir le même fichier redéclenche l'événement.
    event.target.value = "";
    if (!file) return;

    try {
      const document = deserialise(await file.text());
      dispatch({
        type: "load",
        name: document.name,
        model: document.model,
        voxelMm: document.voxelSizeMm,
      });
      setImportError(null);
    } catch (error) {
      // Le modèle en cours n'est pas touché : un fichier abîmé ne doit rien détruire.
      setImportError(error instanceof Error ? error.message : "Fichier illisible.");
    }
  };

  const warnings = useMemo(() => analyse(model), [model]);
  const highlighted = useMemo(
    () => new Set(warnings.flatMap((warning) => warning.voxels)),
    [warnings],
  );
  const colours = useMemo(() => usedColors(model), [model]);
  const [sizeX, sizeY, sizeZ] = dimensionsMm(model, voxelMm);
  const onPlate = fitsOnPlate(model, voxelMm);

  return (
    <div className={styles.shell}>
      <aside className={styles.panel}>
        <div className={styles.brand}>
          <h1>Cubo</h1>
          <span>construis, puis imprime</span>
        </div>

        <section>
          <h2 className={styles.sectionTitle}>Outils</h2>
          <div className={styles.tools}>
            {TOOLS.map((definition) => (
              <button
                key={definition.id}
                type="button"
                className={styles.tool}
                data-testid={`tool-${definition.id}`}
                aria-pressed={tool === definition.id}
                onClick={() => setTool(definition.id)}
              >
                <span className={styles.toolIcon} aria-hidden>
                  {definition.icon}
                </span>
                {definition.label}
              </button>
            ))}
          </div>
          <p className={styles.hint}>{TOOLS.find((entry) => entry.id === tool)?.hint}</p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Couleurs</h2>
          <div className={styles.palette}>
            {PALETTE.map((entry, index) => (
              <button
                key={entry.hex}
                type="button"
                className={styles.swatch}
                data-testid={`color-${index}`}
                aria-pressed={colour === index}
                aria-label={entry.name}
                title={entry.name}
                style={{ background: cssColour(index) }}
                onClick={() => setColour(index)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Historique</h2>
          <div className={styles.row}>
            <button
              type="button"
              className={styles.button}
              data-testid="undo"
              disabled={past.length === 0}
              onClick={() => dispatch({ type: "undo" })}
            >
              ↶ Annuler
            </button>
            <button
              type="button"
              className={styles.button}
              data-testid="redo"
              disabled={future.length === 0}
              onClick={() => dispatch({ type: "redo" })}
            >
              ↷ Refaire
            </button>
          </div>
        </section>
      </aside>

      <div className={styles.canvasWrap} data-testid="canvas-wrap" data-ready={ready}>
        <Scene
          model={model}
          highlighted={highlighted}
          tool={tool}
          voxelMm={voxelMm}
          focusToken={focusToken}
          onPick={handlePick}
          onReady={() => setReady(true)}
        />
      </div>

      <aside className={styles.panel}>
        <section>
          <h2 className={styles.sectionTitle}>Ta création</h2>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>Blocs</span>
              <strong data-testid="block-count">{model.size}</strong>
            </div>
            <div className={styles.stat}>
              <span>Couleurs</span>
              <strong data-testid="color-count">{colours.length}</strong>
            </div>
            <div className={styles.stat}>
              <span>Taille réelle</span>
              <strong data-testid="model-size-mm">{`${sizeX} × ${sizeY} × ${sizeZ} mm`}</strong>
            </div>
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Taille d&apos;un bloc</h2>
          <select
            className={styles.select}
            data-testid="voxel-size"
            value={String(voxelMm)}
            onChange={(event) =>
              dispatch({ type: "voxelSize", voxelMm: Number(event.target.value) })
            }
          >
            {VOXEL_SIZES.map((size) => (
              <option key={size} value={String(size)}>
                {size} mm
              </option>
            ))}
          </select>
          {!onPlate && (
            <p className={styles.hint} data-testid="plate-warning">
              Ta création dépasse le plateau de l&apos;imprimante ({PLATE_MM} mm). Choisis des
              blocs plus petits, ou construis un peu moins large.
            </p>
          )}
        </section>

        <section>
          <h2 className={styles.sectionTitle}>
            Avant d&apos;imprimer (<span data-testid="warning-count">{warnings.length}</span>)
          </h2>
          <div className={styles.warnings} data-testid="warning-list">
            {warnings.length === 0 ? (
              <p className={styles.ok}>Tout est bon, ta création peut être imprimée.</p>
            ) : (
              warnings.map((warning) => (
                <p key={warning.kind} className={styles.warning}>
                  {warning.message}
                </p>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Imprimer et sauvegarder</h2>
          <div className={styles.buttons}>
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              data-testid="export-3mf"
              onClick={() =>
                download(`${fileSafe(name)}.3mf`, to3mf(model, voxelMm, name), "model/3mf")
              }
            >
              Exporter pour l&apos;imprimante (.3mf)
            </button>
            <button
              type="button"
              className={styles.button}
              data-testid="export-stl"
              onClick={() =>
                download(`${fileSafe(name)}.stl`, toBinaryStl(model, voxelMm), "model/stl")
              }
            >
              Exporter en STL
            </button>
            <button
              type="button"
              className={styles.button}
              data-testid="save-file"
              onClick={() =>
                download(
                  `${fileSafe(name)}.cubo.json`,
                  serialise(name, model, voxelMm),
                  "application/json",
                )
              }
            >
              Sauvegarder dans un fichier
            </button>
            <button
              type="button"
              className={styles.button}
              data-testid="open-file-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Ouvrir un fichier
            </button>
            <button type="button" className={styles.button} data-testid="new-model" onClick={() => dispatch({ type: "reset" })}>
              Nouvelle création
            </button>
          </div>

          <input
            ref={fileInputRef}
            className={styles.hidden}
            type="file"
            accept=".json,application/json"
            data-testid="open-file"
            onChange={openFile}
          />

          {importError && (
            <p className={styles.error} data-testid="import-error">
              {importError}
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
