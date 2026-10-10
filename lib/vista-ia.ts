import { DesignZone, ProductCategory } from "./types";

// Las escenas que puede elegir el cliente para "Verla puesta" y lo que se le pide a la IA.
export type AiScene = "deportiva" | "empresarial" | "casual";

// Cuántas fotos se pueden crear en 24 horas: cada celular o computadora, cada conexión a
// internet (una casa con varias personas, o muchos celulares de la misma compañía) y
// todo el sitio en un día.
export const AI_PHOTOS_PER_DEVICE = 10;
export const AI_PHOTOS_PER_CONNECTION = 30;
export const AI_PHOTOS_PER_DAY = 80;

// Claves en la tabla cuenta_limites (también las lee el panel, en Fotos IA).
export const AI_DEVICE_PREFIX = "vista-ia-disp:";
export const AI_CONNECTION_PREFIX = "vista-ia-ip:";
export const AI_DAY_PREFIX = "vista-ia-dia:";

export const AI_SCENES: { value: AiScene; label: string; hint: string }[] = [
  { value: "deportiva", label: "Deportiva", hint: "Cancha o gimnasio" },
  { value: "empresarial", label: "Empresarial", hint: "Oficina moderna" },
  { value: "casual", label: "Casual", hint: "Café o terraza" },
];

const GARMENT: Record<ProductCategory, string> = {
  camisa: "short-sleeve crew-neck t-shirt",
  hoodie: "pullover hoodie",
  tote: "canvas tote bag",
  polo: "polo shirt",
  gorra: "baseball cap",
};

// Quién sale en la foto y dónde: gente con buena presencia en lugares de nivel, como en
// una campaña de ropa, no fotos de la calle.
const SCENE: Record<AiScene, { model: string; place: string; outfit: string }> = {
  deportiva: {
    model: "a fit, athletic, attractive Latin American model in their twenties, confident and energetic",
    place:
      "at a brand-new professional sports complex: a pristine artificial-turf soccer field with modern stadium lights at golden hour, or a sleek high-end gym with clean lines and natural light",
    outfit: "with modern athletic pants or shorts and clean premium sneakers",
  },
  empresarial: {
    model: "a polished, well-groomed, attractive Latin American professional in their late twenties or thirties, confident and friendly",
    place:
      "in a bright, modern corporate office with glass walls, wood and plants, a contemporary meeting room or open workspace with a city view, like the headquarters of a successful company",
    outfit: "with tailored chinos or dress trousers and clean leather shoes, a smart uniform look",
  },
  casual: {
    model: "a stylish, attractive Latin American model in their twenties with a modern haircut, relaxed and smiling",
    place:
      "at an upscale lifestyle location: the terrace of a chic modern café with plants and warm natural light, or a beautifully kept boutique hotel courtyard",
    outfit: "with well-fitted jeans or chinos and clean fashionable sneakers",
  },
};

function view(category: ProductCategory, zone: DesignZone): string {
  if (category === "tote") return "carrying the bag on one shoulder so the printed side faces the camera";
  if (category === "gorra") return "wearing the cap facing the camera so the front print is clearly visible";
  if (zone === "espalda") return "photographed from behind, looking over the shoulder, so the print on the back is clearly visible";
  if (zone === "manga-izq") return "photographed from their left side so the print on the left sleeve is clearly visible";
  if (zone === "manga-der") return "photographed from their right side so the print on the right sleeve is clearly visible";
  return "facing the camera so the print on the front is clearly visible";
}

// Las instrucciones van en inglés: así las sigue mejor el modelo de imágenes.
export function aiPrompt(category: ProductCategory, zone: DesignZone, colorName: string, scene: AiScene): string {
  const garment = GARMENT[category];
  const s = SCENE[scene];
  return [
    `The attached image is a flat mockup of a custom-printed ${garment}${colorName ? ` (color: ${colorName})` : ""}.`,
    `Create one high-end commercial fashion photograph, like a premium clothing brand ad campaign: ${s.model}, wearing or using exactly this ${garment} ${s.outfit}, ${s.place}, ${view(category, zone)}.`,
    "The garment looks brand new, well fitted and neatly pressed. The setting is clean, modern, well kept and aspirational.",
    "Professional photography: shot on a full-frame camera with an 85mm lens, soft flattering light, shallow depth of field, sharp focus on the garment and the print, natural skin tones, magazine quality.",
    "Reproduce the printed design exactly as in the mockup: same artwork, same text and letters, same colors, same size and same position on the garment.",
    "Do not add, remove, translate or change any letters, logos or graphics, and do not add any other text, watermark or brand.",
    "The garment color must match the mockup. No run-down, dirty or cluttered places, no worn-out clothes.",
  ].join(" ");
}
