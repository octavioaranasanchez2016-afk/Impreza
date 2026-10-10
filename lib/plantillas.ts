import { DesignContent, ExtraPiece, FontFamilyKey } from "./design";
import { DesignTransform, DesignZone, ProductCategory } from "./types";
import { CLIPART, renderClipart } from "./clipart";
import { getPrintArea, getZonesForCategory, isDarkColor } from "@/components/GarmentShape";

// Plantillas: diseños listos (graduación, equipos, empresas…) que el cliente pone en un
// toque y después cambia (su nombre, el año, su logo). Cada pieza se ubica dentro del
// área de impresión de la parte: x e y van de 0 a 1 (0 = arriba/izquierda) y size es la
// escala del diseñador (1 = llena el área).

type PieceColor = "auto" | "acento" | string; // auto: blanco en prendas oscuras, negro en claras

interface TemplatePiece {
  zone: DesignZone;
  text?: string;
  font?: FontFamilyKey;
  clipart?: string;
  color: PieceColor;
  x: number;
  y: number;
  size: number;
  // Logo al pecho: en la polo el área del frente ya es el pecho, así que ahí va centrado y grande.
  chest?: boolean;
}

export interface DesignTemplate {
  id: string;
  name: string;
  occasion: "Graduación" | "Equipos" | "Empresas" | "Iglesia" | "Familia";
  hint: string; // qué cambiar después
  pieces: TemplatePiece[];
}

const YEAR = String(new Date().getFullYear());

export const TEMPLATES: DesignTemplate[] = [
  {
    id: "promo-clasica",
    name: "Promoción clásica",
    occasion: "Graduación",
    hint: "Cambia el año y pon tu nombre en la espalda.",
    pieces: [
      { zone: "frente", clipart: "birrete", color: "auto", x: 0.5, y: 0.2, size: 0.35 },
      { zone: "frente", text: "PROMOCIÓN", font: "colegial", color: "auto", x: 0.5, y: 0.45, size: 0.92 },
      { zone: "frente", text: YEAR, font: "display", color: "acento", x: 0.5, y: 0.66, size: 0.5 },
      { zone: "espalda", text: "TU NOMBRE", font: "colegial", color: "auto", x: 0.5, y: 0.12, size: 0.8 },
      { zone: "espalda", text: YEAR.slice(2), font: "colegial", color: "acento", x: 0.5, y: 0.42, size: 0.55 },
    ],
  },
  {
    id: "graduados-laurel",
    name: "Graduados con laureles",
    occasion: "Graduación",
    hint: "Cambia el nombre del colegio y el año.",
    pieces: [
      { zone: "frente", clipart: "laurel", color: "acento", x: 0.5, y: 0.33, size: 0.62 },
      { zone: "frente", text: YEAR, font: "clasica", color: "auto", x: 0.5, y: 0.33, size: 0.3 },
      { zone: "frente", text: "GRADUADOS", font: "clasica", color: "auto", x: 0.5, y: 0.68, size: 0.92 },
      { zone: "frente", text: "NOMBRE DEL COLEGIO", font: "sans", color: "auto", x: 0.5, y: 0.8, size: 0.75 },
    ],
  },
  {
    id: "la-promo-firma",
    name: "La promo, estilo firma",
    occasion: "Graduación",
    hint: "Cambia el año; en la espalda va el nombre de cada quien.",
    pieces: [
      { zone: "frente", text: "La Promo", font: "cursiva", color: "auto", x: 0.5, y: 0.32, size: 0.85 },
      { zone: "frente", text: YEAR, font: "condensada", color: "acento", x: 0.5, y: 0.56, size: 0.4 },
      { zone: "espalda", text: "Tu nombre", font: "firma", color: "auto", x: 0.5, y: 0.16, size: 0.8 },
    ],
  },
  {
    id: "equipo-escudo",
    name: "Equipo con escudo",
    occasion: "Equipos",
    hint: "Cambia el nombre del equipo, el apellido y el número.",
    pieces: [
      { zone: "frente", clipart: "escudo", color: "acento", x: 0.5, y: 0.27, size: 0.42 },
      { zone: "frente", clipart: "estrella", color: "auto", x: 0.5, y: 0.27, size: 0.17 },
      { zone: "frente", text: "LEONES FC", font: "deportiva", color: "auto", x: 0.5, y: 0.66, size: 0.9 },
      { zone: "espalda", text: "APELLIDO", font: "slab", color: "auto", x: 0.5, y: 0.1, size: 0.78 },
      { zone: "espalda", text: "10", font: "condensada", color: "auto", x: 0.5, y: 0.42, size: 0.62 },
    ],
  },
  {
    id: "campeones",
    name: "Campeones",
    occasion: "Equipos",
    hint: "Cambia el torneo y el año.",
    pieces: [
      { zone: "frente", clipart: "trofeo", color: "acento", x: 0.5, y: 0.25, size: 0.4 },
      { zone: "frente", text: "CAMPEONES", font: "carreras", color: "auto", x: 0.5, y: 0.6, size: 0.95 },
      { zone: "frente", text: `TORNEO ${YEAR}`, font: "deportiva", color: "acento", x: 0.5, y: 0.75, size: 0.6 },
    ],
  },
  {
    id: "empresa",
    name: "Uniforme de empresa",
    occasion: "Empresas",
    hint: "Toca «Cambiar» y sube tu logo en lugar del texto.",
    pieces: [
      { zone: "frente", text: "TU EMPRESA", font: "sans", color: "auto", x: 0.8, y: 0.1, size: 0.3, chest: true },
      { zone: "espalda", text: "TU EMPRESA", font: "sans", color: "auto", x: 0.5, y: 0.12, size: 0.85 },
      { zone: "espalda", text: "Servicio de calidad", font: "sans", color: "acento", x: 0.5, y: 0.22, size: 0.6 },
    ],
  },
  {
    id: "retiro",
    name: "Retiro juvenil",
    occasion: "Iglesia",
    hint: "Cambia el nombre de tu iglesia o grupo.",
    pieces: [
      { zone: "frente", clipart: "cruz", color: "acento", x: 0.5, y: 0.26, size: 0.32 },
      { zone: "frente", text: "RETIRO JUVENIL", font: "clasica", color: "auto", x: 0.5, y: 0.58, size: 0.95 },
      { zone: "frente", text: YEAR, font: "clasica", color: "auto", x: 0.5, y: 0.7, size: 0.32 },
    ],
  },
  {
    id: "familia",
    name: "Reunión familiar",
    occasion: "Familia",
    hint: "Cambia el apellido de tu familia.",
    pieces: [
      { zone: "frente", clipart: "corazon", color: "acento", x: 0.5, y: 0.24, size: 0.3 },
      { zone: "frente", text: "Familia Pérez", font: "cursiva", color: "auto", x: 0.5, y: 0.5, size: 0.9 },
      { zone: "frente", text: `REUNIÓN ${YEAR}`, font: "sans", color: "auto", x: 0.5, y: 0.66, size: 0.6 },
    ],
  },
];

