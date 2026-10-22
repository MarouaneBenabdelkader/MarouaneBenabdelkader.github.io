/**
 * The book's scroll story, as plain numbers the scene and the checks share.
 *
 * Scrolling the book's section moves s from 0 to 1:
 *   - first the open book closes (handled by the page logic),
 *   - then it opens all the way round into a lantern: its covers swing back until they nearly
 *     meet behind the spine and every page fans out into a glowing circle,
 *   - then the six chapter pages leave the lantern one by one and float out along a thread that
 *     winds away into the distance; the view travels along it, one chapter at a time,
 *     to a last point where the reader can get in touch.
 */

export const CHAPTERS = 6;

/** Below this, the book is an ordinary book you can leaf through. */
export const BOOK_UNTIL = 0.03;
const LANTERN_FROM = 0.06;
const LANTERN_TO = 0.3;
const CHAPTERS_FROM = 0.34;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number, a: number, b: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export type Phase = {
  /** 0 = closed book, 1 = fully opened lantern. */
  lantern: number;
  /** 0 before the chapters leave the lantern, 1 at the end of the thread. */
  chapters: number;
  /** Which point of the thread is in view: 0..CHAPTERS-1 are the chapters, CHAPTERS the end. */
  focus: number;
};

export function phaseAt(s: number): Phase {
  const chapters = clamp01((s - CHAPTERS_FROM) / (1 - CHAPTERS_FROM));
  return {
    lantern: smooth(s, LANTERN_FROM, LANTERN_TO),
    chapters,
    focus: Math.min(CHAPTERS, Math.max(0, chapters * (CHAPTERS + 0.4) - 0.3)),
  };
}

/**
 * The chapter whose panel is shown: the one in view, once its page has arrived on the thread.
 * Null before the first arrives and at the end of the thread.
 */
export function activeChapter(p: Phase) {
  if (p.chapters < 0.02) return null;
  const i = Math.round(p.focus);
  return i < CHAPTERS && departure(i, p) > 0.95 ? i : null;
}

// The covers stop just short of each other, so they never sit in one plane behind the spine.
const CIRCLE = 2 * Math.PI * 0.985;

/**
 * A sheet's rotation in the open lantern (same convention as a page: +90 degrees lying right).
 * Sheet n of `sheets` takes its share of the circle by position: the front cover goes furthest,
 * the back cover stays where it is.
 */
export function lanternAngle(n: number, sheets: number) {
  return Math.PI / 2 - CIRCLE * (1 - n / (sheets - 1));
}

/**
 * Blank leaves fill the circle between the real sheets so the lantern looks full. With a count
 * whose step is never a multiple of the sheets' step, no leaf ever shares a sheet's angle.
 */
export const LEAVES = 49;
export function leafAngle(j: number, lantern: number) {
  return Math.PI / 2 - CIRCLE * lantern * ((j + 1) / (LEAVES + 1));
}

/** Points of the thread, in world space: the lantern sits at the origin. */
export function threadPoint(i: number): [number, number, number] {
  if (i >= CHAPTERS) return [0, 0.05, -3 - CHAPTERS * 2.6];
  return [Math.sin(i * 1.15 + 0.5) * 1.35, Math.cos(i * 0.85) * 0.35 - 0.05, -3 - i * 2.6];
}

/** Where the thread is at a fractional focus (between two points, eased). */
export function threadAt(focus: number): [number, number, number] {
  const i = Math.min(CHAPTERS - 1, Math.floor(focus));
  const t = smooth(focus - i, 0, 1);
  const a = threadPoint(i);
  const b = threadPoint(i + 1);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** How far chapter i has travelled from the lantern to its place on the thread (0..1). */
export function departure(i: number, p: Phase) {
  // It sets off a little before the view reaches it, and arrives just in time.
  const arrive = (i + 0.3) / (CHAPTERS + 0.4);
  return smooth(p.chapters, arrive - 0.12, arrive - 0.01);
}
