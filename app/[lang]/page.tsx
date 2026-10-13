import { notFound } from "next/navigation";
import { isLang } from "@/content/types";
import { Hero } from "@/components/Hero";
import { Work } from "@/components/Work";
import { Contact, Education, Experience, Skills, SwiftServe } from "@/components/Profile";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <>
      <Hero lang={lang} />
      <Work lang={lang} />
      <Experience lang={lang} />
      <SwiftServe lang={lang} />
      <Skills lang={lang} />
      <Education lang={lang} />
      <Contact lang={lang} />
    </>
  );
}
