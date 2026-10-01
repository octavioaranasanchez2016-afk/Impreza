import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CATEGORIAS, INVENTARIO_CATEGORIAS, type TipoMovimiento } from "@/lib/finca-const";
import { hoyManagua } from "@/lib/finca";

async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const { data: admin } = await supabase.from("admins").select("id").eq("id", user.id).single();
  if (!admin) return NextResponse.json({ error: "Sin acceso." }, { status: 403 });
  return null;
}

class Bad extends Error {}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
function req(v: unknown, label: string, max = 200): string {
  const s = str(v, max);
  if (!s) throw new Bad(`Falta: ${label}.`);
  return s;
}
function num(v: unknown, label: string, { min = 0, required = true }: { min?: number; required?: boolean } = {}): number | null {
  if (v === "" || v == null) {
    if (required) throw new Bad(`Falta: ${label}.`);
    return null;
  }
  const x = Number(v);
  if (!Number.isFinite(x) || x < min || x > 1e9) throw new Bad(`${label} no es válido.`);
  return x;
}
function fecha(v: unknown): string {
  const s = str(v, 10);
  if (!s) return hoyManagua();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) throw new Bad("La fecha no es válida.");
  return s;
}
const uuid = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

const DELETABLE = {
  movimientos: "finca_movimientos",
  pagos: "finca_pagos",
  cultivos: "finca_cultivos",
  inventario: "finca_inventario",
} as const;

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const b = await request.json().catch(() => null);
  if (!b || typeof b !== "object") return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });

  const db = createServiceClient();
  try {
    switch (b.accion) {
      case "movimiento": {
        const tipo = b.tipo as TipoMovimiento;
        if (!(tipo in CATEGORIAS)) throw new Bad("Tipo no válido.");
        const categoria = req(b.categoria, "categoría", 60);
        const { error } = await db.from("finca_movimientos").insert({
          fecha: fecha(b.fecha),
          tipo,
          categoria,
          descripcion: str(b.descripcion) || null,
          monto: num(b.monto, "el monto"),
          cultivo_id: uuid(b.cultivo_id),
        });
        if (error) throw error;
        break;
      }
      case "cultivo": {
        const { error } = await db.from("finca_cultivos").insert({
          nombre: req(b.nombre, "el nombre", 80),
          area_mz: num(b.area_mz, "el área", { required: false }),
          fecha_siembra: str(b.fecha_siembra, 10) ? fecha(b.fecha_siembra) : null,
          notas: str(b.notas, 500) || null,
        });
        if (error) throw error;
        break;
      }
      case "cultivo_estado": {
        const id = uuid(b.id);
        if (!id || !["activo", "cosechado"].includes(b.estado)) throw new Bad("Datos no válidos.");
        const { error } = await db.from("finca_cultivos").update({ estado: b.estado }).eq("id", id);
        if (error) throw error;
        break;
      }
      case "trabajador": {
        const { error } = await db.from("finca_trabajadores").insert({
          nombre: req(b.nombre, "el nombre", 80),
          telefono: str(b.telefono, 30) || null,
          pago_dia: num(b.pago_dia, "el jornal diario", { required: false }) ?? 0,
        });
        if (error) throw error;
        break;
      }
      case "trabajador_activo": {
        const id = uuid(b.id);
        if (!id || typeof b.activo !== "boolean") throw new Bad("Datos no válidos.");
        const { error } = await db.from("finca_trabajadores").update({ activo: b.activo }).eq("id", id);
        if (error) throw error;
        break;
      }
      case "pago": {
        const trabajador_id = uuid(b.trabajador_id);
        if (!trabajador_id) throw new Bad("Elige un trabajador.");
        const { error } = await db.from("finca_pagos").insert({
          fecha: fecha(b.fecha),
          trabajador_id,
          dias: num(b.dias, "los días", { required: false }),
          monto: num(b.monto, "el monto"),
          cultivo_id: uuid(b.cultivo_id),
          nota: str(b.nota) || null,
        });
        if (error) throw error;
        break;
      }
      case "item": {
        const categoria = INVENTARIO_CATEGORIAS.includes(b.categoria) ? b.categoria : "insumo";
        const { error } = await db.from("finca_inventario").insert({
          nombre: req(b.nombre, "el nombre", 80),
          categoria,
          unidad: str(b.unidad, 20) || "unidad",
          cantidad: num(b.cantidad, "la cantidad", { required: false }) ?? 0,
          minimo: num(b.minimo, "el mínimo", { required: false }) ?? 0,
          costo_unit: num(b.costo_unit, "el costo", { required: false }) ?? 0,
        });
        if (error) throw error;
        break;
      }
      case "item_mov": {
        // Entrada (compra o cosecha), salida (uso) o merma (se echó a perder).
        const id = uuid(b.item_id);
        if (!id || !["entrada", "salida", "merma"].includes(b.tipo)) throw new Bad("Datos no válidos.");
        const cantidad = num(b.cantidad, "la cantidad") as number;
        if (cantidad <= 0) throw new Bad("La cantidad debe ser mayor que cero.");
        const { data: item, error: e0 } = await db.from("finca_inventario").select("*").eq("id", id).single();
        if (e0 || !item) throw new Bad("Ese artículo ya no existe.");
        const actual = Number(item.cantidad) || 0;
        const delta = b.tipo === "entrada" ? cantidad : -cantidad;
        if (actual + delta < 0) throw new Bad(`Solo hay ${actual} ${item.unidad} en inventario.`);

        const patch: Record<string, number> = { cantidad: actual + delta };
        const costoTotal = b.tipo === "entrada" ? num(b.costo_total, "el costo", { required: false }) : null;
        if (costoTotal && costoTotal > 0) patch.costo_unit = Math.round((costoTotal / cantidad) * 100) / 100;

        const { error: e1 } = await db.from("finca_inventario").update(patch).eq("id", id);
        if (e1) throw e1;
        const f = fecha(b.fecha);
        const { error: e2 } = await db
          .from("finca_inventario_mov")
          .insert({ item_id: id, fecha: f, tipo: b.tipo, cantidad, nota: str(b.nota) || null });
        if (e2) throw e2;

        // Una compra se anota sola como gasto; una merma, como pérdida (valorada al último costo).
        if (costoTotal && costoTotal > 0) {
          await db.from("finca_movimientos").insert({
            fecha: f,
            tipo: "gasto",
            categoria: "Insumos",
            descripcion: `Compra: ${item.nombre} (${cantidad} ${item.unidad})`,
            monto: costoTotal,
          });
        }
        const costoUnit = Number(item.costo_unit) || 0;
        if (b.tipo === "merma" && costoUnit > 0) {
          await db.from("finca_movimientos").insert({
            fecha: f,
            tipo: "perdida",
            categoria: "Cosecha dañada",
            descripcion: `Merma: ${item.nombre} (${cantidad} ${item.unidad})`,
            monto: Math.round(cantidad * costoUnit * 100) / 100,
          });
        }
        break;
      }
      default:
        throw new Bad("Acción no válida.");
    }
  } catch (e) {
    if (e instanceof Bad) return NextResponse.json({ error: e.message }, { status: 400 });
    const message = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "";
    const missing = /relation .* does not exist|schema cache|finca_/i.test(message);
    return NextResponse.json(
      { error: missing ? "Falta activar el sistema: corre supabase/finca.sql en Supabase." : message || "No se pudo guardar." },
      { status: missing ? 400 : 500 }
    );
  }

  revalidatePath("/admin/finca", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const b = await request.json().catch(() => null);
  const table = DELETABLE[b?.tabla as keyof typeof DELETABLE];
  const id = uuid(b?.id);
  if (!table || !id) return NextResponse.json({ error: "Datos no válidos." }, { status: 400 });

  const { error } = await createServiceClient().from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/admin/finca", "layout");
  return NextResponse.json({ ok: true });
}
