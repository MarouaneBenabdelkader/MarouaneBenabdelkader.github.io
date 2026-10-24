"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import { easing } from "maath";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BookTheme, SheetFaces } from "./pages";
import { CHAPTERS, departure, fanAt, lanternAngle, leafAngle, LEAVES, phaseAt, smooth, spiralFacing, spiralPoint, SPIRAL_FRONT, SPIRAL_RADIUS, SPIRAL_RISE, SPIRAL_STEP, type Phase } from "./story";
import { BEND_SHAPE, OPEN_SHAPE, PAGE_HEIGHT, PAGE_WIDTH, PAGE_SEGMENTS, TURN_BEND, boneTwist, bowFactor, bowOverTurn, sheetHeight, togetherDelay } from "./stack";

/**
 * A book of skinned pages. Each page is a thin box split into segments, with one bone per
 * segment. A turn follows one eased arc: the page lifts off its stack, its free edge leads while
 * the paper bows behind it, and it lays down flat on the other side. Covers are rigid boards whose
 * engraved lines glow from a separate mask. The book floats among drifting motes, rises into view
 * on load, and light spills from between the pages when it opens. Both themes share the scene;
 * only the pages, lights and motes change.
 */

const PAGE_DEPTH = 0.0045;
// Covers are boards: thicker than paper, growing outward so their inner face stays on the stack.
const BOARD_DEPTH = 0.016;
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

/** A cover's geometry: the page's, thickened on its outer side (+z for the front, -z for the back). */
function board(outward: 1 | -1) {
  const g = geometry.clone();
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    if (Math.sign(z) === outward) pos.setZ(i, z + outward * BOARD_DEPTH);
  }
  g.computeVertexNormals();
  return g;
}
const frontBoard = board(1);
const backBoard = board(-1);

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
  /** The scroll story (lantern and chapters), shared by the whole scene. */
  phase: React.RefObject<Phase>;
  motion: Motion;
  onPick: (page: number) => void;
};

function Page({ number, faces, page, sheets, stiff, theme, opening, delay, inFlight, phase, motion, onPick }: PageProps) {
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
    const m = new THREE.SkinnedMesh(stiff ? (number === 0 ? frontBoard : backBoard) : geometry, [] as THREE.Material[]);
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    // Skinned meshes cache their bounds from the first pose; give them one that covers every
    // pose so clicks keep hitting the page once it lies flat.
    m.boundingSphere = new THREE.Sphere(new THREE.Vector3(), PAGE_WIDTH * 2);
    m.add(bones[0]);
    m.bind(new THREE.Skeleton(bones));
    return m;
    // A page never changes number or kind, so its mesh is made once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // In the lantern, every sheet swings round to its place in the circle instead.
    const L = phase.current.lantern;
    // This sheet's own share of the opening: the front cover leads, the pages behind cascade after.
    const fan = fanAt(L, 1 - number / (sheets - 1));
    // Once, after the book has risen: the closed cover lifts a little, as if something inside
    // stirred, and settles back.
    const t = state.clock.elapsedTime;
    const ajar = number === 0 && page === 0 && motion.turnMs > 1 ? 0.22 * Math.sin(Math.PI * smooth(t, 4.4, 6.4)) * (1 - L) : 0;
    const total = THREE.MathUtils.lerp(Math.PI / 2 - Math.PI * eased + open * THREE.MathUtils.degToRad(number * 0.2), lanternAngle(number, sheets), fan) - ajar;
    // Book-local x points at the camera: lift each sheet to its place in its stack, and raise it
    // off the stack while it travels. In the lantern the sheets all meet at the spine.
    group.current.position.x = sheetHeight(number, sheets, eased, arc) * (1 - L);

    const bones = mesh.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const node = i === 0 ? group.current : bones[i];
      // Rest shape: closed, the whole turn is at the spine; open, part of it is spread over the
      // first few segments, so the page leaves the spine at an angle and then lies flat.
      const share = THREE.MathUtils.lerp(i === 0 ? 1 : 0, OPEN_SHAPE[i], open);
      // While turning, the free edge leads and the paper bows behind it.
      const bend = stiff ? 0 : -dir * TURN_BEND * BEND_SHAPE[i] * bowOverTurn(journey) * bowAmount.current * (1 - L);
      // Swinging round into the lantern, the paper flexes against the air and straightens on arrival.
      const flex = stiff ? 0 : -0.25 * TURN_BEND * BEND_SHAPE[i] * Math.sin(Math.PI * fan);
      node.rotation.y = total * share + bend + flex;
      node.rotation.x = stiff ? 0 : dir * boneTwist(i, arc) * bowAmount.current * (1 - L);
    }

    const mats = mesh.material as THREE.MeshStandardMaterial[];
    const pulse = motion.turnMs > 1 ? Math.sin(t * 1.3) * 0.35 : 0;
    // The engraving kindles on arrival: dark while the book rises, then lit with a brief surge.
    const kindle = motion.turnMs > 1 ? smooth(t, 2.4, 3.8) * (1 + 0.8 * Math.sin(Math.PI * smooth(t, 3.2, 4.8))) : 1;
    [faces.frontGlow, faces.backGlow].forEach((mask, i) => {
      // A travelling page catches a little more light at the top of its arc.
      // Lit from inside, the lantern's pages glow a little brighter.
      const target = mask ? (COVER_GLOW + pulse) * kindle + (hovered ? 0.7 : 0) : glow + arc * 0.12 + L * 0.2 + (hovered ? 0.07 : 0);
      easing.damp(mats[4 + i], "emissiveIntensity", target, 0.25, delta);
    });
  });

  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Pages only turn while it is still a book; the lantern and chapters are scrolled through.
    if (phase.current.lantern > 0.01) return;
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

