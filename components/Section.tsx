/** A home-page section: a heading in a narrow left column, content on the right from md up. */
export function Section({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-8 md:grid-cols-[14rem_1fr] md:gap-12 md:py-24">
        {/* Title and aside stick as one block so a wrapped title never overlaps the aside. */}
        <div className="self-start md:sticky md:top-24">
          <h2 id={`${id}-title`} className="font-display text-2xl font-bold tracking-tight">
            {title}
          </h2>
          {aside && <div className="mt-3 text-sm text-muted">{aside}</div>}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((s) => (
        <li key={s} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
          {s}
        </li>
      ))}
    </ul>
  );
}
