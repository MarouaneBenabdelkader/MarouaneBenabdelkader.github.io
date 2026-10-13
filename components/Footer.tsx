import type { Lang } from "@/content/types";
import { profile } from "@/content/profile";

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-line" lang={lang}>
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted sm:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
      </div>
    </footer>
  );
}
