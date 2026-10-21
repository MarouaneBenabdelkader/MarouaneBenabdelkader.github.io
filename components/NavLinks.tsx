"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Lang } from "@/content/types";

/** A nav entry: a section of the home page, or a page of its own when it has an href. */
export type NavItem = { id: string; label: string; href?: string };

/** Desktop nav that highlights the section in view on the home page, or the page you are on. */
export function NavLinks({ lang, items }: { lang: Lang; items: NavItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      // A section counts as current while it crosses the upper third of the viewport.
      { rootMargin: "-30% 0px -65% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    // Above the first section (the hero), nothing is current.
    const onScroll = () => {
      if (window.scrollY + window.innerHeight * 0.3 < sections[0].offsetTop) setActive(null);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [items]);

  return (
    <ul className="flex gap-6 text-sm">
      {items.map((n) => (
        <li key={n.id}>
          <a
            href={n.href ?? `/${lang}/#${n.id}`}
            aria-current={(n.href ? pathname.startsWith(n.href.replace(/\/$/, "")) : active === n.id) ? "page" : undefined}
            className="relative text-muted transition-colors hover:text-ink aria-[current]:text-ink aria-[current]:after:absolute aria-[current]:after:-bottom-1.5 aria-[current]:after:left-0 aria-[current]:after:h-0.5 aria-[current]:after:w-full aria-[current]:after:rounded-full aria-[current]:after:bg-accent"
          >
            {n.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
