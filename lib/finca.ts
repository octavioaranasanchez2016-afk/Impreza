import { createServiceClient } from "./supabase/server";

// Sistema de la finca (ver supabase/finca.sql). Todo en córdobas.

export * from "./finca-const";
import { MANO_DE_OBRA, type TipoMovimiento, INVENTARIO_CATEGORIAS } from "./finca-const";

export interface Cultivo {
  id: string;
  nombre: string;
  area_mz: number | null;
  fecha_siembra: string | null;
  estado: "activo" | "cosechado";
  notas: string | null;
}
export interface Trabajador {
  id: string;
  nombre: string;
  telefono: string | null;
  pago_dia: number;
  activo: boolean;
}
export interface Movimiento {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  categoria: string;
  descripcion: string | null;
  monto: number;
  cultivo_id: string | null;
}
export interface Pago {
  id: string;
  fecha: string;
  trabajador_id: string;
  dias: number | null;
  monto: number;
  cultivo_id: string | null;
  nota: string | null;
}
export interface Item {
  id: string;
  nombre: string;
  categoria: (typeof INVENTARIO_CATEGORIAS)[number];
  unidad: string;
  cantidad: number;
  minimo: number;
  costo_unit: number;
}
export interface ItemMov {
  id: string;
  item_id: string;
  fecha: string;
  tipo: "entrada" | "salida" | "merma";
  cantidad: number;
  nota: string | null;
}

// Hoy y el mes actual en hora de Nicaragua (YYYY-MM-DD / YYYY-MM).
export function hoyManagua(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Managua" }).format(new Date());
}
export function mesActual(): string {
  return hoyManagua().slice(0, 7);
}
export function isMes(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}
export function mesRango(mes: string): { desde: string; hasta: string } {
  const [y, m] = mes.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { desde: `${mes}-01`, hasta: `${next}-01` }; // hasta es exclusivo
}
export function mesMover(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
export function mesNombre(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  const name = new Intl.DateTimeFormat("es-NI", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}
export function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-NI", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

// Las columnas numeric de Postgres llegan como número o texto según el cliente.
const n = (v: unknown) => Number(v) || 0;

// missing: las tablas todavía no existen (falta correr supabase/finca.sql).
export async function fincaSelect<T>(
  table: string,
  opts: { order?: string; asc?: boolean; desde?: string; hasta?: string; limit?: number } = {}
): Promise<{ rows: T[]; missing: boolean }> {
  try {
    let q = createServiceClient().from(table).select("*");
    if (opts.desde) q = q.gte("fecha", opts.desde);
    if (opts.hasta) q = q.lt("fecha", opts.hasta);
    if (opts.order) q = q.order(opts.order, { ascending: opts.asc ?? false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error || !data) return { rows: [], missing: true };
    return { rows: data as T[], missing: false };
  } catch {
    return { rows: [], missing: true };
  }
}

export const normMov = (m: Movimiento): Movimiento => ({ ...m, monto: n(m.monto) });
export const normPago = (p: Pago): Pago => ({ ...p, monto: n(p.monto), dias: p.dias == null ? null : n(p.dias) });
export const normItem = (i: Item): Item => ({ ...i, cantidad: n(i.cantidad), minimo: n(i.minimo), costo_unit: n(i.costo_unit) });
export const normTrab = (t: Trabajador): Trabajador => ({ ...t, pago_dia: n(t.pago_dia) });
export const normCultivo = (c: Cultivo): Cultivo => ({ ...c, area_mz: c.area_mz == null ? null : n(c.area_mz) });

export interface Resumen {
  ingresos: number;
  gastos: number; // incluye mano de obra
  manoDeObra: number;
  perdidas: number;
  resultado: number; // ingresos − gastos − pérdidas
  gastosPorCategoria: { categoria: string; monto: number }[];
  perdidasPorCategoria: { categoria: string; monto: number }[];
  porCultivo: { id: string | null; nombre: string; ingresos: number; gastos: number; perdidas: number; resultado: number }[];
}

export function calcularResumen(movs: Movimiento[], pagos: Pago[], cultivos: Cultivo[]): Resumen {
  const gastoCat = new Map<string, number>();
  const perdidaCat = new Map<string, number>();
  const cult = new Map<string | null, { ingresos: number; gastos: number; perdidas: number }>();
  const bucket = (id: string | null) => {
    if (!cult.has(id)) cult.set(id, { ingresos: 0, gastos: 0, perdidas: 0 });
    return cult.get(id)!;
  };
  let ingresos = 0;
  let gastos = 0;
  let perdidas = 0;
  let manoDeObra = 0;

  for (const m of movs) {
    const b = bucket(m.cultivo_id);
    if (m.tipo === "ingreso") {
      ingresos += m.monto;
      b.ingresos += m.monto;
    } else if (m.tipo === "gasto") {
      gastos += m.monto;
      b.gastos += m.monto;
      gastoCat.set(m.categoria, (gastoCat.get(m.categoria) ?? 0) + m.monto);
    } else {
      perdidas += m.monto;
      b.perdidas += m.monto;
      perdidaCat.set(m.categoria, (perdidaCat.get(m.categoria) ?? 0) + m.monto);
    }
  }
  for (const p of pagos) {
    manoDeObra += p.monto;
    gastos += p.monto;
    bucket(p.cultivo_id).gastos += p.monto;
  }
  if (manoDeObra > 0) gastoCat.set(MANO_DE_OBRA, manoDeObra);

  const toList = (m: Map<string, number>) =>
    [...m.entries()].map(([categoria, monto]) => ({ categoria, monto })).sort((a, b) => b.monto - a.monto);
  const nombre = (id: string | null) => (id ? (cultivos.find((c) => c.id === id)?.nombre ?? "Cultivo borrado") : "Sin cultivo (general)");

  return {
    ingresos,
    gastos,
    manoDeObra,
    perdidas,
    resultado: ingresos - gastos - perdidas,
    gastosPorCategoria: toList(gastoCat),
    perdidasPorCategoria: toList(perdidaCat),
    porCultivo: [...cult.entries()]
      .map(([id, v]) => ({ id, nombre: nombre(id), ...v, resultado: v.ingresos - v.gastos - v.perdidas }))
      .sort((a, b) => b.resultado - a.resultado),
  };
}
