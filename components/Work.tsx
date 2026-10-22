import Link from "next/link";
import { tr, type Lang, type Project } from "@/content/types";
import { projects } from "@/content/projects";
import { diagrams } from "@/content/diagrams";
import { ui } from "@/content/ui";
import { Chips, Section } from "./Section";
import { Logo, logos } from "./Logo";

/** One-line preview of the architecture: the first stage of each step, joined by chevrons. */
function MiniFlow({ slug, lang }: { slug: string; lang: Lang }) {
  const steps = diagrams[slug];
  if (!steps) return null;
  return (
    <ol aria-hidden className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      {steps.map((step, i) => (
        <li key={i} className="flex items-center gap-1.5" style={{ "--i": i } as React.CSSProperties}>
          {i > 0 && (
            <svg viewBox="0 0 8 12" className="h-2.5 w-2 text-accent" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 2l4 4-4 4" />
            </svg>
          )}
          <span className="flow-chip flex items-center gap-1.5 rounded-md bg-accent-wash px-2 py-0.5 font-medium text-accent-ink">
            <span className="size-1.5 rounded-full" style={{ background: `var(--kind-${step[0].kind})` }} />
            {tr(step[0].label, lang)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ProjectRow({ project, lang, index }: { project: Project; lang: Lang; index: number }) {
  const href = `/${lang}/work/${project.slug}/`;
  return (
    <li
      data-reveal
      style={{ "--i": index % 2 } as React.CSSProperties}
      className="group relative -mx-4 rounded-2xl border-t border-line px-4 py-7 transition-colors first:border-t-0 hover:bg-raised"
    >
      <div>
        <p className="text-sm text-muted">{tr(project.sector, lang)}</p>
        <h4 className="mt-1.5 font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          <Link href={href} className="after:absolute after:inset-0 group-hover:text-accent-ink">
            {tr(project.title, lang)}
          </Link>
        </h4>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">{tr(project.summary, lang)}</p>
        <div className="mt-4">
          <Chips items={project.stack} />
        </div>
        <MiniFlow slug={project.slug} lang={lang} />
        <p className="mt-3 text-sm font-semibold text-accent-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-current">
          {tr(ui.readCase, lang)}
          <span aria-hidden className="ml-1 inline-block transition-transform group-hover:translate-x-1">›</span>
        </p>
      </div>
    </li>
  );
}

export function Work({ lang }: { lang: Lang }) {
  const codito = projects.filter((p) => p.kind === "codito");
  const direct = projects.filter((p) => p.kind === "direct");
  return (
    <Section id="work" title={tr(ui.workTitle, lang)} aside={tr(ui.workEyebrow, lang)}>
      <p data-reveal className="max-w-2xl text-lg leading-relaxed">{tr(ui.workIntro, lang)}</p>

      <div className="mt-12">
        <div data-reveal className="flex items-start gap-4">
          <Logo logo={logos.codito} label="Codito Ergo Sum" height={52} className="text-accent" />
          <div>
            <h3 className="font-display text-lg font-bold">{tr(ui.coditoTitle, lang)}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{tr(ui.coditoIntro, lang)}</p>
          </div>
        </div>
        <ul className="mt-4">
          {codito.map((p, i) => (
            <ProjectRow key={p.slug} project={p} lang={lang} index={i} />
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <h3 className="font-display text-lg font-bold">{tr(ui.directTitle, lang)}</h3>
        <ul className="mt-4">
          {direct.map((p, i) => (
            <ProjectRow key={p.slug} project={p} lang={lang} index={i} />
          ))}
        </ul>
      </div>
    </Section>
  );
}
