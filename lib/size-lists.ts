import { randomBytes } from "crypto";
import { createServiceClient } from "./supabase/server";
import { getProductById } from "./catalog";

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
  created_at: string;
}

export interface SizeListEntry {
  id: string;
  nombre: string;
  talla: string;
  cantidad: number;
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

// missing: las tablas todavía no existen (falta correr el SQL).
export async function loadSizeList(
  id: string
): Promise<{ list: SizeList; clave: string; entries: SizeListEntry[] } | { missing: true } | null> {
  const service = createServiceClient();
  const { data: list, error } = await service.from("listas_tallas").select("*").eq("id", id).maybeSingle();
  if (error) return error.code === "42P01" || /does not exist|schema cache/i.test(error.message) ? { missing: true } : null;
  if (!list) return null;
  const { data: entries } = await service
    .from("listas_tallas_personas")
    .select("id, nombre, talla, cantidad, created_at")
    .eq("lista_id", id)
    .order("created_at", { ascending: true });
  const { clave, ...rest } = list as SizeList & { clave: string };
  return { list: rest, clave, entries: (entries ?? []) as SizeListEntry[] };
}

// "S:5,M:11,L:9": para pasarle las tallas al diseñador.
export function sizesParam(entries: SizeListEntry[]): string {
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.talla, (counts.get(e.talla) ?? 0) + e.cantidad);
  return [...counts].map(([talla, n]) => `${talla}:${n}`).join(",");
}
