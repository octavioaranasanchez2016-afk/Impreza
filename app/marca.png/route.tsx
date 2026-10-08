import { ImageResponse } from "next/og";
import { MARK_SHIRT } from "@/components/Logo";
import { loadGoogleFont } from "@/lib/google-font";

// El logo completo en cuadrado (la camiseta y "impreza"), para Google y otros que piden
// la imagen del negocio (ver businessJsonLd en lib/site.ts).
export async function GET() {
  const interBlack = await loadGoogleFont("Inter:wght@900");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#FFFFFF",
          fontFamily: interBlack ? "Inter" : undefined,
        }}
      >
        <svg viewBox="0 0 100 92" width={150} height={138}>
          <path d={MARK_SHIRT} fill="#111111" stroke="#111111" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="50" cy="32" r="7" fill="#FFFFFF" />
          <rect x="43.5" y="44" width="13" height="34" rx="2.5" fill="#FFFFFF" />
        </svg>
        <div style={{ fontSize: 132, fontWeight: 900, letterSpacing: -7, color: "#111111", marginTop: -14 }}>impreza</div>
      </div>
    ),
    { width: 1000, height: 1000, ...(interBlack ? { fonts: [{ name: "Inter", data: interBlack, style: "normal", weight: 900 }] } : {}) }
  );
}
