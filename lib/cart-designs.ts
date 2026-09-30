// Cada línea del carrito guarda su propio diseño: el que había en el diseñador al
// tocar "Agregar al pedido". Así un pedido puede llevar, por ejemplo, dos bolsos con
// diseños distintos. Una línea agregada sin diseño toma el del diseñador (el flujo
// "primero agrego, después diseño"), salvo que ese diseño ya lo lleve otra línea.

import { DesignContent } from "./design";
import { DesignTransform, DesignZone, ProductCategory } from "./types";
import { getZonesForCategory } from "@/components/GarmentShape";
import { defaultTransform } from "@/components/DesignMockup";

export interface LineDesign {
  content: DesignContent;
  transform: DesignTransform;
}

export type LineDesigns = Partial<Record<DesignZone, LineDesign>>;

// Un texto vacío no cuenta como diseño.
export function hasDesign(content: DesignContent | undefined): content is DesignContent {
  return Boolean(content && (content.kind === "imagen" || content.texto.trim()));
}

// La misma imagen (mismo archivo) se sube una sola vez aunque la lleven varias líneas.
export function imageKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

// Lo que hay en el diseñador, solo en las zonas que tiene esta prenda.
export function snapshotDesigns(
  content: Partial<Record<DesignZone, DesignContent>>,
  transforms: Partial<Record<DesignZone, DesignTransform>>,
  category: ProductCategory
): LineDesigns {
  const out: LineDesigns = {};
  for (const zone of getZonesForCategory(category)) {
    const c = content[zone];
    if (!hasDesign(c)) continue;
    out[zone] = { content: c, transform: transforms[zone] ?? defaultTransform(category, zone) };
  }
  return out;
}

const round = (n: number, d: number) => n.toFixed(d);

// Identifica un diseño por lo que es (no por el objeto), para juntar líneas iguales y
// saber cuántos diseños distintos lleva el pedido. "" = sin diseño.
export function designKey(designs: LineDesigns): string {
  return (Object.entries(designs) as [DesignZone, LineDesign][])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([zone, { content: c, transform: t }]) => {
      const what =
        c.kind === "imagen"
          ? `i:${imageKey(c.file)}:${c.fill ? 1 : 0}`
          : `t:${c.texto.trim()}:${c.color.toLowerCase()}:${c.fontFamily}:${c.outline?.toLowerCase() ?? ""}`;
      return `${zone}|${what}|${round(t.x, 2)},${round(t.y, 2)},${round(t.scale, 3)},${round(t.rotation, 1)}`;
    })
    .join("||");
}

export const hasAnyDesign = (designs: LineDesigns) => Object.keys(designs).length > 0;
