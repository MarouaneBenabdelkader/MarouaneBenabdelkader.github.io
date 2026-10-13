import { tr, type Lang } from "@/content/types";
import { ui } from "@/content/ui";
import { profile } from "@/content/profile";

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {profile.name}
        </p>
        <p>{tr(ui.footer, lang)}</p>
      </div>
    </footer>
  );
}
