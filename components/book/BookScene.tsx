"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import { easing } from "maath";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BookTheme, SheetFaces } from "./pages";
import { BEND_SHAPE, OPEN_SHAPE, PAGE_HEIGHT, PAGE_WIDTH, PAGE_SEGMENTS, TURN_BEND, boneTwist, bowFactor, bowOverTurn, sheetHeight, togetherDelay } from "./stack";

/**
 * A book of skinned pages. Each page is a thin box split into segments, with one bone per
 * segment. A turn follows one eased arc: the page lifts off its stack, its free edge leads while
 * the paper bows behind it, and it lays down flat on the other side. Covers are rigid boards whose
 * engraved lines glow from a separate mask. The book floats among drifting motes, rises into view
 * on load, and light spills from between the pages when it opens. Both themes share the scene;
 * only the pages, lights and motes change.
 */

const PAGE_DEPTH = 0.003;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;
// Page size, bow, twist and stacking shared with the checks live in stack.ts.
// Pages are partly self-lit from their own texture: strongly on dark paper so the light text
// reads, gently on light paper so it stays white without flattening the shading.
const GLOW_DARK = 0.95;
const GLOW_LIGHT = 0.6;
// The covers' engraved lines: a slow pulse around this strength, brighter under the pointer.
const COVER_GLOW = 1.1;


const geometry = (() => {
  const g = new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, PAGE_SEGMENTS, 2);
  g.translate(PAGE_WIDTH / 2, 0, 0);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  const indices: number[] = [];
  const weights: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const bone = Math.max(0, Math.floor(v.x / SEGMENT_WIDTH));
    const w = (v.x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
    indices.push(bone, bone + 1, 0, 0);
    weights.push(1 - w, w, 0, 0);
  }
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
  return g;
})();

const paperEdgeDark = new THREE.MeshStandardMaterial({ color: "#1d2b28", roughness: 0.9, emissive: "#41c7b6", emissiveIntensity: 0.08 });
const paperEdgeLight = new THREE.MeshStandardMaterial({ color: "#ebe4d6", roughness: 0.9, emissive: "#ebe4d6", emissiveIntensity: 0.2 });
const boardEdge = new THREE.MeshStandardMaterial({ color: "#0b1110", roughness: 0.6 });

export type FaceTextures = { front: THREE.Texture; back: THREE.Texture; frontGlow?: THREE.Texture; backGlow?: THREE.Texture };

export type Motion = { turnMs: number; smooth: number; fold: number };

type PageProps = {
  number: number;
  faces: FaceTextures;
  page: number;
  sheets: number;
  stiff: boolean;
  theme: BookTheme;
  /** How far the book is open, 0 to 1, moving with the cover (shared by every page). */
  opening: React.RefObject<number>;
  /** Milliseconds to wait before setting off, when several sheets turn together. */
  delay: number;
  /** Which sheets are moving or about to, shared by all pages (one flag per sheet). */
  inFlight: React.RefObject<boolean[]>;
  motion: Motion;
  onPick: (page: number) => void;
};

