"use client";

import dynamic from "next/dynamic";

/**
 * L'éditeur est chargé sans rendu serveur : three.js a besoin d'un vrai canvas WebGL,
 * qui n'existe pas côté serveur. Next 16 exige que `ssr: false` soit déclaré depuis un
 * composant client — d'où ce fin fichier d'aiguillage.
 */
const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        height: "100dvh",
        background: "#0d1117",
        color: "#7d8896",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      Préparation de l&apos;atelier…
    </div>
  ),
});

export default function EditorLoader() {
  return <Editor />;
}
