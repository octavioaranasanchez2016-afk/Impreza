import type { SourceImage } from "./design";

// Formas y quitar fondo para las imágenes del diseñador. Todo pasa en el navegador:
// el resultado es un PNG con transparencia, que es lo que el taller imprime.

export type ImageShape = "original" | "circulo" | "redondeada" | "corazon" | "estrella" | "hexagono";
export type BackgroundStrength = "suave" | "normal" | "fuerte" | "todo";

export const IMAGE_SHAPES: { value: ImageShape; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "circulo", label: "Círculo" },
  { value: "redondeada", label: "Redondeada" },
  { value: "corazon", label: "Corazón" },
  { value: "estrella", label: "Estrella" },
  { value: "hexagono", label: "Hexágono" },
];

export const BACKGROUND_STRENGTHS: { value: BackgroundStrength; label: string; tolerance: number }[] = [
  { value: "suave", label: "Suave", tolerance: 24 },
  { value: "normal", label: "Normal", tolerance: 44 },
  { value: "fuerte", label: "Fuerte", tolerance: 72 },
  // También los huecos de adentro (el centro de la O, la A…), aunque no toquen el borde.
  { value: "todo", label: "Todo ese color", tolerance: 44 },
];

// Lo que se le aplicó a la imagen y la imagen de antes (ya recortada), para poder
// cambiarlo o quitarlo sin volver a subirla.
export interface ImageEffects {
  base: SourceImage;
  shape: ImageShape;
  removeBackground: BackgroundStrength | null;
}

export const hasEffects = (e: { shape: ImageShape; removeBackground: BackgroundStrength | null }) =>
  e.shape !== "original" || e.removeBackground !== null;

// Lado más largo del PNG: a 30 cm sigue dando más de 230 ppp y no pasa de 25 MB.
const MAX_PNG_SIDE = 2800;
const MAX_PNG_BYTES = 24 * 1024 * 1024;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No pudimos abrir la imagen."));
    img.src = url;
  });
}

// El color del fondo: el más repetido en el borde de la imagen (agrupado de a 16 tonos).
function borderColor(data: Uint8ClampedArray, w: number, h: number): [number, number, number] {
  const counts = new Map<number, { n: number; r: number; g: number; b: number }>();
  const add = (i: number) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const c = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    c.n++;
    c.r += r;
    c.g += g;
    c.b += b;
    counts.set(key, c);
  };
  for (let x = 0; x < w; x++) {
    add(x * 4);
    add(((h - 1) * w + x) * 4);
  }
  for (let y = 0; y < h; y++) {
    add(y * w * 4);
    add((y * w + w - 1) * 4);
  }
  let best = { n: 0, r: 255, g: 255, b: 255 };
  for (const c of counts.values()) if (c.n > best.n) best = c;
  return [best.r / best.n, best.g / best.n, best.b / best.n];
}