function Book({ faces, page, together, theme, phase, motion, onPick }: { faces: FaceTextures[]; page: number; together: boolean; theme: BookTheme; phase: React.RefObject<Phase>; motion: Motion; onPick: (p: number) => void }) {
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
  const core = useRef<THREE.PointLight>(null!);
  const coreGlow = useRef<THREE.MeshBasicMaterial>(null!);
  const spin = useRef(0);
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
    // In the lantern the spine is centred, the lantern tips back to show its glowing top and
    // turns slowly on its own.
    const { lantern: L, chapters: C, travel, through } = phase.current;
    // The lantern turns slowly; kept within one turn and weighted by how open the lantern is, so
    // the book always comes back facing the reader when the lantern closes. On the passage it
    // whirls, so its pages stream round the reader as they fly through.
    if (!still) spin.current = (spin.current + delta * (0.22 + 2.4 * travel) * L) % (2 * Math.PI);
    const turned = (spin.current > Math.PI ? spin.current - 2 * Math.PI : spin.current) * L;
    // The passage: the lantern turns its spine toward the reader and comes at them, faster and
    // faster, until they are through it, down a tunnel of its pages, and out past the back.
    const dive = smooth(through, 0.08, 0.8);
    rig.current.visible = through < 0.92;
    const pass = (state.camera.position.z + PAGE_HEIGHT) * dive ** 1.7;
    easing.damp3(rig.current.position, [x * (1 - L), bob * (1 - dive) - 0.3 * dive, pass], through > 0 ? 0.1 : 1.1, delta);
    const sway = still ? 0 : Math.sin(t * 0.35);
    const rot: [number, number, number] = open
      ? [-0.18 - py * 0.05, px * 0.09, 0]
      : [-0.1 - py * 0.14, sway * 0.22 + px * 0.3, still ? 0 : Math.sin(t * 0.5) * 0.03];
    const lanternRot: [number, number, number] = [
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(rot[0], -0.62 - py * 0.05, L), -Math.PI / 2, smooth(through, 0, 0.4)),
      rot[1] * (1 - L) + turned,
      rot[2] * (1 - L),
    ];
    easing.dampE(rig.current.rotation, lanternRot, through > 0 ? 0.2 : open ? 0.8 : 1.1, delta);
    // The lantern's light, flaring as the reader nears its heart, dimming once they are through.
    const lamp = L * (1 - 0.6 * C) * (1 + 1.5 * travel) * (still ? 1 : 1 + Math.sin(t * 1.6) * 0.08);
    core.current.intensity = lamp * 3.2;
    coreGlow.current.opacity = lamp;

    flash.current = Math.max(0, flash.current - delta * 0.9);
    const glow = open ? 0.55 + (still ? 0 : Math.sin(t * 1.7) * 0.12) + flash.current * 1.6 : flash.current * 1.2;
    easing.damp(spill.current, "intensity", glow, 0.3, delta);
  });

  return (
    <group ref={rig}>
      {/* Light rising out of the open pages. */}
      <pointLight ref={spill} position={[0, 0.25, 1.1]} color="#8ff0e2" intensity={0} distance={3.5} decay={1.4} />
      {/* The lantern's light, along the spine at its heart. */}
      <pointLight ref={core} color={theme === "dark" ? "#8ff0e2" : "#ffb35c"} intensity={0} distance={4} decay={1.2} />
      <mesh>
        <cylinderGeometry args={[0.014, 0.014, PAGE_HEIGHT * 0.96, 12]} />
        <meshBasicMaterial ref={coreGlow} color={theme === "dark" ? "#c8fff6" : "#fff1d6"} transparent opacity={0} toneMapped={false} />
      </mesh>
      <group rotation-y={-Math.PI / 2}>
        <Leaves phase={phase} theme={theme} />
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
            phase={phase}
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
function Fit({ page, sheets, phase, still }: { page: number; sheets: number; phase: React.RefObject<Phase>; still: boolean }) {
  const { camera, size } = useThree();
  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    // On the passage into the experience the view widens a little, the way speed stretches it.
    const fov = 32 + (still ? 0 : 9 * phase.current.travel);
    // And it banks a little, one way then back, as if taking the tunnel's curve.
    cam.rotation.z = still ? 0 : 0.05 * Math.sin(2 * Math.PI * phase.current.through);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    const v = THREE.MathUtils.degToRad(cam.fov / 2);
    const aspect = size.width / size.height;
    const portrait = aspect < 0.85;
    const open = page > 0 && page < sheets;
    const width = portrait ? PAGE_WIDTH * 1.2 : PAGE_WIDTH * 2 + 0.3;
    const byWidth = width / 2 / (Math.tan(v) * aspect);
    const byHeight = (PAGE_HEIGHT + 0.5) / 2 / Math.tan(v);
    // The open lantern is wider than the book: pull back to show all of it.
    easing.damp(cam.position, "z", Math.max(byWidth, byHeight) * (1 + 0.55 * phase.current.lantern), 0.4, delta);
    easing.damp(cam.position, "x", portrait && open && phase.current.lantern < 0.5 ? PAGE_WIDTH * 0.42 : 0, 0.6, delta);
  });
  return null;
}

