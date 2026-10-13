export type LogoInfo = { src: string; width: number; height: number };

/**
 * Draws a transparent logo as a single-colour mark in the current text colour,
 * so company logos sit in the design and follow the light/dark theme.
 */
export function Logo({ logo, label, height, className = "" }: { logo: LogoInfo; label: string; height: number; className?: string }) {
  const width = Math.round((logo.width / logo.height) * height);
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width,
        height,
        maskImage: `url(${logo.src})`,
        WebkitMaskImage: `url(${logo.src})`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "left center",
        WebkitMaskPosition: "left center",
      }}
    />
  );
}

export const logos = {
  amadeus: { src: "/logos/amadeus.png", width: 480, height: 64 },
  deep2drive: { src: "/logos/deep2drive.png", width: 364, height: 64 },
  codito: { src: "/logos/codito.png", width: 124, height: 160 },
  smartFactory: { src: "/logos/3dsmartfactory.png", width: 142, height: 160 },
  innovds: { src: "/logos/innovds.png", width: 260, height: 64 },
} satisfies Record<string, LogoInfo>;
