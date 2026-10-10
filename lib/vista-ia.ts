import { DesignZone, ProductCategory } from "./types";

// Las escenas que puede elegir el cliente para "Verla puesta" y lo que se le pide a la IA.
export type AiScene = "calle" | "estudio" | "grupo";

// Cuántas fotos puede crear cada persona en 24 horas, y todo el sitio en un día.
export const AI_PHOTOS_PER_PERSON = 10;
export const AI_PHOTOS_PER_DAY = 80;

// Claves en la tabla cuenta_limites (también las lee el panel, en Fotos IA).
export const AI_PERSON_PREFIX = "vista-ia-ip:";
export const AI_DAY_PREFIX = "vista-ia-dia:";

export const AI_SCENES: { value: AiScene; label: string }[] = [
  { value: "calle", label: "En la calle" },
  { value: "estudio", label: "En estudio" },
  { value: "grupo", label: "Con su grupo" },
];

const GARMENT: Record<ProductCategory, string> = {
  camisa: "short-sleeve crew-neck t-shirt",
  hoodie: "pullover hoodie",
  tote: "canvas tote bag",
  polo: "polo shirt",
  gorra: "baseball cap",
};

const SETTING: Record<AiScene, string> = {
  calle: "walking on a sunny, colorful street in Managua, Nicaragua",
  estudio: "standing in a clean photo studio with a plain light-gray background",
  grupo: "with a few friends wearing the same item, outdoors at a school or sports field in Nicaragua",
};

function view(category: ProductCategory, zone: DesignZone): string {
  if (category === "tote") return "carrying the bag on one shoulder so the printed side faces the camera";
  if (category === "gorra") return "wearing the cap facing the camera so the front print is clearly visible";
  if (zone === "espalda") return "photographed from behind so the print on the back is clearly visible";
  if (zone === "manga-izq") return "photographed from their left side so the print on the left sleeve is clearly visible";
  if (zone === "manga-der") return "photographed from their right side so the print on the right sleeve is clearly visible";
  return "facing the camera so the print on the front is clearly visible";
}

// Las instrucciones van en inglés: así las sigue mejor el modelo de imágenes.
export function aiPrompt(category: ProductCategory, zone: DesignZone, colorName: string, scene: AiScene): string {
  const garment = GARMENT[category];
  return [
    `The attached image is a flat mockup of a custom-printed ${garment}${colorName ? ` (color: ${colorName})` : ""}.`,
    `Create one realistic, natural lifestyle photo of a young Central American person wearing or using exactly this ${garment}, ${SETTING[scene]}, ${view(category, zone)}.`,
    "Reproduce the printed design exactly as in the mockup: same artwork, same text and letters, same colors, same size and same position on the garment.",
    "Do not add, remove, translate or change any letters, logos or graphics, and do not add any other text, watermark or brand.",
    "The garment color must match the mockup. Natural daylight, sharp focus on the print, photographic quality.",
  ].join(" ");
}