export default function BookScene({
  canvases,
  page,
  together = false,
  theme,
  story,
  motion,
  onPick,
  onOpen,
  journey,
  years,
  clickable,
}: {
  canvases: SheetFaces[];
  page: number;
  /** Move every sheet at once (closing or reopening the book) instead of one by one. */
  together?: boolean;
  theme: BookTheme;
  /** How far the reader has scrolled through the book's section, 0 to 1. */
  story: React.RefObject<number>;
  motion: Motion;
  onPick: (p: number) => void;
  /** A stop's page on the spiral was clicked. */
  onOpen: (stop: number) => void;
  /** The journey cards on the spiral, one canvas per stop. */
  journey: HTMLCanvasElement[];
  /** The year each stop began, marked on the thread under its page. */
  years: string[];
  /** Which stops respond to a click. */
  clickable: boolean[];
}) {
  const still = motion.turnMs <= 1;
  const dark = theme === "dark";
  const phase = useRef<Phase>(phaseAt(0));
  // Phones get fewer motes, to spare their GPUs.
  const motes = useMemo(() => (window.matchMedia("(pointer: coarse)").matches ? 0.5 : 1), []);
  return (
    <Canvas
      shadows
      flat
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4.5], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => (document.body.style.cursor = "")}
    >
      <StoryClock story={story} phase={phase} still={still} />
      <Halo still={still} theme={theme} />
      <Textures canvases={canvases}>
        {(faces) => (
          <World phase={phase}>
            <Book faces={faces} page={page} together={together} theme={theme} phase={phase} motion={motion} onPick={onPick} />
            <Constellation journey={journey} years={years} clickable={clickable} phase={phase} theme={theme} onOpen={onOpen} />
          </World>
        )}
      </Textures>
      <ambientLight intensity={dark ? 0.55 : 1.05} />
      <directionalLight position={[1.6, 3.6, 3]} intensity={dark ? 0.85 : 1.1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      {/* Cool rim light from behind picks out the book's edges against the dark. */}
      <directionalLight position={[-2.5, 1.5, -3]} intensity={dark ? 1.6 : 0.8} color="#41c7b6" />
      {/* Motes: glowing on the night stage, darker flecks drifting in the light one. */}
      <Sparkles count={Math.round(70 * motes)} scale={[6, 3.6, 2.4]} size={2.2} speed={still ? 0 : 0.25} opacity={dark ? 0.55 : 0.45} color={dark ? "#6fe6d6" : "#0b8a7c"} />
      <Sparkles count={Math.round(16 * motes)} scale={[5, 3, 2]} size={3.2} speed={still ? 0 : 0.18} opacity={dark ? 0.7 : 0.55} color={dark ? "#f0b44c" : "#b26b00"} />
      <ContactShadows position={[0, -0.95, 0]} opacity={dark ? 0.75 : 0.3} scale={5} blur={3} far={2.2} />
      {!still && <Warp phase={phase} theme={theme} />}
      <Fit page={page} sheets={canvases.length} phase={phase} still={still} />
    </Canvas>
  );
}

