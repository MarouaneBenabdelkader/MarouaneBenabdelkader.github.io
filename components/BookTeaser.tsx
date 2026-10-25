import Link from "next/link";
import { tr, type Lang } from "@/content/types";
import { ui } from "@/content/ui";
import { Section } from "./Section";

/** Invites visitors into the 3D book: its glowing cover, a line on what is inside, a button. */
export function BookTeaser({ lang }: { lang: Lang }) {
  return (
    <Section id="book" title={tr(ui.bookTeaserTitle, lang)}>
      <Link
        href={`/${lang}/book/`}
        data-reveal
        className="group grid items-center gap-8 overflow-hidden rounded-3xl border border-line bg-[radial-gradient(ellipse_at_30%_50%,#0f2522,#050a09_70%)] p-6 text-[#e4edeb] sm:grid-cols-[10rem_1fr] sm:p-8 md:gap-10"
      >
        <span className="relative mx-auto block w-36 sm:w-40">
          <span aria-hidden className="absolute -inset-6 rounded-full bg-[#41c7b6]/20 blur-2xl transition-opacity duration-700 group-hover:opacity-100 sm:opacity-60" />
          <img
            src="/book/cover.jpg"
            alt={tr(ui.bookCoverAlt, lang)}
            width={1280}
            height={1714}
            className="relative block w-full rounded-md shadow-2xl shadow-black/60 transition-transform duration-700 [transform:perspective(700px)_rotateY(-14deg)] group-hover:[transform:perspective(700px)_rotateY(-4deg)_translateY(-4px)]"
          />
        </span>
        <span className="block">
          <span className="block max-w-xl text-lg leading-relaxed text-[#cfe0dc]">{tr(ui.bookTeaser, lang)}</span>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#41c7b6] px-5 py-2.5 text-sm font-semibold text-[#06201c] transition-transform group-hover:-translate-y-0.5">
            {tr(ui.openBook, lang)}
            <span aria-hidden className="transition-transform group-hover:translate-x-1">›</span>
          </span>
        </span>
      </Link>
    </Section>
  );
}
