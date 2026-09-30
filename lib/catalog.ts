import { FabricOption, Product, Technique } from "./types";

// Piloto de telas para la camisa básica. Ajusta la lista a las telas que tiene el
// taller. extra = córdobas que suma cada tela al precio por pieza (en 0 mientras
// no haya costos reales). El sublimado solo agarra en poliéster: por eso las telas
// de algodón no lo permiten.
const CAMISA_FABRICS: FabricOption[] = [
  {
    id: "algodon",
    name: "Algodón 100%",
    description: "Suave y fresca, la de siempre.",
    techniques: ["serigrafia", "dtf"],
    extra: 0,
  },
  {
    id: "algodon-peinado",
    name: "Algodón peinado",
    description: "Premium: hilo más fino, más suave y resistente.",
    techniques: ["serigrafia", "dtf"],
    extra: 0,
  },
  {
    id: "mezcla",
    name: "Mezcla 50/50",
    description: "Algodón y poliéster: no se encoge ni se arruga.",
    techniques: ["serigrafia", "dtf"],
    extra: 0,
  },
  {
    id: "poliester",
    name: "Poliéster dry-fit",
    description: "Deportiva, liviana y seca rápido. La tela para sublimado.",
    techniques: ["serigrafia", "sublimado", "dtf"],
    extra: 0,
  },
];

export const TECHNIQUE_LABEL: Record<Technique, string> = {
  serigrafia: "Serigrafía",
  sublimado: "Sublimado",
  bordado: "Bordado",
  dtf: "DTF",
};

// Una línea corta para el formulario del pedido (la explicación completa está en
// TECHNIQUE_INFO y se ve con "Ver diferencias").
export const TECHNIQUE_HINT: Record<Technique, string> = {
  serigrafia: "Durable, ideal para muchas piezas.",
  sublimado: "Full color, solo poliéster claro.",
  bordado: "Hilo cosido, elegante.",
  dtf: "Full color en cualquier tela.",
};

// Qué es cada técnica, para el inicio, la página del producto, las preguntas
// frecuentes y la ventana "Ver diferencias" del pedido.
export const TECHNIQUE_INFO: Record<Technique, { what: string; points: string[] }> = {
  serigrafia: {
    what: "La tinta pasa a través de una malla directo sobre la tela, un color a la vez. Colores sólidos y muy duraderos.",
    points: ["Ideal para logos de 1 a 3 colores", "La mejor opción para pedidos grandes", "Muy resistente al lavado"],
  },
  sublimado: {
    what: "Con calor, la tinta se funde con las fibras de poliéster. Colores vivos y detalle de fotografía.",
    points: ["Ideal para fotos y diseños a todo color", "No se siente al tacto: no se agrieta ni se despega", "Solo en poliéster blanco o claro"],
  },
  dtf: {
    what: "El diseño se imprime a todo color en una película especial y se pega a la prenda con calor.",
    points: ["Fotos, degradados y muchos colores", "En cualquier tela y color, incluso oscuros", "Conviene desde 1 pieza"],
  },
  bordado: {
    what: "Tu logo cosido con hilo directo en la prenda. Un acabado elegante que dura años.",
    points: ["Ideal para logos en polos y gorras", "Perfecto para uniformes de empresa", "No se despinta ni se agrieta al lavar"],
  },
};

// Comparación rápida, fila por fila.
export const TECHNIQUE_COMPARISON: { label: string; values: Record<Technique, string> }[] = [
  {
    label: "Mejor para",
    values: {
      serigrafia: "Pedidos grandes y logos simples",
      sublimado: "Fotos y diseños a todo color",
      dtf: "Pocas piezas a todo color",
      bordado: "Logos en polos y gorras",
    },
  },
  {
    label: "Colores",
    values: { serigrafia: "1 a 3 colores sólidos", sublimado: "Ilimitados", dtf: "Ilimitados", bordado: "Según los hilos" },
  },
  {
    label: "Telas",
    values: {
      serigrafia: "Algodón, mezcla y poliéster",
      sublimado: "Solo poliéster claro",
      dtf: "Cualquier tela y color",
      bordado: "Polos y gorras",
    },
  },
  {
    label: "Al tacto",
    values: { serigrafia: "Capa de tinta", sublimado: "No se siente", dtf: "Capa fina y flexible", bordado: "Hilo en relieve" },
  },
];

