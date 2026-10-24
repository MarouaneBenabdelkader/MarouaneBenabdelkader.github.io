"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildFaces, journeyCard, type BookContent, type BookTheme } from "./pages";
import { activeChapter, BOOK_UNTIL, departure, FIRST_CHAPTER_AT, phaseAt } from "./story";
import type { Motion } from "./BookScene";

const BookScene = dynamic(() => import("./BookScene"), { ssr: false });

export type BookProps = {
  content: Omit<BookContent, "projects" | "covers"> & {
    projects: (Omit<BookContent["projects"][number], "image"> & { image: Record<BookTheme, string>; href: string })[];
  };
  covers: { front: string; frontGlow: string; back: string; backGlow: string };
  /** The journey on the spiral, oldest first. */
  stops: { kind: "job" | "freelance" | "next"; company: string; role: string; type: string; dates: string; lines: string[]; logo?: string }[];
  ui: {
    loading: string;
    hintOpen: string;
    hintTurn: string;
    prev: string;
    next: string;
    noWebgl: string;
    coverCaption: string;
    aboutCaption: string;
    contactCaption: string;
    readCase: string;
    email: string;
    lanternHint: string;
    contact: string;
    linkedin: string;
    readChapters: string;
  };
};

/** Where the reader is in the book's scroll story, coarse enough to drive the panels. */
type Stage = { kind: "book" } | { kind: "lantern" } | { kind: "chapter"; index: number } | { kind: "end" };
const sameStage = (a: Stage, b: Stage) => a.kind === b.kind && (a.kind !== "chapter" || (b.kind === "chapter" && a.index === b.index));

const SLOW: Motion = { turnMs: 1800, smooth: 0.42, fold: 0.35 };
// Closing on scroll: every open sheet swings shut together, slower than a single page turn.
const CLOSE: Motion = { turnMs: 2600, smooth: 0.9, fold: 0.6 };
const INSTANT: Motion = { turnMs: 1, smooth: 0.05, fold: 0.05 };
const SHEETS = 8;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** The site fonts as canvas font-family strings, loaded in every weight the pages use. */
async function siteFonts() {
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--font-bricolage").trim() || "sans-serif";
  const body = css.getPropertyValue("--font-instrument").trim() || "sans-serif";
  await Promise.all([
    ...["600", "700", "800"].map((w) => document.fonts.load(`${w} 40px ${display}`)),
    ...["400", "500", "600"].map((w) => document.fonts.load(`${w} 40px ${body}`)),
  ]).catch(() => undefined);
  return { display, body };
}

