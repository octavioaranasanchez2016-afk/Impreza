import { FONT_OPTIONS, FontFamilyKey, MockupTextContent } from "./design";
import { DesignTransform, DesignZone, ProductCategory } from "./types";
import { getPrintArea, getZonesForCategory } from "@/components/GarmentShape";

// Camisas de grupo con lo de cada persona. El organizador hace una camisa de ejemplo
// (la suya): lo que es igual en todas es el diseño del grupo (ver group-design.ts), y
// además marca "lo que pone cada quien": textos que cada persona llena al anotarse —su
// nombre o apodo, su número u otro texto— cada uno en su lugar de la prenda, con su
// letra, color y tamaño. Se guarda en listas_tallas.estilo. Este archivo no usa nada
// del servidor.

export type Campo = "nombre" | "numero" | "texto";

export const CAMPOS: { value: Campo; label: string; add: string }[] = [
  { value: "nombre", label: "Nombre o apodo", add: "Su nombre o apodo" },
  { value: "numero", label: "Número", add: "Su número" },
  { value: "texto", label: "Otro texto", add: "Otro texto" },
];

export const campoLabel = (campo: Campo) => CAMPOS.find((c) => c.value === campo)!.label;

// Un texto de cada persona en un lugar de la prenda (como un texto del diseñador).
export interface PersonalField {
  zona: DesignZone;
  campo: Campo;
  color: string;
  fuente: FontFamilyKey;
  contorno?: string;
  posX: number;
  posY: number;
  escala: number;
  rotacion: number;
}

// Lo que dice la camisa de ejemplo en cada campo (la del organizador).
export interface Ejemplos {
  nombre: string;
  numero: string;
  texto: string;
}

// Lo que el organizador deja que cada quien elija para sus textos al anotarse.
export interface NameChoice {
  color: boolean;
  fuente: boolean;
}

export interface GroupPersonal {
  campos: PersonalField[];
  ejemplos: Ejemplos;
  etiqueta: string; // lo que se le pide a cada quien en "otro texto" ("Tu frase")
  eligen: NameChoice;
}

export const MAX_TEXTO = 16;
export const MAX_NUMERO = 3;
export const MAX_EXTRA = 24;
export const MAX_CAMPOS = 8;
export const DEFAULT_ETIQUETA = "Tu frase";

export function cleanTexto(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO) : "";
}

export function cleanNumero(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, MAX_NUMERO) : "";
}

export function cleanExtra(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, MAX_EXTRA) : "";
}

export function cleanCampo(campo: Campo, value: unknown): string {
  return campo === "numero" ? cleanNumero(value) : campo === "texto" ? cleanExtra(value) : cleanTexto(value);
}

// Columna listas_tallas.personalizado: si cada quien escribe nombre y/o número.
export type Personalizado = "ninguno" | "nombre" | "numero" | "nombre_numero";

export function parsePersonalizado(value: unknown): Personalizado {
  return value === "nombre" || value === "numero" || value === "nombre_numero" ? value : "ninguno";
}

// Lo que tiene que escribir cada persona al anotarse.
export function camposPedidos(personal: GroupPersonal | null): Record<Campo, boolean> {
  const has = (campo: Campo) => Boolean(personal?.campos.some((f) => f.campo === campo));
  return { nombre: has("nombre"), numero: has("numero"), texto: has("texto") };
}

export function personalizadoDe(personal: GroupPersonal | null): Personalizado {
  const { nombre, numero } = camposPedidos(personal);
  return nombre && numero ? "nombre_numero" : nombre ? "nombre" : numero ? "numero" : "ninguno";
}

const ZONE_TITLE: Partial<Record<DesignZone, string>> = {
  frente: "Frente",
  espalda: "Espalda",
  "manga-izq": "Manga izquierda",
  "manga-der": "Manga derecha",
};

// Los lados de la prenda donde puede ir algo de cada persona (no en la etiqueta).
export function personalZones(category: ProductCategory): DesignZone[] {
  return getZonesForCategory(category).filter((z) => ZONE_TITLE[z]);
}

export const zoneTitle = (zone: DesignZone) => ZONE_TITLE[zone] ?? zone;

export function fieldTransform(field: PersonalField): DesignTransform {
  return { x: field.posX, y: field.posY, scale: field.escala, rotation: field.rotacion };
}

