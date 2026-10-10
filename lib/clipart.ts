import type { SourceImage } from "./design";

// Dibujos listos para agregar al diseño (birrete, balón, corona…). Son formas sólidas de
// un solo color, que se imprimen bien en cualquier técnica. Cada uno se dibuja en un
// cuadro de 100 × 100 con currentColor y se convierte en un PNG transparente grande.

export interface Clipart {
  id: string;
  label: string;
  group: "Graduación" | "Deportes" | "Celebración" | "Fe" | "Otros";
  svg: string; // contenido del <svg viewBox="0 0 100 100">
}

const line = (d: string, w = 6) =>
  `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Hojas de un laurel a lo largo de una rama (lado izquierdo; el derecho es su espejo).
const laurelLeaves = [
  [24, 80, -40],
  [17, 68, -62],
  [13, 55, -78],
  [13, 42, -95],
  [17, 29, -112],
  [24, 18, -130],
]
  .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="4.6" transform="rotate(${r} ${x} ${y})"/>`)
  .join("");

export const CLIPART: Clipart[] = [
  {
    id: "birrete",
    label: "Birrete",
    group: "Graduación",
    svg:
      `<path d="M50 16 L96 36 L50 56 L4 36 Z"/>` +
      `<path d="M24 46 V66 C24 76 76 76 76 66 V46 L50 58 Z"/>` +
      line("M88 40 V64", 3) +
      `<circle cx="88" cy="69" r="5.5"/>`,
  },
  {
    id: "libro",
    label: "Libro",
    group: "Graduación",
    svg:
      `<path d="M10 22 C27 15 41 17 47 25 V86 C41 78 27 76 10 82 Z"/>` +
      `<path d="M90 22 C73 15 59 17 53 25 V86 C59 78 73 76 90 82 Z"/>`,
  },
  {
    id: "laurel",
    label: "Laureles",
    group: "Graduación",
    svg:
      `<g>${line("M48 92 C26 86 12 66 13 40 C14 30 18 22 24 14", 3.5)}${laurelLeaves}</g>` +
      `<g transform="translate(100 0) scale(-1 1)">${line("M48 92 C26 86 12 66 13 40 C14 30 18 22 24 14", 3.5)}${laurelLeaves}</g>`,
  },
  {
    id: "estrella",
    label: "Estrella",
    group: "Celebración",
    svg: `<polygon points="50,5 61,37 95,37 68,58 78,92 50,72 22,92 32,58 5,37 39,37"/>`,
  },
  {
    id: "corona",
    label: "Corona",
    group: "Celebración",
    svg:
      `<path d="M10 74 L15 32 L33 52 L50 22 L67 52 L85 32 L90 74 Z"/>` +
      `<rect x="10" y="79" width="80" height="11" rx="2"/>` +
      `<circle cx="15" cy="27" r="6"/><circle cx="50" cy="17" r="6"/><circle cx="85" cy="27" r="6"/>`,
  },
  {
    id: "trofeo",
    label: "Trofeo",
    group: "Deportes",
    svg:
      `<path d="M28 10 H72 V38 C72 55 62 64 50 64 C38 64 28 55 28 38 Z"/>` +
      line("M28 18 H15 C15 34 21 43 31 45 M72 18 H85 C85 34 79 43 69 45", 6) +
      `<rect x="44" y="62" width="12" height="14"/>` +
      `<rect x="28" y="76" width="44" height="12" rx="2"/>`,
  },
  {
    id: "medalla",
    label: "Medalla",
    group: "Deportes",
    svg:
      `<polygon points="26,4 44,4 60,40 42,40"/>` +
      `<polygon points="74,4 56,4 40,40 58,40"/>` +
      `<circle cx="50" cy="64" r="27"/>`,
  },
  {
    id: "futbol",
    label: "Fútbol",
    group: "Deportes",
    svg:
      `<circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width="6"/>` +
      `<polygon points="50,33 65,44 59,62 41,62 35,44"/>` +
      line("M50 33 V9 M65 44 L88 37 M59 62 L73 83 M41 62 L27 83 M35 44 L12 37", 5),
  },
  {
    id: "baloncesto",
    label: "Baloncesto",
    group: "Deportes",
    svg:
      `<circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width="6"/>` +
      line("M7 50 H93 M50 7 V93 M21 19 C38 36 38 64 21 81 M79 19 C62 36 62 64 79 81", 5),
  },
  {
    id: "beisbol",
    label: "Béisbol",
    group: "Deportes",
    svg:
      `<circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" stroke-width="6"/>` +
      line("M25 15 C39 33 39 67 25 85 M75 15 C61 33 61 67 75 85", 4.5) +
      line(
        "M26 27 L35 24 M29 38 L38 37 M30 50 L40 50 M29 62 L38 63 M26 73 L35 76 M74 27 L65 24 M71 38 L62 37 M70 50 L60 50 M71 62 L62 63 M74 73 L65 76",
        3
      ),
  },
  {
    id: "huella",
    label: "Huella",
    group: "Deportes",
    svg:
      `<ellipse cx="50" cy="67" rx="22" ry="18"/>` +
      `<ellipse cx="21" cy="42" rx="8" ry="11" transform="rotate(-20 21 42)"/>` +
      `<ellipse cx="38" cy="25" rx="8" ry="11" transform="rotate(-8 38 25)"/>` +
      `<ellipse cx="62" cy="25" rx="8" ry="11" transform="rotate(8 62 25)"/>` +
      `<ellipse cx="79" cy="42" rx="8" ry="11" transform="rotate(20 79 42)"/>`,
  },
  {
    id: "rayo",
    label: "Rayo",
    group: "Deportes",
    svg: `<polygon points="60,4 18,56 46,56 36,96 82,40 54,40 66,4"/>`,
  },
  {
    id: "fuego",
    label: "Fuego",
    group: "Deportes",
    svg: `<path d="M50 4 C58 24 80 34 80 60 C80 80 66 94 50 94 C34 94 20 80 20 62 C20 46 30 38 34 26 C38 38 44 42 47 42 C46 28 44 16 50 4 Z"/>`,
  },
  {
    id: "escudo",
    label: "Escudo",
    group: "Otros",
    svg: `<path d="M50 4 L88 16 V46 C88 70 72 86 50 96 C28 86 12 70 12 46 V16 Z"/>`,
  },
  {
    id: "corazon",
    label: "Corazón",
    group: "Celebración",
    svg: `<path d="M50 90 C14 64 4 44 10 28 C16 12 38 8 50 26 C62 8 84 12 90 28 C96 44 86 64 50 90 Z"/>`,
  },
  {
    id: "cruz",
    label: "Cruz",
    group: "Fe",
    svg: `<path d="M42 5 H58 V29 H82 V45 H58 V95 H42 V45 H18 V29 H42 Z"/>`,
  },
  {
    id: "nota",
    label: "Música",
    group: "Celebración",
    svg: line("M38 76 V19 L84 9 V65", 7) + `<ellipse cx="27" cy="78" rx="13" ry="10"/><ellipse cx="73" cy="67" rx="13" ry="10"/>`,
  },
  {
    id: "sol",
    label: "Sol",
    group: "Otros",
    svg:
      `<circle cx="50" cy="50" r="21"/>` +
      line("M50 6 V18 M50 82 V94 M6 50 H18 M82 50 H94 M19 19 L27 27 M73 73 L81 81 M81 19 L73 27 M27 73 L19 81", 7),
  },
  {
    id: "volcan",
    label: "Volcán",
    group: "Otros",
    svg: `<path d="M5 90 L38 36 H62 L95 90 Z"/><circle cx="43" cy="22" r="8"/><circle cx="57" cy="15" r="10"/><circle cx="70" cy="20" r="6"/>`,
  },
];

