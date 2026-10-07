import { randomBytes } from "crypto";
import { createServiceClient } from "./supabase/server";
import { getProductById } from "./catalog";
import { NameStyle, Personalizado, parsePersonStyle } from "./group-names";
import { GroupDesign, parseGroupDesign } from "./group-design";

// Listas de tallas para grupos (ver supabase/listas.sql). Solo se usan desde el
// servidor: la lista se abre con su id (difícil de adivinar) y el organizador la
// administra con su clave.
export const MAX_PERSONAS = 500;
export const MAX_NOMBRE = 60;

export interface SizeList {
  id: string;
  nombre: string;
  organizador: string | null;
  product_id: string;
  color: string | null;
  cerrada: boolean;
  order_id?: string | null; // el pedido que se hizo con esta lista
  personalizado?: Personalizado | null; // si cada camisa lleva nombre (y número)
  estilo?: unknown; // dónde y cómo va el nombre, elegido en el diseñador
  created_at: string;
}

export interface SizeListEntry {
  id: string;
  nombre: string;
  talla: string;
  cantidad: number;
  texto?: string | null; // lo que dirá su camisa
  numero?: string | null;
  estilo?: Partial<Pick<NameStyle, "fuente" | "color">>; // la letra y el color que eligió, si se podía
  created_at: string;
}

export function newSecret(): string {
  return randomBytes(18).toString("base64url");
}

export function cleanName(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE) : "";
}

// Tallas que se pueden elegir: las del color de la lista o todas las del producto.
export function listSizes(productId: string, color: string | null): string[] {
  const product = getProductById(productId);
  if (!product) return [];
  const variants = color ? product.variants.filter((v) => v.color === color) : product.variants;
  const all = [...new Set(variants.flatMap((v) => v.sizes))];
  const order = ["XS", "S", "M", "L", "XL", "XXL"];
  return all.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
}

// Una columna o tabla que todavía no existe en Supabase (falta correr listas.sql).
export function isMissingSchema(error: { code?: string; message?: string } | null): boolean {
  return Boolean(
    error && (error.code === "42P01" || error.code === "PGRST204" || error.code === "PGRST205" || /does not exist|schema cache/i.test(error.message ?? ""))
  );
}

// missing: las tablas todavía no existen (falta correr el SQL).
export async function loadSizeList(
  id: string
): Promise<{ list: SizeList; clave: string; entries: SizeListEntry[] } | { missing: true } | null> {
  const service = createServiceClient();
  const { data: list, error } = await service.from("listas_tallas").select("*").eq("id", id).maybeSingle();
  if (error) return isMissingSchema(error) ? { missing: true } : null;
  if (!list) return null;
  // "*": las columnas texto y número pueden no existir todavía.
  const { data: rows } = await service
    .from("listas_tallas_personas")
    .select("*")
    .eq("lista_id", id)
    .order("created_at", { ascending: true });
  const entries = (rows ?? []).map((r) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    talla: r.talla as string,
    cantidad: r.cantidad as number,
    texto: (r.texto as string | null) ?? null,
    numero: (r.numero as string | null) ?? null,
    estilo: parsePersonStyle(r.estilo),
    created_at: r.created_at as string,
  }));
  const { clave, ...rest } = list as SizeList & { clave: string };
  return { list: rest, clave, entries };
}

// "S:5,M:11,L:9": para pasarle las tallas al diseñador.
export function sizesParam(entries: SizeListEntry[]): string {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.talla, (counts.get(e.talla) ?? 0) + e.cantidad);
  return [...counts].map(([talla, n]) => `${talla}:${n}`).join(",");
}

// El diseño del grupo guardado en la lista, con URLs firmadas para ver sus imágenes
// (el bucket es privado). null si la lista no tiene diseño.
export async function loadGroupDesign(list: SizeList): Promise<GroupDesign | null> {
  const estilo = list.estilo && typeof list.estilo === "object" ? (list.estilo as Record<string, unknown>) : {};
  const design = parseGroupDesign(estilo.diseno, list.product_id, list.id);
  if (!design) return null;
  const paths = design.zonas.flatMap((z) => (z.tipo === "imagen" ? [z.path] : []));
  if (paths.length === 0) return design;
  const { data } = await createServiceClient().storage.from("disenos").createSignedUrls(paths, 60 * 60 * 6);
  const urls = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return {
    ...design,
    zonas: design.zonas.map((z) => (z.tipo === "imagen" ? { ...z, url: urls.get(z.path) ?? undefined } : z)),
  };
}
