import { FONT_OPTIONS, FontFamilyKey } from "./design";

// Camisas de grupo donde cada una lleva el nombre (y a veces el número) de su dueño:
// cada persona lo escribe al anotarse en la lista de tallas, y en el diseñador se
// elige dónde va y cómo se ve. Este archivo no usa nada del servidor.
export type Personalizado = "ninguno" | "nombre" | "nombre_numero";

export const PERSONALIZADO_OPTIONS: { value: Personalizado; label: string; hint: string }[] = [
  { value: "ninguno", label: "Todas iguales", hint: "Nadie lleva su nombre" },
  { value: "nombre", label: "Con nombre o apodo", hint: "Ideal para promociones" },
  { value: "nombre_numero", label: "Nombre y número", hint: "Ideal para equipos" },
];

export const MAX_TEXTO = 16;
export const MAX_NUMERO = 3;

export function cleanTexto(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXTO) : "";
}

export function cleanNumero(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "").slice(0, MAX_NUMERO) : "";
}

export type Ubicacion = "espalda-arriba" | "espalda-abajo" | "manga-izq" | "pecho";

export const UBICACIONES: { value: Ubicacion; label: string }[] = [
  { value: "espalda-arriba", label: "Espalda, arriba" },
  { value: "espalda-abajo", label: "Espalda, abajo" },
  { value: "manga-izq", label: "Manga izquierda" },
  { value: "pecho", label: "Pecho" },
];

// Letras que funcionan bien para nombres en camisas.
export const NAME_FONTS: FontFamilyKey[] = ["display", "colegial", "bloque", "script", "gotica", "sans"];

export interface NameStyle {
  ubicacion: Ubicacion;
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

export function parseNameStyle(value: unknown): NameStyle | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const ubicacion = UBICACIONES.find((u) => u.value === v.ubicacion)?.value;
  const fuente = NAME_FONTS.find((f) => f === v.fuente);
  const color = typeof v.color === "string" && /^#[0-9A-F]{6}$/i.test(v.color) ? v.color.toUpperCase() : null;
  return ubicacion && fuente && color ? { ubicacion, fuente, color } : null;
}

// "Espalda, arriba · letra Colegial · blanco": para el panel y los correos.
export function describeNameStyle(style: NameStyle): string {
  const where = UBICACIONES.find((u) => u.value === style.ubicacion)?.label ?? style.ubicacion;
  const font = FONT_OPTIONS.find((f) => f.value === style.fuente)?.label ?? style.fuente;
  const color = NAME_COLORS.find((c) => c.hex === style.color)?.name.toLowerCase() ?? style.color;
  return `${where} · letra ${font} · ${color}`;
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
