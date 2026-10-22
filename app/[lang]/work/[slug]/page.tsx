import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LANGS, isLang, tr, type Lang } from "@/content/types";
import { getProject, projects } from "@/content/projects";
import { diagrams } from "@/content/diagrams";
import { ui } from "@/content/ui";
import { Chips } from "@/components/Section";
import { Pipeline } from "@/components/Pipeline";
import { ScrollProgress } from "@/components/Motion";

type Params = Promise<{ lang: string; slug: string }>;

export const dynamicParams = false;
export const generateStaticParams = () =>
  LANGS.flatMap((lang) => projects.map((p) => ({ lang, slug: p.slug })));

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!isLang(lang) || !project) return {};
  return {
    title: tr(project.title, lang),
    description: tr(project.summary, lang),
    alternates: { languages: { en: `/en/work/${slug}/`, fr: `/fr/work/${slug}/` } },
  };
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section data-reveal className="grid gap-4 border-t border-line py-10 md:grid-cols-[12rem_1fr] md:gap-12">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="min-w-0 text-[1.0625rem]">{children}</div>
    </section>
  );
}

function Neighbour({ lang, index, dir }: { lang: Lang; index: number; dir: "previous" | "next" }) {
  const p = projects[(index + projects.length) % projects.length];
  return (
    <Link
      href={`/${lang}/work/${p.slug}/`}
      className={`group block rounded-2xl border border-line p-5 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-ink ${dir === "next" ? "sm:text-right" : ""}`}
    >
      <span className="text-sm text-muted">{tr(dir === "next" ? ui.next : ui.previous, lang)}</span>
      <span className="mt-1 block font-display font-semibold leading-snug group-hover:text-accent-ink">{tr(p.title, lang)}</span>
    </Link>
  );
}

export default async function CaseStudy({ params }: { params: Params }) {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!isLang(lang) || !project) notFound();
  const index = projects.indexOf(project);
  const diagram = diagrams[slug];

  return (
    <article className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
      <ScrollProgress />
      <header className="rise grid gap-10 pb-12 pt-10 md:grid-cols-[minmax(0,1fr)_17rem] md:items-end md:pt-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
        <Link href={`/${lang}/#work`} className="text-sm text-muted hover:text-ink">
          {tr(ui.backHome, lang)}
        </Link>
        <p className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{tr(project.kind === "codito" ? ui.withCodito : ui.directClient, lang)}</span>
          <span className="rounded-full bg-accent-wash px-2.5 py-0.5 font-semibold text-accent-ink">{tr(project.sector, lang)}</span>
        </p>
        <h1 className="mt-3 max-w-4xl font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
          {tr(project.title, lang)}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{tr(project.summary, lang)}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Chips items={project.stack} />
          {project.link && (
            <a href={project.link} target="_blank" rel="noopener" className="font-semibold text-accent-ink underline">
              {tr(ui.visitSite, lang)}
            </a>
          )}
        </div>
        </div>
        {/* The project's page from the book: glowing lines in the dark theme, ink in the light one. */}
        <figure aria-hidden className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-line shadow-xl shadow-black/15 md:mx-0 md:max-w-none">
          <img src={`/book/light/${slug}.jpg`} alt="" width={1536} height={2057} className="block aspect-[3/4] w-full object-cover dark:hidden" />
          <img src={`/book/dark/${slug}.jpg`} alt="" width={1536} height={2057} className="hidden aspect-[3/4] w-full object-cover dark:block" />
          <Link
            href={`/${lang}/book/`}
            tabIndex={-1}
            className="absolute inset-x-3 bottom-3 rounded-full bg-paper/85 px-3 py-1.5 text-center text-xs font-semibold text-accent-ink backdrop-blur transition-colors hover:bg-paper"
          >
            {tr(ui.seeInBook, lang)}
          </Link>
        </figure>
      </header>

      <Block title={tr(ui.context, lang)}>
        <p className="max-w-2xl leading-relaxed">{tr(project.context, lang)}</p>
      </Block>
      <Block title={tr(ui.problem, lang)}>
        <p className="max-w-2xl leading-relaxed">{tr(project.problem, lang)}</p>
      </Block>
      <Block title={tr(ui.built, lang)}>
        <ul className="max-w-2xl space-y-3 leading-relaxed">
          {project.built.map((b) => (
            <li key={b.en} className="relative pl-5 before:absolute before:left-0 before:top-[0.65em] before:size-2 before:rounded-full before:bg-accent">
              {tr(b, lang)}
            </li>
          ))}
        </ul>
      </Block>
      {diagram && (
        <Block title={tr(ui.architecture, lang)}>
          <Pipeline diagram={diagram} lang={lang} label={`${tr(ui.architecture, lang)}: ${tr(project.title, lang)}`} />
        </Block>
      )}
      <Block title={tr(ui.decisions, lang)}>
        <dl className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {project.decisions.map((d) => (
            <div key={d.title.en} className="border-l-2 border-accent pl-4">
              <dt className="font-display text-lg font-semibold leading-snug">{tr(d.title, lang)}</dt>
              <dd className="mt-2 leading-relaxed text-muted">{tr(d.body, lang)}</dd>
            </div>
          ))}
        </dl>
      </Block>
      <Block title={tr(ui.statusLabel, lang)}>
        <p className="flex max-w-2xl items-start gap-2 leading-relaxed">
          <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-hidden />
          {tr(project.status, lang)}
        </p>
      </Block>

      <nav data-reveal aria-label={tr(ui.backHome, lang)} className="grid gap-4 border-t border-line pt-10 sm:grid-cols-2">
        <Neighbour lang={lang} index={index - 1} dir="previous" />
        <Neighbour lang={lang} index={index + 1} dir="next" />
      </nav>
    </article>
  );
}
