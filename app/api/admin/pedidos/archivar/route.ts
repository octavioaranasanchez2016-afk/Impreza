import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { serverError } from "@/lib/bot";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// - archivar: pedidos completados que ya se entregaron; siguen contando en las ventas.
// - descartar: pedidos malos (prueba, falsos, duplicados, cancelados), en cualquier
//   estado; salen de la lista y NO cuentan en la facturación.
// - restaurar: vuelve a la lista de activos.
// Pasa por RLS con la sesión del admin, igual que los cambios de estado.
type Accion = "archivar" | "descartar" | "restaurar";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.denied) return auth.denied;
  const { supabase } = auth;

  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || !ids.every((id) => typeof id === "string" && UUID.test(id))) {
    return NextResponse.json({ error: "Pedidos inválidos." }, { status: 400 });
  }
  const accion: Accion = ["archivar", "descartar", "restaurar"].includes(body?.accion) ? body.accion : "archivar";
  const now = new Date().toISOString();

  const update = (values: Record<string, unknown>, onlyCompleted = false) => {
    let query = supabase.from("orders").update(values).in("id", ids);
    if (onlyCompleted) query = query.eq("status", "listo_entregado");
    return query.select("id");
  };

  let result;
  if (accion === "archivar") {
    result = await update({ archivado_at: now }, true);
  } else if (accion === "descartar") {
    result = await update({ archivado_at: now, descartado: true });
    if (result.error?.code === "PGRST204") {
      return NextResponse.json(
        { error: "Falta activar los pedidos descartados en Supabase (ejecuta supabase/descartados.sql)." },
        { status: 409 }
      );
    }
  } else {
    result = await update({ archivado_at: null, descartado: false });
    // Sin la columna "descartado" todavía, restaurar solo saca del archivo.
    if (result.error?.code === "PGRST204") result = await update({ archivado_at: null });
  }

  if (result.error?.code === "PGRST204") {
    return NextResponse.json(
      { error: "Falta activar el archivo en Supabase (ejecuta supabase/archivo.sql)." },
      { status: 409 }
    );
  }
  if (result.error) {
    return serverError(result.error, "No se pudo guardar. Intenta de nuevo.");
  }
  return NextResponse.json({ ok: true, count: result.data?.length ?? 0 });
}
