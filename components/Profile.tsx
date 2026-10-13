import { tr, type Lang } from "@/content/types";
import { profile } from "@/content/profile";
import { ui } from "@/content/ui";
import { Chips, Section } from "./Section";
import { Logo } from "./Logo";

export function Experience({ lang }: { lang: Lang }) {
  return (
    <Section id="experience" title={tr(ui.experienceTitle, lang)}>
      <ol>
        {profile.experience.map((job) => (
          <li
            key={job.company}
            className="grid gap-2 border-t border-line py-7 first:border-t-0 first:pt-0 sm:grid-cols-[10rem_1fr] sm:gap-8"
          >
            <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-4">
              <p className="text-sm tabular-nums text-muted">{tr(job.dates, lang)}</p>
              {job.logo && (
                <Logo
                  logo={job.logo}
                  label={job.company}
                  // Icons get a fixed height; wordmarks share an optical width of ~110px.
                  height={job.logo.width < job.logo.height ? 48 : Math.min(24, (110 * job.logo.height) / job.logo.width)}
                  className="text-ink opacity-80"
                />
              )}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold tracking-tight">
                {tr(job.role, lang)}, <span className="text-accent-ink">{job.company}</span>
              </h3>
              <p className="mt-0.5 text-sm text-muted">
                {tr(job.type, lang)}, {job.place}
              </p>
              <ul className="mt-3 space-y-1.5 leading-relaxed">
                {job.bullets.map((b) => (
                  <li key={b.en} className="relative max-w-2xl pl-4 before:absolute before:left-0 before:top-[0.7em] before:size-1.5 before:rounded-full before:bg-line">
                    {tr(b, lang)}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function SwiftServe({ lang }: { lang: Lang }) {
  const s = profile.swiftserve;
  return (
    <Section id="swiftserve" title={tr(ui.personalTitle, lang)}>
      <div className="rounded-2xl border border-line bg-raised p-6 sm:p-8">
        <h3 className="font-display text-2xl font-bold tracking-tight">{s.title}</h3>
        <p className="mt-1 font-medium text-accent-ink">{tr(s.tagline, lang)}</p>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">{tr(s.summary, lang)}</p>
        <ul className="mt-4 space-y-1.5">
          {s.bullets.map((b) => (
            <li key={b.en} className="relative max-w-2xl pl-4 before:absolute before:left-0 before:top-[0.7em] before:size-1.5 before:rounded-full before:bg-accent">
              {tr(b, lang)}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Chips items={s.stack} />
          <a href={s.link} target="_blank" rel="noopener" className="font-semibold text-accent-ink underline">
            {tr(ui.readDocs, lang)}
          </a>
        </div>
      </div>
    </Section>
  );
}

export function Skills({ lang }: { lang: Lang }) {
  return (
    <Section id="skills" title={tr(ui.skillsTitle, lang)}>
      <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {profile.skills.map((g) => (
          <div key={g.group.en}>
            <dt className="font-display font-semibold">{tr(g.group, lang)}</dt>
            <dd className="mt-2.5">
              <Chips items={g.items} />
            </dd>
          </div>
        ))}
        <div>
          <dt className="font-display font-semibold">{tr(ui.languagesLabel, lang)}</dt>
          <dd className="mt-1 leading-relaxed text-muted">{tr(profile.languages, lang)}</dd>
        </div>
      </dl>
    </Section>
  );
}

export function Education({ lang }: { lang: Lang }) {
  return (
    <Section id="education" title={tr(ui.educationTitle, lang)}>
      <ol>
        {profile.education.map((e) => (
          <li key={e.school} className="grid gap-1 border-t border-line py-4 first:border-t-0 first:pt-0 sm:grid-cols-[10rem_1fr] sm:gap-8">
            <p className="text-sm tabular-nums text-muted">{e.dates}</p>
            <div>
              <p className="font-semibold">{tr(e.degree, lang)}</p>
              <p className="text-sm text-muted">{e.school}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Contact({ lang }: { lang: Lang }) {
  const links = [
    { href: profile.linkedin, label: "LinkedIn" },
    { href: profile.github, label: "GitHub" },
  ];
  return (
    <Section id="contact" title={tr(ui.navContact, lang)}>
      <h3 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-none tracking-[-0.03em]">
        {tr(ui.contactTitle, lang)}
      </h3>
      <p className="mt-5 max-w-xl leading-relaxed text-muted">{tr(ui.contactIntro, lang)}</p>
      <a
        href={`mailto:${profile.email}`}
        className="mt-8 inline-block break-all font-display text-xl font-semibold text-accent-ink underline sm:text-2xl"
      >
        {profile.email}
      </a>
      <ul className="mt-8 flex flex-wrap gap-3">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} target="_blank" rel="noopener" className="inline-block rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-ink">
              {l.label}
            </a>
          </li>
        ))}
        <li>
          <a href={profile.cv} download className="inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-85">
            {tr(ui.downloadCv, lang)}
          </a>
        </li>
      </ul>
    </Section>
  );
}
