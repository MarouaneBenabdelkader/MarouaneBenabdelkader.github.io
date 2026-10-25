// Verifies the static export in out/. Exits non-zero on any failure.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { findForbidden } from "./forbidden.mjs";

const OUT = "out";
const LANGS = ["en", "fr"];
const CVS = { en: "Marouane_Benabdelkader_Resume_EN.pdf", fr: "Marouane_Benabdelkader_CV_FR.pdf" };
const SLUGS = [
  "parenting-ai-orientation", "technical-spec-generator", "b2b-prospecting-agent",
  "payment-reminder-agent", "news-to-avatar-video", "maison-salah",
];
const failures = [];
const fail = (m) => failures.push(m);
const read = (p) => readFileSync(p, "utf8");

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

if (!existsSync(OUT)) {
  console.error("FAIL: out/ does not exist — run `npm run build` first");
  process.exit(1);
}

const root = join(OUT, "index.html");
if (!existsSync(root)) fail("missing out/index.html");
else if (!/http-equiv="refresh"[^>]*url=\/en\//i.test(read(root))) fail("root index.html has no meta refresh to /en/");

for (const lang of LANGS) {
  const other = lang === "en" ? "fr" : "en";
  const home = join(OUT, lang, "index.html");
  if (!existsSync(home)) { fail(`missing ${home}`); continue; }
  const homeHtml = read(home);
  if (!homeHtml.includes(`<html lang="${lang}"`)) fail(`${home}: wrong <html lang>`);
  if (!homeHtml.includes(`href="/${other}/"`)) fail(`${home}: no language toggle to /${other}/`);
  if (!homeHtml.includes(`href="/${lang}/book/"`)) fail(`${home}: navbar has no link to the book`);
  // Search: the page names its canonical URL, its other language, a social preview and who it is about.
  if (!homeHtml.includes(`<link rel="canonical" href="https://marouanebenabdelkader.github.io/${lang}/"`)) fail(`${home}: no canonical URL`);
  if (!homeHtml.includes(`hrefLang="${other}"`)) fail(`${home}: no hreflang link to /${other}/`);
  if (!homeHtml.includes(`og-${lang}.jpg`) || !existsSync(join(OUT, `og-${lang}.jpg`))) fail(`${home}: no social preview image`);
  if (!homeHtml.includes(`"@type":"Person"`)) fail(`${home}: no Person structured data`);
  for (const m of homeHtml.matchAll(/<img\b[^>]*>/g)) if (!/\salt="[^"]+"/.test(m[0])) fail(`${home}: image without alt text: ${m[0].slice(0, 80)}`);
  const cv = CVS[lang];
  if (!homeHtml.includes(`href="/${cv}"`)) fail(`${home}: no download link to ${cv}`);
  if (!existsSync(join(OUT, cv))) fail(`missing ${cv}`);
  const bookPage = join(OUT, lang, "book", "index.html");
  const bookHtml = existsSync(bookPage) ? read(bookPage) : "";
  if (!bookHtml) fail(`missing ${bookPage}`);
  else {
    if (!bookHtml.includes(`<html lang="${lang}"`)) fail(`${bookPage}: wrong <html lang>`);
    if (!bookHtml.includes(`href="/${other}/book/"`)) fail(`${bookPage}: language toggle does not stay on the book`);
  }
  for (const slug of SLUGS) {
    if (!homeHtml.includes(`href="/${lang}/work/${slug}/"`)) fail(`${home}: no link to case study ${slug}`);
    if (bookHtml && !bookHtml.includes(`href="/${lang}/work/${slug}/"`)) fail(`${bookPage}: contents has no link to ${slug}`);
    if (!existsSync(join(OUT, "book", "dark", `${slug}.jpg`)) || !existsSync(join(OUT, "book", "light", `${slug}.jpg`))) fail(`missing book illustration for ${slug}`);
    const page = join(OUT, lang, "work", slug, "index.html");
    if (!existsSync(page)) { fail(`missing ${page}`); continue; }
    const html = read(page);
    if (!html.includes(`<html lang="${lang}"`)) fail(`${page}: wrong <html lang>`);
    if (!html.includes(`href="/${other}/work/${slug}/"`)) fail(`${page}: language toggle does not keep the slug`);
  }
}

const sitemap = existsSync(join(OUT, "sitemap.xml")) ? read(join(OUT, "sitemap.xml")) : "";
if (!sitemap) fail("missing out/sitemap.xml");
else if ((sitemap.match(/<url>/g) || []).length !== LANGS.length * (SLUGS.length + 2)) fail("sitemap.xml does not list every page in every language");
if (!existsSync(join(OUT, "robots.txt")) || !read(join(OUT, "robots.txt")).includes("sitemap.xml")) fail("robots.txt missing or not pointing at the sitemap");

const textFiles = walk(OUT).filter((p) => [".html", ".txt", ".js", ".json"].includes(extname(p)));
const phoneRe = /62\s?19\s?92\s?44/;
for (const p of textFiles) {
  const s = read(p);
  const word = findForbidden(s);
  if (word) fail(`${p}: forbidden name "${word}"`);
  if (phoneRe.test(s)) fail(`${p}: contains phone number`);
}

if (failures.length) {
  console.error(`FAIL (${failures.length}):\n- ` + failures.slice(0, 40).join("\n- "));
  process.exit(1);
}
console.log(`PASS: ${LANGS.length * (SLUGS.length + 2) + 1} pages, ${textFiles.length} files scanned`);
