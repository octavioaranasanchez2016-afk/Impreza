import { FONT_OPTIONS, FontFamilyKey } from "./design";
import { DesignZone, ProductCategory } from "./types";

// Camisas de grupo donde cada una lleva el nombre y/o el número de su dueño. El
// organizador elige al crear la lista qué va en cada lugar (pecho, espalda, mangas);
// cada persona escribe lo suyo al anotarse, y en el diseñador se eligen la letra y
// el color. Este archivo no usa nada del servidor.

// Lo que cada persona tiene que escribir al anotarse (columna listas_tallas.personalizado).
export type Personalizado = "ninguno" | "nombre" | "numero" | "nombre_numero";

export function parsePersonalizado(value: unknown): Personalizado {
  return value === "nombre" || value === "numero" || value === "nombre_numero" ? value : "ninguno";
}

export const MAX_TEXTO = 16;
export const MAX_NUMERO = 3;

export function cleanTexto(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO) : "";
}

export function cleanNumero(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, MAX_NUMERO) : "";
}

// Dónde puede ir lo de cada persona, y qué lleva cada lugar.
export type Lugar = "pecho" | "espalda" | "manga-izq" | "manga-der";
export type Lleva = "nombre" | "numero" | "ambos";
export type Lugares = Partial<Record<Lugar, Lleva>>;

export const LUGARES: { value: Lugar; zone: DesignZone; label: string }[] = [
  { value: "pecho", zone: "frente", label: "Pecho" },
  { value: "espalda", zone: "espalda", label: "Espalda" },
  { value: "manga-izq", zone: "manga-izq", label: "Manga izquierda" },
  { value: "manga-der", zone: "manga-der", label: "Manga derecha" },
];

const LUGARES_POR_PRENDA: Record<ProductCategory, Lugar[]> = {
  camisa: ["pecho", "espalda", "manga-izq", "manga-der"],
  polo: ["pecho", "espalda", "manga-izq", "manga-der"],
  hoodie: ["pecho", "espalda"],
  tote: ["pecho"],
  gorra: ["pecho"],
};

const LLEVA_LABEL: Record<Lleva, string> = { nombre: "nombre", numero: "número", ambos: "nombre y número" };

export function lugaresFor(category: ProductCategory): Lugar[] {
  return LUGARES_POR_PRENDA[category];
}

export function lugarZone(lugar: Lugar): DesignZone {
  return LUGARES.find((l) => l.value === lugar)!.zone;
}

// En una gorra o un bolso no hay pecho: es el frente.
export function lugarLabel(lugar: Lugar, category?: ProductCategory): string {
  if (lugar === "pecho" && (category === "tote" || category === "gorra")) return "Frente";
  return LUGARES.find((l) => l.value === lugar)!.label;
}

export const llevaNombre = (l?: Lleva) => l === "nombre" || l === "ambos";
export const llevaNumero = (l?: Lleva) => l === "numero" || l === "ambos";

// Los lugares en orden fijo (pecho, espalda, mangas).
export function lugaresEnOrden(lugares: Lugares): [Lugar, Lleva][] {
  return LUGARES.filter((l) => lugares[l.value]).map((l) => [l.value, lugares[l.value]!]);
}

// Lo que cada persona tiene que escribir según lo que va en la camisa.
export function personalizadoDe(lugares: Lugares): Personalizado {
  const values = Object.values(lugares);
  const nombre = values.some(llevaNombre);
  const numero = values.some(llevaNumero);
  return nombre && numero ? "nombre_numero" : nombre ? "nombre" : numero ? "numero" : "ninguno";
}

export function camposDe(personalizado: Personalizado): { nombre: boolean; numero: boolean } {
  return {
    nombre: personalizado === "nombre" || personalizado === "nombre_numero",
    numero: personalizado === "numero" || personalizado === "nombre_numero",
  };
}

// Para listas creadas antes de poder elegir lugares: todo en la espalda.
export function defaultLugares(personalizado: Personalizado, category: ProductCategory): Lugares {
  if (personalizado === "ninguno") return {};
  const lugar: Lugar = lugaresFor(category).includes("espalda") ? "espalda" : "pecho";
  return { [lugar]: personalizado === "nombre_numero" ? "ambos" : personalizado === "numero" ? "numero" : "nombre" };
}

export function parseLugares(value: unknown, category?: ProductCategory): Lugares {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const allowed = category ? lugaresFor(category) : LUGARES.map((l) => l.value);
  const out: Lugares = {};
  for (const lugar of allowed) {
    const lleva = v[lugar];
    if (lleva === "nombre" || lleva === "numero" || lleva === "ambos") out[lugar] = lleva;
  }
  return out;
}

