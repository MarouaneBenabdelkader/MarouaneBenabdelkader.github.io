// Checks the book's page stacking: a page being turned must never sink below the sheets it
// is leaving or landing on, or their content flashes through it at the start or end of a turn.
import { BEND_SHAPE, boneTwist, bowFactor, bowOverTurn, OPEN_SHAPE, PAGE_HEIGHT, PAGE_SEGMENTS, PAGE_WIDTH, sheetHeight, STACK_GAP, togetherDelay, TURN_BEND, TURN_LIFT } from "../components/book/stack";

const SHEETS = 8;
const failures: string[] = [];
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

for (let n = 0; n < SHEETS; n++) {
  for (let step = 0; step <= 100; step++) {
    const p = step / 100;
    const eased = ease(p);
    const h = sheetHeight(n, SHEETS, eased, Math.sin(p * Math.PI));
    // Near the start it is over the right-hand stack (sheets after it, still unturned); near the
    // end it lies on the left-hand stack (sheets before it, already turned).
    const others = eased < 0.5
      ? Array.from({ length: SHEETS - 1 - n }, (_, k) => sheetHeight(n + 1 + k, SHEETS, 0, 0))
      : Array.from({ length: n }, (_, k) => sheetHeight(k, SHEETS, 1, 0));
    const highest = Math.max(-Infinity, ...others);
    if (others.length && h < highest + STACK_GAP / 2) {
      failures.push(`sheet ${n} at ${Math.round(p * 100)}% of its turn sits at ${h.toFixed(4)}, below a neighbour at ${highest.toFixed(4)}`);
    }
  }
}

// Closing on scroll (and reopening) moves several sheets at once. If they share one angle while
// their stacking order flips, they overlap exactly and flicker; each must keep its own angle.
const TURN_MS = 2600;
for (const [from, to] of [[5, 0], [0, 5], [7, 0], [0, 7]]) {
  const moving = Array.from({ length: Math.abs(to - from) }, (_, k) => Math.min(from, to) + k);
  const delays = moving.map((n) => togetherDelay(n, from, to));
  const end = TURN_MS + Math.max(...delays);
  for (let t = 0; t <= end; t += 10) {
    const eased = moving.map((n, k) => ease(Math.min(1, Math.max(0, (t - delays[k]) / TURN_MS))));
    for (let a = 0; a < moving.length; a++) {
      for (let b = a + 1; b < moving.length; b++) {
        const inFlight = eased[a] > 0.02 && eased[a] < 0.98;
        if (inFlight && Math.abs(eased[a] - eased[b]) < 0.01) {
          failures.push(`${from}->${to}: sheets ${moving[a]} and ${moving[b]} share one angle at ${t} ms`);
        }
      }
    }
  }
}

// Sheets moving together must not cut through each other. Each page is drawn as it is built: a
// strip of segments from its spine point, in the book's frame (x toward the camera, z sideways),
// raised by its height along x. Each segment turns by the page's rotation (all at the spine,
// for a flat page) plus the bow of paper mid-turn, whose free edge leads. Covers don't bow.
const SEG = PAGE_WIDTH / PAGE_SEGMENTS;
type Pt = [number, number];
const strip = (h: number, total: number, bow: number): Pt[] => {
  const pts: Pt[] = [[h, 0]];
  let angle = 0;
  for (let i = 0; i < PAGE_SEGMENTS; i++) {
    angle += (i === 0 ? total : 0) + bow * BEND_SHAPE[i];
    const [x, z] = pts[pts.length - 1];
    pts.push([x + SEG * Math.cos(angle), z - SEG * Math.sin(angle)]);
  }
  return pts;
};
const cross = (a: Pt, b: Pt, c: Pt) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const segmentsMeet = (p1: Pt, p2: Pt, q1: Pt, q2: Pt) =>
  cross(p1, p2, q1) * cross(p1, p2, q2) < 0 && cross(q1, q2, p1) * cross(q1, q2, p2) < 0;
