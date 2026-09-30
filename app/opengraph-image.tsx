import { ImageResponse } from "next/og";
import { LOGO_Z_DATA_URL } from "@/lib/og-logo";

// Imagen que aparece al compartir el enlace del sitio en WhatsApp, Facebook, etc.
export const alt = "Impreza — Serigrafía, DTF, sublimado y bordado en Managua";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Letras de la marca desde Google Fonts. Si no responde, se usa la letra por defecto.
async function loadGoogleFont(family: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}`).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [bebas, inter] = await Promise.all([loadGoogleFont("Bebas+Neue"), loadGoogleFont("Inter:wght@500")]);
  const fonts = [
    ...(inter ? [{ name: "Inter", data: inter, style: "normal" as const, weight: 500 as const }] : []),
    ...(bebas ? [{ name: "Bebas", data: bebas, style: "normal" as const, weight: 400 as const }] : []),
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
          <img src={LOGO_Z_DATA_URL} width={84} height={84} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: bebas ? 230 : 150, fontFamily: bebas ? "Bebas" : undefined, letterSpacing: 6, lineHeight: 0.9 }}>
            IMPREZA
          </div>
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
