import { DesignTransform } from "./types";
import type { ImageEffects } from "./image-effects";

// Se acepta cualquier imagen; prepareDesignFile la pasa a JPG si hace falta.
export const ACCEPTED_DESIGN_TYPES = ["image/*"];
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

export type FontFamilyKey =
  | "sans"
  | "display"
  | "script"
  | "serif"
  | "mono"
  | "colegial"
  | "gotica"
  | "marcador"
  | "manuscrita"
  | "retro"
  | "bloque"
  | "militar"
  | "redonda"
  | "condensada"
  | "deportiva"
  | "carreras"
  | "slab"
  | "comic"
  | "caricatura"
  | "grafiti"
  | "pincel"
  | "cursiva"
  | "caligrafia"
  | "firma"
  | "vintage"
  | "vaquera"
  | "clasica"
  | "revista"
  | "setentas"
  | "futurista"
  | "pixel"
  | "terror"
  | "metal";

// weight: grosor con que se dibuja. Las fuentes que solo vienen en un grosor van en
// 400; si se les pide negrita, el navegador la inventa y se ve mal.
// name: el nombre real de la fuente (Google Fonts), para que el taller la encuentre.
export const FONT_OPTIONS: { label: string; value: FontFamilyKey; cssVar: string; weight: number; name: string }[] = [
  { label: "Moderna", value: "sans", cssVar: "var(--font-sans)", weight: 700, name: "Inter" },
  { label: "Impacto", value: "display", cssVar: "var(--font-display)", weight: 700, name: "Bebas Neue" },
  { label: "Colegial", value: "colegial", cssVar: "var(--font-colegial)", weight: 400, name: "Graduate" },
  { label: "Gótica", value: "gotica", cssVar: "var(--font-gotica)", weight: 400, name: "UnifrakturMaguntia" },
  { label: "Script", value: "script", cssVar: "var(--font-script)", weight: 400, name: "Pacifico" },
  { label: "Retro", value: "retro", cssVar: "var(--font-retro)", weight: 400, name: "Lobster" },
  { label: "Marcador", value: "marcador", cssVar: "var(--font-marcador)", weight: 400, name: "Permanent Marker" },
  { label: "Manuscrita", value: "manuscrita", cssVar: "var(--font-manuscrita)", weight: 700, name: "Caveat" },
  { label: "Bloque", value: "bloque", cssVar: "var(--font-bloque)", weight: 400, name: "Bungee" },
  { label: "Militar", value: "militar", cssVar: "var(--font-militar)", weight: 400, name: "Black Ops One" },
  { label: "Redonda", value: "redonda", cssVar: "var(--font-redonda)", weight: 600, name: "Fredoka" },
  { label: "Elegante", value: "serif", cssVar: "var(--font-serif)", weight: 700, name: "Playfair Display" },
  { label: "Mono", value: "mono", cssVar: "var(--font-mono)", weight: 700, name: "JetBrains Mono" },
  { label: "Condensada", value: "condensada", cssVar: "var(--font-condensada)", weight: 400, name: "Anton" },
  { label: "Deportiva", value: "deportiva", cssVar: "var(--font-deportiva)", weight: 400, name: "Russo One" },
  { label: "Carreras", value: "carreras", cssVar: "var(--font-carreras)", weight: 400, name: "Racing Sans One" },
  { label: "Slab", value: "slab", cssVar: "var(--font-slab)", weight: 400, name: "Alfa Slab One" },
  { label: "Cómic", value: "comic", cssVar: "var(--font-comic)", weight: 400, name: "Bangers" },
  { label: "Caricatura", value: "caricatura", cssVar: "var(--font-caricatura)", weight: 400, name: "Luckiest Guy" },
  { label: "Grafiti", value: "grafiti", cssVar: "var(--font-grafiti)", weight: 400, name: "Sedgwick Ave Display" },
  { label: "Pincel", value: "pincel", cssVar: "var(--font-pincel)", weight: 400, name: "Kaushan Script" },
  { label: "Cursiva", value: "cursiva", cssVar: "var(--font-cursiva)", weight: 700, name: "Dancing Script" },
  { label: "Caligrafía", value: "caligrafia", cssVar: "var(--font-caligrafia)", weight: 400, name: "Great Vibes" },
  { label: "Firma", value: "firma", cssVar: "var(--font-firma)", weight: 400, name: "Satisfy" },
  { label: "Vintage", value: "vintage", cssVar: "var(--font-vintage)", weight: 400, name: "Yellowtail" },
  { label: "Vaquera", value: "vaquera", cssVar: "var(--font-vaquera)", weight: 400, name: "Rye" },
  { label: "Clásica", value: "clasica", cssVar: "var(--font-clasica)", weight: 700, name: "Cinzel" },
  { label: "Revista", value: "revista", cssVar: "var(--font-revista)", weight: 400, name: "Abril Fatface" },
  { label: "Años 70", value: "setentas", cssVar: "var(--font-setentas)", weight: 400, name: "Righteous" },
  { label: "Futurista", value: "futurista", cssVar: "var(--font-futurista)", weight: 700, name: "Orbitron" },
  { label: "Pixel", value: "pixel", cssVar: "var(--font-pixel)", weight: 400, name: "Press Start 2P" },
  { label: "Terror", value: "terror", cssVar: "var(--font-terror)", weight: 400, name: "Creepster" },
  { label: "Metal", value: "metal", cssVar: "var(--font-metal)", weight: 400, name: "Metal Mania" },
];

