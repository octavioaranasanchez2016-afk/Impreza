export const ACCEPTED_DESIGN_TYPES = ["image/jpeg"];
export const MAX_DESIGN_SIZE_MB = 25;
const MIN_SHORT_SIDE_PX = 1000;
// Por debajo de esto, al tamaño real de impresión, la imagen se ve pixelada.
export const MIN_PRINT_DPI = 150;

export const TEXT_COLOR_OPTIONS = [
  { label: "Negro", value: "#111111" },
  { label: "Blanco", value: "#FFFFFF" },
  { label: "Gris", value: "#9CA3AF" },
  { label: "Rojo", value: "#DC2626" },
  { label: "Naranja", value: "#F97316" },
  { label: "Amarillo", value: "#FBC72D" },
  { label: "Verde", value: "#16A34A" },
  { label: "Azul", value: "#2563EB" },
  { label: "Azul marino", value: "#1E3A8A" },
  { label: "Morado", value: "#7C3AED" },
  { label: "Rosado", value: "#EC4899" },
  { label: "Magenta", value: "#E5007E" },
  { label: "Cian", value: "#00A6E0" },
  { label: "Dorado", value: "#B8860B" },
];

export type FontFamilyKey = "sans" | "display" | "script" | "serif" | "mono";

export const FONT_OPTIONS: { label: string; value: FontFamilyKey; cssVar: string }[] = [
  { label: "Moderna", value: "sans", cssVar: "var(--font-sans)" },
  { label: "Impacto", value: "display", cssVar: "var(--font-display)" },
  { label: "Script", value: "script", cssVar: "var(--font-script)" },
  { label: "Elegante", value: "serif", cssVar: "var(--font-serif)" },
  { label: "Mono", value: "mono", cssVar: "var(--font-mono)" },
];

export function fontFamilyCss(key: FontFamilyKey): string {
  return FONT_OPTIONS.find((f) => f.value === key)?.cssVar ?? "var(--font-sans)";
}

// Emojis y símbolos rápidos para insertar en el texto — no reemplazan el
// teclado de emojis del dispositivo, solo dan opciones a mano en la web.
export const EMOJI_QUICK_PICKS = [
  "⭐",
  "❤️",
  "🔥",
  "✝️",
  "🐐",
  "⚡",
  "🏆",
  "🎉",
  "☠️",
  "🌵",
  "✔️",
  "♥",
  "★",
  "✦",
  "→",
];

// Lo mínimo que DesignMockup necesita para dibujar un diseño — ni admin (que
// solo tiene una URL firmada) ni el formulario (que tiene el File real)
// necesitan compartir más que esto.
export interface MockupImageContent {
  kind: "imagen";
  previewUrl: string;
  width: number;
  height: number;
}

export interface MockupTextContent {
  kind: "texto";
  texto: string;
  color: string;
  fontFamily: FontFamilyKey;
}

export type MockupContent = MockupImageContent | MockupTextContent;

export interface ImageDesignContent extends MockupImageContent {
  file: File;
}

export type DesignContent = ImageDesignContent | MockupTextContent;

export interface DesignFileResult {
  content: ImageDesignContent | null;
  error: string | null;
}

// Algunos navegadores dejan file.type vacío; en ese caso se decide por la extensión.
function isJpeg(file: File): boolean {
  if (file.type) return file.type === "image/jpeg";
  return /\.jpe?g$/i.test(file.name);
}

export async function validateDesignFile(file: File): Promise<DesignFileResult> {
  if (!isJpeg(file)) {
    return { content: null, error: "Formato no válido. Solo aceptamos imágenes JPG." };
  }

  if (file.size > MAX_DESIGN_SIZE_MB * 1024 * 1024) {
    return { content: null, error: `El archivo pesa demasiado (máximo ${MAX_DESIGN_SIZE_MB}MB).` };
  }

  const previewUrl = URL.createObjectURL(file);
  const dimensions = await getImageDimensions(previewUrl);
  const shortSide = Math.min(dimensions.width, dimensions.height);

  if (shortSide < MIN_SHORT_SIDE_PX) {
    URL.revokeObjectURL(previewUrl);
    return {
      content: null,
      error: `La imagen es muy pequeña (${dimensions.width}×${dimensions.height}px). Sube un archivo de al menos ${MIN_SHORT_SIDE_PX}px en su lado más corto para que la impresión salga nítida.`,
    };
  }

  return {
    content: { kind: "imagen", file, previewUrl, width: dimensions.width, height: dimensions.height },
    error: null,
  };
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}
