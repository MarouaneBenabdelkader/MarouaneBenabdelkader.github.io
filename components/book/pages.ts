/**
 * Draws every face of the book onto canvases, in the visitor's language, theme and the site fonts.
 * Sheet layout, as [front | back] (8 sheets):
 *   sheet 0: front cover | about me
 *   sheet 1: contents | illustration of project 1
 *   sheet k (2..7): chapter of project k-1 | illustration of project k, or the back cover on sheet 7
 * Spread s shows the back of sheet s-1 on the left and the front of sheet s on the right,
 * so spreads 2..7 are projects 1..6.
 */

const PAGE_PX = { w: 1024, h: 1368 };

export type BookTheme = "light" | "dark";

export type BookProject = {
  slug: string;
  title: string;
  sector: string;
  headline: string;
  hook: string;
  how: string[];
  result: string;
  stack: string[];
  credit: string;
  image: HTMLImageElement;
};

export type BookContent = {
  name: string;
  title: string;
  lines: string[];
  foreword: string;
  contents: string;
  chapter: string;
  challengeLabel: string;
  howLabel: string;
  resultLabel: string;
  coverSubtitle: string;
  backTitle: string;
  contact: string[];
  projects: BookProject[];
  /** Cover art and its glow masks (only the luminous engraved lines, black elsewhere). */
  covers: { front: HTMLImageElement; frontGlow: HTMLImageElement; back: HTMLImageElement; backGlow: HTMLImageElement };
};

/** One sheet: its two faces, plus glow masks for faces that light up (the covers). */
export type SheetFaces = {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  frontGlow?: HTMLCanvasElement;
  backGlow?: HTMLCanvasElement;
};

type Palette = {
  paper: string;
  ink: string;
  muted: string;
  accent: string;
  amber: string;
  line: string;
  rule: string;
  chip: string;
  gutter: string;
  vignette: [string, string];
  /** Halo behind headings: letters lit from within on dark paper, none on light paper. */
  glow: string | null;
};

// Dark pages match the engraved cover; light pages are ink drawings on warm paper.
const PALETTES: Record<BookTheme, Palette> = {
  dark: {
    paper: "rgb(13,24,20)",
    ink: "#e6f2ef",
    muted: "#a3b9b4",
    accent: "#5fd9c8",
    amber: "#e0a43a",
    line: "rgba(95,217,200,0.32)",
    rule: "rgba(95,217,200,0.14)",
    chip: "rgba(95,217,200,0.5)",
    gutter: "rgba(0,0,0,0.55)",
    vignette: ["rgba(65,199,182,0.06)", "rgba(0,0,0,0.25)"],
    glow: "rgba(65,199,182,0.55)",
  },
  light: {
    paper: "rgb(246,242,234)",
    ink: "#14211f",
    muted: "#4a5856",
    accent: "#076a5f",
    amber: "#b26b00",
    line: "rgba(7,106,95,0.35)",
    rule: "rgba(7,106,95,0.16)",
    chip: "rgba(20,33,31,0.35)",
    gutter: "rgba(60,50,30,0.2)",
    vignette: ["rgba(255,255,255,0.35)", "rgba(120,100,60,0.08)"],
    glow: null,
  },
};
let C = PALETTES.dark;

const LUMEN = "#dffcf7"; // cover lettering, lit from within
const LUMEN_EDGE = "#41c7b6";
const M = 104; // page margin, inside the frame

type Fonts = { display: string; body: string };

// Pages are laid out in PAGE_PX units and rendered at a multiple of it: higher for text so
// letters stay sharp on a tilted page, and for art as far as the source images allow.
export type FaceScale = { text: number; art: number };
let scale: FaceScale = { text: 1, art: 1 };

function canvas(s = 1) {
  const c = document.createElement("canvas");
  c.width = Math.round(PAGE_PX.w * s);
  c.height = Math.round(PAGE_PX.h * s);
  const ctx = c.getContext("2d")!;
  ctx.scale(s, s);
  return [c, ctx] as const;
}