export function BookExperience({ content, covers, stops, ui }: BookProps) {
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const [canvases, setCanvases] = useState<ReturnType<typeof buildFaces> | null>(null);
  const [journeyCanvases, setJourneyCanvases] = useState<HTMLCanvasElement[]>([]);
  const [page, setPage] = useState(0);
  const [touched, setTouched] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [together, setTogether] = useState(false);
  const [theme, setTheme] = useState<BookTheme | null>(null);
  // Portrait screens frame one page, so each chapter must fit on it; wider screens use the spread.
  const [single, setSingle] = useState(false);
  const pageRef = useRef(0);
  const reopenAt = useRef<number | null>(null);
  pageRef.current = page;
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);
  const swiped = useRef(0);
  // How far through the book's tall section the reader has scrolled (0..1), read every frame by
  // the scene; the stage only changes when a panel should.
  const story = useRef(0);
  const [stage, setStage] = useState<Stage>({ kind: "book" });
  const stageRef = useRef(stage);
  const rootRef = useRef<HTMLDivElement>(null);

  // Follow the site theme: light pages with ink drawings, or dark pages with glowing ones.
  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setTheme(html.dataset.theme === "dark" ? "dark" : "light");
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    const portrait = window.matchMedia("(max-aspect-ratio: 17/20)");
    const fit = () => setSingle(portrait.matches);
    fit();
    portrait.addEventListener("change", fit);
    return () => {
      mo.disconnect();
      portrait.removeEventListener("change", fit);
    };
  }, []);

  // Draw the pages, and redraw them when the theme changes; the open book stays where it is.
  useEffect(() => {
    if (!theme) return;
    if (!hasWebGL()) return setState("fallback");
    let cancelled = false;
    (async () => {
      try {
        const [fonts, front, frontGlow, back, backGlow, ...images] = await Promise.all([
          siteFonts(),
          loadImage(covers.front),
          loadImage(covers.frontGlow),
          loadImage(covers.back),
          loadImage(covers.backGlow),
          ...content.projects.map((p) => loadImage(p.image[theme])),
        ]);
        const stopLogos = await Promise.all(stops.map((s) => (s.logo ? loadImage(s.logo) : Promise.resolve(undefined))));
        if (cancelled) return;
        const faces = buildFaces(
          { ...content, covers: { front, frontGlow, back, backGlow }, projects: content.projects.map((p, i) => ({ ...p, image: images[i] })) },
          fonts,
          // Sharper pages on computers; phones get a lighter set to save GPU memory.
          window.matchMedia("(pointer: coarse)").matches ? { text: 1.25, art: 1 } : { text: 1.75, art: 1.5 },
          theme,
          !single,
        );
        setCanvases(faces);
        const art = window.matchMedia("(pointer: coarse)").matches ? 1 : 1.5;
        setJourneyCanvases(stops.map((s, i) => journeyCard({ ...s, logo: stopLogos[i] }, i, stops.length, fonts, theme, art)));
        setState("ready");
      } catch {
        if (!cancelled) setState("fallback");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [content, covers, stops, theme, single]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
    };
  }, []);

  const go = useCallback((p: number) => {
    setTouched(true);
    setTogether(false);
    reopenAt.current = null;
    setPage(Math.max(0, Math.min(SHEETS, p)));
  }, []);

  // Scrolling through the book's section drives the story: an open book first closes (and
  // reopens where it was if the reader comes back to the top), then opens into the lantern, then
  // the chapters leave it one by one.
  useEffect(() => {
    const section = rootRef.current?.closest<HTMLElement>("[data-story]");
    // The opening plays by itself: starting to scroll down from the book glides the page to the
    // first chapter (the book closes, opens into the lantern and the first chapter flies out on
    // the way); scrolling back up from there glides back to the book.
    const GLIDE_MS = 2600;
    let glide: number | null = null;
    let lastS = 0;
    const scrollFor = (s: number) => {
      const rect = section!.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      return rect.top + window.scrollY + s * travel;
    };
    const glideTo = (s: number) => {
      const from = window.scrollY;
      const to = scrollFor(s);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo({ top: to, behavior: "instant" });
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / GLIDE_MS);
        const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        window.scrollTo({ top: from + (to - from) * e, behavior: "instant" });
        glide = t < 1 ? requestAnimationFrame(step) : null;
      };
      if (glide !== null) cancelAnimationFrame(glide);
      glide = requestAnimationFrame(step);
    };
    const onScroll = () => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const s = Math.min(1, Math.max(0, -rect.top / travel));
      story.current = s;
      if (glide === null) {
        // Any scroll away from the book starts it; a single wheel step moves s by about 0.015.
        const between = s > 0.001 && s < FIRST_CHAPTER_AT - 0.002;
        if (between && s > lastS && lastS <= BOOK_UNTIL) glideTo(FIRST_CHAPTER_AT);
        else if (between && s < lastS && lastS >= FIRST_CHAPTER_AT - 0.002) glideTo(0);
      }
      lastS = s;
      const p = pageRef.current;
      if (s > BOOK_UNTIL && p > 0 && p < SHEETS) {
        reopenAt.current = p;
        setTogether(true);
        setPage(0);
      } else if (s < 0.004 && p === 0 && reopenAt.current !== null) {
        const back = reopenAt.current;
        reopenAt.current = null;
        setTogether(true);
        setPage(back);
      }
      const phase = phaseAt(s);
      // Between two stops the panel follows the page nearest the front once it is most of the way
      // there, so the text always matches the page the reader is looking at; the lantern hint
      // only shows before any page has left.
      const near = Math.min(5, Math.round(phase.focus));
      const chapter =
        activeChapter(phase) ??
        (phase.chapters > 0.02 && phase.focus < 5.5 ? (departure(near, phase) > 0.5 ? near : Math.min(5, Math.floor(phase.focus))) : null);
      const next: Stage =
        s <= BOOK_UNTIL ? { kind: "book" } : chapter !== null ? { kind: "chapter", index: chapter } : phase.focus > 5.5 ? { kind: "end" } : { kind: "lantern" };
      if (!sameStage(next, stageRef.current)) {
        stageRef.current = next;
        setStage(next);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (glide !== null) cancelAnimationFrame(glide);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // The freelance stop leads back to the chapters at the top of the book; the others are read
  // in their panel.
  const backToChapters = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);
  const openStop = useCallback((i: number) => {
    if (stops[i]?.kind === "freelance") backToChapters();
  }, [stops, backToChapters]);

  // A swipe also ends in a click on the page under the finger; ignore that click.
  const pick = useCallback((p: number) => {
    if (performance.now() - swiped.current < 400) return;
    go(p);
  }, [go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  const years = useMemo(() => stops.map((s) => s.dates.match(/\d{4}/)?.[0] ?? ""), [stops]);

  const project = page >= 2 && page <= 7 ? content.projects[page - 2] : null;
  const caption = project ? project.title : page === 0 ? ui.coverCaption : page === 1 ? ui.aboutCaption : ui.contactCaption;

  return (
    <div
      ref={rootRef}
      className="relative flex size-full touch-pan-y select-none flex-col"
      onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY, t: performance.now() })}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5 && performance.now() - s.t < 800) {
          swiped.current = performance.now();
          go(page + (dx < 0 ? 1 : -1));
        }
      }}
    >
      {/* The book gets all the space above the caption strip, so the two never overlap. */}
      <div className="relative min-h-0 flex-1">
        {state === "ready" && canvases && (
          <div
            className="absolute inset-0 animate-[book-in_1.6s_ease-out_both]"
            // Fade the 3D area's lower edge so the glow never stops in a hard line above the caption.
            style={{ maskImage: "linear-gradient(to bottom, #000 91%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, #000 91%, transparent)" }}
            aria-hidden
          >
            <BookScene
              canvases={canvases}
              page={page}
              together={together}
              theme={theme ?? "dark"}
              story={story}
              motion={reduced ? INSTANT : together ? CLOSE : SLOW}
              onPick={pick}
              onOpen={openStop}
              journey={journeyCanvases}
              years={years}
              clickable={stops.map((s) => s.kind === "freelance")}
            />
          </div>
        )}

        {state === "loading" && (
          <p className="absolute inset-0 grid place-items-center text-sm text-muted" role="status">
            {ui.loading}
          </p>
        )}

        {state === "fallback" && (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-muted">
            <a href="#contents" className="underline">{ui.noWebgl}</a>
          </p>
        )}

        {state === "ready" && (
          <p
            className="pointer-events-none absolute inset-x-0 top-4 text-center text-sm text-muted transition-opacity duration-700"
            style={{ opacity: stage.kind === "lantern" || (stage.kind === "book" && !(touched && page > 0)) ? 1 : 0 }}
          >
            {stage.kind === "lantern" ? ui.lanternHint : page === 0 ? ui.hintOpen : ui.hintTurn}
          </p>
        )}
      </div>

      <div
        className="flex shrink-0 flex-col items-center gap-3 px-4 pb-5 pt-2 transition-opacity duration-500"
        // The page controls belong to the book; once the story moves on they fade out of the way.
        style={{ visibility: state === "ready" ? "visible" : "hidden", opacity: stage.kind === "book" ? 1 : 0, pointerEvents: stage.kind === "book" ? "auto" : "none" }}
      >
        <p aria-live="polite" className="flex min-h-[4.25rem] max-w-2xl flex-col items-center justify-end text-center">
          <span className="block font-display text-base font-semibold leading-snug sm:text-lg">{caption}</span>
          {project && (
            <Link
              href={project.href}
              className="mt-1 inline-block text-sm font-semibold text-accent-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
            >
              {ui.readCase}
              <span aria-hidden className="ml-1">›</span>
            </Link>
          )}
          {page === SHEETS && (
            <a href={`mailto:${ui.email}`} className="mt-1 inline-block text-sm font-semibold text-accent-ink underline underline-offset-4">
              {ui.email}
            </a>
          )}
        </p>
        <div className="flex items-center gap-3 rounded-full border border-line bg-raised/90 p-1.5 shadow-sm backdrop-blur">
          <PageButton label={ui.prev} disabled={page === 0} onClick={() => go(page - 1)} flip />
          <ol className="flex items-center gap-1.5" aria-label={`${page} / ${SHEETS}`}>
            {Array.from({ length: SHEETS + 1 }, (_, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={String(i)}
                  aria-current={i === page ? "page" : undefined}
                  className={`block h-1.5 rounded-full transition-all duration-500 ${i === page ? "w-5 bg-accent" : "w-1.5 bg-line hover:bg-muted"}`}
                />
              </li>
            ))}
          </ol>
          <PageButton label={ui.next} disabled={page === SHEETS} onClick={() => go(page + 1)} />
        </div>
      </div>

      {/* The stop in view on the thread: beside its page on wide screens, below it on phones,
          where it may use the room the page controls leave once they have faded out. */}
      {state === "ready" && <StoryPanel stage={stage} stops={stops} ui={ui} onChapters={backToChapters} />}
    </div>
  );
}