// Ajusta los lugares a la prenda y a lo que la gente escribió en la lista: si la
// prenda cambió (por ejemplo a hoodie, sin mangas) o un lugar pide algo que nadie
// escribió, se quita; si no queda nada, todo va en la espalda.
export function fitLugares(lugares: Lugares, personalizado: Personalizado, category: ProductCategory): Lugares {
  const campos = camposDe(personalizado);
  const out: Lugares = {};
  for (const [lugar, lleva] of lugaresEnOrden(parseLugares(lugares, category))) {
    const nombre = llevaNombre(lleva) && campos.nombre;
    const numero = llevaNumero(lleva) && campos.numero;
    if (nombre || numero) out[lugar] = nombre && numero ? "ambos" : nombre ? "nombre" : "numero";
  }
  return Object.keys(out).length > 0 ? out : defaultLugares(personalizado, category);
}

// Los lugares que eligió el organizador (guardados en listas_tallas.estilo).
export function lugaresDeLista(personalizado: Personalizado, estilo: unknown, category: ProductCategory): Lugares {
  const saved = estilo && typeof estilo === "object" ? (estilo as Record<string, unknown>).lugares : null;
  return fitLugares(parseLugares(saved, category), personalizado, category);
}

// "espalda:ambos,manga-izq:numero": para pasarle los lugares al diseñador.
export function lugaresParam(lugares: Lugares): string {
  return lugaresEnOrden(lugares)
    .map(([lugar, lleva]) => `${lugar}:${lleva}`)
    .join(",");
}

export function parseLugaresParam(value: string | null): Lugares {
  if (!value) return {};
  return parseLugares(Object.fromEntries(value.split(",").map((part) => part.split(":"))));
}

// "Espalda: nombre y número · Manga izquierda: número".
export function describeLugares(lugares: Lugares, category?: ProductCategory): string {
  return lugaresEnOrden(lugares)
    .map(([lugar, lleva]) => `${lugarLabel(lugar, category)}: ${LLEVA_LABEL[lleva]}`)
    .join(" · ");
}

// Letras que funcionan bien para nombres en camisas.
export const NAME_FONTS: FontFamilyKey[] = ["display", "colegial", "bloque", "script", "gotica", "sans"];

export interface NameStyle {
  lugares: Lugares;
  fuente: FontFamilyKey;
  color: string; // "#FFFFFF"
}

export const NAME_COLORS = [
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Negro", hex: "#111111" },
  { name: "Rojo", hex: "#C8102E" },
  { name: "Azul", hex: "#1D4ED8" },
  { name: "Dorado", hex: "#C9A227" },
  { name: "Plateado", hex: "#A8A9AD" },
];

// Los pedidos de antes guardaban un solo lugar ("ubicacion").
const OLD_UBICACION: Record<string, Lugar> = {
  "espalda-arriba": "espalda",
  "espalda-abajo": "espalda",
  "manga-izq": "manga-izq",
  pecho: "pecho",
};

export function parseNameStyle(value: unknown, personalizado: Personalizado = "nombre"): NameStyle | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  let lugares = parseLugares(v.lugares);
  const old = typeof v.ubicacion === "string" ? OLD_UBICACION[v.ubicacion] : undefined;
  if (Object.keys(lugares).length === 0 && old) {
    lugares = { [old]: personalizado === "nombre_numero" ? "ambos" : personalizado === "numero" ? "numero" : "nombre" };
  }
  const fuente = NAME_FONTS.find((f) => f === v.fuente);
  const color = typeof v.color === "string" && /^#[0-9A-F]{6}$/i.test(v.color) ? v.color.toUpperCase() : null;
  return Object.keys(lugares).length > 0 && fuente && color ? { lugares, fuente, color } : null;
}

// "Espalda: nombre y número · Manga izquierda: número · letra Colegial · blanco":
// para el panel y los correos.
export function describeNameStyle(style: NameStyle, category?: ProductCategory): string {
  const font = FONT_OPTIONS.find((f) => f.value === style.fuente)?.label ?? style.fuente;
  const color = NAME_COLORS.find((c) => c.hex === style.color)?.name.toLowerCase() ?? style.color;
  return `${describeLugares(style.lugares, category)} · letra ${font} · ${color}`;
}

// Ejemplos para el diseñador: "CHEPE~10|LA FLACA~7" (máx. 5).
export function examplesParam(entries: { texto?: string | null; numero?: string | null }[]): string {
  return entries
    .filter((e) => e.texto || e.numero)
    .slice(0, 5)
    .map((e) => `${e.texto ?? ""}~${e.numero ?? ""}`)
    .join("|");
}

export function parseExamples(value: string | null): { texto: string; numero: string }[] {
  if (!value) return [];
  return value
    .split("|")
    .slice(0, 5)
    .map((part) => {
      const [texto, numero] = part.split("~");
      return { texto: cleanTexto(texto ?? ""), numero: cleanNumero(numero ?? "") };
    })
    .filter((e) => e.texto || e.numero);
}