/**
 * Wraps text into lines no wider than max and returns the y after the last line. With dry set it
 * only measures, so a page can try a layout before drawing it.
 */
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number, maxLines = 99, dry = false) {
  const draw = (s: string, at: number) => !dry && ctx.fillText(s, x, at);
  let line = "";
  let n = 0;
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > max && line) {
      if (++n === maxLines) {
        draw(`${line}…`, y);
        return y + lh;
      }
      draw(line, y);
      line = word;
      y += lh;
    } else line = test;
  }
  if (line) draw(line, y);
  return y + lh;
}

/** Runs draw with the palette's heading halo, if it has one. */
function glowing(ctx: CanvasRenderingContext2D, blur: number, draw: () => void) {
  if (C.glow) {
    ctx.shadowColor = C.glow;
    ctx.shadowBlur = blur;
  }
  draw();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

/** Shadow along the binding edge, where the page dips into the spine. */
function gutter(ctx: CanvasRenderingContext2D, side: "left" | "right") {
  const w = 110;
  const x0 = side === "left" ? 0 : PAGE_PX.w - w;
  const g = ctx.createLinearGradient(side === "left" ? 0 : PAGE_PX.w, 0, side === "left" ? w : PAGE_PX.w - w, 0);
  g.addColorStop(0, C.gutter);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x0, 0, w, PAGE_PX.h);
}

/** The cover's engraved frame, repeated on every page: a fine line with lit corner nodes. */
function frame(ctx: CanvasRenderingContext2D) {
  const i = 48;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(i, i, PAGE_PX.w - 2 * i, PAGE_PX.h - 2 * i);
  ctx.fillStyle = C.accent;
  for (const [x, y] of [[i, i], [PAGE_PX.w - i, i], [i, PAGE_PX.h - i], [PAGE_PX.w - i, PAGE_PX.h - i]]) {
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A short circuit trace used as a rule: a lit pad, a run, a bend and an open pad. */
function trace(ctx: CanvasRenderingContext2D, x: number, y: number, len = 200) {
  ctx.strokeStyle = C.accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + len * 0.7, y);
  ctx.lineTo(x + len * 0.7 + 14, y - 14);
  ctx.lineTo(x + len, y - 14);
  ctx.stroke();
  ctx.fillStyle = C.amber;
  ctx.beginPath();
  ctx.arc(x + 4, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + len + 6, y - 14, 6, 0, Math.PI * 2);
  ctx.stroke();
}

/** Page number in the outer bottom corner, with an optional note on the inner side. */
function footer(ctx: CanvasRenderingContext2D, f: Fonts, n: number, side: "left" | "right", note?: string) {
  const y = PAGE_PX.h - 96;
  ctx.font = `600 28px ${f.display}`;
  ctx.fillStyle = C.accent;
  ctx.textAlign = side === "left" ? "left" : "right";
  ctx.fillText(String(n), side === "left" ? M : PAGE_PX.w - M, y);
  if (note) {
    ctx.font = `500 26px ${f.body}`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = side === "left" ? "right" : "left";
    ctx.fillText(note, side === "left" ? PAGE_PX.w - M : M, y);
  }
  ctx.textAlign = "left";
}

function page(side: "left" | "right", s = scale.text) {
  const [c, ctx] = canvas(s);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, PAGE_PX.w, PAGE_PX.h);
  const v = ctx.createRadialGradient(PAGE_PX.w / 2, PAGE_PX.h * 0.42, 80, PAGE_PX.w / 2, PAGE_PX.h * 0.45, PAGE_PX.h * 0.75);
  v.addColorStop(0, C.vignette[0]);
  v.addColorStop(1, C.vignette[1]);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, PAGE_PX.w, PAGE_PX.h);
  return [c, ctx, () => gutter(ctx, side === "right" ? "left" : "right")] as const;
}