// El texto de un campo, listo para dibujarlo sobre la prenda: con lo que escribió la
// persona (o el ejemplo) y, si el organizador lo deja, la letra y el color que eligió.
export function fieldContent(
  field: PersonalField,
  texto: string,
  propio?: Partial<Pick<PersonalField, "fuente" | "color">>,
  eligen?: NameChoice
): MockupTextContent {
  return {
    kind: "texto",
    texto,
    color: eligen?.color && propio?.color ? propio.color : field.color,
    fontFamily: eligen?.fuente && propio?.fuente ? propio.fuente : field.fuente,
    outline: field.contorno ?? null,
  };
}

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (n: unknown, min: number, max: number) => Math.min(max, Math.max(min, Number(n) || 0));

function parseField(raw: unknown, zones: DesignZone[]): PersonalField | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const zona = zones.find((z) => z === v.zona);
  const campo = CAMPOS.find((c) => c.value === v.campo)?.value;
  if (!zona || !campo) return null;
  return {
    zona,
    campo,
    color: typeof v.color === "string" && HEX.test(v.color) ? v.color : "#111111",
    fuente: FONT_OPTIONS.find((f) => f.value === v.fuente)?.value ?? "display",
    ...(typeof v.contorno === "string" && HEX.test(v.contorno) ? { contorno: v.contorno } : {}),
    posX: clamp(v.posX, 0, 100),
    posY: clamp(v.posY, 0, 100),
    escala: clamp(v.escala, 0.05, 5),
    rotacion: ((clamp(v.rotacion, -3600, 3600) % 360) + 360) % 360,
  };
}

function parseChoice(value: unknown): NameChoice {
  const v = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return { color: v.color === true, fuente: v.fuente === true };
}

// Revisa lo que llega del diseñador (o de la base) y deja solo lo válido para esta
// prenda. null si nadie pone nada propio.
export function parsePersonal(value: unknown, category: ProductCategory): GroupPersonal | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const zones = personalZones(category);
  const campos = (Array.isArray(v.campos) ? v.campos : [])
    .map((f) => parseField(f, zones))
    .filter((f): f is PersonalField => f !== null)
    .slice(0, MAX_CAMPOS);
  if (campos.length === 0) return null;
  const e = v.ejemplos && typeof v.ejemplos === "object" ? (v.ejemplos as Record<string, unknown>) : {};
  return {
    campos,
    ejemplos: { nombre: cleanTexto(e.nombre), numero: cleanNumero(e.numero), texto: cleanExtra(e.texto) },
    etiqueta: cleanExtra(v.etiqueta) || DEFAULT_ETIQUETA,
    eligen: parseChoice(v.eligen),
  };
}

// --- Listas hechas antes de la camisa de ejemplo -----------------------------------
// Guardaban qué llevaba cada lugar (estilo.lugares: {"espalda":"ambos"}) con una letra
// y un color para todos. Se convierten a campos con las posiciones de entonces.

type Lleva = "nombre" | "numero" | "ambos";
const LEGACY_LUGAR_ZONE: Record<string, DesignZone> = {
  pecho: "frente",
  espalda: "espalda",
  "manga-izq": "manga-izq",
  "manga-der": "manga-der",
  "espalda-arriba": "espalda",
  "espalda-abajo": "espalda",
};

function legacyFields(zone: DesignZone, lleva: Lleva, category: ProductCategory, fuente: FontFamilyKey, color: string) {
  const a = getPrintArea(category, zone);
  let box = { x: a.x, y: a.y, w: a.w, h: a.h };
  if (zone === "frente" && (category === "camisa" || category === "hoodie")) {
    const w = a.w * 0.36;
    box = { x: a.x + a.w * 0.82 - w / 2, y: a.y + a.h * 0.06, w, h: a.h * 0.24 };
  }
  const back = zone === "espalda";
  const both = lleva === "ambos";
  const base = { zona: zone, fuente, color, posX: box.x + box.w / 2, rotacion: 0 };
  const out: PersonalField[] = [];
  if (lleva !== "numero") {
    const posY = box.y + box.h * (back ? 0.15 : both ? 0.27 : 0.5);
    out.push({ ...base, campo: "nombre", posY, escala: (box.w * 0.9) / a.w });
  }
  if (lleva !== "nombre") {
    const posY = box.y + box.h * (back ? (both ? 0.55 : 0.42) : both ? 0.68 : 0.5);
    out.push({ ...base, campo: "numero", posY, escala: (box.w * 0.5) / a.w });
  }
  return out;
}

