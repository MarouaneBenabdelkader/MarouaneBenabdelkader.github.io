/**
 * The book's scroll story, as plain numbers the scene and the checks share.
 *
 * Scrolling the book's section moves s from 0 to 1:
 *   - first the open book closes (handled by the page logic),
 *   - then it opens all the way round into a lantern: its covers swing back until they nearly
 *     meet behind the spine and every page fans out into a glowing circle,
 *   - then the six chapter pages leave the lantern one by one onto a spiral, which turns as the
 *     reader scrolls so each chapter swings to the front in turn, ending where the reader can
 *     get in touch.
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

/**
 * Lets the spiral linger a little on each chapter: within each step, motion is part steady and
 * part eased, so it slows as a chapter reaches the front and never stops dead.
 */
function dwell(f: number) {
  if (f >= CHAPTERS) return CHAPTERS;
  const i = Math.floor(f);
  const r = f - i;
  return i + 0.35 * r + 0.65 * r * r * (3 - 2 * r);
}

export function phaseAt(s: number): Phase {
  const chapters = clamp01((s - CHAPTERS_FROM) / (1 - CHAPTERS_FROM));
  return {
    lantern: smooth(s, LANTERN_FROM, LANTERN_TO),
    chapters,
    focus: dwell(Math.min(CHAPTERS, Math.max(0, chapters * (CHAPTERS + 0.4) - 0.3))),
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

/** How far chapter i has travelled from the lantern to its place on the spiral (0..1). */
export function departure(i: number, p: Phase) {
  // It sets off a little before the view reaches it, and arrives just in time.
  const arrive = (i + 0.3) / (CHAPTERS + 0.4);
  // Never before the chapters phase begins: the first chapter's window would otherwise start
  // below zero and leave it floating beside the closed book.
  if (p.chapters <= 0) return 0;
  return smooth(p.chapters, Math.max(0, arrive - 0.12), arrive - 0.01);
}

/**
 * The chapters' spiral. Pages sit on a helix around a vertical axis behind the stage; scrolling
 * turns it so the chapter in view swings to the front, upcoming ones wait to the left, lower
 * and further back, and passed ones turn away to the right. Positions are in the scene's world
 * space (before its framing offset); the front of the spiral is at z = SPIRAL_FRONT.
 */
export const SPIRAL_STEP = 0.55; // radians between neighbouring chapters
export const SPIRAL_RADIUS = 3.2;
export const SPIRAL_RISE = 0.42; // height between neighbouring chapters
export const SPIRAL_FRONT = 0.9;

export function spiralPoint(t: number, focus: number): [number, number, number] {
  const a = (focus - t) * SPIRAL_STEP;
  return [SPIRAL_RADIUS * Math.sin(a), (focus - t) * SPIRAL_RISE, SPIRAL_FRONT - SPIRAL_RADIUS * (1 - Math.cos(a))];
}

/** Turn of the page at t so it faces outward from the spiral's axis. */
export function spiralFacing(t: number, focus: number) {
  return (focus - t) * SPIRAL_STEP;
}

/**
 * The first scroll position where the lantern is fully open and the first chapter is in place
 * at the front of the spiral: where the automatic opening ends.
 */
export const FIRST_CHAPTER_AT = (() => {
  for (let k = 0; k <= 10000; k++) {
    const s = k / 10000;
    const p = phaseAt(s);
    if (p.lantern >= 1 && activeChapter(p) === 0) return s;
  }
  return 1;
})();
