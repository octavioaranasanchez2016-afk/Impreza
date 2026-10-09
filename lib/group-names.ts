import { FONT_OPTIONS, FontFamilyKey, MockupTextContent } from "./design";
import { DesignTransform, DesignZone, ProductCategory } from "./types";
import { getPrintArea, getZonesForCategory } from "@/components/GarmentShape";

// Camisas de grupo con lo de cada persona. El organizador hace una camisa de ejemplo
// (la suya): lo que es igual en todas es el diseño del grupo (ver group-design.ts), y
// además pone "lo que pone cada quien": textos —su nombre o apodo, su número u otro
// texto— cada uno en su lugar de la prenda, con su letra, color y tamaño. Cada texto es
// una casilla aparte: lo de la espalda y lo de una manga no tienen nada que ver. Se
// guarda en listas_tallas.estilo. Este archivo no usa nada del servidor.

export type Campo = "nombre" | "numero" | "texto";

export const CAMPOS: { value: Campo; label: string; add: string }[] = [
  { value: "nombre", label: "Nombre o apodo", add: "Su nombre o apodo" },
  { value: "numero", label: "Número", add: "Su número" },
  { value: "texto", label: "Otro texto", add: "Otro texto" },
];

export const campoLabel = (campo: Campo) => CAMPOS.find((c) => c.value === campo)!.label;

// Un texto de cada persona en un lugar de la prenda (como un texto del diseñador).
export interface PersonalField {
  id: string; // cada texto es una casilla aparte para cada persona
  zona: DesignZone;
  campo: Campo; // qué se escribe ahí: nombre o apodo, número (solo cifras) u otro texto
  ejemplo: string; // lo que dice la camisa de ejemplo (la del organizador)
  etiqueta?: string; // otro texto: lo que se le pide a cada quien ("Tu frase")
  color: string;
  fuente: FontFamilyKey;
  contorno?: string;
  posX: number;
  posY: number;
  escala: number;
  rotacion: number;
}

// Lo que escribió una persona, texto por texto (por id).
export type Valores = Record<string, string>;

// Lo que el organizador deja que cada quien elija para sus textos al anotarse.
export interface NameChoice {
  color: boolean;
  fuente: boolean;
}

export interface GroupPersonal {
  campos: PersonalField[];
  eligen: NameChoice;
}

export const MAX_TEXTO = 16;
export const MAX_NUMERO = 3;
export const MAX_EXTRA = 24;
export const MAX_CAMPOS = 8;
export const DEFAULT_ETIQUETA = "Tu frase";
const DEFAULT_EJEMPLO: Record<Campo, string> = { nombre: "JUAN", numero: "10", texto: "TEXTO" };

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

export const maxLength = (campo: Campo) => (campo === "numero" ? MAX_NUMERO : campo === "texto" ? MAX_EXTRA : MAX_TEXTO);

export function newFieldId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Columna listas_tallas.personalizado: si cada quien escribe nombre y/o número.
export type Personalizado = "ninguno" | "nombre" | "numero" | "nombre_numero";

export function parsePersonalizado(value: unknown): Personalizado {
  return value === "nombre" || value === "numero" || value === "nombre_numero" ? value : "ninguno";
}

// Qué tipos de texto escribe cada persona al anotarse.
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
const ZONE_ORDER: DesignZone[] = ["frente", "espalda", "manga-izq", "manga-der"];

// Los lados de la prenda donde puede ir algo de cada persona (no en la etiqueta).
export function personalZones(category: ProductCategory): DesignZone[] {
  return getZonesForCategory(category).filter((z) => ZONE_TITLE[z]);
}

export const zoneTitle = (zone: DesignZone) => ZONE_TITLE[zone] ?? zone;

// "nombre o apodo", "número", o lo que pide el organizador en otro texto.
export function fieldHint(field: PersonalField): string {
  return field.campo === "texto" ? (field.etiqueta || DEFAULT_ETIQUETA).toLowerCase() : campoLabel(field.campo).toLowerCase();
}