/** A bullet: a small amber node, then the wrapped line. Returns the y after it. */
function bullet(ctx: CanvasRenderingContext2D, text: string, y: number, size: number, lh: number, f: Fonts, dry: boolean) {
  if (!dry) {
    ctx.fillStyle = C.amber;
    ctx.beginPath();
    ctx.arc(M + 7, y - size * 0.32, 6.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = C.ink;
  ctx.font = `400 ${size}px ${f.body}`;
  return wrap(ctx, text, M + 34, y, PAGE_PX.w - 2 * M - 34, lh, 99, dry);
}

/** Draws a cover and its glow mask; the lettering goes on both so it glows like the engraving. */
function cover(content: BookContent, f: Fonts, back: boolean) {
  const [c, ctx] = canvas(scale.art);
  const [gc, gctx] = canvas(scale.art);
  ctx.drawImage(back ? content.covers.back : content.covers.front, 0, 0, PAGE_PX.w, PAGE_PX.h);
  gctx.drawImage(back ? content.covers.backGlow : content.covers.frontGlow, 0, 0, PAGE_PX.w, PAGE_PX.h);

  const cx = PAGE_PX.w / 2;
  const max = PAGE_PX.w - 260;
  for (const [g, glow] of [[ctx, false], [gctx, true]] as const) {
    g.textAlign = "center";
    g.fillStyle = LUMEN;
    g.shadowColor = LUMEN_EDGE;
    g.shadowBlur = glow ? 22 : 12;
    if (!back) {
      const [first, ...rest] = content.name.split(" ");
      // Everything sits above the sigil, which fills the lower half of the cover art.
      g.font = `800 116px ${f.display}`;
      g.fillText(first, cx, 260);
      g.font = `800 92px ${f.display}`;
      g.fillText(rest.join(" "), cx, 370);
      g.fillStyle = LUMEN_EDGE;
      g.fillRect(cx - 70, 420, 140, 3);
      g.font = `500 38px ${f.body}`;
      g.fillStyle = "#9fe8dd";
      wrap(g, content.coverSubtitle, cx, 495, max, 50, 2);
    } else {
      g.font = `800 68px ${f.display}`;
      const y = wrap(g, content.backTitle, cx, 210, max, 78);
      g.fillStyle = LUMEN_EDGE;
      g.fillRect(cx - 70, y - 22, 140, 3);
      g.fillStyle = "#9fe8dd";
      g.font = `500 31px ${f.body}`;
      content.contact.forEach((line, i) => g.fillText(line, cx, y + 44 + i * 50));
    }
    g.shadowColor = "transparent";
    g.textAlign = "left";
  }
  return { face: c, glow: gc };
}

function about(content: BookContent, f: Fonts) {
  const [c, ctx, shade] = page("left");
  const max = PAGE_PX.w - 2 * M;
  frame(ctx);
  ctx.fillStyle = C.ink;
  ctx.font = `800 82px ${f.display}`;
  let y = 0;
  glowing(ctx, 14, () => (y = wrap(ctx, content.name, M, 230, max, 86)));
  trace(ctx, M, y - 18, 220);
  ctx.fillStyle = C.accent;
  ctx.font = `600 39px ${f.display}`;
  y = wrap(ctx, content.title, M, y + 70, max, 50);
  y += 30;
  for (const line of content.lines) y = bullet(ctx, line, y, 31, 42, f, false) + 12;
  ctx.fillStyle = C.ink;
  ctx.font = `italic 400 35px ${f.body}`;
  wrap(ctx, content.foreword, M, y + 44, max, 52);
  shade();
  return c;
}

function contents(content: BookContent, f: Fonts) {
  const [c, ctx, shade] = page("right");
  const max = PAGE_PX.w - 2 * M - 150;
  frame(ctx);
  ctx.fillStyle = C.ink;
  ctx.font = `800 80px ${f.display}`;
  glowing(ctx, 14, () => ctx.fillText(content.contents, M, 236));
  trace(ctx, M, 290, 220);
  let y = 400;
  content.projects.forEach((p, i) => {
    if (i > 0) {
      ctx.fillStyle = C.rule;
      ctx.fillRect(M, y - 52, PAGE_PX.w - 2 * M, 1.5);
    }
    ctx.font = `700 44px ${f.display}`;
    ctx.fillStyle = C.accent;
    ctx.fillText(String(i + 1).padStart(2, "0"), M, y + 4);
    ctx.textAlign = "right";
    ctx.font = `600 28px ${f.display}`;
    ctx.fillText(String(2 + i * 2), PAGE_PX.w - M, y);
    ctx.textAlign = "left";
    ctx.fillStyle = C.ink;
    ctx.font = `600 34px ${f.display}`;
    const end = wrap(ctx, p.headline, M + 96, y - 4, max, 42, 2);
    ctx.fillStyle = C.muted;
    ctx.font = `500 26px ${f.body}`;
    y = wrap(ctx, p.sector, M + 96, end, max, 32, 1) + 58;
  });
  footer(ctx, f, 1, "right");
  shade();
  return c;
}

/**
 * The left page of a chapter. On a spread it carries the drawing with the chapter number and
 * headline beneath it; on a single-page layout (phones, which frame one page) it is the drawing alone.
 */
function illustration(p: BookProject, content: BookContent, f: Fonts, index: number, n: number, spread: boolean) {
  const [c, ctx, shade] = page("left", scale.art);
  const img = p.image;
  if (!spread) {
    const s = Math.max(PAGE_PX.w / img.width, PAGE_PX.h / img.height);
    ctx.drawImage(img, (PAGE_PX.w - img.width * s) / 2, (PAGE_PX.h - img.height * s) / 2, img.width * s, img.height * s);
  } else {
    // The drawings sit centred with empty paper around them: keep the middle band, full width,
    // and let its lower edge fade into the page above the headline.
    const sy = img.height * 0.1;
    const sh = img.height * 0.64;
    const dh = (PAGE_PX.w * sh) / img.width;
    ctx.drawImage(img, 0, sy, img.width, sh, 0, 0, PAGE_PX.w, dh);
    const fade = ctx.createLinearGradient(0, dh - 160, 0, dh);
    // Fade from the paper colour itself; fading from transparent black would leave a grey band.
    fade.addColorStop(0, C.paper.replace("rgb(", "rgba(").replace(")", ",0)"));
    fade.addColorStop(1, C.paper);
    ctx.fillStyle = fade;
    ctx.fillRect(0, dh - 160, PAGE_PX.w, 162);
    ctx.fillStyle = C.paper;
    ctx.fillRect(0, dh, PAGE_PX.w, PAGE_PX.h - dh);

    const max = PAGE_PX.w - 2 * M;
    let y = dh + 40;
    ctx.fillStyle = C.accent;
    ctx.font = `600 31px ${f.display}`;
    ctx.fillText(`${content.chapter} ${String(index + 1).padStart(2, "0")}`, M, y);
    ctx.fillStyle = C.muted;
    ctx.font = `500 29px ${f.body}`;
    wrap(ctx, p.sector, M, y + 44, max, 36, 1);
    // The headline takes what room is left above the footer, at the largest size that fits.
    let size = 66;
    ctx.font = `700 ${size}px ${f.display}`;
    while (size > 44 && wrap(ctx, p.headline, M, y + 130, max, size * 1.08, 99, true) > PAGE_PX.h - 150) {
      size -= 2;
      ctx.font = `700 ${size}px ${f.display}`;
    }
    ctx.fillStyle = C.ink;
    glowing(ctx, 12, () => (y = wrap(ctx, p.headline, M, y + 130, max, size * 1.08)));
    trace(ctx, M, y - 14, 200);
  }
  frame(ctx);
  footer(ctx, f, n, "left");
  shade();
  return c;
}

/**
 * The right page of a chapter: the client's challenge, how it works in three lines, where it
 * stands and the stack. On a single-page layout it also opens with the number and headline.
 * Everything scales down together until it fits; nothing is cut.
 */
function chapterPage(p: BookProject, content: BookContent, f: Fonts, index: number, n: number, spread: boolean) {
  const [c, ctx, shade] = page("right");
  const max = PAGE_PX.w - 2 * M;
  const bottom = PAGE_PX.h - 150;
  frame(ctx);

  const label = (text: string, y: number, k: number, dry: boolean) => {
    ctx.font = `700 ${29 * k}px ${f.display}`;
    ctx.fillStyle = C.accent;
    if (!dry) ctx.fillText(text, M, y);
  };

  const layout = (k: number, dry: boolean) => {
    let y = 190;
    if (!spread) {
      ctx.fillStyle = C.accent;
      ctx.font = `600 30px ${f.display}`;
      if (!dry) ctx.fillText(`${content.chapter} ${String(index + 1).padStart(2, "0")}`, M, y);
      ctx.fillStyle = C.muted;
      ctx.font = `500 28px ${f.body}`;
      wrap(ctx, p.sector, M, y + 44, max, 34, 1, dry);
      ctx.fillStyle = C.ink;
      ctx.font = `700 ${62 * k}px ${f.display}`;
      const head = () => (y = wrap(ctx, p.headline, M, 320, max, 68 * k, 99, dry));
      if (dry) head();
      else glowing(ctx, 12, head);
      if (!dry) trace(ctx, M, y - 16, 200);
      y += 40 * k;
    } else {
      label(content.challengeLabel, y, k, dry);
      y += 62 * k;
    }

    const body = spread ? 38 : 35;
    ctx.fillStyle = C.ink;
    ctx.font = `italic 400 ${body * k}px ${f.body}`;
    y = wrap(ctx, p.hook, M, y, max, body * 1.42 * k, 99, dry);

    label(content.howLabel, y + 34 * k, k, dry);
    y += 96 * k;
    const point = spread ? 36 : 31;
    for (const line of p.how) y = bullet(ctx, line, y, point * k, point * 1.4 * k, f, dry) + 14 * k;

    label(content.resultLabel, y + 26 * k, k, dry);
    ctx.font = `500 ${(spread ? 35 : 31) * k}px ${f.body}`;
    ctx.fillStyle = C.ink;
    y = wrap(ctx, p.result, M, y + 84 * k, max, (spread ? 49 : 43) * k, 99, dry);

    // Stack as outlined chips.
    ctx.font = `500 ${(spread ? 26 : 24) * k}px ${f.body}`;
    let x = M;
    y += 40 * k;
    for (const s of p.stack.slice(0, 7)) {
      const w = ctx.measureText(s).width + 30 * k;
      if (x + w > PAGE_PX.w - M) {
        x = M;
        y += 52 * k;
      }
      if (!dry) {
        ctx.strokeStyle = C.chip;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y - 31 * k, w, 44 * k, 22 * k);
        ctx.stroke();
        ctx.fillStyle = C.ink;
        ctx.fillText(s, x + 15 * k, y);
      }
      x += w + 9 * k;
    }
    return y;
  };

  let k = 1;
  while (k > 0.66 && layout(k, true) > bottom) k -= 0.03;
  layout(k, false);

  footer(ctx, f, n, "right", p.credit);
  shade();
  return c;
}

/**
 * Returns the 8 sheets in the given theme, rendered at the given resolution. With spread, each
 * chapter uses both pages; without it (one page in view, on phones) each chapter fits on the right.
 */
export function buildFaces(content: BookContent, fonts: Fonts, faceScale: FaceScale, theme: BookTheme, spread: boolean): SheetFaces[] {
  scale = faceScale;
  C = PALETTES[theme];
  const ps = content.projects;
  const front = cover(content, fonts, false);
  const back = cover(content, fonts, true);
  const faces: SheetFaces[] = [];
  faces.push({ front: front.face, frontGlow: front.glow, back: about(content, fonts) });
  faces.push({ front: contents(content, fonts), back: illustration(ps[0], content, fonts, 0, 2, spread) });
  for (let i = 0; i < ps.length; i++) {
    const last = i + 1 === ps.length;
    faces.push({
      front: chapterPage(ps[i], content, fonts, i, 3 + i * 2, spread),
      back: last ? back.face : illustration(ps[i + 1], content, fonts, i + 1, 4 + i * 2, spread),
      backGlow: last ? back.glow : undefined,
    });
  }
  return faces;
}

/** One stop of the journey on the spiral: a job, the freelance years, or what comes next. */
export type JourneyStop = {
  company: string;
  role: string;
  type: string;
  dates: string;
  lines: string[];
  logo?: HTMLImageElement;
};

/** Draws a logo as a single-colour mark, the way the site shows company logos. */
function tintedLogo(img: HTMLImageElement, color: string, h: number) {
  const w = Math.round((img.width / img.height) * h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(img, 0, 0, w, h);
  return c;
}

/**
 * A journey card, built like a book page: the engraved frame, the dates as a lit label, the
 * company in large type (with its logo when there is one), the role and two lines on the work.
 */
/** Fine paper grain, fixed for every page so redraws match. */
function grain(ctx: CanvasRenderingContext2D, seed: number) {
  let r = seed * 9301 + 49297;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  ctx.fillStyle = C.glow ? "rgba(255,255,255,0.035)" : "rgba(60,45,20,0.05)";
  for (let k = 0; k < 2600; k++) ctx.fillRect(rand() * PAGE_PX.w, rand() * PAGE_PX.h, 1.6, 1.6);
}

/**
 * A stop of the journey as a page torn from the book: the year it began, set large, and the
 * company's mark. What happened there is told in the panel beside it, so the page stays a picture
 * the reader recognises at a glance.
 */
export function journeyCard(stop: JourneyStop, index: number, count: number, fonts: Fonts, theme: BookTheme, s: number) {
  C = PALETTES[theme];
  const [c, ctx] = canvas(s);
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, PAGE_PX.w, PAGE_PX.h);
  const v = ctx.createRadialGradient(PAGE_PX.w / 2, PAGE_PX.h * 0.45, 80, PAGE_PX.w / 2, PAGE_PX.h * 0.5, PAGE_PX.h * 0.75);
  v.addColorStop(0, C.vignette[0]);
  v.addColorStop(1, C.vignette[1]);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, PAGE_PX.w, PAGE_PX.h);
  grain(ctx, index + 1);
  frame(ctx);
  const max = PAGE_PX.w - 2 * M;

  ctx.fillStyle = C.accent;
  ctx.font = `700 34px ${fonts.display}`;
  ctx.fillText(String(index + 1).padStart(2, "0"), M, 190);

  // The year the stop began, the page's headline.
  const year = stop.dates.match(/\d{4}/)?.[0] ?? "";
  ctx.fillStyle = C.ink;
  ctx.font = `800 300px ${fonts.display}`;
  glowing(ctx, 30, () => ctx.fillText(year, M - 12, 500));
  ctx.fillStyle = C.muted;
  ctx.font = `500 36px ${fonts.body}`;
  wrap(ctx, stop.dates, M, 580, max, 44, 1);
  trace(ctx, M, 650, 240);

  // The company's mark, centred in the lower half; a symbol carries the name under it, a
  // wordmark is the name. The next chapter has no mark yet: an open ring waits for one.
  const mid = 900;
  const wordmark = !!stop.logo && stop.logo.width / stop.logo.height > 2.5;
  if (stop.logo) {
    const h = wordmark ? 150 : 230;
    const mark = tintedLogo(stop.logo, C.ink, h);
    const w = Math.min(max, mark.width);
    const dh = (w / mark.width) * h;
    const top = wordmark ? mid - dh / 2 : mid - dh / 2 - 50;
    glowing(ctx, 18, () => ctx.drawImage(mark, (PAGE_PX.w - w) / 2, top, w, dh));
    if (!wordmark) {
      ctx.fillStyle = C.ink;
      ctx.font = `700 60px ${fonts.display}`;
      ctx.textAlign = "center";
      wrap(ctx, stop.company, PAGE_PX.w / 2, top + dh + 80, max, 66, 1);
      ctx.textAlign = "left";
    }
  } else {
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 3;
    for (const [r, from, to] of [[150, 0.2, 1.8], [105, 1.1, 2.7], [60, 0, 2]] as const) {
      ctx.beginPath();
      ctx.arc(PAGE_PX.w / 2, mid - 30, r, from * Math.PI, to * Math.PI);
      ctx.stroke();
    }
    ctx.fillStyle = C.amber;
    ctx.beginPath();
    ctx.arc(PAGE_PX.w / 2, mid - 30, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = `700 60px ${fonts.display}`;
    ctx.textAlign = "center";
    glowing(ctx, 14, () => ctx.fillText(stop.company, PAGE_PX.w / 2, mid + 210));
    ctx.textAlign = "left";
  }

  // Where this page sits in the journey: one node per stop, this one lit.
  const gap = 46;
  const x0 = (PAGE_PX.w - gap * (count - 1)) / 2;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, 1220);
  ctx.lineTo(x0 + gap * (count - 1), 1220);
  ctx.stroke();
  for (let k = 0; k < count; k++) {
    ctx.fillStyle = k === index ? C.amber : C.paper;
    ctx.strokeStyle = k === index ? C.amber : C.accent;
    ctx.beginPath();
    ctx.arc(x0 + gap * k, 1220, k === index ? 11 : 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  gutter(ctx, "left");
  return c;
}