const STREAKS = 140;
const DRIFT = 36;

/** A soft round burst of light, for the moment the reader passes the lantern's heart. */
function burstTexture(dark: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  const rgb = dark ? "200,255,246" : "255,250,238";
  g.addColorStop(0, `rgba(${rgb},1)`);
  g.addColorStop(0.5, `rgba(${rgb},0.55)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/** A loose leaf: a small sheet of the book's paper with a ruled border and a few lines of text. */
function leafTexture(dark: boolean) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 172;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = dark ? "#0f2420" : "#fbf8f2";
  ctx.fillRect(0, 0, 128, 172);
  ctx.strokeStyle = dark ? "rgba(111,230,214,0.85)" : "rgba(11,138,124,0.7)";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 112, 156);
  ctx.fillStyle = dark ? "rgba(143,240,226,0.55)" : "rgba(19,33,31,0.35)";
  ctx.fillRect(20, 26, 60, 9);
  for (let i = 0; i < 7; i++) ctx.fillRect(20, 52 + i * 14, i % 3 === 2 ? 56 : 88, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The passage from the book into the experience. The lantern itself becomes the tunnel (see
 * Book); around it, loose leaves swirl past the reader, streaks of light rush out of the depth,
 * and light bursts as the reader passes the lantern's heart. Nothing is drawn outside the passage.
 */
function Warp({ phase, theme }: { phase: React.RefObject<Phase>; theme: BookTheme }) {
  const dark = theme === "dark";
  const root = useRef<THREE.Group>(null!);
  const lines = useRef<THREE.LineSegments>(null!);
  const mat = useRef<THREE.LineBasicMaterial>(null!);
  const leaves = useRef<THREE.InstancedMesh>(null!);
  const burst = useRef<THREE.Mesh>(null!);
  const burstMat = useRef<THREE.MeshBasicMaterial>(null!);
  const leaf = useMemo(() => new THREE.PlaneGeometry(0.2, 0.27), []);
  useEffect(() => () => leaf.dispose(), [leaf]);
  const burstMap = useMemo(() => burstTexture(dark), [dark]);
  useEffect(() => () => burstMap.dispose(), [burstMap]);
  const leafMap = useMemo(() => leafTexture(dark), [dark]);
  useEffect(() => () => leafMap.dispose(), [leafMap]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { geometry, seeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(STREAKS * 6), 3));
    // Fixed per streak: direction around the axis, distance from it, start depth, speed.
    const seeds = Array.from({ length: STREAKS }, (_, i) => {
      const r = (i * 0.618034) % 1;
      return { a: i * 2.39996, d: 0.5 + 2.6 * Math.sqrt(r), z: (i * 0.37) % 1, v: 0.7 + 0.6 * ((i * 0.7548) % 1) };
    });
    return { geometry: g, seeds };
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const run = useRef(0);
  useFrame((state, delta) => {
    const { travel: t, through } = phase.current;
    root.current.visible = t > 0.01;
    if (!root.current.visible) return;
    run.current += delta * (0.25 + 1.6 * t);
    const cam = state.camera.position;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const DEPTH = 14;
    for (let i = 0; i < STREAKS; i++) {
      const s = seeds[i];
      // Each streak travels from far behind the stage to just past the camera, then starts over.
      const k = (s.z + run.current * s.v) % 1;
      const z = cam.z - DEPTH + k * DEPTH;
      const len = (0.08 + 2.2 * t) * (0.4 + k);
      const x = cam.x + Math.cos(s.a) * s.d * (0.6 + 0.6 * k);
      const y = cam.y + Math.sin(s.a) * s.d * (0.6 + 0.6 * k);
      pos.setXYZ(i * 2, x, y, z);
      pos.setXYZ(i * 2 + 1, x, y, z - len);
    }
    pos.needsUpdate = true;
    mat.current.opacity = Math.min(1, t * 1.3) * (dark ? 0.5 : 0.4);

    // Loose leaves spiral round the reader's path and tumble past, once they are inside.
    for (let i = 0; i < DRIFT; i++) {
      const k = (((i * 0.53) % 1) + run.current * (0.45 + 0.35 * ((i * 0.31) % 1))) % 1;
      const turn = i * 2.39996 + run.current * 1.4;
      const d = 0.55 + 1.7 * ((i * 0.618034) % 1);
      dummy.position.set(cam.x + Math.cos(turn) * d, cam.y + Math.sin(turn) * d, cam.z - 9 + k * 9.4);
      dummy.rotation.set(run.current * 2.1 + i, run.current * 1.3 + i * 0.7, turn);
      dummy.scale.setScalar(Math.min(1, t * 1.6) * smooth(through, 0.3, 0.6) * (0.6 + 0.6 * ((i * 0.77) % 1)));
      dummy.updateMatrix();
      leaves.current.setMatrixAt(i, dummy.matrix);
    }
    leaves.current.instanceMatrix.needsUpdate = true;

    // The burst, just in front of the reader, peaking as they cross the lantern's heart.
    burst.current.position.set(cam.x, cam.y, cam.z - 1);
    burstMat.current.opacity = Math.exp(-(((through - 0.62) / 0.11) ** 2)) * (dark ? 0.5 : 0.75);
  });
  return (
    <group ref={root} visible={false}>
      <mesh ref={burst} renderOrder={4}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial
          ref={burstMat}
          map={burstMap}
          transparent
          opacity={0}
          depthTest={false}
          depthWrite={false}
          blending={dark ? THREE.AdditiveBlending : THREE.NormalBlending}
          toneMapped={false}
        />
      </mesh>
      <instancedMesh ref={leaves} args={[leaf, undefined, DRIFT]} frustumCulled={false}>
        <meshBasicMaterial map={leafMap} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <lineSegments ref={lines} geometry={geometry} frustumCulled={false} renderOrder={3}>
        <lineBasicMaterial
          ref={mat}
          color={dark ? "#9ff5ea" : "#0b8a7c"}
          transparent
          opacity={0}
          blending={dark ? THREE.AdditiveBlending : THREE.NormalBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

/** Turns the raw scroll position into the story's phase each frame, smoothed so it glides. */
function StoryClock({ story, phase, still }: { story: React.RefObject<number>; phase: React.RefObject<Phase>; still: boolean }) {
  const s = useRef(story.current);
  useFrame((_, delta) => {
    if (still) s.current = story.current;
    else easing.damp(s, "current", story.current, 0.22, delta);
    phase.current = phaseAt(s.current);
  });
  return null;
}

/**
 * Blank leaves that fill the lantern's circle between the real sheets, so it reads as a full fan
 * of paper. Hidden while the book is closed (they would sit inside it).
 */
function Leaves({ phase, theme }: { phase: React.RefObject<Phase>; theme: BookTheme }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(PAGE_WIDTH * 0.97, PAGE_HEIGHT * 0.97);
    g.translate((PAGE_WIDTH * 0.97) / 2, 0, 0);
    return g;
  }, []);
  const material = useMemo(
    () =>
      theme === "dark"
        ? new THREE.MeshStandardMaterial({ color: "#0c1614", emissive: "#2a8c80", emissiveIntensity: 0.12, side: THREE.DoubleSide, roughness: 0.9, transparent: true, depthWrite: false })
        : new THREE.MeshStandardMaterial({ color: "#f6f2ea", emissive: "#ffcf8a", emissiveIntensity: 0.1, side: THREE.DoubleSide, roughness: 0.9, transparent: true, depthWrite: false }),
    [theme],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const L = phase.current.lantern;
    ref.current.visible = L > 0.015;
    if (!ref.current.visible) return;
    for (let j = 0; j < LEAVES; j++) {
      dummy.rotation.set(0, leafAngle(j, L), 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(j, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    // Fainter once the chapters have left, so the lantern recedes behind them.
    material.opacity = Math.min(0.55, L * 4) * (1 - 0.7 * smooth(phase.current.chapters, 0, 0.12));
  });
  return <instancedMesh ref={ref} args={[geometry, material, LEAVES]} frustumCulled={false} />;
}

/**
 * Frames the scene: once the chapters leave, everything shifts so the spiral's front sits beside
 * the chapter panel (left of centre on wide screens, above the panel on phones). The view never
 * travels; the spiral turns instead.
 */
function World({ phase, children }: { phase: React.RefObject<Phase>; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const { size } = useThree();
  useFrame((_, delta) => {
    const k = smooth(phase.current.chapters, 0, 0.1);
    const portrait = size.width / size.height < 0.85;
    const [ox, oy] = portrait ? [0, 0.62] : [-0.55, -0.12];
    easing.damp3(ref.current.position, [k * ox, k * oy, 0], 0.35, delta);
  });
  return <group ref={ref}>{children}</group>;
}

const CARD_W = 1.5;
const CARD_H = CARD_W / 0.7485;
// Where a stop's page comes from: far ahead, the way the reader is travelling.
const ARRIVE_FROM = new THREE.Vector3(0, 0.35, -9);
// Ends of the thread, in spiral steps before the first stop and after the last.
const THREAD_FROM = -0.6;
const THREAD_TO = CHAPTERS + 0.6;

/** A loose page: its side edges curl gently back, the way a sheet out of a binding never lies flat. */
const cardGeometry = (() => {
  const g = new THREE.PlaneGeometry(CARD_W, CARD_H, 24, 1);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) / (CARD_W / 2);
    pos.setZ(i, -0.07 * u * u);
  }
  g.computeVertexNormals();
  return g;
})();

/** A soft shadow under a loose page, as a blurred dark sheet. */
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.filter = "blur(18px)";
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(40, 40, 176, 240);
  return new THREE.CanvasTexture(c);
}

/** A year drawn as a small label for the thread. */
function yearTexture(year: string, dark: boolean) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  const font = getComputedStyle(document.documentElement).getPropertyValue("--font-bricolage").trim() || "sans-serif";
  ctx.font = `700 56px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (dark) {
    ctx.shadowColor = "rgba(65,199,182,0.8)";
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = dark ? "#dffcf7" : "#0b4f47";
  ctx.fillText(year, 128, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The journey on its spiral. Each stop's page leaves the lantern along an arc to its place,
 * turning to face the reader as it goes; scrolling then turns the spiral so each stop swings to
 * the front in turn. The thread through them is the time axis: lit up to where the reader is,
 * faint beyond, with each stop's year marked at its node. The page in front is bright and the
 * others dim, so one stop holds the eye at a time.
 */
function Constellation({
  journey,
  years,
  clickable,
  phase,
  theme,
  onOpen,
}: {
  journey: HTMLCanvasElement[];
  years: string[];
  clickable: boolean[];
  phase: React.RefObject<Phase>;
  theme: BookTheme;
  onOpen: (chapter: number) => void;
}) {
  const dark = theme === "dark";
  const cards = useRef<(THREE.Mesh | null)[]>([]);
  const shadows = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const labels = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const spiral = useRef<THREE.Group>(null!);
  const threadMat = useRef<THREE.MeshBasicMaterial>(null!);
  const litMat = useRef<THREE.MeshBasicMaterial>(null!);
  const target = useMemo(() => new THREE.Vector3(), []);
  const gl = useThree((s) => s.gl);
  // Phones show the panel under the page, so the pages are a little smaller there.
  const size = useThree((s) => s.size);
  const fit = size.width / size.height < 0.85 ? 0.8 : 1;
  const maps = useMemo(
    () =>
      journey.map((c) => {
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = gl.capabilities.getMaxAnisotropy();
        return t;
      }),
    [journey, gl],
  );
  useEffect(() => () => maps.forEach((t) => t.dispose()), [maps]);
  const shadow = useMemo(shadowTexture, []);
  useEffect(() => () => shadow.dispose(), [shadow]);
  const yearMaps = useMemo(() => years.map((y) => yearTexture(y, dark)), [years, dark]);
  useEffect(() => () => yearMaps.forEach((t) => t.dispose()), [yearMaps]);

  // The thread is built once around the spiral's axis at focus 0; turning and raising the group
  // by the focus moves it exactly as spiralPoint moves the pages. Two tubes share the curve: a
  // faint one for the whole path and a brighter, thicker one for the part already travelled.
  const { thread, lit, count, litCount } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let t = THREAD_FROM; t <= THREAD_TO; t += 0.05) {
      const a = -t * SPIRAL_STEP;
      pts.push(new THREE.Vector3(SPIRAL_RADIUS * Math.sin(a), -t * SPIRAL_RISE - CARD_H * 0.55, SPIRAL_RADIUS * Math.cos(a)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const thread = new THREE.TubeGeometry(curve, 600, 0.007, 6);
    const lit = new THREE.TubeGeometry(curve, 600, 0.014, 8);
    return { thread, lit, count: thread.index?.count ?? 0, litCount: lit.index?.count ?? 0 };
  }, []);
  useEffect(
    () => () => {
      thread.dispose();
      lit.dispose();
    },
    [thread, lit],
  );

  useFrame((state, delta) => {
    const p = phase.current;
    const f = p.focus;
    spiral.current.position.set(0, f * SPIRAL_RISE, SPIRAL_FRONT - SPIRAL_RADIUS);
    spiral.current.rotation.y = f * SPIRAL_STEP;
    const along = (t: number) => Math.min(1, Math.max(0, (t - THREAD_FROM) / (THREAD_TO - THREAD_FROM)));
    // The faint thread runs a little ahead of the reader; the lit one stops where they are.
    thread.setDrawRange(0, p.chapters > 0 ? Math.floor(count * along(f + 1.8)) : 0);
    lit.setDrawRange(0, p.chapters > 0 ? Math.floor(litCount * along(f)) : 0);
    const shown = p.chapters > 0.01 ? 1 : 0;
    easing.damp(threadMat.current, "opacity", shown * (dark ? 0.3 : 0.32), 0.3, delta);
    easing.damp(litMat.current, "opacity", shown * (dark ? 0.95 : 0.85), 0.3, delta);

    for (let i = 0; i <= CHAPTERS; i++) {
      // Nodes and years: bright once reached, faint ahead, fading once well behind.
      const reached = smooth(f - i, -0.6, -0.05);
      const node = nodes.current[i];
      if (node) {
        (node.material as THREE.MeshBasicMaterial).opacity = Math.min(1, threadMat.current.opacity * (1.4 + 1.8 * reached));
        node.scale.setScalar(1 + 0.6 * reached * (1 - Math.min(1, Math.abs(f - i))));
      }
      const label = labels.current[i];
      if (label) label.opacity = shown * (0.25 + 0.75 * reached) * (1 - 0.6 * smooth(f - i, 1, 2.5)) * Math.min(1, threadMat.current.opacity * 4);
    }

    for (let i = 0; i < CHAPTERS; i++) {
      const card = cards.current[i];
      if (!card) continue;
      const d = departure(i, p);
      card.visible = d > 0.002;
      if (!card.visible) continue;
      const e = 1 - (1 - d) ** 3;
      target.set(...spiralPoint(i, f));
      // Out of the depth along a shallow arc, then on the spiral; the page in front leans out a little.
      const away = Math.abs(f - i);
      const front = 1 - Math.min(1, away);
      card.position.lerpVectors(ARRIVE_FROM, target, e);
      card.position.y += Math.sin(d * Math.PI) * 0.2;
      card.position.z += 0.12 * front * e;
      card.scale.setScalar(fit * (0.35 + 0.65 * e) * (1 - Math.min(0.3, away * 0.12)));
      const drift = Math.sin(state.clock.elapsedTime * 0.5 + i);
      card.rotation.set(drift * 0.015, THREE.MathUtils.lerp(0.6, spiralFacing(i, f), e) + drift * 0.02, 0);
      // Brightest at the front; the others dim and darken, passed ones fastest.
      const passed = smooth(f - i, 0.5, 1.6);
      const mat = card.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(1, d * 3) * (1 - Math.min(0.5, away * 0.25)) * (1 - 0.85 * passed);
      mat.color.setScalar(1 - Math.min(0.55, away * 0.5));
      const sh = shadows.current[i];
      if (sh) sh.opacity = mat.opacity * (dark ? 0.7 : 0.35);
    }
  });

  return (
    <group>
      <group ref={spiral}>
        <mesh geometry={thread} frustumCulled={false}>
          <meshBasicMaterial ref={threadMat} color={dark ? "#6fe6d6" : "#0b8a7c"} transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh geometry={lit} frustumCulled={false}>
          <meshBasicMaterial
            ref={litMat}
            color={dark ? "#8ff0e2" : "#076a5f"}
            transparent
            opacity={0}
            blending={dark ? THREE.AdditiveBlending : THREE.NormalBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {Array.from({ length: CHAPTERS + 1 }, (_, i) => {
          const a = -i * SPIRAL_STEP;
          const at: [number, number, number] = [SPIRAL_RADIUS * Math.sin(a), -i * SPIRAL_RISE - CARD_H * 0.55, SPIRAL_RADIUS * Math.cos(a)];
          return (
            <group key={`node-${i}`} position={at}>
              <mesh ref={(m) => void (nodes.current[i] = m)}>
                <sphereGeometry args={[i === CHAPTERS ? 0.05 : 0.035, 16, 16]} />
                <meshBasicMaterial color={dark ? "#f0b44c" : "#b26b00"} transparent opacity={0} toneMapped={false} depthWrite={false} />
              </mesh>
              {yearMaps[i] && (
                <sprite position={[0, -0.14, 0]} scale={[0.42, 0.1575, 1]}>
                  <spriteMaterial ref={(m) => void (labels.current[i] = m)} map={yearMaps[i]} transparent opacity={0} depthWrite={false} toneMapped={false} />
                </sprite>
              )}
            </group>
          );
        })}
      </group>
      {Array.from({ length: CHAPTERS }, (_, i) => (
        <mesh
          key={`card-${i}`}
          ref={(m) => void (cards.current[i] = m)}
          visible={false}
          renderOrder={2}
          geometry={cardGeometry}
          onClick={(e) => {
            // Only a page that is out on the spiral opens its chapter; otherwise the tap is not
            // for it (it may be meant for the book behind), so let it through.
            if (!clickable[i] || departure(i, phase.current) < 0.5) return;
            e.stopPropagation();
            onOpen(i);
          }}
          onPointerEnter={() => {
            if (clickable[i] && departure(i, phase.current) >= 0.5) document.body.style.cursor = "pointer";
          }}
          onPointerLeave={() => (document.body.style.cursor = "")}
        >
          {/* The stop's page, drawn over the thread so the thread passes behind it. */}
          <meshBasicMaterial map={maps[i] ?? null} transparent side={THREE.DoubleSide} toneMapped={false} depthTest={false} />
          {/* Its shadow, cast down and back as if lit from above the reader. */}
          <mesh position={[0.06, -0.09, -0.12]} scale={1.08} renderOrder={1} raycast={() => null}>
            <planeGeometry args={[CARD_W, CARD_H]} />
            <meshBasicMaterial ref={(m) => void (shadows.current[i] = m)} map={shadow} transparent opacity={0} depthTest={false} depthWrite={false} />
          </mesh>
        </mesh>
      ))}
    </group>
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
