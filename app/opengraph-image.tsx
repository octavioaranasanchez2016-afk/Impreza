import { ImageResponse } from "next/og";
import { LOGO_DOT, LOGO_LETTERS, LOGO_MAGENTA, LOGO_RATIO, LOGO_VIEWBOX, MARK_DOT, MARK_STEM, MARK_VIEWBOX } from "@/components/Logo";
import { loadGoogleFont } from "@/lib/google-font";

// Imagen que aparece al compartir el enlace del sitio en WhatsApp, Facebook, etc.
export const alt = "Impreza — Serigrafía, DTF, sublimado y bordado en Managua";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [inter, interBlack] = await Promise.all([loadGoogleFont("Inter:wght@500"), loadGoogleFont("Inter:wght@900")]);
  const fonts = [
    ...(inter ? [{ name: "Inter", data: inter, style: "normal" as const, weight: 500 as const }] : []),
    ...(interBlack ? [{ name: "Inter", data: interBlack, style: "normal" as const, weight: 900 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111111",
          color: "#FFFFFF",
          padding: "72px 80px",
          fontFamily: inter ? "Inter" : undefined,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#8A8A8D" }}>
            SERIGRAFÍA · DTF · SUBLIMADO · BORDADO · MANAGUA
          </div>
          <svg viewBox={MARK_VIEWBOX} width={32} height={Math.round(32 * (76.7 / 23.6))}>
            <path d={MARK_STEM} fill="#FFFFFF" />
            <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill={LOGO_MAGENTA} />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* El logo: la palabra "impreza" en letra gruesa, con el punto magenta. */}
          <svg viewBox={LOGO_VIEWBOX} width={700} height={Math.round(700 / LOGO_RATIO)}>
            {LOGO_LETTERS.map((d) => (
              <path key={d} d={d} fill="#FFFFFF" />
            ))}
            <circle cx={LOGO_DOT.cx} cy={LOGO_DOT.cy} r={LOGO_DOT.r} fill={LOGO_MAGENTA} />
          </svg>
          <div style={{ fontSize: 44, marginTop: 20, color: "#F4F4F4" }}>Tu diseño. Impreso como debe ser.</div>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 28 }}>
          {["Desde 1 pieza", "Listo en 7 días hábiles", "Entrega a domicilio"].map((label) => (
            <div key={label} style={{ display: "flex", border: "2px solid #FFFFFF", borderRadius: 10, padding: "10px 20px" }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, ...(fonts.length ? { fonts } : {}) }
  );
}
