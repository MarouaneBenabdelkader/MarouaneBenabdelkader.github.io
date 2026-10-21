import Link from "next/link";
import { tr, type Lang } from "@/content/types";
import { ui } from "@/content/ui";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";

export function Header({ lang }: { lang: Lang }) {
  const nav = [
    { id: "work", label: tr(ui.navWork, lang) },
    { id: "book", label: tr(ui.navBook, lang), href: `/${lang}/book/` },
    { id: "experience", label: tr(ui.navExperience, lang) },
    { id: "skills", label: tr(ui.navSkills, lang) },
    { id: "contact", label: tr(ui.navContact, lang) },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-8">
        <Link href={`/${lang}/`} className="font-display text-lg font-bold tracking-tight">
          Marouane<span className="text-accent">.</span>
        </Link>
        <nav aria-label="Main" className="ml-auto hidden md:block">
          <NavLinks lang={lang} items={nav} />
        </nav>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <LangToggle lang={lang} label={tr(ui.langToggle, lang)} />
          <ThemeToggle label={tr(ui.themeToggle, lang)} />
          <MobileMenu lang={lang} label={tr(ui.menu, lang)} items={nav} />
        </div>
      </div>
    </header>
  );
}
