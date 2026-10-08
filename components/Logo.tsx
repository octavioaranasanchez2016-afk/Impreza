// El logo de Impreza: una camiseta con la "i" y la palabra "impreza" en letra gruesa.
// Todo se dibuja con formas y con la letra del sitio, así se ve nítido en cualquier
// tamaño. El tamaño lo da el font-size de className (la camiseta mide un poco más
// que las letras). invert: para fondos oscuros.

// La camiseta (100 × 92): las mangas, el cuello y la "i" en el centro.
export const MARK_SHIRT =
  "M33 4 L4 20 L15 40 L26 34 L26 90 L74 90 L74 34 L85 40 L96 20 L67 4 C63 12 57 16 50 16 C43 16 37 12 33 4 Z";

export function LogoMark({ invert = false, className = "" }: { invert?: boolean; className?: string }) {
  const shirt = invert ? "#FFFFFF" : "#111111";
  const letter = invert ? "#111111" : "#FFFFFF";
  return (
    <svg viewBox="0 0 100 92" className={className} aria-hidden>
      <path d={MARK_SHIRT} fill={shirt} stroke={shirt} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="50" cy="32" r="7" fill={letter} />
      <rect x="43.5" y="44" width="13" height="34" rx="2.5" fill={letter} />
    </svg>
  );
}

export function Logo({ invert = false, className = "" }: { invert?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.22em] leading-none ${className}`} aria-label="Impreza">
      <LogoMark invert={invert} className="h-[1.15em] w-auto shrink-0" />
      <span
        className={`font-sans font-black ${invert ? "text-paper" : "text-ink"}`}
        style={{ letterSpacing: "-0.05em", marginTop: "-0.12em" }}
        aria-hidden
      >
        impreza
      </span>
    </span>
  );
}
