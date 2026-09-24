import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "recibido",
  "diseno_aprobado",
  "en_produccion",
  "listo_entregado",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // createClient() usa las cookies de sesión del admin logueado, así que este
  // update pasa por RLS normalmente (policy "admins actualizan pedidos") —
  // no se usa la service role aquí, un admin no autenticado no puede llegar.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status as OrderStatus | undefined;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
