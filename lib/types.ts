export type Technique = "serigrafia" | "sublimado" | "bordado";

export type ProductCategory = "camisa" | "hoodie" | "tote" | "polo" | "gorra";

// Zonas donde el cliente puede colocar un diseño distinto (frente, espalda, manga).
export type DesignZone = "frente" | "espalda" | "manga";

export interface ProductVariantOption {
  color: string;
  colorHex: string;
  sizes: string[];
}

// Tela en que se puede pedir un producto (piloto: solo la camisa básica).
export interface FabricOption {
  id: string;
  name: string;
  description: string;
  techniques: Technique[]; // con qué técnicas se puede imprimir esta tela
  extra: number; // córdobas que suma al precio base por pieza
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
  fabrics?: FabricOption[]; // si no tiene, el producto viene en una sola tela
}

export interface OrderItemInput {
  productId: string;
  color: string;
  size: string;
  quantity: number;
  fabric?: string | null; // id de la tela, solo en productos con telas
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
