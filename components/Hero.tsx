import { tr, type Lang } from "@/content/types";
import { profile } from "@/content/profile";
import { ui } from "@/content/ui";
import { HeroPortrait } from "./Motion";

const specialties = [
  { en: "RAG & knowledge", fr: "RAG & connaissance", x: 6, y: 18, anchor: "start" as const },
  { en: "Agentic workflows", fr: "Workflows agentiques", x: 394, y: 18, anchor: "end" as const },
  { en: "Computer vision", fr: "Vision par ordinateur", x: 6, y: 392, anchor: "start" as const },
  { en: "Automation", fr: "Automatisation", x: 394, y: 392, anchor: "end" as const },
];

// The portrait occupies x 70–330, y 40–365 (4:5); wires run from each label to its sides.
const wires = [
  "M10 30 H30 Q45 30 45 45 V125 Q45 140 60 140 H70",
  "M390 30 H370 Q355 30 355 45 V125 Q355 140 340 140 H330",
  "M10 370 H30 Q45 370 45 355 V280 Q45 265 60 265 H70",
  "M390 370 H370 Q355 370 355 355 V280 Q355 265 340 265 H330",
];

/**
 * Wires from each specialty into the portrait. They draw once on load (.draw), then
 * signals keep travelling along them toward the photo (.signal + animateMotion).
 */
function Schematic({ lang }: { lang: Lang }) {
  return (
    <div className="rise relative mx-auto aspect-square w-full max-w-[400px]" style={{ "--i": 2 } as React.CSSProperties}>
      <svg viewBox="0 0 400 400" className="draw absolute inset-0 size-full text-accent" fill="none" aria-hidden>
        {wires.map((d, i) => (
          <path key={d} id={`wire-${i}`} className="wire" pathLength={1} d={d} stroke="currentColor" strokeWidth="1.5" />
        ))}
        {[[70, 140], [330, 140], [70, 265], [330, 265]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} className="signal" cx={cx} cy={cy} r="3.5" fill="currentColor" />
        ))}
        {/* Negative begin offsets start every signal mid-path at t=0, so none waits at the SVG origin. */}
        {wires.map((d, i) => (
          <circle key={`signal-${d}`} className="signal" r="3" fill="currentColor">
            <animateMotion dur="2.8s" begin={`${-i * 0.7}s`} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
              <mpath href={`#wire-${i}`} />
            </animateMotion>
          </circle>
        ))}
        {specialties.map((s) => (
          <text key={s.en} x={s.x} y={s.y} textAnchor={s.anchor} className="fill-muted font-sans text-[13px]">
            {s[lang]}
          </text>
        ))}
      </svg>
      <HeroPortrait src="/images/profile.jpg" alt={tr(ui.portraitAlt, lang)} />
    </div>
  );
}

const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function Hero({ lang }: { lang: Lang }) {
  return (
    // Fills one screen below the 4rem header, content centred, so the buttons sit above the fold on load.
    <div className="mx-auto grid max-w-6xl content-center items-center gap-10 px-4 pb-12 pt-8 sm:px-8 md:min-h-[calc(100svh-4rem)] md:grid-cols-[1.25fr_1fr] md:gap-12 md:py-8">
      <div>
        <ul className="rise space-y-1.5 text-sm text-muted" style={stagger(0)}>
          {[ui.status, ui.availability].map((line) => (
            <li key={line.en} className="flex items-start gap-2">
              <span className="ping relative mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
              {tr(line, lang)}
            </li>
          ))}
        </ul>
        <h1
          className="rise mt-6 font-display text-[clamp(2.75rem,min(8vw,10.5svh),5.5rem)] font-extrabold leading-[0.95] tracking-[-0.035em]"
          style={stagger(1)}
        >
          Marouane
          <br />
          Benabdelkader
        </h1>
        <p className="rise mt-6 max-w-xl font-display text-xl font-medium leading-snug text-accent-ink sm:text-2xl" style={stagger(2)}>
          {tr(profile.title, lang)}
        </p>
        <p className="rise mt-5 max-w-xl leading-relaxed text-muted" style={stagger(3)}>
          {tr(profile.pitch, lang)}
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3" style={stagger(4)}>
          <a
            href="#work"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-[transform,opacity] hover:-translate-y-0.5 hover:opacity-90"
          >
            {tr(ui.seeWork, lang)}
          </a>
          <a
            href={tr(profile.cv, lang)}
            download
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-[transform,border-color] hover:-translate-y-0.5 hover:border-ink"
          >
            {tr(ui.downloadCv, lang)}
          </a>
        </div>
      </div>
      <Schematic lang={lang} />
    </div>
  );
}