// Cuántas letras se ven en el diseñador antes de tocar "Ver todas".
export const FONTS_SHOWN_FIRST = 12;

export function fontFamilyCss(key: FontFamilyKey): string {
  return FONT_OPTIONS.find((f) => f.value === key)?.cssVar ?? "var(--font-sans)";
}

export function fontWeight(key: FontFamilyKey): number {
  return FONT_OPTIONS.find((f) => f.value === key)?.weight ?? 700;
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
  // true: cubre toda el área de impresión recortando los bordes de la imagen.
  fill?: boolean;
}

export interface MockupTextContent {
  kind: "texto";
  texto: string;
  color: string;
  fontFamily: FontFamilyKey;
  outline?: string | null; // color del contorno de las letras; sin valor = sin contorno
}

// Otra cosa en la misma parte de la prenda, además del diseño principal: un texto o una
// imagen (por ejemplo, "SENIOR" arriba y el logo debajo). Cada una se mueve, se agranda
// y se gira aparte. En el diseñador lleva el archivo (DesignContent); para dibujarla
// basta MockupContent.
export interface ExtraPiece<C extends MockupContent = DesignContent> {
  content: C;
  transform: DesignTransform;
}

// Cuántas cosas puede llevar una misma parte (el diseño principal y los otros textos).
export const MAX_PIECES_PER_ZONE = 6;

// Grosor del contorno, relativo al tamaño de la letra.
export const TEXT_OUTLINE_WIDTH = "0.07em";

export type MockupContent = MockupImageContent | MockupTextContent;

// Parte de la imagen que se usa, en fracciones (0 a 1) del ancho y alto originales.
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SourceImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export interface ImageDesignContent extends MockupImageContent {
  file: File;
  // Si el cliente eligió qué parte de su imagen usar: la original y el recorte, para
  // poder cambiarlo. Lo que se sube e imprime es file (ya recortado).
  source?: SourceImage & { crop: CropRect };
  // Si se le dio forma o se le quitó el fondo: la imagen de antes (ya recortada) y lo
  // que se aplicó. Lo que se sube e imprime es file (el PNG con transparencia).
  effects?: ImageEffects;
  // Si es uno de los dibujos de Impreza: cuál y en qué color, para poder cambiarle el color.
  clipart?: { id: string; color: string };
}

