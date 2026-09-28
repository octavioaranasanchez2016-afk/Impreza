import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OrderStatus, PaymentStatus } from "@/lib/types";
import { sendStatusUpdateEmail, StatusEmailKind } from "@/lib/email";

const VALID_STATUSES: OrderStatus[] = ["recibido", "diseno_aprobado", "en_produccion", "listo_entregado"];
const VALID_PAYMENT_STATUSES: PaymentStatus[] = ["en_revision", "pagado", "fallido"];

const STATUS_EMAIL: Partial<Record<OrderStatus, StatusEmailKind>> = {
  diseno_aprobado: "diseno_aprobado",
  en_produccion: "en_produccion",
  listo_entregado: "listo",
};
const PAYMENT_EMAIL: Partial<Record<PaymentStatus, StatusEmailKind>> = {
  pagado: "pago_verificado",
  fallido: "pago_rechazado",
};

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

  const { data: before } = await supabase
    .from("orders")
    .select("status, payment_status, cliente_nombre, cliente_email, total, created_at")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("orders").update(update).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Correo al cliente solo cuando el pedido avanza (no al corregir hacia atrás
  // ni al volver a tocar el mismo estado).
  let kind: StatusEmailKind | undefined;
  if (update.payment_status && before && update.payment_status !== before.payment_status) {
    kind = PAYMENT_EMAIL[update.payment_status];
  }
  if (
    update.status &&
    before &&
    VALID_STATUSES.indexOf(update.status) > VALID_STATUSES.indexOf(before.status as OrderStatus)
  ) {
    kind = STATUS_EMAIL[update.status];
  }

  const emailSent = Boolean(kind && before?.cliente_email);
  if (kind && before?.cliente_email) {
    const emailParams = {
      kind,
      orderId: id,
      clienteNombre: before.cliente_nombre as string,
      clienteEmail: before.cliente_email as string,
      total: Number(before.total),
      createdAt: before.created_at as string,
    };
    after(() => sendStatusUpdateEmail(emailParams));
  }

  return NextResponse.json({ ok: true, emailSent });
}
