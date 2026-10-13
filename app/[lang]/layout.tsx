import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { body, display } from "@/lib/fonts";
import { themeScript } from "@/lib/theme-script";
import { LANGS, isLang, tr } from "@/content/types";
import { profile } from "@/content/profile";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RevealOnScroll } from "@/components/Motion";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

const SITE = "https://marouanebenabdelkader.github.io";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    metadataBase: new URL(SITE),
    title: { default: `${profile.name}, ${tr(profile.title, lang)}`, template: `%s | ${profile.name}` },
    description: tr(profile.pitch, lang),
    alternates: { languages: { en: "/en/", fr: "/fr/" } },
    icons: { icon: "/icon.svg" },
    openGraph: { type: "website", locale: lang === "fr" ? "fr_FR" : "en_US", images: ["/images/profile.jpg"] },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-paper text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-raised focus:px-3 focus:py-2"
        >
          {lang === "fr" ? "Aller au contenu" : "Skip to content"}
        </a>
        <Header lang={lang} />
        <main id="main">{children}</main>
        <Footer lang={lang} />
        <RevealOnScroll />
      </body>
    </html>
  );
}
