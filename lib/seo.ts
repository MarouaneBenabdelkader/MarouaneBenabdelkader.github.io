import type { Metadata } from "next";
import { LANGS, tr, type Lang } from "@/content/types";
import { profile } from "@/content/profile";

export const SITE = "https://marouanebenabdelkader.github.io";

/** Social preview cards, one per language (1200×630). */
export const ogImage = (lang: Lang) => ({ url: `/og-${lang}.jpg`, width: 1200, height: 630, alt: profile.name });

/**
 * Metadata for a page that exists in every language at /{lang}{path}: its canonical URL, the
 * other languages' versions (English is the default for everyone else), and its social preview.
 */
export function pageMeta(lang: Lang, path: string, title: string, description: string, absoluteTitle = false): Metadata {
  const url = `/${lang}${path}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(LANGS.map((l) => [l, `/${l}${path}`])), "x-default": `/en${path}` },
    },
    openGraph: {
      type: path === "/" ? "profile" : "article",
      url,
      title,
      description,
      siteName: profile.name,
      locale: lang === "fr" ? "fr_FR" : "en_US",
      alternateLocale: lang === "fr" ? "en_US" : "fr_FR",
      images: [ogImage(lang)],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage(lang).url] },
  };
}

/** Structured data for search engines: who the site is about, with links to the same person elsewhere. */
export function personJsonLd(lang: Lang) {
  const amadeus = profile.experience.find((job) => job.company === "Amadeus");
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE}/${lang}/`,
    inLanguage: lang,
    mainEntity: {
      "@type": "Person",
      "@id": `${SITE}/#person`,
      name: profile.name,
      url: `${SITE}/${lang}/`,
      image: `${SITE}/images/profile.jpg`,
      jobTitle: amadeus ? tr(amadeus.role, lang) : undefined,
      description: tr(profile.pitch, lang),
      email: `mailto:${profile.email}`,
      address: { "@type": "PostalAddress", addressLocality: "Nice", addressCountry: "FR" },
      worksFor: { "@type": "Organization", name: "Amadeus", url: "https://amadeus.com" },
      alumniOf: profile.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
      knowsAbout: profile.skills.flatMap((group) => group.items),
      knowsLanguage: ["fr", "en", "ar"],
      sameAs: [profile.linkedin, profile.github],
    },
  };
}

/** Renders structured data as a JSON-LD script; `<` is escaped so the JSON can never close the tag. */
export function jsonLdHtml(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
