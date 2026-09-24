export const ACCEPTED_DESIGN_TYPES = ["image/png", "image/jpeg", "application/pdf"];
export const MAX_DESIGN_SIZE_MB = 25;
// Heurística simple para MVP: lado más corto en píxeles. La validación de
// DPI real (fase 3) requiere leer metadata de la imagen o el tamaño de
// impresión que elija el cliente.
const MIN_SHORT_SIDE_PX = 1000;
const WARN_SHORT_SIDE_PX = 1500;

export const TEXT_COLOR_OPTIONS = [
  { label: "Negro", value: "#111111" },
  { label: "Blanco", value: "#FFFFFF" },
  { label: "Magenta", value: "#E5007E" },
  { label: "Cian", value: "#00A6E0" },
  { label: "Amarillo", value: "#FBC72D" },
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
  warning: string | null;
}

export type DesignContent = ImageDesignContent | MockupTextContent;

export interface DesignFileResult {
  content: ImageDesignContent | null;
  error: string | null;
}

export async function validateDesignFile(file: File): Promise<DesignFileResult> {
  if (!ACCEPTED_DESIGN_TYPES.includes(file.type)) {
    return { content: null, error: "Formato no válido. Sube un archivo PNG, JPG o PDF." };
  }

  if (file.size > MAX_DESIGN_SIZE_MB * 1024 * 1024) {
    return { content: null, error: `El archivo pesa demasiado (máximo ${MAX_DESIGN_SIZE_MB}MB).` };
  }

  if (file.type === "application/pdf") {
    // Un PDF no tiene dimensiones de imagen; usamos un tamaño de referencia
    // neutro (cuadrado) para que el ajuste automático no falle.
    return {
      content: { kind: "imagen", file, previewUrl: "", warning: null, width: 1000, height: 1000 },
      error: null,
    };
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

  const warning =
    shortSide < WARN_SHORT_SIDE_PX
      ? "La resolución es aceptable pero no ideal. Para impresiones grandes podría verse borrosa."
      : null;

  return {
    content: { kind: "imagen", file, previewUrl, warning, width: dimensions.width, height: dimensions.height },
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
