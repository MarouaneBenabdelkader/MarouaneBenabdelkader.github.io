export type Lang = "en" | "fr";
export const LANGS: Lang[] = ["en", "fr"];

/** A string in both site languages. */
export type T = { en: string; fr: string };

export const tr = (t: T, lang: Lang) => t[lang];

export const isLang = (value: string): value is Lang => (LANGS as string[]).includes(value);

export type Project = {
  slug: string;
  kind: "codito" | "direct";
  title: T;
  sector: T;
  summary: T;
  stack: string[];
  context: T;
  problem: T;
  built: T[];
  decisions: { title: T; body: T }[];
  status: T;
  link?: string;
};