function StoryPanel({
  stage,
  stops,
  ui,
  onChapters,
}: {
  stage: Stage;
  stops: BookProps["stops"];
  ui: BookProps["ui"];
  onChapters: () => void;
}) {
  const stop = stage.kind === "chapter" ? stops[stage.index] : null;
  const visible = stage.kind === "chapter" || stage.kind === "end";
  return (
    <div
      aria-live="polite"
      className="absolute inset-x-4 bottom-4 mx-auto max-w-md rounded-2xl border border-line bg-raised/80 p-5 shadow-lg backdrop-blur transition-all duration-500 md:inset-x-auto md:bottom-auto md:right-[6%] md:top-1/2 md:w-[24rem] md:-translate-y-1/2"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
    >
      {stop && stage.kind === "chapter" && (
        <div key={stage.index} className="animate-[book-in_0.6s_ease-out_both]">
          <p className="font-display text-sm font-semibold text-accent-ink">
            {String(stage.index + 1).padStart(2, "0")} · {stop.dates}
          </p>
          <h3 className="mt-2 font-display text-xl font-bold leading-snug sm:text-2xl">{stop.company}</h3>
          <p className="mt-1 font-semibold text-accent-ink">{stop.role}</p>
          <p className="mt-0.5 text-sm text-muted">{stop.type}</p>
          <ul className="mt-3 space-y-1.5 text-[0.95rem] leading-relaxed text-ink/90">
            {stop.lines.map((l) => (
              <li key={l} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {l}
              </li>
            ))}
          </ul>
          {stop.kind === "freelance" && (
            <button
              type="button"
              onClick={onChapters}
              className="mt-4 text-sm font-semibold text-accent-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
            >
              {ui.readChapters}
              <span aria-hidden className="ml-1">›</span>
            </button>
          )}
        </div>
      )}
      {stage.kind === "end" && (
        <div className="animate-[book-in_0.6s_ease-out_both]">
          <h3 className="font-display text-xl font-bold leading-snug sm:text-2xl">{ui.contact}</h3>
          <p className="mt-3 flex flex-col gap-1 text-sm font-semibold text-accent-ink">
            <a href={`mailto:${ui.email}`} className="underline underline-offset-4">
              {ui.email}
            </a>
            <a href={ui.linkedin} className="underline underline-offset-4">
              LinkedIn
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

function PageButton({ label, disabled, onClick, flip }: { label: string; disabled: boolean; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full text-ink transition-colors hover:bg-accent-wash disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg viewBox="0 0 16 16" className={`size-4 ${flip ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 3l5 5-5 5" />
      </svg>
    </button>
  );
}
