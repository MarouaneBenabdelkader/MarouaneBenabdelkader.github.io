import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLang, tr } from "@/content/types";
import { projects } from "@/content/projects";
import { profile } from "@/content/profile";
import { ui } from "@/content/ui";
import { book, chapters } from "@/content/book";
import { BookExperience, type BookProps } from "@/components/book/BookExperience";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: tr(book.metaTitle, lang),
    description: tr(book.metaDescription, lang),
    alternates: { languages: { en: "/en/book/", fr: "/fr/book/" } },
  };
}

export default async function BookPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const entries = projects.map((p) => {
    const ch = chapters[p.slug];
    return {
      slug: p.slug,
      href: `/${lang}/work/${p.slug}/`,
      title: tr(p.title, lang),
      sector: tr(p.sector, lang),
      headline: tr(ch.headline, lang),
      hook: tr(ch.hook, lang),
      how: ch.how.map((line) => tr(line, lang)),
      result: tr(ch.result, lang),
      stack: p.stack,
      credit: p.kind === "codito" ? tr(ui.coditoTitle, lang) : tr(book.directClient, lang),
      // One illustration per theme: glowing lines on dark paper, ink on light paper.
      image: { dark: `/book/dark/${p.slug}.jpg`, light: `/book/light/${p.slug}.jpg` },
    };
  });

  const props: BookProps = {
    covers: {
      front: "/book/cover.jpg",
      frontGlow: "/book/cover-glow.jpg",
      back: "/book/cover-back.jpg",
      backGlow: "/book/cover-back-glow.jpg",
    },
    content: {
      name: profile.name,
      title: tr(profile.title, lang),
      lines: [tr(ui.status, lang), tr(ui.availability, lang)],
      foreword: tr(book.foreword, lang),
      challengeLabel: tr(book.challengeLabel, lang),
      howLabel: tr(book.howLabel, lang),
      resultLabel: tr(book.resultLabel, lang),
      contents: tr(book.contents, lang),
      coverSubtitle: tr(book.coverSubtitle, lang),
      backTitle: tr(book.backTitle, lang),
      chapter: tr(book.chapter, lang),
      contact: [profile.email, profile.linkedin.replace(/^https:\/\/www\./, "").replace(/\/$/, ""), profile.github.replace(/^https:\/\//, "")],
      projects: entries,
    },
    ui: {
      loading: tr(book.loading, lang),
      hintOpen: tr(book.hintOpen, lang),
      hintTurn: tr(book.hintTurn, lang),
      prev: tr(book.prev, lang),
      next: tr(book.next, lang),
      noWebgl: tr(book.noWebgl, lang),
      coverCaption: tr(book.coverCaption, lang),
      aboutCaption: tr(book.aboutCaption, lang),
      contactCaption: tr(book.contactCaption, lang),
      readCase: tr(ui.readCase, lang),
      email: profile.email,
      lanternHint: tr(book.lanternHint, lang),
      contact: tr(book.backTitle, lang),
      linkedin: profile.linkedin,
    },
  };

  return (
    <>
      <h1 className="sr-only">
        {profile.name}, {tr(book.metaTitle, lang)}
      </h1>
      {/* A tall section scrolled through while the stage stays pinned: the book, then the lantern,
          then the chapters along their thread. */}
      <section data-story className="stage relative" style={{ height: "620svh" }}>
        <div className="stage sticky top-16 h-[calc(100svh-4rem)] min-h-[34rem] overflow-hidden">
          <BookExperience {...props} />
        </div>
      </section>

      <section id="contents" aria-labelledby="contents-title" className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
          <h2 id="contents-title" className="font-display text-2xl font-bold tracking-tight">
            {tr(book.contents, lang)}
          </h2>
          <ol className="mt-6">
            {entries.map((p, i) => (
              <li key={p.slug} className="border-t border-line first:border-t-0">
                <Link href={p.href} className="group grid grid-cols-[2rem_1fr] gap-3 py-5">
                  <span className="font-display font-bold text-accent-ink tabular-nums">{i + 1}</span>
                  <span>
                    <span className="block text-sm text-muted">{p.sector}</span>
                    <span className="mt-1 block font-display text-lg font-semibold leading-snug group-hover:text-accent-ink">
                      {p.title}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-sm">
            <Link href={`/${lang}/`} className="font-semibold text-accent-ink underline underline-offset-4">
              {tr(book.classic, lang)}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