// Lo de cada persona guardado en una lista (o en el pedido que se hizo con ella), en
// el formato de ahora aunque la lista sea de antes.
export function personalDeLista(estilo: unknown, category: ProductCategory, personalizado?: unknown): GroupPersonal | null {
  const e = estilo && typeof estilo === "object" ? (estilo as Record<string, unknown>) : {};
  if (Array.isArray(e.campos)) return parsePersonal(e, category);

  const pide = parsePersonalizado(personalizado);
  const fuente = FONT_OPTIONS.find((f) => f.value === e.fuente)?.value ?? "display";
  const color = typeof e.color === "string" && HEX.test(e.color) ? e.color : "#FFFFFF";
  const zones = personalZones(category);
  let lugares: [DesignZone, Lleva][] = [];
  if (e.lugares && typeof e.lugares === "object") {
    lugares = Object.entries(e.lugares as Record<string, unknown>)
      .filter(([lugar, lleva]) => LEGACY_LUGAR_ZONE[lugar] && (lleva === "nombre" || lleva === "numero" || lleva === "ambos"))
      .map(([lugar, lleva]) => [LEGACY_LUGAR_ZONE[lugar], lleva as Lleva]);
  } else if (typeof e.ubicacion === "string" && LEGACY_LUGAR_ZONE[e.ubicacion] && pide !== "ninguno") {
    lugares = [[LEGACY_LUGAR_ZONE[e.ubicacion], pide === "nombre_numero" ? "ambos" : pide === "numero" ? "numero" : "nombre"]];
  } else if (pide !== "ninguno") {
    lugares = [[zones.includes("espalda") ? "espalda" : "frente", pide === "nombre_numero" ? "ambos" : pide === "numero" ? "numero" : "nombre"]];
  }
  const campos = lugares
    .filter(([zone]) => zones.includes(zone))
    .flatMap(([zone, lleva]) => legacyFields(zone, lleva, category, fuente, color));
  if (campos.length === 0) return null;
  return {
    campos,
    ejemplos: { nombre: "JUAN", numero: "10", texto: "" },
    etiqueta: DEFAULT_ETIQUETA,
    eligen: parseChoice(e.eligen),
  };
}

// --- Para el panel y los correos ----------------------------------------------------

// Letras y colores que cada persona puede elegir para sus textos, si se lo permiten.
export const NAME_FONTS: FontFamilyKey[] = ["display", "colegial", "bloque", "script", "gotica", "sans"];

export const NAME_COLORS = [
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Negro", hex: "#111111" },
  { name: "Rojo", hex: "#C8102E" },
  { name: "Azul", hex: "#1D4ED8" },
  { name: "Dorado", hex: "#C9A227" },
  { name: "Plateado", hex: "#A8A9AD" },
];

const fontLabel = (f: FontFamilyKey) => FONT_OPTIONS.find((o) => o.value === f)?.label ?? f;
const colorLabel = (hex: string) => NAME_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name.toLowerCase() ?? hex;

// "Espalda: nombre (Colegial, blanco) y número (Impacto, blanco) · Manga izquierda: …"
export function describePersonal(personal: GroupPersonal): string {
  const byZone = new Map<DesignZone, string[]>();
  for (const f of personal.campos) {
    const what = f.campo === "texto" ? `«${personal.etiqueta}»` : campoLabel(f.campo).toLowerCase();
    byZone.set(f.zona, [...(byZone.get(f.zona) ?? []), `${what} (${fontLabel(f.fuente)}, ${colorLabel(f.color)})`]);
  }
  const choose = [personal.eligen.fuente && "la letra", personal.eligen.color && "el color"].filter(Boolean).join(" y ");
  const parts = [...byZone].map(([zone, items]) => `${zoneTitle(zone)}: ${items.join(" y ")}`);
  return `${parts.join(" · ")}${choose ? ` · ${choose} lo eligió cada quien` : ""}`;
}

// La letra, el color y el otro texto de una persona (listas_tallas_personas.estilo).
export interface PersonExtra {
  fuente?: FontFamilyKey;
  color?: string;
  extra?: string;
}

export function parsePersonExtra(value: unknown): PersonExtra {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const fuente = NAME_FONTS.find((f) => f === v.fuente);
  const color = NAME_COLORS.find((c) => c.hex === v.color)?.hex;
  const extra = cleanExtra(v.extra);
  return { ...(fuente ? { fuente } : {}), ...(color ? { color } : {}), ...(extra ? { extra } : {}) };
}

// "Colegial, dorado": cómo quiso sus textos una persona, para el panel.
export function describePersonStyle(style: PersonExtra): string {
  return [style.fuente ? fontLabel(style.fuente) : null, style.color ? colorLabel(style.color) : null].filter(Boolean).join(", ");
}

// Lo que escribió una persona, campo por campo.
export function valoresDe(entry: { texto?: string | null; numero?: string | null; estilo?: PersonExtra }): Ejemplos {
  return { nombre: entry.texto ?? "", numero: entry.numero ?? "", texto: entry.estilo?.extra ?? "" };
}