// Quita el fondo de un solo color que toca los bordes: desde el borde avanza por los
// píxeles parecidos a ese color y los vuelve transparentes (con everywhere, todos los de
// ese color, aunque estén encerrados); en la orilla del dibujo
// deja una transparencia gradual para que no se vea serrucho. Devuelve qué parte se quitó.
function removeBackground(data: Uint8ClampedArray, w: number, h: number, tolerance: number, everywhere: boolean): number {
  const [br, bg, bb] = borderColor(data, w, h);
  const dist = (p: number) => {
    const i = p * 4;
    const dr = data[i] - br, dg = data[i + 1] - bg, db = data[i + 2] - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const push = (p: number) => {
    if (seen[p] || data[p * 4 + 3] === 0 || dist(p) > tolerance) return;
    seen[p] = 1;
    queue[tail++] = p;
  };
  if (everywhere) {
    for (let p = 0; p < w * h; p++) push(p);
  }
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (p >= w) push(p - w);
    if (p < w * (h - 1)) push(p + w);
  }
  for (let i = 0; i < tail; i++) data[queue[i] * 4 + 3] = 0;

  // Orilla suave: los píxeles junto al fondo quitado que se le parecen un poco.
  for (let p = 0; p < w * h; p++) {
    if (seen[p]) continue;
    const x = p % w;
    const touches =
      (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (p >= w && seen[p - w]) || (p < w * (h - 1) && seen[p + w]);
    if (!touches) continue;
    const d = dist(p);
    if (d < tolerance * 2) data[p * 4 + 3] = Math.round((data[p * 4 + 3] * (d - tolerance)) / tolerance);
  }
  return tail / (w * h);
}

function shapePath(ctx: CanvasRenderingContext2D, shape: ImageShape, w: number, h: number) {
  const s = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  ctx.beginPath();
  if (shape === "circulo") {
    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
  } else if (shape === "redondeada") {
    ctx.roundRect(0, 0, w, h, s * 0.14);
  } else if (shape === "corazon") {
    const top = cy - s * 0.28;
    ctx.moveTo(cx, cy + s * 0.45);
    ctx.bezierCurveTo(cx - s * 0.62, cy + s * 0.02, cx - s * 0.42, top - s * 0.3, cx, top);
    ctx.bezierCurveTo(cx + s * 0.42, top - s * 0.3, cx + s * 0.62, cy + s * 0.02, cx, cy + s * 0.45);
  } else if (shape === "estrella") {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s / 2 : s * 0.21;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(cx + r * Math.cos(a), cy + s * 0.04 + r * Math.sin(a));
    }
  } else if (shape === "hexagono") {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3;
      ctx.lineTo(cx + (s / 2) * Math.cos(a), cy + (s / 2) * Math.sin(a));
    }
  }
  ctx.closePath();
}

// La parte de la imagen que usa cada forma: el círculo, el corazón, la estrella y el
// hexágono van en el cuadrado del centro; la redondeada usa la imagen entera.
function shapeFrame(shape: ImageShape, w: number, h: number) {
  if (shape === "original" || shape === "redondeada") return { sx: 0, sy: 0, sw: w, sh: h };
  const s = Math.min(w, h);
  return { sx: (w - s) / 2, sy: (h - s) / 2, sw: s, sh: s };
}

export interface EffectsResult {
  image: SourceImage;
  // Qué parte de la imagen se volvió transparente al quitar el fondo (0 a 1).
  removed: number;
}

// Aplica la forma y el quitar fondo sobre la imagen base y devuelve un PNG nuevo.
export async function applyImageEffects(
  base: SourceImage,
  shape: ImageShape,
  removeBg: BackgroundStrength | null
): Promise<EffectsResult> {
  const img = await loadImage(base.previewUrl);
  const frame = shapeFrame(shape, img.naturalWidth, img.naturalHeight);
  let ratio = Math.min(1, MAX_PNG_SIDE / Math.max(frame.sw, frame.sh));

  for (let attempt = 0; attempt < 3; attempt++) {
    const width = Math.max(1, Math.round(frame.sw * ratio));
    const height = Math.max(1, Math.round(frame.sh * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Tu navegador no pudo editar la imagen.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, width, height);

    let removed = 0;
    if (removeBg) {
      const tolerance = BACKGROUND_STRENGTHS.find((s) => s.value === removeBg)?.tolerance ?? 44;
      const pixels = ctx.getImageData(0, 0, width, height);
      removed = removeBackground(pixels.data, width, height, tolerance, removeBg === "todo");
      ctx.putImageData(pixels, 0, 0);
    }
    if (shape !== "original") {
      ctx.globalCompositeOperation = "destination-in";
      shapePath(ctx, shape, width, height);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Tu navegador no pudo editar la imagen.");
    if (blob.size > MAX_PNG_BYTES && attempt < 2) {
      ratio *= 0.75;
      continue;
    }
    const name = base.file.name.replace(/\.[^.]+$/, "").replace(/^recorte-/, "") || "diseno";
    const file = new File([blob], `${name}.png`, { type: "image/png", lastModified: Date.now() });
    return { image: { file, previewUrl: URL.createObjectURL(file), width, height }, removed };
  }
  throw new Error("La imagen quedó demasiado pesada. Prueba con una más pequeña.");
}

// Extensión del archivo de diseño en el almacenamiento: PNG si tiene transparencia.
export const designExtension = (file: File) => (file.type === "image/png" ? "png" : "jpg");

// Para cuando el almacenamiento todavía no acepta PNG: lo transparente queda blanco.
export async function flattenToJpeg(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(url);
  }
}
