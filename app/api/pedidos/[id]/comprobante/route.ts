import { NextRequest, NextResponse, after } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendReceiptResubmittedEmail } from "@/lib/email";
import { HOUR, clientIp, withinLimit } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// El cliente vuelve a subir su comprobante después de que el pago fue rechazado.
// El archivo ya lo subió el navegador al bucket "comprobantes" (igual que al hacer
// el pedido); aquí se cambia el comprobante del pedido, el anterior queda en
// payment_transactions como rechazado, y el pedido vuelve a "Pago por verificar".
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Pedido no válido." }, { status: 400 });

  if (!(await withinLimit({ clave: `comprobante-ip:${clientIp(req.headers)}`, max: 10, windowMs: HOUR }))) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un rato o escríbenos por WhatsApp." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const path = typeof body?.comprobantePath === "string" ? body.comprobantePath : "";
  if (!/^comprobantes\/[0-9a-f-]{36}\.(jpg|png)$/.test(path)) {
    return NextResponse.json({ error: "Comprobante no válido." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: order } = await service
    .from("orders")
    .select("id, payment_status, comprobante_url, cliente_nombre, total")
    .eq("id", id)
    .single();
  if (!order) return NextResponse.json({ error: "No encontramos ese pedido." }, { status: 404 });
  // Solo se puede cambiar el comprobante de un pago rechazado: si ya está en revisión
  // o pagado, no se toca.
  if (order.payment_status !== "fallido") {
    return NextResponse.json({ error: "Este pedido no está esperando un comprobante nuevo." }, { status: 409 });
  }

  // Que el archivo exista de verdad en el bucket.
  const { error: missing } = await service.storage.from("comprobantes").createSignedUrl(path, 60);
  if (missing) return NextResponse.json({ error: "No encontramos el archivo del comprobante. Intenta de nuevo." }, { status: 400 });

  // Historial: el comprobante rechazado queda guardado para verlo desde el panel.
  if (order.comprobante_url) {
    const { error: logError } = await service.from("payment_transactions").insert({
      order_id: order.id,
      provider: "comprobante",
      status: "fallido",
      provider_reference: order.comprobante_url,
    });
    if (logError) console.error("No se guardó el comprobante anterior en el historial:", logError.message);
  }

  const { error } = await service
    .from("orders")
    .update({ comprobante_url: path, payment_status: "en_revision", updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("payment_status", "fallido");
  if (error) return NextResponse.json({ error: "No se pudo guardar el comprobante. Intenta de nuevo." }, { status: 500 });

  after(() =>
    sendReceiptResubmittedEmail({ orderId: order.id, clienteNombre: order.cliente_nombre, total: Number(order.total) })
  );

  return NextResponse.json({ ok: true });
}
