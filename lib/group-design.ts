import { ExtraText, FONT_OPTIONS, FontFamilyKey, MAX_PIECES_PER_ZONE, MockupContent } from "./design";
import { getFabric, getProductById } from "./catalog";
import { DesignTransform, DesignZone, Technique } from "./types";

// El diseño del grupo: el organizador lo hace antes de compartir la lista, así cada
// quien ve su camisa (con su nombre) antes de anotarse, y al hacer el pedido ya
// está listo en el diseñador. Se guarda en listas_tallas.estilo.diseno; las imágenes
// van al bucket "disenos" en listas/<id de la lista>/. Este archivo no usa nada del servidor.

interface Placement {
  posX: number;
  posY: number;
  escala: number;
  rotacion: number;
}

export type GroupDesignZone =
  | ({
      zona: DesignZone;
      tipo: "imagen";
      path: string;
      ajuste: "llenar" | "completa";
      anchoPx: number;
      altoPx: number;
      url?: string; // firmada, solo al leerlo
    } & Placement)
  | ({
      zona: DesignZone;
      tipo: "texto";
      texto: string;
      color: string;
      fuente: FontFamilyKey;
      contorno?: string;
    } & Placement);

export interface GroupDesign {
  tecnica: Technique;
  tela: string | null;
  color: string | null; // color de la prenda
  zonas: GroupDesignZone[];
}

// Lo que el diseñador (y la vista previa de la lista) necesita para dibujar cada zona:
// el diseño principal y los otros textos de esa parte.
export type GroupDesignPreview = Partial<
  Record<DesignZone, { content: MockupContent; transform: DesignTransform; extras?: ExtraText[] }>
>;

const ZONES: DesignZone[] = ["frente", "espalda", "manga-izq", "manga-der", "etiqueta"];
const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (n: unknown, min: number, max: number) => Math.min(max, Math.max(min, Number(n) || 0));

export function groupImagePath(listId: string, zone: DesignZone): string {
  return `listas/${listId}/${crypto.randomUUID()}-${zone}.jpg`;
}

// Revisa lo que llega (del navegador o de la base) y deja solo lo válido para
// esta prenda. null si no hay diseño.
export function parseGroupDesign(value: unknown, productId: string, listId: string): GroupDesign | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const product = getProductById(productId);
  if (!product) return null;
  const tecnica = product.techniques.find((t) => t === v.tecnica) ?? product.techniques[0];
  const fabric = getFabric(productId, typeof v.tela === "string" ? v.tela : null);
  const tela = fabric && fabric.techniques.includes(tecnica) ? fabric.id : null;
  const color = product.variants.find((variant) => variant.color === v.color)?.color ?? null;
  const pathPrefix = `listas/${listId}/`;

  const zonas: GroupDesignZone[] = [];
  for (const raw of Array.isArray(v.zonas) ? v.zonas : []) {
    if (!raw || typeof raw !== "object") continue;
    const z = raw as Record<string, unknown>;
    const zona = ZONES.find((zone) => zone === z.zona);
    // Una parte lleva su diseño principal (el primero) y, después, otros textos.
    const before = zonas.filter((other) => other.zona === zona).length;
    if (!zona || before >= MAX_PIECES_PER_ZONE || (before > 0 && z.tipo !== "texto")) continue;
    const placement: Placement = {
      posX: clamp(z.posX, 0, 100),
      posY: clamp(z.posY, 0, 100),
      escala: clamp(z.escala, 0.1, 5),
      rotacion: ((clamp(z.rotacion, -3600, 3600) % 360) + 360) % 360,
    };
    if (z.tipo === "imagen") {
      const path = typeof z.path === "string" ? z.path : "";
      if (!path.startsWith(pathPrefix) || path.includes("..") || !/\.jpg$/.test(path)) continue;
      zonas.push({
        zona,
        tipo: "imagen",
        path,
        ajuste: z.ajuste === "llenar" ? "llenar" : "completa",
        anchoPx: Math.round(clamp(z.anchoPx, 1, 100000)),
        altoPx: Math.round(clamp(z.altoPx, 1, 100000)),
        ...(typeof z.url === "string" ? { url: z.url } : {}),
        ...placement,
      });
    } else if (z.tipo === "texto") {
      const texto = typeof z.texto === "string" ? z.texto.trim().slice(0, 200) : "";
      if (!texto) continue;
      zonas.push({
        zona,
        tipo: "texto",
        texto,
        color: typeof z.color === "string" && HEX.test(z.color) ? z.color : "#111111",
        fuente: FONT_OPTIONS.find((f) => f.value === z.fuente)?.value ?? "sans",
        ...(typeof z.contorno === "string" && HEX.test(z.contorno) ? { contorno: z.contorno } : {}),
        ...placement,
      });
    }
  }
  return zonas.length > 0 ? { tecnica, tela, color, zonas } : null;
}

// Para dibujarlo sobre la prenda (las imágenes, con su URL firmada).
export function groupDesignPreview(design: GroupDesign | null): GroupDesignPreview {
  const out: GroupDesignPreview = {};
  for (const z of design?.zonas ?? []) {
    const transform = { x: z.posX, y: z.posY, scale: z.escala, rotation: z.rotacion };
    const main = out[z.zona];
    if (z.tipo === "texto") {
      const content = { kind: "texto" as const, texto: z.texto, color: z.color, fontFamily: z.fuente, outline: z.contorno ?? null };
      if (main) main.extras = [...(main.extras ?? []), { content, transform }];
      else out[z.zona] = { content, transform };
    } else if (z.url && !main) {
      out[z.zona] = {
        content: { kind: "imagen", previewUrl: z.url, width: z.anchoPx, height: z.altoPx, fill: z.ajuste === "llenar" },
        transform,
      };
    }
  }
  return out;
}
