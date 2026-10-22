"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import { easing } from "maath";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { BookTheme, SheetFaces } from "./pages";
import { CHAPTERS, departure, lanternAngle, leafAngle, LEAVES, phaseAt, smooth, threadAt, threadPoint, type Phase } from "./story";
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
    // In the lantern, every sheet swings round to its place in the circle instead.
    const L = phase.current.lantern;
    const total = THREE.MathUtils.lerp(Math.PI / 2 - Math.PI * eased + open * THREE.MathUtils.degToRad(number * 0.2), lanternAngle(number, sheets), L);
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
      node.rotation.y = total * share + bend;
      node.rotation.x = stiff ? 0 : dir * boneTwist(i, arc) * bowAmount.current * (1 - L);
    }

    const mats = mesh.material as THREE.MeshStandardMaterial[];
    const pulse = motion.turnMs > 1 ? Math.sin(state.clock.elapsedTime * 1.3) * 0.35 : 0;
    [faces.frontGlow, faces.backGlow].forEach((mask, i) => {
      // A travelling page catches a little more light at the top of its arc.
      // Lit from inside, the lantern's pages glow a little brighter.
      const target = mask ? COVER_GLOW + pulse + (hovered ? 0.7 : 0) : glow + arc * 0.12 + L * 0.2 + (hovered ? 0.07 : 0);
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
    const { lantern: L, chapters: C } = phase.current;
    if (!still) spin.current += delta * 0.22 * L;
    // As the chapters leave, the lantern draws back and sinks below the thread.
    const away = smooth(C, 0, 0.12);
    easing.damp3(rig.current.position, [x * (1 - L), bob - 0.9 * away, -1.2 * away], 1.1, delta);
    rig.current.scale.setScalar(1 - 0.45 * away);
    const sway = still ? 0 : Math.sin(t * 0.35);
    const rot: [number, number, number] = open
      ? [-0.18 - py * 0.05, px * 0.09, 0]
      : [-0.1 - py * 0.14, sway * 0.22 + px * 0.3, still ? 0 : Math.sin(t * 0.5) * 0.03];
    const lanternRot: [number, number, number] = [
      THREE.MathUtils.lerp(rot[0], -0.62 - py * 0.05, L),
      rot[1] * (1 - L) + spin.current,
      rot[2] * (1 - L),
    ];
    easing.dampE(rig.current.rotation, lanternRot, open ? 0.8 : 1.1, delta);
    // The lantern's light, dimming as the chapters carry the view away from it.
    const lamp = L * (1 - 0.6 * C) * (still ? 1 : 1 + Math.sin(t * 1.6) * 0.08);
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
function Fit({ page, sheets, phase }: { page: number; sheets: number; phase: React.RefObject<Phase> }) {
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
  /** Open a chapter's case study (clicking its page on the thread). */
  onOpen: (chapter: number) => void;
}) {
  const still = motion.turnMs <= 1;
  const dark = theme === "dark";
  const phase = useRef<Phase>(phaseAt(0));
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
            <Constellation faces={faces} phase={phase} theme={theme} onOpen={onOpen} />
          </World>
        )}
      </Textures>
      <ambientLight intensity={dark ? 0.55 : 1.05} />
      <directionalLight position={[1.6, 3.6, 3]} intensity={dark ? 0.85 : 1.1} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      {/* Cool rim light from behind picks out the book's edges against the dark. */}
      <directionalLight position={[-2.5, 1.5, -3]} intensity={dark ? 1.6 : 0.8} color="#41c7b6" />
      {/* Motes: glowing on the night stage, darker flecks drifting in the light one. */}
      <Sparkles count={70} scale={[6, 3.6, 2.4]} size={2.2} speed={still ? 0 : 0.25} opacity={dark ? 0.55 : 0.45} color={dark ? "#6fe6d6" : "#0b8a7c"} />
      <Sparkles count={16} scale={[5, 3, 2]} size={3.2} speed={still ? 0 : 0.18} opacity={dark ? 0.7 : 0.55} color={dark ? "#f0b44c" : "#b26b00"} />
      <ContactShadows position={[0, -0.95, 0]} opacity={dark ? 0.75 : 0.3} scale={5} blur={3} far={2.2} />
      <Fit page={page} sheets={canvases.length} phase={phase} />
    </Canvas>
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
    material.opacity = Math.min(0.55, L * 4);
  });
  return <instancedMesh ref={ref} args={[geometry, material, LEAVES]} frustumCulled={false} />;
}

