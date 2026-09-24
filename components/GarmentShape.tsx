import { DesignZone, ProductCategory } from "@/lib/types";

// Qué zonas de diseño tiene cada producto.
export const ZONES_BY_CATEGORY: Record<ProductCategory, DesignZone[]> = {
  camisa: ["frente", "espalda", "manga"],
  hoodie: ["frente", "espalda"],
  tote: ["frente"],
};

export const ZONE_LABEL: Record<DesignZone, string> = {
  frente: "Frente",
  espalda: "Espalda",
  manga: "Manga",
};

interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Áreas de impresión en % del contenedor. El viewBox del SVG es 0 0 300 300
// (cuadrado, igual que el contenedor "aspect-square") para que estos % se
// alineen exactamente con la posición real del diseño superpuesto — un
// viewBox no cuadrado desalinea la guía respecto al overlay HTML.
const PRINT_AREA: Record<string, Area> = {
  "camisa:frente": { x: 33, y: 32, w: 34, h: 45 },
  "camisa:espalda": { x: 27, y: 30, w: 47, h: 53 },
  "camisa:manga": { x: 33, y: 30, w: 33, h: 37 },
  "hoodie:frente": { x: 32, y: 33, w: 37, h: 25 },
  "hoodie:espalda": { x: 23, y: 30, w: 53, h: 57 },
  "tote:frente": { x: 30, y: 47, w: 40, h: 37 },
};

export function getZonesForCategory(category: ProductCategory): DesignZone[] {
  return ZONES_BY_CATEGORY[category];
}

export function getPrintArea(category: ProductCategory, zone: DesignZone): Area {
  return PRINT_AREA[`${category}:${zone}`] ?? PRINT_AREA[`${category}:frente`];
}

export function GarmentShape({
  category,
  zone,
  color,
  showGuide,
}: {
  category: ProductCategory;
  zone: DesignZone;
  color: string;
  showGuide?: boolean;
}) {
  const area = getPrintArea(category, zone);
  const guide = showGuide && (
    <rect
      x={`${area.x}%`}
      y={`${area.y}%`}
      width={`${area.w}%`}
      height={`${area.h}%`}
      fill="none"
      stroke="#111111"
      strokeDasharray="6 5"
      strokeWidth={1.5}
      opacity={0.4}
    />
  );

  return (
    <svg viewBox="0 0 300 300" className="h-full w-full">
      {renderSilhouette(category, zone, color)}
      {guide}
    </svg>
  );
}

// Las líneas internas (cuello, bolsillo, costura) deben verse tanto sobre
// colores claros como oscuros, así que su color se adapta al fill de la prenda.
function isDarkColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

function renderSilhouette(category: ProductCategory, zone: DesignZone, color: string) {
  const stroke = "rgba(0,0,0,0.15)";
  const dark = isDarkColor(color);
  const detailStroke = dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)";
  const detailFill = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";

  if (category === "camisa" && zone === "manga") {
    return (
      <path
        d="M90 50 C90 35 210 35 210 50 L225 140 L190 280 L110 280 L75 140 Z"
        fill={color}
        stroke={stroke}
        strokeWidth={2}
      />
    );
  }

  if (category === "camisa" && zone === "espalda") {
    return (
      <path
        d="M104 23 L150 35 L196 23 L250 58 L228 95 L204 81 V282 H96 V81 L72 95 L50 58 Z"
        fill={color}
        stroke={stroke}
        strokeWidth={2}
      />
    );
  }

  if (category === "camisa") {
    return (
      <>
        <path
          d="M104 23 L150 42 L196 23 L250 58 L228 95 L204 81 V282 H96 V81 L72 95 L50 58 Z"
          fill={color}
          stroke={stroke}
          strokeWidth={2}
        />
        <path
          d="M128 27 C128 43 138 51 150 51 C162 51 172 43 172 27"
          fill="none"
          stroke={detailStroke}
          strokeWidth={2}
        />
      </>
    );
  }

  if (category === "hoodie" && zone === "espalda") {
    return (
      <>
        <path
          d="M150 16 C118 16 96 30 90 49 L34 69 L52 113 L86 99 V282 H214 V99 L248 113 L266 69 L210 49 C204 30 182 16 150 16 Z"
          fill={color}
          stroke={stroke}
          strokeWidth={2}
        />
        <path
          d="M130 20 C130 10 170 10 170 20"
          fill="none"
          stroke={detailStroke}
          strokeWidth={2}
        />
      </>
    );
  }

  if (category === "hoodie") {
    return (
      <>
        <path
          d="M150 16 C118 16 96 30 90 49 L34 69 L52 113 L86 99 V282 H214 V99 L248 113 L266 69 L210 49 C204 30 182 16 150 16 Z"
          fill={color}
          stroke={stroke}
          strokeWidth={2}
        />
        <path
          d="M124 49 C124 69 136 81 150 81 C164 81 176 69 176 49"
          fill="none"
          stroke={detailStroke}
          strokeWidth={2}
        />
        <path d="M95 185 H205 V203 H95 Z" fill={detailFill} />
      </>
    );
  }

  // tote
  return (
    <>
      <path d="M60 110 H240 L248 270 H52 Z" fill={color} stroke={stroke} strokeWidth={2} />
      <path
        d="M110 110 V70 C110 40 130 25 150 25 C170 25 190 40 190 70 V110"
        fill="none"
        stroke={color}
        strokeWidth={13}
      />
      <path
        d="M110 110 V70 C110 40 130 25 150 25 C170 25 190 40 190 70 V110"
        fill="none"
        stroke={detailStroke}
        strokeWidth={2}
      />
    </>
  );
}
