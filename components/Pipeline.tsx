import { tr, type Lang, type T } from "@/content/types";
import type { Diagram, StageKind } from "@/content/diagrams";

const KIND_LABEL: Record<StageKind, T> = {
  io: { en: "Input / output", fr: "Entrée / sortie" },
  ai: { en: "AI / agent", fr: "IA / agent" },
  logic: { en: "Rules & processing", fr: "Règles & traitement" },
  data: { en: "Data & search", fr: "Données & recherche" },
  app: { en: "Interface", fr: "Interface" },
};

const PARALLEL: T = { en: "In parallel", fr: "En parallèle" };

/** Colour for each role; the CSS variables are defined for both themes in globals.css. */
const kindVar = (kind: StageKind) => ({ "--k": `var(--kind-${kind})` }) as React.CSSProperties;

/**
 * A diagram as numbered steps on a vertical rail. Each stage is a card coloured by its role
 * (legend on top); stages sharing a step run in parallel and sit side by side.
 */
export function Pipeline({ diagram, lang, label }: { diagram: Diagram; lang: Lang; label: string }) {
  const kinds = (Object.keys(KIND_LABEL) as StageKind[]).filter((k) => diagram.some((step) => step.some((s) => s.kind === k)));
  return (
    <figure aria-label={label} className="rounded-2xl border border-line bg-raised p-4 sm:p-7">
      <ul className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
        {kinds.map((k) => (
          <li key={k} className="flex items-center gap-2" style={kindVar(k)}>
            <span aria-hidden className="size-2.5 rounded-full bg-[var(--k)]" />
            {tr(KIND_LABEL[k], lang)}
          </li>
        ))}
      </ul>
      <ol>
        {diagram.map((step, i) => {
          const last = i === diagram.length - 1;
          return (
            <li
              key={i}
              data-reveal
              style={{ "--i": i } as React.CSSProperties}
              className="relative grid grid-cols-[2rem_1fr] gap-3 pb-5 last:pb-0 sm:grid-cols-[2.25rem_1fr] sm:gap-4"
            >
              {/* Rail: step number with a line running down to the next step. */}
              <div className="relative flex justify-center">
                {!last && <span aria-hidden className="rail absolute -bottom-5 top-8 w-0.5 sm:top-9" />}
                <span className="relative z-10 grid size-8 place-items-center rounded-full border border-line bg-paper font-display text-sm font-bold tabular-nums sm:size-9">
                  {i + 1}
                </span>
              </div>
              <div>
                {step.length > 1 && <p className="mb-1.5 text-xs font-semibold text-muted">{tr(PARALLEL, lang)}</p>}
                <div className={`grid gap-3 ${step.length === 2 ? "md:grid-cols-2" : step.length === 3 ? "md:grid-cols-3" : ""}`}>
                  {step.map((stage) => (
                    <div
                      key={stage.label.en}
                      style={kindVar(stage.kind)}
                      className="rounded-xl border border-line border-l-[3px] border-l-[var(--k)] bg-paper px-4 py-3 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10"
                    >
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="font-display text-[1.0625rem] font-semibold leading-snug">{tr(stage.label, lang)}</span>
                        <span className="sr-only">({tr(KIND_LABEL[stage.kind], lang)})</span>
                      </p>
                      <p className="mt-1 text-[0.9375rem] leading-snug text-muted">{tr(stage.detail, lang)}</p>
                      {stage.tools && (
                        <ul className="mt-2.5 flex flex-wrap gap-1.5">
                          {stage.tools.split(", ").map((tool) => (
                            <li key={tool} className="rounded-md bg-[color-mix(in_srgb,var(--k)_14%,transparent)] px-2 py-0.5 text-[0.8125rem] font-semibold text-ink">
                              {tool}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
