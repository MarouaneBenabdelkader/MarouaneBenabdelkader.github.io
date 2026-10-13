import type { Metadata } from "next";

export const metadata: Metadata = { title: "Marouane Benabdelkader" };

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
