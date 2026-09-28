import { Product } from "./types";

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
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
