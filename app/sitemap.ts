import type { MetadataRoute } from "next";
import { LANGS } from "@/content/types";
import { projects } from "@/content/projects";
import { SITE } from "@/lib/seo";

export const dynamic = "force-static";

// Every page in every language, each listing its other-language versions.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/book/", ...projects.map((p) => `/work/${p.slug}/`)];
  return paths.flatMap((path) =>
    LANGS.map((lang) => ({
      url: `${SITE}/${lang}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, `${SITE}/${l}${path}`])) },
    })),
  );
}
