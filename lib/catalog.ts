import { Product, Technique } from "./types";

export const TECHNIQUE_LABEL: Record<Technique, string> = {
  serigrafia: "Serigrafía",
  sublimado: "Sublimado",
  bordado: "Bordado",
};

// Catálogo inicial con precios de referencia en córdobas (NIO). Ajusta
// basePrice y variantes con los precios reales del taller antes de publicar.
export const PRODUCTS: Product[] = [
  {
    id: "camisa-basica",
    slug: "camisa-basica",
    category: "camisa",
    name: "Camisa básica",
    description: "Camisa 100% algodón, corte unisex. Ideal para serigrafía o sublimado.",
    basePrice: 220,
    image: "https://images.unsplash.com/photo-1651761179569-4ba2aa054997?w=900&q=80&auto=format&fit=crop",
    techniques: ["serigrafia", "sublimado"],
    variants: [
      { color: "Blanco", colorHex: "#FFFFFF", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Negro", colorHex: "#111111", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Gris", colorHex: "#9CA3AF", sizes: ["S", "M", "L", "XL"] },
      { color: "Azul marino", colorHex: "#1E3A8A", sizes: ["S", "M", "L", "XL"] },
    ],
  },
  {
    id: "hoodie-basico",
    slug: "hoodie-basico",
    category: "hoodie",
    name: "Hoodie con capucha",
    description: "Hoodie fleece con bolsillo canguro, ideal para diseños grandes.",
    basePrice: 510,
    image: "https://images.unsplash.com/photo-1581655353466-d5ad6765dd37?w=900&q=80&auto=format&fit=crop",
    techniques: ["serigrafia", "sublimado"],
    variants: [
      { color: "Negro", colorHex: "#111111", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Gris jaspe", colorHex: "#B6B6B6", sizes: ["S", "M", "L", "XL"] },
      { color: "Azul marino", colorHex: "#1E3A8A", sizes: ["S", "M", "L", "XL"] },
    ],
  },
  {
    id: "tote-bag",
    slug: "tote-bag",
    category: "tote",
    name: "Tote bag",
    description: "Bolsa de tela resistente, tamaño único. Perfecta para eventos y regalos.",
    basePrice: 165,
    image: "https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?w=900&q=80&auto=format&fit=crop",
    techniques: ["serigrafia", "sublimado"],
    variants: [
      { color: "Natural", colorHex: "#EFE7D8", sizes: ["Único"] },
      { color: "Negro", colorHex: "#111111", sizes: ["Único"] },
    ],
  },
  // Polos y gorras: precios de referencia, por confirmar con el taller.
  {
    id: "polo-bordada",
    slug: "polo-bordada",
    category: "polo",
    name: "Camisa polo",
    description: "Polo de piqué con cuello y botones, con tu logo bordado. Ideal para uniformes de empresa.",
    basePrice: 380,
    image: "https://images.unsplash.com/photo-1625910513413-c23b8bb81cba?w=900&q=80&auto=format&fit=crop",
    techniques: ["bordado"],
    variants: [
      { color: "Blanco", colorHex: "#FFFFFF", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Negro", colorHex: "#111111", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Azul marino", colorHex: "#1E3A8A", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Gris", colorHex: "#9CA3AF", sizes: ["S", "M", "L", "XL"] },
    ],
  },
  {
    id: "gorra",
    slug: "gorra",
    category: "gorra",
    name: "Gorra",
    description: "Gorra de seis paneles con visera curva y cierre ajustable, con tu logo bordado al frente.",
    basePrice: 250,
    image: "https://images.unsplash.com/photo-1691256676359-20e5c6d4bc92?w=900&q=80&auto=format&fit=crop",
    techniques: ["bordado"],
    variants: [
      { color: "Negro", colorHex: "#111111", sizes: ["Ajustable"] },
      { color: "Blanco", colorHex: "#FFFFFF", sizes: ["Ajustable"] },
      { color: "Azul marino", colorHex: "#1E3A8A", sizes: ["Ajustable"] },
      { color: "Gris", colorHex: "#9CA3AF", sizes: ["Ajustable"] },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

// Un pedido lleva una sola técnica: las que sirven para TODOS estos productos.
export function sharedTechniques(productIds: string[]): Technique[] {
  const all = Object.keys(TECHNIQUE_LABEL) as Technique[];
  return all.filter((t) => productIds.every((id) => getProductById(id)?.techniques.includes(t)));
}
