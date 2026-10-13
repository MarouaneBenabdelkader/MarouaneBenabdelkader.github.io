"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "@/content/types";

/** Swaps the language segment so /en/work/x/ and /fr/work/x/ point at each other. */
export function switchLangPath(pathname: string, to: Lang) {
  const rest = pathname.replace(/^\/(en|fr)(?=\/|$)/, "").replace(/\/+$/, "");
  return `/${to}${rest}/`;
}

export function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const pathname = usePathname() ?? `/${lang}/`;
  const other: Lang = lang === "en" ? "fr" : "en";
  return (
    <Link
      href={switchLangPath(pathname, other)}
      hrefLang={other}
      aria-label={label}
      title={label}
      className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:bg-accent-wash hover:text-ink"
    >
      {other.toUpperCase()}
    </Link>
  );
}
