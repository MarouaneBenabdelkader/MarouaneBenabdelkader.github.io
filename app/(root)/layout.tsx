import type { Metadata } from "next";
import { SITE } from "@/lib/seo";

// The root only forwards to a language, so search engines are pointed at the English home page.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Marouane Benabdelkader",
  description: "Full Stack AI Engineer in Nice, France.",
  alternates: { canonical: "/en/", languages: { en: "/en/", fr: "/fr/", "x-default": "/en/" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="0; url=/en/" />
      </head>
      <body>{children}</body>
    </html>
  );
}
