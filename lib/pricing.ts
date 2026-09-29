import { OrderItemInput, PricingBreakdown, Technique } from "./types";
import { getFabric, getProductById } from "./catalog";

// Descuentos por volumen sobre la cantidad TOTAL de piezas del pedido (todas las
// prendas/colores/tallas se suman, ya que el ahorro viene de producir en lote).
export const VOLUME_TIERS: { min: number; discountPct: number }[] = [
  { min: 144, discountPct: 0.4 },
  { min: 96, discountPct: 0.3 },
  { min: 48, discountPct: 0.25 },
  { min: 24, discountPct: 0.2 },
  { min: 12, discountPct: 0.15 },
  { min: 1, discountPct: 0 },
];

// Costo por unidad que agrega cada técnica sobre el precio base de la prenda (córdobas).
// El bordado ya va incluido en el precio base de polos y gorras.
const TECHNIQUE_UNIT_MODIFIER: Record<Technique, number> = {
  serigrafia: 0,
  sublimado: 55,
  bordado: 0,
};

// Cargo fijo por diseño (una sola vez por pedido), no por prenda (córdobas).
// En 0 por decisión del dueño: la preparación (malla, ponchado) no se cobra
// aparte, porque el cliente no tiene por qué ver los costos del taller.
const TECHNIQUE_SETUP_FEE: Record<Technique, number> = {
  serigrafia: 0,
  sublimado: 0,
  bordado: 0,
};

// Solo para pedidos antiguos que sí traen este cargo.
export const SETUP_FEE_LABEL = "Preparación del diseño";

export function getVolumeDiscountPct(totalQuantity: number): number {
  const tier = VOLUME_TIERS.find((t) => totalQuantity >= t.min);
  return tier ? tier.discountPct : 0;
}

export function getUnitPrice(productId: string, technique: Technique, fabricId?: string | null): number {
  const product = getProductById(productId);
  if (!product) return 0;
  return product.basePrice + TECHNIQUE_UNIT_MODIFIER[technique] + (getFabric(productId, fabricId)?.extra ?? 0);
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export function buildInvoiceLines(items: OrderItemInput[], technique: Technique): InvoiceLine[] {
  return items.map((item) => {
    const unitPrice = getUnitPrice(item.productId, technique, item.fabric);
    const name = getProductById(item.productId)?.name ?? item.productId;
    const fabric = getFabric(item.productId, item.fabric);
    return {
      description: `${name} — ${item.color}, talla ${item.size}${fabric ? ` · ${fabric.name}` : ""}`,
      quantity: item.quantity,
      unitPrice,
      lineTotal: round2(unitPrice * item.quantity),
    };
  });
}

export function calculateOrderTotal(
  items: OrderItemInput[],
  technique: Technique
): PricingBreakdown {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  if (totalQuantity <= 0) {
    return {
      totalQuantity: 0,
      subtotal: 0,
      discountPct: 0,
      discountAmount: 0,
      setupFee: 0,
      total: 0,
    };
  }

  const subtotal = items.reduce(
    (sum, item) => sum + getUnitPrice(item.productId, technique, item.fabric) * item.quantity,
    0
  );

  const discountPct = getVolumeDiscountPct(totalQuantity);
  const discountAmount = subtotal * discountPct;
  const setupFee = TECHNIQUE_SETUP_FEE[technique];
  const total = subtotal - discountAmount + setupFee;

  return {
    totalQuantity,
    subtotal: round2(subtotal),
    discountPct,
    discountAmount: round2(discountAmount),
    setupFee: round2(setupFee),
    total: round2(total),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