function Page({ number, faces, page, sheets, stiff, theme, opening, delay, inFlight, motion, onPick }: PageProps) {
  const group = useRef<THREE.Group>(null!);
  const opened = page > number;
  // 0 = lying on the right, 1 = lying on the left. It moves at a constant rate and is eased on
  // the way out, so a turn reversed halfway through simply heads back from where it is.
  const progress = useRef(opened ? 1 : 0);
  // When this sheet's turn was asked for, and when it may start (later, if it waits its turn).
  const lastOpened = useRef(opened);
  const startAt = useRef(0);
  // 1 = bows as it turns, 0 = moves flat; eased between the two so the change never snaps.
  const bowAmount = useRef(1);
  const [hovered, setHovered] = useState(false);
  const glow = theme === "dark" ? GLOW_DARK : GLOW_LIGHT;

  // Created once per page and kept: swapping the mesh would leave the renderer's click targets
  // pointing at the old one. New textures or a new theme only replace its materials (below).
  const mesh = useMemo(() => {
    const bones: THREE.Bone[] = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      const bone = new THREE.Bone();
      bone.position.x = i === 0 ? 0 : SEGMENT_WIDTH;
      if (i > 0) bones[i - 1].add(bone);
      bones.push(bone);
    }
    const m = new THREE.SkinnedMesh(geometry, [] as THREE.Material[]);
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    // Skinned meshes cache their bounds from the first pose; give them one that covers every
    // pose so clicks keep hitting the page once it lies flat.
    m.boundingSphere = new THREE.Sphere(new THREE.Vector3(), PAGE_WIDTH * 2);
    m.add(bones[0]);
    m.bind(new THREE.Skeleton(bones));
    return m;
  }, []);

  useLayoutEffect(() => {
    const face = (map: THREE.Texture, mask?: THREE.Texture) =>
      mask
        ? new THREE.MeshStandardMaterial({ map, emissiveMap: mask, emissive: "#ffffff", emissiveIntensity: COVER_GLOW, roughness: 0.55, metalness: 0.15 })
        : new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: "#ffffff", emissiveIntensity: glow, roughness: 0.85 });
    const edge = stiff ? boardEdge : theme === "dark" ? paperEdgeDark : paperEdgeLight;
    const front = face(faces.front, faces.frontGlow);
    const back = face(faces.back, faces.backGlow);
    mesh.material = [edge, edge, edge, edge, front, back];
    return () => {
      front.dispose();
      back.dispose();
    };
  }, [mesh, faces, stiff, theme, glow]);

  useFrame((state, delta) => {
    const dir = opened ? 1 : -1;
    if (lastOpened.current !== opened) {
      lastOpened.current = opened;
      startAt.current = performance.now() + delay;
    }
    if (performance.now() >= startAt.current) {
      progress.current = THREE.MathUtils.clamp(progress.current + (dir * delta * 1000) / motion.turnMs, 0, 1);
    }
    const p = progress.current;
    // Bow only when this is the one sheet in flight; several together move as flat sheets.
    const flights = inFlight.current;
    flights[number] = performance.now() < startAt.current || (p > 0 && p < 1);
    easing.damp(bowAmount, "current", bowFactor(flights.filter(Boolean).length > 1), 0.12, delta);
    const eased = p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
    // How far through a turn the page is: 0 at rest, 1 halfway, where it lifts and bows most.
    const arc = Math.sin(p * Math.PI);
    // How far through its own journey the page is, whichever way it travels.
    const journey = dir > 0 ? p : 1 - p;
    const open = THREE.MathUtils.smoothstep(opening.current, 0.4, 1);

    // Total rotation: +90 degrees lying right, -90 lying left, plus a hair of fan between sheets.
    const total = Math.PI / 2 - Math.PI * eased + open * THREE.MathUtils.degToRad(number * 0.2);
    // Book-local x points at the camera: lift each sheet to its place in its stack, and raise it
    // off the stack while it travels.
    group.current.position.x = sheetHeight(number, sheets, eased, arc);

    const bones = mesh.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const node = i === 0 ? group.current : bones[i];
      // Rest shape: closed, the whole turn is at the spine; open, part of it is spread over the
      // first few segments, so the page leaves the spine at an angle and then lies flat.
      const share = THREE.MathUtils.lerp(i === 0 ? 1 : 0, OPEN_SHAPE[i], open);
      // While turning, the free edge leads and the paper bows behind it.
      const bend = stiff ? 0 : -dir * TURN_BEND * BEND_SHAPE[i] * bowOverTurn(journey) * bowAmount.current;
      node.rotation.y = total * share + bend;
      node.rotation.x = stiff ? 0 : dir * boneTwist(i, arc) * bowAmount.current;
    }

    const mats = mesh.material as THREE.MeshStandardMaterial[];
    const pulse = motion.turnMs > 1 ? Math.sin(state.clock.elapsedTime * 1.3) * 0.35 : 0;
    [faces.frontGlow, faces.backGlow].forEach((mask, i) => {
      // A travelling page catches a little more light at the top of its arc.
      const target = mask ? COVER_GLOW + pulse + (hovered ? 0.7 : 0) : glow + arc * 0.12 + (hovered ? 0.07 : 0);
      easing.damp(mats[4 + i], "emissiveIntensity", target, 0.25, delta);
    });
  });

  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onPick(opened ? number : number + 1);
  };

  return (
    <group ref={group}>
      <primitive
        object={mesh}
        onClick={pick}
        onPointerEnter={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
      />
    </group>
  );
}

/**
 * Steps the displayed page one sheet at a time, so a jump of several pages riffles through them.
 * With `together`, every sheet moves at once instead, which is how a book closes.
 */
