"use client";

import { useRef } from "react";
import type { Lang } from "@/content/types";
import type { NavItem } from "./NavLinks";

/** Phone-width menu: a native disclosure that closes once a link is chosen. */
export function MobileMenu({ lang, label, items }: { lang: Lang; label: string; items: NavItem[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className="group relative md:hidden">
      <summary
        aria-label={label}
        className="grid size-9 cursor-pointer list-none place-items-center rounded-full text-muted hover:bg-accent-wash hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-5 group-open:hidden" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 24 24" className="hidden size-5 group-open:block" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </summary>
      <nav aria-label="Mobile" className="absolute right-0 top-12 w-48 rounded-2xl border border-line bg-raised p-2 shadow-lg shadow-black/10">
        {items.map((n) => (
          <a
            key={n.id}
            href={n.href ?? `/${lang}/#${n.id}`}
            onClick={() => ref.current?.removeAttribute("open")}
            className="block rounded-xl px-3 py-2.5 text-sm hover:bg-accent-wash"
          >
            {n.label}
          </a>
        ))}
      </nav>
    </details>
  );
}