export function clipartSvg(item: Clipart, color: string, size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" color="${color}" fill="currentColor">${item.svg}</svg>`;
}

// Lado del PNG: a 30 cm da más de 170 ppp, y como son formas lisas pesa poco.
const CLIPART_PX = 2048;

// El dibujo en el color elegido, como un PNG transparente listo para el diseño.
export async function renderClipart(item: Clipart, color: string): Promise<SourceImage> {
  const url = URL.createObjectURL(new Blob([clipartSvg(item, color, CLIPART_PX)], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = CLIPART_PX;
    canvas.height = CLIPART_PX;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Tu navegador no pudo dibujar la figura.");
    ctx.drawImage(img, 0, 0, CLIPART_PX, CLIPART_PX);

    // Se recorta al borde de la figura: así su cuadro coincide con lo que se ve y se centra bien.
    const { data } = ctx.getImageData(0, 0, CLIPART_PX, CLIPART_PX);
    let top = CLIPART_PX, left = CLIPART_PX, right = -1, bottom = -1;
    for (let y = 0; y < CLIPART_PX; y++) {
      for (let x = 0; x < CLIPART_PX; x++) {
        if (data[(y * CLIPART_PX + x) * 4 + 3] > 8) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }
    const pad = 8;
    left = Math.max(0, left - pad);
    top = Math.max(0, top - pad);
    const width = right < 0 ? CLIPART_PX : Math.min(CLIPART_PX, right + pad + 1) - left;
    const height = bottom < 0 ? CLIPART_PX : Math.min(CLIPART_PX, bottom + pad + 1) - top;
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    out.getContext("2d")?.drawImage(canvas, left, top, width, height, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Tu navegador no pudo dibujar la figura.");
    const file = new File([blob], `dibujo-${item.id}.png`, { type: "image/png", lastModified: Date.now() });
    return { file, previewUrl: URL.createObjectURL(file), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
