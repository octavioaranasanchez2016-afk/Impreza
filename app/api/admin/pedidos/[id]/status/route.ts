import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OrderStatus, PaymentStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = ["recibido", "diseno_aprobado", "en_produccion", "listo_entregado"];
const VALID_PAYMENT_STATUSES: PaymentStatus[] = ["en_revision", "pagado", "fallido"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const update: { status?: OrderStatus; payment_status?: PaymentStatus; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (body?.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body?.paymentStatus !== undefined) {
    if (!VALID_PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return NextResponse.json({ error: "Estado de pago inválido." }, { status: 400 });
    }
    update.payment_status = body.paymentStatus;
  }
  if (!update.status && !update.payment_status) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const { error } = await supabase.from("orders").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
