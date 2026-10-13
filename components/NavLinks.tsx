"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/content/types";

/** Desktop nav that highlights the section currently in view (home page only). */
export function NavLinks({ lang, items }: { lang: Lang; items: { id: string; label: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

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
            href={`/${lang}/#${n.id}`}
            aria-current={active === n.id ? "true" : undefined}
            className="relative text-muted transition-colors hover:text-ink aria-[current]:text-ink aria-[current]:after:absolute aria-[current]:after:-bottom-1.5 aria-[current]:after:left-0 aria-[current]:after:h-0.5 aria-[current]:after:w-full aria-[current]:after:rounded-full aria-[current]:after:bg-accent"
          >
            {n.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