// Las plantillas de esta prenda: solo las piezas de partes que la prenda tiene; si al
// frente no le queda nada, la plantilla no se ofrece.
export function templatesFor(category: ProductCategory): DesignTemplate[] {
  if (category === "gorra") return [];
  const zones = getZonesForCategory(category);
  return TEMPLATES.map((t) => ({ ...t, pieces: t.pieces.filter((p) => zones.includes(p.zone)) })).filter((t) =>
    t.pieces.some((p) => p.zone === "frente")
  );
}

function pieceColor(color: PieceColor, garmentHex: string): string {
  const dark = isDarkColor(garmentHex);
  if (color === "auto") return dark ? "#FFFFFF" : "#111111";
  if (color === "acento") return dark ? "#FBC72D" : "#E5007E"; // amarillo en oscuras, magenta en claras
  return color;
}

export interface BuiltTemplate {
  content: Partial<Record<DesignZone, DesignContent>>;
  transforms: Partial<Record<DesignZone, DesignTransform>>;
  extras: Partial<Record<DesignZone, ExtraPiece[]>>;
}

// La plantilla lista para el diseñador, en los colores que van con la prenda. Los dibujos
// se convierten en imágenes, así que tarda un momento.
export async function buildTemplate(template: DesignTemplate, category: ProductCategory, garmentHex: string): Promise<BuiltTemplate> {
  const built: BuiltTemplate = { content: {}, transforms: {}, extras: {} };
  for (const piece of template.pieces) {
    const area = getPrintArea(category, piece.zone);
    const spot = piece.chest && category === "polo" ? { x: 0.5, y: 0.5, size: 0.9 } : piece;
    const transform: DesignTransform = {
      x: area.x + area.w * spot.x,
      y: area.y + area.h * spot.y,
      scale: Math.min(1, Math.max(0.15, spot.size)),
      rotation: 0,
    };
    const color = pieceColor(piece.color, garmentHex);
    let content: DesignContent | null = null;
    if (piece.text && piece.font) {
      content = { kind: "texto", texto: piece.text, color, fontFamily: piece.font, outline: null };
    } else if (piece.clipart) {
      const item = CLIPART.find((c) => c.id === piece.clipart);
      if (item) content = { kind: "imagen", ...(await renderClipart(item, color)), clipart: { id: item.id, color } };
    }
    if (!content) continue;
    if (!built.content[piece.zone]) {
      built.content[piece.zone] = content;
      built.transforms[piece.zone] = transform;
    } else {
      built.extras[piece.zone] = [...(built.extras[piece.zone] ?? []), { content, transform }];
    }
  }
  return built;
}
