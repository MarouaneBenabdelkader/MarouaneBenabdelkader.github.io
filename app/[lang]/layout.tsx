import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { body, display } from "@/lib/fonts";
import { themeScript } from "@/lib/theme-script";
import { analyticsScript } from "@/lib/analytics";
import { LANGS, isLang, tr } from "@/content/types";
import { profile } from "@/content/profile";
import { ui } from "@/content/ui";
import { SITE, pageMeta } from "@/lib/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RevealOnScroll } from "@/components/Motion";

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  // The home page's own metadata; the other pages replace it with theirs.
  const home = pageMeta(lang, "/", tr(ui.homeTitle, lang), tr(ui.homeDescription, lang), true);
  return {
    ...home,
    metadataBase: new URL(SITE),
    title: { default: tr(ui.homeTitle, lang), template: `%s | ${profile.name}` },
    authors: [{ name: profile.name, url: `${SITE}/${lang}/` }],
    creator: profile.name,
    icons: { icon: "/icon.svg" },
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
        {analyticsScript && <script dangerouslySetInnerHTML={{ __html: analyticsScript }} />}
      </body>
    </html>
  );
}
