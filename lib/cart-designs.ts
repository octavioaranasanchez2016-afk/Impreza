// Cada línea del carrito guarda su propio diseño: el que había en el diseñador al
// tocar "Agregar al pedido". Así un pedido puede llevar, por ejemplo, dos bolsos con
// diseños distintos. Una línea agregada sin diseño toma el del diseñador (el flujo
// "primero agrego, después diseño"), salvo que ese diseño ya lo lleve otra línea.

import { DesignContent, ExtraText, MockupTextContent } from "./design";
import { DesignTransform, DesignZone, ProductCategory } from "./types";
import { getZonesForCategory } from "@/components/GarmentShape";
import { defaultTransform } from "@/components/DesignMockup";

export interface LineDesign {
  content: DesignContent;
  transform: DesignTransform;
  extras?: ExtraText[]; // otros textos en la misma parte
}

export type LineDesigns = Partial<Record<DesignZone, LineDesign>>;

// Los otros textos de cada parte, en el diseñador.
export type ZoneExtras = Partial<Record<DesignZone, ExtraText[]>>;

// Un texto vacío no cuenta como diseño.
export function hasDesign(content: DesignContent | undefined): content is DesignContent {
  return Boolean(content && (content.kind === "imagen" || content.texto.trim()));
}

// La misma imagen (mismo archivo) se sube una sola vez aunque la lleven varias líneas.
export function imageKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

// Lo que lleva una parte: el diseño principal y sus otros textos, sin los vacíos. Si el
// principal está vacío, el primer texto pasa a ser el principal.
export function zoneDesign(
  content: DesignContent | undefined,
  transform: DesignTransform,
  extras: ExtraText[] = []
): LineDesign | null {
  const pieces: { content: DesignContent; transform: DesignTransform }[] = [
    ...(hasDesign(content) ? [{ content, transform }] : []),
    ...extras.filter((e) => hasDesign(e.content)),
  ];
  if (pieces.length === 0) return null;
  const [main, ...rest] = pieces;
  const others = rest as { content: MockupTextContent; transform: DesignTransform }[];
  return others.length ? { ...main, extras: others } : main;
}

// Lo que hay en el diseñador, solo en las zonas que tiene esta prenda.
export function snapshotDesigns(
  content: Partial<Record<DesignZone, DesignContent>>,
  transforms: Partial<Record<DesignZone, DesignTransform>>,
  category: ProductCategory,
  extras: ZoneExtras = {}
): LineDesigns {
  const out: LineDesigns = {};
  for (const zone of getZonesForCategory(category)) {
    const design = zoneDesign(content[zone], transforms[zone] ?? defaultTransform(category, zone), extras[zone]);
    if (design) out[zone] = design;
  }
  return out;
}

const round = (n: number, d: number) => n.toFixed(d);

function pieceKey(c: DesignContent, t: DesignTransform): string {
  const what =
    c.kind === "imagen"
      ? `i:${imageKey(c.file)}:${c.fill ? 1 : 0}`
      : `t:${c.texto.trim()}:${c.color.toLowerCase()}:${c.fontFamily}:${c.outline?.toLowerCase() ?? ""}`;
  return `${what}|${round(t.x, 2)},${round(t.y, 2)},${round(t.scale, 3)},${round(t.rotation, 1)}`;
}

// Identifica un diseño por lo que es (no por el objeto), para juntar líneas iguales y
// saber cuántos diseños distintos lleva el pedido. "" = sin diseño.
export function designKey(designs: LineDesigns): string {
  return (Object.entries(designs) as [DesignZone, LineDesign][])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zone, d]) =>
      [`${zone}|${pieceKey(d.content, d.transform)}`, ...(d.extras ?? []).map((e) => pieceKey(e.content, e.transform))].join("+")
    )
    .join("||");
}

export const hasAnyDesign = (designs: LineDesigns) => Object.keys(designs).length > 0;
