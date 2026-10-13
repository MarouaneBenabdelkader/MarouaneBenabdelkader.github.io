"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Adds `is-visible` to every [data-reveal] element as it scrolls into view. Re-scans on navigation. */
export function RevealOnScroll() {
  const pathname = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-visible");
          observer.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}

/** Thin accent bar at the top showing how far the page has been read. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty("transform", `scaleX(${max > 0 ? window.scrollY / max : 0})`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-0.5">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
    </div>
  );
}

/** Portrait that tilts slightly toward the pointer (mouse only; off for reduced motion via CSS). */
export function HeroPortrait({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
    ref.current.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    ref.current.style.setProperty("--s", "1.02");
  }
  function onLeave() {
    ref.current?.style.removeProperty("--rx");
    ref.current?.style.removeProperty("--ry");
    ref.current?.style.removeProperty("--s");
  }
  return (
    <div className="absolute inset-0" onPointerMove={onMove} onPointerLeave={onLeave}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={260}
        height={325}
        className="tilt absolute left-[17.5%] top-[10%] h-[81.25%] w-[65%] rounded-[2rem] border border-line object-cover shadow-xl shadow-black/15"
      />
    </div>
  );
}