// Segments right at the spine are shared by every page and ignored.
const SPINE = 3;
const stripsMeet = (a: Pt[], b: Pt[]) => {
  for (let i = SPINE; i < a.length - 1; i++)
    for (let j = SPINE; j < b.length - 1; j++) if (segmentsMeet(a[i], a[i + 1], b[j], b[j + 1])) return i;
  return -1;
};
// Two ways several sheets are in flight at once: closing or reopening on scroll (together, as a
// flat block, set off by togetherDelay) and jumping several pages with a dot (a riffle: one sheet
// after another, each bowing as in a single turn).
const RIFFLE_MS = 1800 / 6;
const scenarios = [[5, 0], [2, 0], [0, 5], [0, 2], [7, 0], [0, 7]].flatMap(([from, to]) => [
  { from, to, together: true },
  { from, to, together: false },
]);
for (const { from, to, together } of scenarios) {
  const moving = Array.from({ length: Math.abs(to - from) }, (_, k) => Math.min(from, to) + k);
  const dir = to > from ? 1 : -1;
  const turnMs = together ? TURN_MS : 1800;
  const delays = moving.map((n) => (together ? togetherDelay(n, from, to) : (dir > 0 ? n - from : from - 1 - n) * RIFFLE_MS));
  const end = turnMs + Math.max(...delays);
  for (let t = 0; t <= end; t += 10) {
    const pose = moving.map((n, k) => {
      const q = Math.min(1, Math.max(0, (t - delays[k]) / turnMs));
      const p = dir > 0 ? q : 1 - q; // progress: 0 lying right, 1 lying left
      const eased = ease(p);
      const arc = Math.sin(p * Math.PI);
      const stiff = n === 0 || n === SHEETS - 1;
      // Every scenario here has several sheets in flight.
      const bow = stiff ? 0 : -dir * TURN_BEND * arc * bowFactor(true);
      return { n, pts: strip(sheetHeight(n, SHEETS, eased, arc), Math.PI / 2 - Math.PI * eased, bow) };
    });
    for (let i = 0; i < pose.length; i++) {
      for (let j = i + 1; j < pose.length; j++) {
        const at = stripsMeet(pose[i].pts, pose[j].pts);
        if (at >= 0) failures.push(`${from}->${to}${together ? " together" : " riffle"}: sheets ${pose[i].n} and ${pose[j].n} cut through each other at segment ${at} at ${t} ms`);
      }
    }
  }
}

// A single page turning in an open book must clear the stacks it leaves and lands on: its bow
// must never push part of it into the top page of either stack. Pages are modelled as the scene
// builds them: each bone turns by its share of the page's rotation (the open shape) plus the bow.
const shaped = (h: number, total: number, bend: (i: number) => number): Pt[] => {
  const pts: Pt[] = [[h, 0]];
  let angle = 0;
  for (let i = 0; i < PAGE_SEGMENTS; i++) {
    angle += total * OPEN_SHAPE[i] + bend(i);
    const [x, z] = pts[pts.length - 1];
    pts.push([x + SEG * Math.cos(angle), z - SEG * Math.sin(angle)]);
  }
  return pts;
};
const fan = (n: number) => (n * 0.2 * Math.PI) / 180;
const atRest = (n: number, turned: boolean) =>
  shaped(sheetHeight(n, SHEETS, turned ? 1 : 0, 0), (turned ? -Math.PI / 2 : Math.PI / 2) + fan(n), () => 0);
for (let n = 1; n < SHEETS - 1; n++) {
  for (const dir of [1, -1]) {
    for (let step = 1; step < 100; step++) {
      const q = step / 100;
      const pr = dir > 0 ? q : 1 - q;
      const eased = ease(pr);
      const page = shaped(
        sheetHeight(n, SHEETS, eased, Math.sin(pr * Math.PI)),
        Math.PI / 2 - Math.PI * eased + fan(n),
        (i) => -dir * TURN_BEND * BEND_SHAPE[i] * bowOverTurn(q),
      );
      for (const [label, other] of [["right stack", atRest(n + 1, false)], ["left stack", atRest(n - 1, true)]] as const) {
        const at = stripsMeet(page, other);
        if (at >= 0) failures.push(`sheet ${n} turning ${dir > 0 ? "forward" : "back"} cuts into the ${label} at ${step}% (segment ${at})`);
      }
    }
  }
}

// The twist must stay small against the lift: chained bones add their twists, and if the page's
// top or bottom edge tilts back further than the page has risen, that half dips into the stack
// below and the previous page shows through it while the turn ends.
for (let step = 1; step < 100; step++) {
  const arc = Math.sin((step / 100) * Math.PI);
  let twist = 0;
  for (let i = 0; i <= PAGE_SEGMENTS; i++) twist += boneTwist(i, arc);
  const dip = (PAGE_HEIGHT / 2) * Math.sin(twist);
  if (dip > 0.6 * TURN_LIFT * arc) {
    failures.push(`at ${step}% of a turn the page edge tilts ${dip.toFixed(3)} back, more than its lift of ${(TURN_LIFT * arc).toFixed(3)} allows`);
  }
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} stacking errors\n- ` + failures.slice(0, 8).join("\n- "));
  process.exit(1);
}
console.log("PASS: book stacking (a turning page always stays on top)");
