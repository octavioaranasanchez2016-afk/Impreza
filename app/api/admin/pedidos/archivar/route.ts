import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Archiva (o saca del archivo) uno o varios pedidos. Solo se archivan pedidos
// completados; pasa por RLS con la sesión del admin, igual que los cambios de estado.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || !ids.every((id) => typeof id === "string" && UUID.test(id))) {
    return NextResponse.json({ error: "Pedidos inválidos." }, { status: 400 });
  }
  const archivar = body?.archivar !== false;

  let query = supabase
    .from("orders")
    .update({ archivado_at: archivar ? new Date().toISOString() : null })
    .in("id", ids);
  if (archivar) query = query.eq("status", "listo_entregado");
  const { data, error } = await query.select("id");

  if (error?.code === "PGRST204") {
    return NextResponse.json(
      { error: "Falta activar el archivo en Supabase (ejecuta supabase/archivo.sql)." },
      { status: 409 }
    );
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