// El recorte más grande con esa proporción (ancho/alto en píxeles), centrado.
export function centeredCrop(aspect: number, width: number, height: number): CropRect {
  const w = width / height > aspect ? (aspect * height) / width : 1;
  const h = width / height > aspect ? 1 : width / (aspect * height);
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

// Proporción en píxeles de un recorte.
export const cropAspect = (crop: CropRect, width: number, height: number) => (crop.w * width) / (crop.h * height);

// Lado más largo del recorte: los navegadores del celular no pueden dibujar lienzos
// mucho más grandes, y a 30 cm sigue dando más de 300 ppp.
const MAX_CROP_SIDE = 4096;

// Recorta la imagen en el navegador y devuelve un JPG nuevo con solo esa parte.
export async function cropImageFile(source: SourceImage, crop: CropRect): Promise<SourceImage> {
  const img = new Image();
  img.src = source.previewUrl;
  await img.decode();
  const sx = Math.round(crop.x * img.naturalWidth);
  const sy = Math.round(crop.y * img.naturalHeight);
  const sw = Math.max(1, Math.round(crop.w * img.naturalWidth));
  const sh = Math.max(1, Math.round(crop.h * img.naturalHeight));
  const ratio = Math.min(1, MAX_CROP_SIDE / Math.max(sw, sh));
  const width = Math.round(sw * ratio);
  const height = Math.round(sh * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo recortar la imagen.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("Tu navegador no pudo recortar la imagen.");

  const base = source.file.name.replace(/\.[^.]+$/, "").replace(/^recorte-/, "");
  const file = new File([blob], `recorte-${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  return { file, previewUrl: URL.createObjectURL(file), width, height };
}

export type DesignContent = ImageDesignContent | MockupTextContent;

export interface DesignFileResult {
  content: ImageDesignContent | null;
  error: string | null;
  // Qué se le cambió a la imagen para poder imprimirla, para contárselo al cliente.
  notice: string | null;
}

// Más que esto ni se intenta abrir: el celular se puede quedar sin memoria.
const MAX_INPUT_SIZE_MB = 60;
// Por debajo de esto, aunque se agrande, en la prenda se ve borrosa.
const BLURRY_SHORT_SIDE_PX = 500;
const IMAGE_NAME = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;

// Algunos navegadores dejan file.type vacío; en ese caso se decide por la extensión.
function isJpeg(file: File): boolean {
  if (file.type) return file.type === "image/jpeg";
  return /\.jpe?g$/i.test(file.name);
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// true si alguna parte de la imagen es transparente (se revisa en chico, es rápido).
function hasTransparency(img: HTMLImageElement): boolean {
  const ratio = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
  return false;
}

// Acepta cualquier imagen que el navegador pueda abrir y, si hace falta, la deja lista para
// imprimir: la pasa a JPG, la agranda hasta 1000 px en su lado corto o la achica si es enorme.
// Todo lo que se cambió va en notice, para que el cliente lo sepa.
export async function prepareDesignFile(file: File): Promise<DesignFileResult> {
  const fail = (error: string): DesignFileResult => ({ content: null, error, notice: null });
  if (!file.type.startsWith("image/") && !IMAGE_NAME.test(file.name)) {
    return fail("Ese archivo no es una imagen. Sube una foto o imagen (JPG, PNG o WEBP).");
  }
  if (file.size > MAX_INPUT_SIZE_MB * 1024 * 1024) {
    return fail(`La imagen pesa demasiado (máximo ${MAX_INPUT_SIZE_MB} MB).`);
  }

  const sourceUrl = URL.createObjectURL(file);
  const img = await loadImage(sourceUrl);
  if (!img || !img.naturalWidth || !img.naturalHeight) {
    URL.revokeObjectURL(sourceUrl);
    return fail("No pudimos abrir esta imagen. Guárdala como JPG o PNG y vuelve a subirla.");
  }

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const shortSide = Math.min(w, h);
  const longSide = Math.max(w, h);
  const jpeg = isJpeg(file);
  const tooSmall = shortSide < MIN_SHORT_SIDE_PX;
  const tooBig = longSide > MAX_CROP_SIDE || file.size > MAX_DESIGN_SIZE_MB * 1024 * 1024;

  if (jpeg && !tooSmall && !tooBig) {
    return { content: { kind: "imagen", file, previewUrl: sourceUrl, width: w, height: h }, error: null, notice: null };
  }

  const scale = Math.min(tooSmall ? MIN_SHORT_SIDE_PX / shortSide : 1, MAX_CROP_SIDE / longSide);
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  const transparent = !jpeg && hasTransparency(img);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(sourceUrl);
    return fail("Tu navegador no pudo preparar la imagen. Guárdala como JPG y vuelve a subirla.");
  }
  // El JPG no guarda transparencia: lo transparente queda blanco.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(sourceUrl);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) return fail("Tu navegador no pudo preparar la imagen. Guárdala como JPG y vuelve a subirla.");

  const base = file.name.replace(/\.[^.]+$/, "") || "diseno";
  const ready = new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });

  const changes: string[] = [];
  if (!jpeg) {
    const format = (file.type.split("/")[1] || file.name.split(".").pop() || "").toUpperCase();
    changes.push(`La pasamos de ${format || "su formato"} a JPG para imprimirla.`);
    if (transparent) changes.push("Lo que era transparente ahora es blanco; si la quieres sin fondo, escríbenos por WhatsApp.");
  }
  if (tooSmall) {
    changes.push(
      shortSide < BLURRY_SHORT_SIDE_PX
        ? `Era muy pequeña (${w}×${h} px) y la agrandamos a ${width}×${height} px, pero en la prenda se va a ver borrosa. Si tienes una versión más grande, súbela.`
        : `Era pequeña (${w}×${h} px) y la agrandamos a ${width}×${height} px. Puede verse un poco menos nítida; si tienes una versión más grande, súbela.`
    );
  } else if (tooBig) {
    changes.push(`Era muy grande y la ajustamos a ${width}×${height} px, que alcanza de sobra para imprimirla.`);
  }

  return {
    content: { kind: "imagen", file: ready, previewUrl: URL.createObjectURL(ready), width, height },
    error: null,
    notice: changes.join(" "),
  };
}
