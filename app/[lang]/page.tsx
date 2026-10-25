import { notFound } from "next/navigation";
import { isLang } from "@/content/types";
import { jsonLdHtml, personJsonLd } from "@/lib/seo";
import { Hero } from "@/components/Hero";
import { Work } from "@/components/Work";
import { BookTeaser } from "@/components/BookTeaser";
import { Contact, Education, Experience, Skills, SwiftServe } from "@/components/Profile";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(personJsonLd(lang))} />
      <Hero lang={lang} />
      <Work lang={lang} />
      <BookTeaser lang={lang} />
      <Experience lang={lang} />
      <SwiftServe lang={lang} />
      <Skills lang={lang} />
      <Education lang={lang} />
      <Contact lang={lang} />
    </>
  );
}
