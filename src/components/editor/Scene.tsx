"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { PLATE_MM, key, parseKey, type VoxelKey, type VoxelModel } from "@/lib/voxel/model";
import { cssColour } from "@/lib/voxel/palette";
import type { Tool } from "./tools";

// Le modèle raisonne en Z vertical, comme l'imprimante et le format 3MF. On aligne la
// scène dessus plutôt que de traduire les axes à chaque aller-retour.
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

/** Vue de trois quarts, environ 32° au-dessus de l'horizon. */
const VIEW_DIRECTION = new THREE.Vector3(0.9, -1.25, 0.95).normalize();

const HIGHLIGHT = new THREE.Color("#FF4D4D");

export interface SceneProps {
  model: VoxelModel;
  highlighted: ReadonlySet<VoxelKey>;
  tool: Tool;
  voxelMm: number;
  /** Change de valeur quand un nouveau modèle est chargé : la caméra le recadre alors. */
  focusToken: number;
  onPick: (target: VoxelKey, neighbour: VoxelKey) => void;
  onReady: () => void;
}

interface Framing {
  center: THREE.Vector3;
  radius: number;
}

function framing(model: VoxelModel): Framing {
  if (model.size === 0) return { center: new THREE.Vector3(0.5, 0.5, 0.5), radius: 1 };

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const voxelKey of model.keys()) {
    const position = parseKey(voxelKey);
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], position[axis]);
      max[axis] = Math.max(max[axis], position[axis] + 1);
    }
  }

  return {
    center: new THREE.Vector3(...[0, 1, 2].map((axis) => (min[axis] + max[axis]) / 2)),
    radius: Math.max(...[0, 1, 2].map((axis) => max[axis] - min[axis])) / 2,
  };
}

/**
 * Recadre la caméra sur le modèle au chargement d'une création.
 *
 * La caméra vise toujours le centre du modèle : le rayon passant par le centre de l'écran
 * touche donc forcément un bloc, ce qui rend le clic central déterministe pour les tests
 * comme pour l'enfant.
 */
function CameraRig({ model, focusToken }: { model: VoxelModel; focusToken: number }) {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as
    | (THREE.EventDispatcher & { target: THREE.Vector3; update: () => void })
    | null;

  useEffect(() => {
    const { center, radius } = framing(model);
    const distance = Math.max(8, radius * 5);

    camera.position.copy(center).addScaledVector(VIEW_DIRECTION, distance);
    camera.up.set(0, 0, 1);
    camera.lookAt(center);

    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
    // Volontairement piloté par focusToken seul : recadrer à chaque bloc posé
    // arracherait la vue des mains de l'enfant en pleine construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusToken, camera, controls]);

  return null;
}

/** Le plateau réel de la X1C, à l'échelle : la limite physique doit se voir. */
function Plate({ voxelMm }: { voxelMm: number }) {
  const side = PLATE_MM / voxelMm;

  return (
    <group position={[0.5, 0.5, 0]}>
      <mesh position={[0, 0, -0.03]} receiveShadow>
        <boxGeometry args={[side, side, 0.06]} />
        <meshLambertMaterial color="#20272e" />
      </mesh>
      <gridHelper
        args={[side, Math.round(side), "#3d4a56", "#2b343d"]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

function Voxels({
  model,
  tool,
  onPick,
}: {
  model: VoxelModel;
  tool: Tool;
  onPick: SceneProps["onPick"];
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const keys = useMemo(() => [...model.keys()], [model]);

  // La capacité d'un InstancedMesh est fixée à la construction : on la fait croître par
  // puissances de deux pour ne recréer l'objet que rarement.
  const capacity = useMemo(() => Math.max(1024, 2 ** Math.ceil(Math.log2(keys.length + 1))), [keys]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const colour = new THREE.Color();

    keys.forEach((voxelKey, index) => {
      const [x, y, z] = parseKey(voxelKey);
      matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, colour.set(cssColour(model.get(voxelKey) ?? 0)));
    });

    mesh.count = keys.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [keys, model, capacity]);

  const handlePick = (event: ThreeEvent<MouseEvent>) => {
    if (tool === "orbit" || event.instanceId === undefined || !event.face) return;
    event.stopPropagation();

    const target = keys[event.instanceId];
    if (!target) return;

    // Les instances ne sont que translatées : la normale locale de la face du cube est
    // donc déjà la normale monde, et désigne directement la cellule voisine.
    const [x, y, z] = parseKey(target);
    const normal = event.face.normal;
    const neighbour = key(
      x + Math.round(normal.x),
      y + Math.round(normal.y),
      z + Math.round(normal.z),
    );

    onPick(target, neighbour);
  };

  return (
    <instancedMesh
      key={capacity}
      ref={meshRef}
      args={[undefined, undefined, capacity]}
      onPointerDown={handlePick}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

/** Cage rouge translucide autour des blocs problématiques, couleur d'origine préservée. */
function Highlights({ highlighted }: { highlighted: ReadonlySet<VoxelKey> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const keys = useMemo(() => [...highlighted], [highlighted]);
  const capacity = useMemo(() => Math.max(256, 2 ** Math.ceil(Math.log2(keys.length + 1))), [keys]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    keys.forEach((voxelKey, index) => {
      const [x, y, z] = parseKey(voxelKey);
      matrix.makeScale(1.12, 1.12, 1.12).setPosition(x + 0.5, y + 0.5, z + 0.5);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.count = keys.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [keys, capacity]);

  return (
    <instancedMesh key={capacity} ref={meshRef} args={[undefined, undefined, capacity]} raycast={() => null}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={HIGHLIGHT} transparent opacity={0.35} depthWrite={false} />
    </instancedMesh>
  );
}

export default function Scene({
  model,
  highlighted,
  tool,
  voxelMm,
  focusToken,
  onPick,
  onReady,
}: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 45, near: 0.1, far: 4000 }}
      onCreated={onReady}
      style={{ touchAction: "none" }}
    >
      <color attach="background" args={["#11161b"]} />
      <hemisphereLight intensity={0.55} groundColor="#0d1117" />
      <directionalLight position={[12, -18, 26]} intensity={1.5} castShadow />

      <Plate voxelMm={voxelMm} />
      <Voxels model={model} tool={tool} onPick={onPick} />
      <Highlights highlighted={highlighted} />

      <CameraRig model={model} focusToken={focusToken} />
      <OrbitControls
        makeDefault
        enableDamping
        // Le clic gauche est réservé aux outils, sauf quand l'enfant choisit « Tourner ».
        mouseButtons={{
          LEFT: tool === "orbit" ? THREE.MOUSE.ROTATE : undefined,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
    </Canvas>
  );
}
