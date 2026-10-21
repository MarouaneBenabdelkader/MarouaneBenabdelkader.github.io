"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildFaces, type BookContent, type BookTheme } from "./pages";
import type { Motion } from "./BookScene";

const BookScene = dynamic(() => import("./BookScene"), { ssr: false });

export type BookProps = {
  content: Omit<BookContent, "projects" | "covers"> & {
    projects: (Omit<BookContent["projects"][number], "image"> & { image: Record<BookTheme, string>; href: string })[];
  };
  covers: { front: string; frontGlow: string; back: string; backGlow: string };
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
  };
};

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

export function BookExperience({ content, covers, ui }: BookProps) {
  const [state, setState] = useState<"loading" | "ready" | "fallback">("loading");
  const [canvases, setCanvases] = useState<ReturnType<typeof buildFaces> | null>(null);
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
        setState("ready");
      } catch {
        if (!cancelled) setState("fallback");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [content, covers, theme, single]);

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

  // Scrolling down closes an open book; scrolling back to the top reopens it where it was.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const p = pageRef.current;
      if (y > 60 && p > 0 && p < SHEETS) {
        reopenAt.current = p;
        setTogether(true);
        setPage(0);
      } else if (y < 20 && p === 0 && reopenAt.current !== null) {
        const back = reopenAt.current;
        reopenAt.current = null;
        setTogether(true);
        setPage(back);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const project = page >= 2 && page <= 7 ? content.projects[page - 2] : null;
  const caption = project ? project.title : page === 0 ? ui.coverCaption : page === 1 ? ui.aboutCaption : ui.contactCaption;

  return (
    <div
      className="flex size-full touch-pan-y select-none flex-col"
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
              motion={reduced ? INSTANT : together ? CLOSE : SLOW}
              onPick={pick}
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
            style={{ opacity: touched && page > 0 ? 0 : 1 }}
          >
            {page === 0 ? ui.hintOpen : ui.hintTurn}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-3 px-4 pb-5 pt-2" style={{ visibility: state === "ready" ? "visible" : "hidden" }}>
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
