import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { Invoice } from "@/components/Invoice";
import { formatBoth } from "@/lib/currency";
import { buildInvoiceLines } from "@/lib/pricing";
import { PRODUCTION_BUSINESS_DAYS, estimateReadyDate, formatReadyDate } from "@/lib/delivery";
import { Technique } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConfirmacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, cliente_nombre, tecnica, subtotal, descuento_pct, descuento_monto, cargo_diseno, total, created_at")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, color, talla, cantidad")
    .eq("order_id", id);

  const technique = order.tecnica as Technique;
  const orderItems = (items ?? []).map((i) => ({
    productId: i.product_id,
    color: i.color,
    size: i.talla,
    quantity: i.cantidad,
  }));
  const shortId = order.id.slice(0, 8).toUpperCase();
  const total = Number(order.total);
  const message = `Hola, soy ${order.cliente_nombre}. Hice el pedido #${shortId} en Impreza por ${formatBoth(
    total
  )} y adjunté mi comprobante de transferencia.`;

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 md:px-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-3xl text-paper">✓</div>
        <h1 className="mt-6 text-3xl font-bold text-ink">¡Pedido confirmado!</h1>
        <p className="mt-2 text-ink-soft">
          Recibimos tu pedido <span className="font-semibold text-ink">#{shortId}</span> y tu comprobante de
          transferencia. Vamos a verificar el pago y te escribimos por WhatsApp para coordinar la entrega.
        </p>
        <p className="mx-auto mt-4 max-w-md rounded-brand bg-paper-soft px-4 py-3 text-sm text-ink">
          Listo aproximadamente el{" "}
          <span className="font-semibold">{formatReadyDate(estimateReadyDate(new Date(order.created_at)))}</span>
          <span className="block text-xs text-ink-soft">
            {PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos tu pago.
          </span>
        </p>
      </div>

      <div className="mt-8">
        <Invoice
          title="Factura"
          lines={buildInvoiceLines(orderItems, technique)}
          pricing={{
            totalQuantity: orderItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: Number(order.subtotal),
            discountPct: Number(order.descuento_pct),
            discountAmount: Number(order.descuento_monto),
            setupFee: Number(order.cargo_diseno),
            total,
          }}
          technique={technique}
          clienteNombre={order.cliente_nombre}
          orderNumber={shortId}
          date={new Date(order.created_at)}
        />
        <p className="mt-2 text-center text-xs text-ink-muted">
          Pago por transferencia · en verificación. Guarda esta página o toma una captura como respaldo.
        </p>
      </div>

      <div className="mt-8 text-center">
        <WhatsAppLinkButton
          message={message}
          className="inline-block rounded-brand bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Escribir por WhatsApp
        </WhatsAppLinkButton>
        <div className="mt-4">
          <Link href="/" className="text-sm text-ink-soft hover:text-ink">
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
}
