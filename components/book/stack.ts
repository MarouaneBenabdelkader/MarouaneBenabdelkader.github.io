// Height of each sheet in its stack, so pages layer cleanly instead of z-fighting.
export const STACK_GAP = 0.006;
// How high a page rises off the stack at the middle of a turn.
export const TURN_LIFT = 0.18;
// A page is a strip of segments, one bone each; mid-turn the paper bows by up to TURN_BEND per
// segment, most in the middle of the page and none at its edges.
export const PAGE_SEGMENTS = 30;
export const TURN_BEND = 0.08;
export const BEND_SHAPE = Array.from({ length: PAGE_SEGMENTS + 1 }, (_, i) => Math.sin((i / PAGE_SEGMENTS) * Math.PI));
export const PAGE_WIDTH = 1.28;
export const PAGE_HEIGHT = 1.71;
// Share of an open page's rotation taken by each bone: most at the spine, the rest over the next
// few segments, then none, so pages rise gently from the gutter and lie flat (shares sum to 1).
export const OPEN_SHAPE = Array.from({ length: PAGE_SEGMENTS + 1 }, (_, i) => [0.62, 0.14, 0.09, 0.06, 0.04, 0.03, 0.02][i] ?? 0);

/**
 * How strongly the paper bows at a point in its journey (q: 0 setting off, 1 arriving, in either
 * direction), in the direction of travel. The free edge leads for most of the journey, so the
 * page is clearly curled as it stands up and crosses over, then trails for the landing and settles
 * last, from above, so the paper never pushes into either stack. A bow that led all the way dug
 * into the far stack.
 */
export function bowOverTurn(q: number) {
  return Math.sin(Math.PI * q) * (1.4 - 2 * q);
}
// Mid-turn the paper also twists a little about its length (top and bottom edges tilt opposite
// ways). FOLD is the twist of the whole page, in radians, at the middle of a turn.
export const FOLD = 0.12;

/**
 * Twist of each bone at a point in a turn (arc 0 at rest, 1 mid-turn). Bones are chained, so
 * their twists add up: each takes an equal share of FOLD, which keeps the page's edges from
 * tilting back further than the page has lifted off the stack.
 */
export function boneTwist(i: number, arc: number) {
  return i === 0 ? 0 : (FOLD * arc) / PAGE_SEGMENTS;
}

/**
 * How far a sheet sits above the book's base (book-local x, toward the camera). It glides from
 * the top of the right-hand stack to the top of the left-hand one as the turn progresses (eased,
 * 0 to 1), and rises off the stack mid-turn (arc). Jumping straight to the new stack instead
 * would drop the page below its neighbours for a few frames and let their content flash through.
 * Covers rise exactly as high as paper: when they move together (closing on scroll), a cover
 * lifted less than the page beside it would have that page cut through it.
 */
export function sheetHeight(number: number, sheets: number, eased: number, arc: number) {
  const right = (sheets - 1 - number) * STACK_GAP;
  const left = number * STACK_GAP;
  return right + (left - right) * eased + TURN_LIFT * arc;
}

// Gap between sheets setting off when several turn together.
export const STAGGER_MS = 110;

/**
 * Delay before a sheet starts moving when several turn together (closing on scroll, or reopening).
 * They set off one after another so the pages fan out like a real book closing, instead of
 * sharing one angle while their stacking order flips, which makes them flicker through each other.
 * Closing starts with the top of the left-hand stack, so the cover lands last, on top; reopening
 * starts with the cover.
 */
export function togetherDelay(number: number, from: number, to: number) {
  return (to < from ? from - 1 - number : number - from) * STAGGER_MS;
}

/**
 * How much a page bows mid-turn. A single turning page bows fully. When several sheets are in
 * flight at once (closing or reopening on scroll, or jumping several pages), their bows would
 * differ and their free edges would cut through each other, so they move as flat sheets.
 */
export function bowFactor(severalInFlight: boolean) {
  return severalInFlight ? 0 : 1;
}