// Los textos de cada quien en el orden de la prenda (frente, espalda, mangas).
export function fieldsEnOrden(personal: GroupPersonal): PersonalField[] {
  return ZONE_ORDER.flatMap((z) => personal.campos.filter((f) => f.zona === z));
}

// Cómo se llama cada casilla: el lugar ("Manga izquierda"), y si en ese lugar hay más de
// un texto, también qué es ("Espalda · número").
export function fieldLabel(personal: GroupPersonal, field: PersonalField): string {
  const shared = personal.campos.filter((f) => f.zona === field.zona).length > 1;
  return shared ? `${zoneTitle(field.zona)} · ${fieldHint(field)}` : zoneTitle(field.zona);
}

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

// legacy: lo que guardaban las primeras camisas de ejemplo para todo el grupo (un
// ejemplo y una etiqueta por tipo de texto, en vez de uno por texto).
function parseField(
  raw: unknown,
  index: number,
  zones: DesignZone[],
  legacy: { ejemplos: Record<string, unknown>; etiqueta: unknown }
): PersonalField | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const zona = zones.find((z) => z === v.zona);
  const campo = CAMPOS.find((c) => c.value === v.campo)?.value;
  if (!zona || !campo) return null;
  const id = typeof v.id === "string" && /^[a-z0-9@#-]{1,40}$/i.test(v.id) ? v.id : `${campo}-${zona}-${index}`;
  const ejemplo = cleanCampo(campo, typeof v.ejemplo === "string" ? v.ejemplo : legacy.ejemplos[campo]) || DEFAULT_EJEMPLO[campo];
  const etiqueta = campo === "texto" ? cleanExtra(v.etiqueta ?? legacy.etiqueta) || DEFAULT_ETIQUETA : undefined;
  return {
    id,
    zona,
    campo,
    ejemplo,
    ...(etiqueta ? { etiqueta } : {}),
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
  const legacy = {
    ejemplos: v.ejemplos && typeof v.ejemplos === "object" ? (v.ejemplos as Record<string, unknown>) : {},
    etiqueta: v.etiqueta,
  };
  const campos: PersonalField[] = [];
  (Array.isArray(v.campos) ? v.campos : []).forEach((raw, i) => {
    const field = parseField(raw, i, zones, legacy);
    if (field && !campos.some((f) => f.id === field.id) && campos.length < MAX_CAMPOS) campos.push(field);
  });
  return campos.length > 0 ? { campos, eligen: parseChoice(v.eligen) } : null;
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
  const out: Omit<PersonalField, "id" | "ejemplo">[] = [];
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
    .flatMap(([zone, lleva]) => legacyFields(zone, lleva, category, fuente, color))
    .map((f, i) => ({ ...f, id: `${f.campo}-${f.zona}-${i}`, ejemplo: DEFAULT_EJEMPLO[f.campo] }));
  return campos.length > 0 ? { campos, eligen: parseChoice(e.eligen) } : null;
}

// --- Lo que escribe cada persona ----------------------------------------------------

// Letras y colores que cada persona puede elegir para sus textos, si se lo permiten.
export const NAME_FONTS: FontFamilyKey[] = [
  "display",
  "colegial",
  "bloque",
  "script",
  "gotica",
  "sans",
  "deportiva",
  "slab",
  "cursiva",
  "clasica",
];

export const NAME_COLORS = [
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Negro", hex: "#111111" },
  { name: "Rojo", hex: "#C8102E" },
  { name: "Azul", hex: "#1D4ED8" },
  { name: "Dorado", hex: "#C9A227" },
  { name: "Plateado", hex: "#A8A9AD" },
];

// Lo que se guarda de una persona además de las columnas texto y número
// (listas_tallas_personas.estilo): sus textos y la letra y el color que eligió.
export interface PersonExtra {
  fuente?: FontFamilyKey;
  color?: string;
  valores?: Valores;
  extra?: string; // las primeras listas: un solo "otro texto"
}

export function parsePersonExtra(value: unknown): PersonExtra {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const fuente = NAME_FONTS.find((f) => f === v.fuente);
  const color = NAME_COLORS.find((c) => c.hex === v.color)?.hex;
  const extra = cleanExtra(v.extra);
  const valores: Valores = {};
  if (v.valores && typeof v.valores === "object") {
    for (const [id, valor] of Object.entries(v.valores as Record<string, unknown>)) {
      const clean = cleanExtra(valor);
      if (clean && /^[a-z0-9@#-]{1,40}$/i.test(id)) valores[id] = clean;
    }
  }
  return {
    ...(fuente ? { fuente } : {}),
    ...(color ? { color } : {}),
    ...(Object.keys(valores).length ? { valores } : {}),
    ...(extra ? { extra } : {}),
  };
}

// Lo que escribió una persona en cada texto. Los registros de antes (una sola casilla
// por tipo, en las columnas texto y número) se reparten por tipo.
export function valoresDePersona(
  personal: GroupPersonal | null,
  entry: { texto?: string | null; numero?: string | null; estilo?: PersonExtra }
): Valores {
  const out: Valores = {};
  for (const f of personal?.campos ?? []) {
    const own = entry.estilo?.valores?.[f.id];
    const old = f.campo === "nombre" ? entry.texto : f.campo === "numero" ? entry.numero : entry.estilo?.extra;
    const valor = own ?? (entry.estilo?.valores ? undefined : old);
    if (valor) out[f.id] = valor;
  }
  return out;
}

// Lo que escribió una persona, revisado texto por texto, más lo que va en las columnas
// texto y número (su primer nombre y su primer número, para buscar y ordenar). falta:
// el primer texto que dejó vacío.
export function cleanValores(
  personal: GroupPersonal | null,
  raw: unknown
): { valores: Valores; texto: string | null; numero: string | null; falta: PersonalField | null } {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const valores: Valores = {};
  let falta: PersonalField | null = null;
  for (const f of personal ? fieldsEnOrden(personal) : []) {
    const clean = cleanCampo(f.campo, v[f.id]);
    if (clean) valores[f.id] = clean;
    else falta ??= f;
  }
  const first = (campo: Campo) => personal?.campos.find((f) => f.campo === campo && valores[f.id]);
  return {
    valores,
    texto: first("nombre") ? valores[first("nombre")!.id] : null,
    numero: first("numero") ? valores[first("numero")!.id] : null,
    falta,
  };
}

// "Manga izquierda: JUAN · Manga derecha: 10": lo que lleva la camisa de una persona.
export function describeValores(personal: GroupPersonal | null, valores: Valores): string {
  if (!personal) return "";
  return fieldsEnOrden(personal)
    .filter((f) => valores[f.id])
    .map((f) => `${fieldLabel(personal, f)}: ${valores[f.id]}`)
    .join(" · ");
}

// --- Para el panel y los correos ----------------------------------------------------

const fontLabel = (f: FontFamilyKey) => FONT_OPTIONS.find((o) => o.value === f)?.label ?? f;
const colorLabel = (hex: string) => NAME_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name.toLowerCase() ?? hex;

// "Espalda: nombre o apodo (Colegial, blanco) y número (Impacto, blanco) · Manga izquierda: …"
export function describePersonal(personal: GroupPersonal): string {
  const parts = ZONE_ORDER.flatMap((zone) => {
    const items = personal.campos
      .filter((f) => f.zona === zone)
      .map((f) => `${f.campo === "texto" ? `«${f.etiqueta || DEFAULT_ETIQUETA}»` : fieldHint(f)} (${fontLabel(f.fuente)}, ${colorLabel(f.color)})`);
    return items.length ? [`${zoneTitle(zone)}: ${items.join(" y ")}`] : [];
  });
  const choose = [personal.eligen.fuente && "la letra", personal.eligen.color && "el color"].filter(Boolean).join(" y ");
  return `${parts.join(" · ")}${choose ? ` · ${choose} lo eligió cada quien` : ""}`;
}

// "Colegial, dorado": cómo quiso sus textos una persona, para el panel.
export function describePersonStyle(style: PersonExtra): string {
  return [style.fuente ? fontLabel(style.fuente) : null, style.color ? colorLabel(style.color) : null].filter(Boolean).join(", ");
}
