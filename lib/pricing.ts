import { OrderItemInput, PricingBreakdown, Technique } from "./types";
import { getProductById } from "./catalog";

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
const TECHNIQUE_UNIT_MODIFIER: Record<Technique, number> = {
  serigrafia: 0,
  sublimado: 55,
};

// Cargo fijo por diseño (una sola vez por pedido), no por prenda (córdobas).
// Serigrafía requiere preparar una malla/pantalla por diseño; sublimado no.
const TECHNIQUE_SETUP_FEE: Record<Technique, number> = {
  serigrafia: 290,
  sublimado: 0,
};

export function getVolumeDiscountPct(totalQuantity: number): number {
  const tier = VOLUME_TIERS.find((t) => totalQuantity >= t.min);
  return tier ? tier.discountPct : 0;
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

  const unitModifier = TECHNIQUE_UNIT_MODIFIER[technique];

  const subtotal = items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    if (!product) return sum;
    const unitPrice = product.basePrice + unitModifier;
    return sum + unitPrice * item.quantity;
  }, 0);

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
