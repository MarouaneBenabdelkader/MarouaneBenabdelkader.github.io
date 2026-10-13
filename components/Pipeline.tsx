import { tr, type Lang } from "@/content/types";
import type { Diagram } from "@/content/diagrams";

// Spelled out so Tailwind sees the full class names.
const COLS: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" };

/**
 * Renders a diagram as a vertical flow: each step is a row of one or more stages,
 * joined to the next step by a short connector with an arrowhead.
 */
export function Pipeline({ diagram, lang, label }: { diagram: Diagram; lang: Lang; label: string }) {
  return (
    <figure aria-label={label} className="rounded-2xl border border-line bg-raised p-4 sm:p-8">
      <ol className="flex flex-col items-stretch">
        {diagram.map((step, i) => (
          <li key={i} className="flex flex-col items-center">
            {i > 0 && (
              <svg viewBox="0 0 12 28" className="h-7 w-3 text-accent" aria-hidden>
                <path d="M6 0V24" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 20l4 5 4-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            )}
            <div className={`grid w-full gap-3 ${COLS[step.length] ?? "max-w-sm"}`}>
              {step.map((stage) => (
                <div key={stage.label.en} className="rounded-xl border border-line bg-paper px-4 py-3 text-center">
                  <p className="font-display font-semibold leading-snug">{tr(stage.label, lang)}</p>
                  <p className="mt-0.5 text-sm leading-snug text-muted">{tr(stage.detail, lang)}</p>
                  {stage.tools && <p className="mt-1.5 text-xs font-semibold text-accent-ink">{stage.tools}</p>}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
