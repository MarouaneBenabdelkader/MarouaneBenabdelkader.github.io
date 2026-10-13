import Link from "next/link";
import { tr, type Lang, type Project } from "@/content/types";
import { projects } from "@/content/projects";
import { ui } from "@/content/ui";
import { Chips, Section } from "./Section";

function ProjectRow({ project, lang }: { project: Project; lang: Lang }) {
  const href = `/${lang}/work/${project.slug}/`;
  return (
    <li className="group relative grid gap-3 border-t border-line py-7 first:border-t-0 lg:grid-cols-[1fr_13rem] lg:gap-10">
      <div>
        <p className="text-sm text-muted">{tr(project.sector, lang)}</p>
        <h4 className="mt-1.5 font-display text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          <Link href={href} className="after:absolute after:inset-0 group-hover:text-accent-ink">
            {tr(project.title, lang)}
          </Link>
        </h4>
        <p className="mt-2 max-w-2xl leading-relaxed text-muted">{tr(project.summary, lang)}</p>
        <p className="mt-3 text-sm font-semibold text-accent-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-current">
          {tr(ui.readCase, lang)}
        </p>
      </div>
      <div className="lg:pt-7">
        <Chips items={project.stack} />
      </div>
    </li>
  );
}

export function Work({ lang }: { lang: Lang }) {
  const codito = projects.filter((p) => p.kind === "codito");
  const direct = projects.filter((p) => p.kind === "direct");
  return (
    <Section id="work" title={tr(ui.workTitle, lang)} aside={tr(ui.workEyebrow, lang)}>
      <p className="max-w-2xl text-lg leading-relaxed">{tr(ui.workIntro, lang)}</p>

      <div className="mt-12">
        <h3 className="font-display text-lg font-bold">{tr(ui.coditoTitle, lang)}</h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{tr(ui.coditoIntro, lang)}</p>
        <ul className="mt-4">
          {codito.map((p) => (
            <ProjectRow key={p.slug} project={p} lang={lang} />
          ))}
        </ul>
      </div>

      <div className="mt-12">
        <h3 className="font-display text-lg font-bold">{tr(ui.directTitle, lang)}</h3>
        <ul className="mt-4">
          {direct.map((p) => (
            <ProjectRow key={p.slug} project={p} lang={lang} />
          ))}
        </ul>
      </div>
    </Section>
  );
}
