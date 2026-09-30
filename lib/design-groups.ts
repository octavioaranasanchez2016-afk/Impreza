// Un pedido puede llevar varios diseños. Cada uno es un "grupo" con sus zonas
// (frente, espalda, manga) y las piezas que lo llevan. Todo va en orders.disenos
// (jsonb): cada zona trae su número de grupo y la lista de piezas de ese grupo, así
// no hizo falta cambiar la base de datos. Los pedidos anteriores no traen grupo:
// su único diseño va en todas las piezas.

import { FontFamilyKey } from "./design";
import { DesignZone, OrderItemInput, Technique } from "./types";

export interface StoredPieza {
  productId: string;
  tecnica?: Technique | null;
  tela?: string | null;
  color: string;
  talla: string;
  cantidad: number;
}

export interface StoredDiseno {
  zona: DesignZone;
  tipo: "imagen" | "texto";
  path?: string;
  ajuste?: "completa" | "llenar";
  anchoPx?: number;
  altoPx?: number;
  texto?: string;
  color?: string;
  fuente?: FontFamilyKey;
  contorno?: string;
  posX: number;
  posY: number;
  escala: number;
  rotacion?: number;
  grupo?: number;
  piezas?: StoredPieza[];
}

export interface DesignGroup<D extends StoredDiseno> {
  grupo: number;
  disenos: D[];
  piezas: OrderItemInput[];
}

export function groupDesigns<D extends StoredDiseno>(
  disenos: D[],
  items: OrderItemInput[]
): { groups: DesignGroup<D>[]; sinDiseno: OrderItemInput[] } {
  if (disenos.length === 0) return { groups: [], sinDiseno: items };
  if (disenos.every((d) => d.grupo == null)) {
    return { groups: [{ grupo: 1, disenos, piezas: items }], sinDiseno: [] };
  }

  const byGroup = new Map<number, D[]>();
  for (const d of disenos) {
    const g = d.grupo ?? 1;
    byGroup.set(g, [...(byGroup.get(g) ?? []), d]);
  }
  const groups = [...byGroup.entries()]
    .sort(([a], [b]) => a - b)
    .map(([grupo, ds]) => ({
      grupo,
      disenos: ds,
      piezas: (ds.find((d) => d.piezas?.length)?.piezas ?? []).map((p) => ({
        productId: p.productId,
        technique: p.tecnica ?? null,
        fabric: p.tela ?? null,
        color: p.color,
        size: p.talla,
        quantity: p.cantidad,
      })),
    }));

  // Lo que no aparece en ningún grupo va sin diseño.
  const remaining = items.map((i) => ({ ...i }));
  for (const g of groups) {
    for (const p of g.piezas) {
      let left = p.quantity;
      for (const r of remaining) {
        if (left <= 0) break;
        if (r.productId !== p.productId || r.color !== p.color || r.size !== p.size || r.quantity <= 0) continue;
        // La tela solo se compara si ambos lados la tienen (sin la columna order_items.tela no viene).
        if (r.fabric && p.fabric && r.fabric !== p.fabric) continue;
        if (r.technique && p.technique && r.technique !== p.technique) continue;
        const take = Math.min(r.quantity, left);
        r.quantity -= take;
        left -= take;
      }
    }
  }
  return { groups, sinDiseno: remaining.filter((r) => r.quantity > 0) };
}

export const countPieces = (items: OrderItemInput[]) => items.reduce((sum, i) => sum + i.quantity, 0);
