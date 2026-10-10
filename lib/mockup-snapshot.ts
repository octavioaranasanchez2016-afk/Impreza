// Foto plana de lo que muestra el diseñador (la prenda con su diseño), para mandarla a
// la IA que la convierte en una foto de alguien usándola. Se dibuja en un lienzo a partir
// de lo que ya está en pantalla: la silueta (SVG) y cada imagen o texto en su lugar.

const BACKGROUND = "#EDEDEB";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo dibujar la prenda."));
    img.src = url;
  });
}

// La silueta de la prenda, sin la línea punteada del área de impresión.
async function drawGarment(ctx: CanvasRenderingContext2D, container: HTMLElement, size: number) {
  const svg = container.querySelector("svg");
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll("rect[stroke-dasharray]").forEach((guide) => guide.remove());
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(size));
  clone.setAttribute("height", String(size));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
  try {
    ctx.drawImage(await loadImage(url), 0, 0, size, size);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// La transparencia acumulada de un elemento (las piezas en segundo plano van más claras).
function opacityOf(el: HTMLElement, container: HTMLElement): number {
  let alpha = 1;
  for (let node: HTMLElement | null = el; node && node !== container; node = node.parentElement) {
    alpha *= parseFloat(getComputedStyle(node).opacity) || 1;
  }
  return alpha;
}

export async function snapshotMockup(container: HTMLElement, size = 1024): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo preparar la imagen.");
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, size, size);
  await drawGarment(ctx, container, size);

  const box = container.getBoundingClientRect();
  const scale = size / box.width;
  // Cada pieza es un bloque centrado en (left, top) y girado; en el orden del DOM, que es
  // el orden en que se pintan (lo de abajo primero).
  const pieces = container.querySelectorAll<HTMLElement>("div[style*='translate(-50%, -50%)']");
  for (const piece of pieces) {
    const parent = piece.parentElement;
    if (!parent || !parent.offsetWidth) continue;
    const parentBox = parent.getBoundingClientRect();
    const zoom = parentBox.width / parent.offsetWidth;
    const cx = (parentBox.left - box.left + (parseFloat(piece.style.left) / 100) * parentBox.width) * scale;
    const cy = (parentBox.top - box.top + (parseFloat(piece.style.top) / 100) * parentBox.height) * scale;
    const w = piece.offsetWidth * zoom * scale;
    const h = piece.offsetHeight * zoom * scale;
    const rotation = Number(/rotate\((-?[\d.]+)deg\)/.exec(piece.style.transform)?.[1] ?? 0);

    ctx.save();
    ctx.globalAlpha = opacityOf(piece, container);
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);

    const img = piece.querySelector("img");
    const text = piece.querySelector("p");
    if (img && img.naturalWidth) {
      if (getComputedStyle(img).objectFit === "cover") {
        // "Llenar área": la imagen cubre el bloque y se recorta lo que sobra.
        const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const sw = w / s;
        const sh = h / s;
        ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, -w / 2, -h / 2, w, h);
      } else {
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }
    } else if (text && !text.classList.contains("opacity-40")) {
      const style = getComputedStyle(text);
      const fontSize = parseFloat(style.fontSize) * zoom * scale;
      ctx.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const outline = /(#[0-9a-f]{6})/i.exec(text.style.getPropertyValue("-webkit-text-stroke"))?.[1];
      if (outline) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = fontSize * 0.14;
        ctx.lineJoin = "round";
        ctx.strokeText(text.textContent ?? "", 0, 0);
      }
      ctx.fillStyle = style.color;
      ctx.fillText(text.textContent ?? "", 0, 0);
    }
    ctx.restore();
  }

  return canvas.toDataURL("image/jpeg", 0.9);
}
