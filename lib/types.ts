export type Technique = "serigrafia" | "sublimado" | "bordado";

export type ProductCategory = "camisa" | "hoodie" | "tote" | "polo" | "gorra";

// Zonas donde el cliente puede colocar un diseño distinto (frente, espalda, manga).
export type DesignZone = "frente" | "espalda" | "manga";

export interface ProductVariantOption {
  color: string;
  colorHex: string;
  sizes: string[];
}

export interface Product {
  id: string;
  slug: string;
  category: ProductCategory;
  name: string;
  description: string;
  basePrice: number; // córdobas (NIO), precio base sin impresion ni descuento
  image: string;
  variants: ProductVariantOption[];
  techniques: Technique[];
}

export interface OrderItemInput {
  productId: string;
  color: string;
  size: string;
  quantity: number;
}

export type OrderStatus =
  | "recibido"
  | "diseno_aprobado"
  | "en_produccion"
  | "listo_entregado";

export type PaymentMethod = "contra_entrega" | "transferencia" | "whatsapp" | "en_linea";

export type PaymentStatus = "pendiente" | "en_revision" | "pagado" | "fallido";

export interface DesignTransform {
  x: number; // centro del diseño, % del ancho del contenedor
  y: number; // centro del diseño, % del alto del contenedor
  scale: number; // multiplicador sobre el tamaño base
  rotation: number; // grados, sentido horario
}

export interface PricingBreakdown {
  totalQuantity: number;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  setupFee: number;
  total: number;
}