/** Moves the whole scene so the chapter in view sits beside its panel as the thread unrolls. */
function World({ phase, children }: { phase: React.RefObject<Phase>; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const { size } = useThree();
  useFrame(() => {
    const p = phase.current;
    const k = smooth(p.chapters, 0, 0.1);
    const portrait = size.width / size.height < 0.85;
    const [x, y, z] = threadAt(p.focus);
    // Desktop: the page sits left of centre with its panel on the right. Phones: above the panel.
    const offset = portrait ? [0, 0.3] : [-0.85, 0];
    ref.current.position.set(k * (offset[0] - x), k * (offset[1] - y), -k * z);
  });
  return <group ref={ref}>{children}</group>;
}

const CARD_W = 1.4;
const CARD_H = CARD_W / 0.7485;

/**
 * The six chapters leaving the lantern: each page flies out along an arc to its place on a
 * glowing thread that winds away from the book, with a lit point at each stop and one at the end.
 */
function Constellation({
  faces,
  phase,
  theme,
  onOpen,
}: {
  faces: FaceTextures[];
  phase: React.RefObject<Phase>;
  theme: BookTheme;
  onOpen: (chapter: number) => void;
}) {
  const dark = theme === "dark";
  const cards = useRef<(THREE.Mesh | null)[]>([]);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const thread = useMemo(() => {
    const pts = [new THREE.Vector3(0, 0, 0), ...Array.from({ length: CHAPTERS + 1 }, (_, i) => new THREE.Vector3(...threadPoint(i)))];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 420, 0.009, 6);
  }, []);
  useEffect(() => () => thread.dispose(), [thread]);
  const threadMat = useRef<THREE.MeshBasicMaterial>(null!);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const p = phase.current;
    // Cards sit in the Constellation group, inside World: the World group is what moves.
    const world = cards.current[0]?.parent?.parent;
    const worldZ = world ? world.position.z : 0;
    // The thread draws itself just ahead of the view.
    const reveal = p.chapters > 0 ? Math.min(1, (p.focus + 1.6) / (CHAPTERS + 1)) : 0;
    thread.setDrawRange(0, Math.floor((thread.index?.count ?? 0) * reveal));
    threadMat.current.opacity = Math.min(0.85, p.chapters * 12);

    for (let i = 0; i < CHAPTERS; i++) {
      const card = cards.current[i];
      if (!card) continue;
      const d = departure(i, p);
      card.visible = d > 0.002;
      if (!card.visible) continue;
      const [x, y, z] = threadPoint(i);
      const e = 1 - (1 - d) ** 3;
      // Out of the lantern along an arc, turning to face the reader as it goes.
      card.position.set(x * e, y * e + Math.sin(d * Math.PI) * 0.55, z * e);
      card.scale.setScalar(0.3 + 0.7 * e);
      card.rotation.set(0, (1 - e) * 1.2 + Math.sin(state.clock.elapsedTime * 0.6 + i) * 0.04, 0);
      // Fade pages the view has passed, before they come too close.
      const mat = card.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(1, d * 3) * (1 - smooth(card.position.z + worldZ, 1.2, 2.6));
    }
    for (let i = 0; i <= CHAPTERS; i++) {
      const node = nodes.current[i];
      if (!node) continue;
      v.set(...threadPoint(i));
      const shown = reveal * (CHAPTERS + 1) > i + 1;
      node.scale.setScalar(shown ? (i === CHAPTERS ? 2.2 : 1) * (1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.15) : 0.001);
    }
  });

  return (
    <group>
      <mesh geometry={thread} frustumCulled={false}>
        <meshBasicMaterial
          ref={threadMat}
          color={dark ? "#6fe6d6" : "#0b8a7c"}
          transparent
          opacity={0}
          blending={dark ? THREE.AdditiveBlending : THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>
      {Array.from({ length: CHAPTERS + 1 }, (_, i) => (
        <mesh key={`node-${i}`} ref={(m) => void (nodes.current[i] = m)} position={threadPoint(i)}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color={dark ? "#f0b44c" : "#b26b00"} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: CHAPTERS }, (_, i) => (
        <mesh
          key={`card-${i}`}
          ref={(m) => void (cards.current[i] = m)}
          visible={false}
          renderOrder={2}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(i);
          }}
          onPointerEnter={() => (document.body.style.cursor = "pointer")}
          onPointerLeave={() => (document.body.style.cursor = "")}
        >
          <planeGeometry args={[CARD_W, CARD_H]} />
          {/* The chapter's own left page: its illustration, number and headline. */}
          {/* Drawn last and over the thread, so the thread arriving from the previous stop passes
              behind the page instead of across it. */}
          <meshBasicMaterial map={faces[i + 1].back} transparent side={THREE.DoubleSide} toneMapped={false} depthTest={false} />
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