function useRiffle(page: number, stepMs: number, together: boolean) {
  const [shown, setShown] = useState(page);
  const last = useRef(0);
  useEffect(() => {
    if (shown === page) return;
    if (together) return setShown(page);
    const wait = Math.max(0, stepMs - (performance.now() - last.current));
    const t = setTimeout(() => {
      last.current = performance.now();
      setShown((s) => s + Math.sign(page - s));
    }, wait);
    return () => clearTimeout(t);
  }, [page, shown, stepMs, together]);
  return shown;
}

function Book({ faces, page, together, theme, motion, onPick }: { faces: FaceTextures[]; page: number; together: boolean; theme: BookTheme; motion: Motion; onPick: (p: number) => void }) {
  const shown = useRiffle(page, motion.turnMs / 6, together);
  // The last move of the displayed page, so sheets turning together can set off in order.
  const prevShown = useRef(shown);
  const move = useRef({ from: shown, to: shown });
  if (prevShown.current !== shown) {
    move.current = { from: prevShown.current, to: shown };
    prevShown.current = shown;
  }
  const rig = useRef<THREE.Group>(null!);
  // Moves at the cover's pace: 0 closed, 1 open. Pages take their open shape from it.
  const opening = useRef(shown > 0 && shown < faces.length ? 1 : 0);
  const inFlight = useRef<boolean[]>([]);
  const spill = useRef<THREE.PointLight>(null!);
  const flash = useRef(0);
  const sheets = faces.length;
  const still = motion.turnMs <= 1;

  // Entrance: the book starts low, tipped back and turned away, then rises and turns to face you.
  useEffect(() => {
    if (still) return;
    rig.current.position.set(-PAGE_WIDTH / 2, -1.6, -0.6);
    rig.current.rotation.set(0.9, -1.2, 0.25);
  }, [still]);

  // Each turn sends a pulse of light out of the spine.
  useEffect(() => {
    flash.current = 1;
  }, [shown]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const open = shown > 0 && shown < sheets;
    // Same constant rate as a cover's turn, so the opening tracks the cover's lift.
    const step = (delta * 1000) / motion.turnMs;
    opening.current = open ? Math.min(1, opening.current + step) : Math.max(0, opening.current - step);
    const { x: px, y: py } = state.pointer;
    // Centre the closed book on screen; an open book is centred on its spine.
    const x = shown === 0 ? -PAGE_WIDTH / 2 : shown === sheets ? PAGE_WIDTH / 2 : 0;
    // Closed, it hovers and sways to show its depth; open, it steadies so the pages can be read.
    const bob = still ? 0 : Math.sin(t * 0.9) * (open ? 0.015 : 0.045);
    easing.damp3(rig.current.position, [x, bob, 0], 1.1, delta);
    const sway = still ? 0 : Math.sin(t * 0.35);
    const rot: [number, number, number] = open
      ? [-0.18 - py * 0.05, px * 0.09, 0]
      : [-0.1 - py * 0.14, sway * 0.22 + px * 0.3, still ? 0 : Math.sin(t * 0.5) * 0.03];
    easing.dampE(rig.current.rotation, rot, open ? 0.8 : 1.1, delta);

    flash.current = Math.max(0, flash.current - delta * 0.9);
    const glow = open ? 0.55 + (still ? 0 : Math.sin(t * 1.7) * 0.12) + flash.current * 1.6 : flash.current * 1.2;
    easing.damp(spill.current, "intensity", glow, 0.3, delta);
  });

  return (
    <group ref={rig}>
      {/* Light rising out of the open pages. */}
      <pointLight ref={spill} position={[0, 0.25, 1.1]} color="#8ff0e2" intensity={0} distance={3.5} decay={1.4} />
      <group rotation-y={-Math.PI / 2}>
        {faces.map((f, i) => (
          <Page
            key={i}
            number={i}
            faces={f}
            page={shown}
            sheets={sheets}
            stiff={i === 0 || i === sheets - 1}
            theme={theme}
            opening={opening}
            delay={together ? togetherDelay(i, move.current.from, move.current.to) : 0}
            inFlight={inFlight}
            motion={motion}
            onPick={onPick}
          />
        ))}
      </group>
    </group>
  );
}

