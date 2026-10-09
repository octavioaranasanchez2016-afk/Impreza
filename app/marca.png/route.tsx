import { ImageResponse } from "next/og";
import { LOGO_DOT, LOGO_LETTERS, LOGO_MAGENTA, LOGO_RATIO, LOGO_VIEWBOX } from "@/components/Logo";

// El logo completo en cuadrado (la palabra "impreza"), para Google y otros que piden
// la imagen del negocio (ver businessJsonLd en lib/site.ts). Se arma una vez al publicar.
export const dynamic = "force-static";

export async function GET() {
  const width = 760;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFFFFF" }}>
        <svg viewBox={LOGO_VIEWBOX} width={width} height={Math.round(width / LOGO_RATIO)}>
          {LOGO_LETTERS.map((d) => (
            <path key={d} d={d} fill="#111111" />
          ))}
          <circle cx={LOGO_DOT.cx} cy={LOGO_DOT.cy} r={LOGO_DOT.r} fill={LOGO_MAGENTA} />
        </svg>
      </div>
    ),
    { width: 1000, height: 1000 }
  );
}
