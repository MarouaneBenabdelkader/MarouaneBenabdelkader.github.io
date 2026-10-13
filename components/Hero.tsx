import { tr, type Lang } from "@/content/types";
import { profile } from "@/content/profile";
import { ui } from "@/content/ui";

const specialties = [
  { en: "RAG & knowledge", fr: "RAG & connaissance", x: 6, y: 18, anchor: "start" as const },
  { en: "Agentic workflows", fr: "Workflows agentiques", x: 394, y: 18, anchor: "end" as const },
  { en: "Computer vision", fr: "Vision par ordinateur", x: 6, y: 392, anchor: "start" as const },
  { en: "Automation", fr: "Automatisation", x: 394, y: 392, anchor: "end" as const },
];

/** Wires from each corner label into the portrait; they draw once on load (see .draw in globals.css). */
function Schematic({ lang }: { lang: Lang }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[400px]">
      <svg viewBox="0 0 400 400" className="draw absolute inset-0 size-full text-accent" fill="none" aria-hidden>
        {/* The portrait occupies x 70–330, y 40–365 (4:5); wires land on its sides. */}
        <path className="wire" pathLength={1} d="M10 30 H30 Q45 30 45 45 V125 Q45 140 60 140 H70" stroke="currentColor" strokeWidth="1.5" />
        <path className="wire" pathLength={1} d="M390 30 H370 Q355 30 355 45 V125 Q355 140 340 140 H330" stroke="currentColor" strokeWidth="1.5" />
        <path className="wire" pathLength={1} d="M10 370 H30 Q45 370 45 355 V280 Q45 265 60 265 H70" stroke="currentColor" strokeWidth="1.5" />
        <path className="wire" pathLength={1} d="M390 370 H370 Q355 370 355 355 V280 Q355 265 340 265 H330" stroke="currentColor" strokeWidth="1.5" />
        {[[70, 140], [330, 140], [70, 265], [330, 265]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.5" fill="currentColor" />
        ))}
        {specialties.map((s) => (
          <text key={s.en} x={s.x} y={s.y} textAnchor={s.anchor} className="fill-muted font-sans text-[13px]">
            {s[lang]}
          </text>
        ))}
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/profile.jpg"
        alt={profile.name}
        width={260}
        height={325}
        className="absolute left-[17.5%] top-[10%] h-[81.25%] w-[65%] rounded-[2rem] border border-line object-cover"
      />
    </div>
  );
}

export function Hero({ lang }: { lang: Lang }) {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-8 md:grid-cols-[1.25fr_1fr] md:pb-24 md:pt-20">
      <div>
        <ul className="space-y-1.5 text-sm text-muted">
          {[ui.status, ui.availability].map((line) => (
            <li key={line.en} className="flex items-start gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
              {tr(line, lang)}
            </li>
          ))}
        </ul>
        <h1 className="mt-6 font-display text-[clamp(2.75rem,8vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.035em]">
          Marouane
          <br />
          Benabdelkader
        </h1>
        <p className="mt-6 max-w-xl font-display text-xl font-medium leading-snug text-accent-ink sm:text-2xl">
          {tr(profile.title, lang)}
        </p>
        <p className="mt-5 max-w-xl leading-relaxed text-muted">{tr(profile.pitch, lang)}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#work"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85"
          >
            {tr(ui.seeWork, lang)}
          </a>
          <a
            href={profile.cv}
            download
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-ink"
          >
            {tr(ui.downloadCv, lang)}
          </a>
        </div>
      </div>
      <Schematic lang={lang} />
    </div>
  );
}