/** A soft teal halo behind the book that breathes, so it seems to give off its own light. */
function Halo({ still, theme }: { still: boolean; theme: BookTheme }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const map = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(65,199,182,0.55)");
    g.addColorStop(0.45, "rgba(65,199,182,0.16)");
    g.addColorStop(1, "rgba(65,199,182,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  useFrame((state) => {
    const base = theme === "dark" ? 0.75 : 0.35;
    mat.current.opacity = base + (still ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * base * 0.25);
  });
  return (
    <mesh position={[0, 0.1, -1.2]} renderOrder={-1}>
      <planeGeometry args={[6.5, 5]} />
      <meshBasicMaterial
        ref={mat}
        map={map}
        transparent
        depthWrite={false}
        blending={theme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </mesh>
  );
}

/**
 * Keeps the book filling the view. On portrait screens an open book is too wide to read, so the
 * camera frames the right-hand page (the text) and lets the illustration show at the edge.
 */
function Fit({ page, sheets }: { page: number; sheets: number }) {
  const { camera, size } = useThree();
  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    const v = THREE.MathUtils.degToRad(cam.fov / 2);
    const aspect = size.width / size.height;
    const portrait = aspect < 0.85;
    const open = page > 0 && page < sheets;
    const width = portrait ? PAGE_WIDTH * 1.2 : PAGE_WIDTH * 2 + 0.3;
    const byWidth = width / 2 / (Math.tan(v) * aspect);
    const byHeight = (PAGE_HEIGHT + 0.5) / 2 / Math.tan(v);
    easing.damp(cam.position, "z", Math.max(byWidth, byHeight), 0.4, delta);
    easing.damp(cam.position, "x", portrait && open ? PAGE_WIDTH * 0.42 : 0, 0.6, delta);
  });
  return null;
}

export default function BookScene({
  canvases,
  page,
  together = false,
  theme,
  motion,
  onPick,
}: {
  canvases: SheetFaces[];
  page: number;
  /** Move every sheet at once (closing or reopening the book) instead of one by one. */
  together?: boolean;
  theme: BookTheme;
  motion: Motion;
  onPick: (p: number) => void;
}) {
  const still = motion.turnMs <= 1;
  const dark = theme === "dark";
  return (
    <Canvas
      shadows
      flat
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4.5], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => (document.body.style.cursor = "")}
    >
      <Halo still={still} theme={theme} />
      <Textures canvases={canvases}>
        {(faces) => <Book faces={faces} page={page} together={together} theme={theme} motion={motion} onPick={onPick} />}
      </Textures>
      <ambientLight intensity={dark ? 0.55 : 1.05} />
      <directionalLight position={[1.6, 3.6, 3]} intensity={dark ? 0.85 : 1.1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      {/* Cool rim light from behind picks out the book's edges against the dark. */}
      <directionalLight position={[-2.5, 1.5, -3]} intensity={dark ? 1.6 : 0.8} color="#41c7b6" />
      {/* Motes: glowing on the night stage, darker flecks drifting in the light one. */}
      <Sparkles count={70} scale={[6, 3.6, 2.4]} size={2.2} speed={still ? 0 : 0.25} opacity={dark ? 0.55 : 0.45} color={dark ? "#6fe6d6" : "#0b8a7c"} />
      <Sparkles count={16} scale={[5, 3, 2]} size={3.2} speed={still ? 0 : 0.18} opacity={dark ? 0.7 : 0.55} color={dark ? "#f0b44c" : "#b26b00"} />
      <ContactShadows position={[0, -0.95, 0]} opacity={dark ? 0.75 : 0.3} scale={5} blur={3} far={2.2} />
      <Fit page={page} sheets={canvases.length} />
    </Canvas>
  );
}

function Textures({ canvases, children }: { canvases: SheetFaces[]; children: (faces: FaceTextures[]) => React.ReactNode }) {
  const gl = useThree((s) => s.gl);
  const faces = useMemo(() => {
    const make = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = gl.capabilities.getMaxAnisotropy();
      return t;
    };
    const maybe = (c?: HTMLCanvasElement) => (c ? make(c) : undefined);
    return canvases.map((f) => ({ front: make(f.front), back: make(f.back), frontGlow: maybe(f.frontGlow), backGlow: maybe(f.backGlow) }));
  }, [canvases, gl]);
  useEffect(
    () => () => faces.forEach((f) => [f.front, f.back, f.frontGlow, f.backGlow].forEach((t) => t?.dispose())),
    [faces],
  );
  return <>{children(faces)}</>;
}