// Orden en que se muestran las técnicas.
export const TECHNIQUE_ORDER: Technique[] = ["serigrafia", "dtf", "sublimado", "bordado"];

// Catálogo inicial con precios de referencia en córdobas (NIO). Ajusta
// basePrice y variantes con los precios reales del taller antes de publicar.
export const PRODUCTS: Product[] = [
  {
    id: "camisa-basica",
    slug: "camisa-basica",
    category: "camisa",
    name: "Camisa básica",
    description:
      "Camisa corte unisex en 14 colores y cuatro telas. Serigrafía o DTF en cualquier tela; sublimado en poliéster dry-fit.",
    basePrice: 220,
    image: "https://images.unsplash.com/photo-1651761179569-4ba2aa054997?w=900&q=80&auto=format&fit=crop",
    techniques: ["serigrafia", "sublimado", "dtf"],
    variants: [
      { color: "Blanco", colorHex: "#FFFFFF", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Negro", colorHex: "#111111", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Gris", colorHex: "#9CA3AF", sizes: ["S", "M", "L", "XL"] },
      { color: "Azul marino", colorHex: "#1E3A8A", sizes: ["S", "M", "L", "XL"] },
      { color: "Azul rey", colorHex: "#1D4ED8", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Celeste", colorHex: "#7DD3FC", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Rojo", colorHex: "#C8102E", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Vino", colorHex: "#7F1D1D", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Rosado", colorHex: "#F9A8D4", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Naranja", colorHex: "#F97316", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Amarillo", colorHex: "#FACC15", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Verde botella", colorHex: "#14532D", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Morado", colorHex: "#6D28D9", sizes: ["S", "M", "L", "XL", "XXL"] },
      { color: "Beige", colorHex: "#E8DCC4", sizes: ["S", "M", "L", "XL", "XXL"] },
    ],
    fabrics: CAMISA_FABRICS,
  },
  {
    id: "hoodie-basico",
    slug: "hoodie-basico",
    category: "hoodie",
    name: "Hoodie con capucha",
    description: "Hoodie fleece con bolsillo canguro, ideal para diseños grandes, y tu propia etiqueta por dentro.",
    basePrice: 510,
    image: "https://images.unsplash.com/photo-1581655353466-d5ad6765dd37?w=900&q=80&auto=format&fit=crop",
    techniques: ["serigrafia", "sublimado", "dtf"],
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
    techniques: ["serigrafia", "sublimado", "dtf"],
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
    description:
      "Polo de piqué con cuello y botones, con tu logo bordado o en DTF, y tu propia etiqueta por dentro. Ideal para uniformes de empresa.",
    basePrice: 380,
    image: "https://images.unsplash.com/photo-1625910513413-c23b8bb81cba?w=900&q=80&auto=format&fit=crop",
    techniques: ["bordado", "dtf"],
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

export function getFabric(productId: string, fabricId?: string | null): FabricOption | undefined {
  return fabricId ? getProductById(productId)?.fabrics?.find((f) => f.id === fabricId) : undefined;
}

// Técnicas posibles para un producto en una tela (sin tela: las del producto).
export function lineTechniques(productId: string, fabricId?: string | null): Technique[] {
  const product = getProductById(productId);
  if (!product) return [];
  const fabric = getFabric(productId, fabricId);
  return fabric ? product.techniques.filter((t) => fabric.techniques.includes(t)) : product.techniques;
}

// Como sharedTechniques, pero tomando en cuenta la tela de cada línea.
export function sharedTechniquesForLines(lines: { productId: string; fabric?: string | null }[]): Technique[] {
  const all = Object.keys(TECHNIQUE_LABEL) as Technique[];
  return all.filter((t) => lines.every((l) => lineTechniques(l.productId, l.fabric).includes(t)));
}
