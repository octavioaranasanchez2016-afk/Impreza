import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { Invoice } from "@/components/Invoice";
import { formatBoth } from "@/lib/currency";
import { buildInvoiceLines } from "@/lib/pricing";
import { PRODUCTION_BUSINESS_DAYS, estimateReadyDate, formatReadyDate } from "@/lib/delivery";
import { OrderStatus, PaymentStatus, Technique } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_ORDER: OrderStatus[] = ["recibido", "diseno_aprobado", "en_produccion", "listo_entregado"];

function headline(status: OrderStatus, payment: PaymentStatus) {
  if (payment === "fallido") return { title: "Necesitamos revisar tu pago", text: "No pudimos verificar tu transferencia. Escríbenos por WhatsApp con tu comprobante y lo resolvemos." };
  if (status === "listo_entregado") return { title: "¡Tu pedido está listo!", text: "Escríbenos por WhatsApp para coordinar la entrega o recogida." };
  if (status === "en_produccion") return { title: "Tu pedido está en producción", text: "Estamos imprimiendo tu pedido. Te avisamos cuando esté listo." };
  if (status === "diseno_aprobado") return { title: "Tu diseño fue aprobado", text: "Tu pedido pasa a producción en breve." };
  if (payment === "pagado") return { title: "Pago confirmado", text: "Verificamos tu transferencia. Tu pedido ya está en proceso." };
  return {
    title: "¡Pedido confirmado!",
    text: "Recibimos tu pedido y tu comprobante de transferencia. Vamos a verificar el pago y te avisamos.",
  };
}

export default async function ConfirmacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, cliente_nombre, tecnica, subtotal, descuento_pct, descuento_monto, cargo_diseno, total, created_at, status, payment_status"
      )
      .eq("id", id)
      .single(),
    supabase.from("order_items").select("product_id, color, talla, cantidad").eq("order_id", id),
  ]);

  if (!order) notFound();

  const technique = order.tecnica as Technique;
  const status = order.status as OrderStatus;
  const payment = order.payment_status as PaymentStatus;
  const orderItems = (items ?? []).map((i) => ({
    productId: i.product_id,
    color: i.color,
    size: i.talla,
    quantity: i.cantidad,
  }));
  const shortId = order.id.slice(0, 8).toUpperCase();
  const total = Number(order.total);
  const statusIndex = STATUS_ORDER.indexOf(status);
  const { title, text } = headline(status, payment);
  const done = status === "listo_entregado";

  const steps = [
    { label: "Pedido recibido", done: true },
    { label: payment === "fallido" ? "Pago con problema" : "Pago verificado", done: payment === "pagado", error: payment === "fallido" },
    { label: "Diseño aprobado", done: statusIndex >= 1 },
    { label: "En producción", done: statusIndex >= 2 },
    { label: "Listo", done: statusIndex >= 3 },
  ];

  const message = `Hola, soy ${order.cliente_nombre}. Te escribo por mi pedido #${shortId} en Impreza por ${formatBoth(total)}.`;

  return (
    <section className="mx-auto max-w-2xl px-4 py-14 md:px-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">Pedido #{shortId}</p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-wide text-ink">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">{text}</p>
      </div>

      <ol className="mt-8 grid grid-cols-5 gap-1 rounded-brand border border-black/10 bg-white p-4">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                s.error
                  ? "border-red-600 bg-red-600 text-white"
                  : s.done
                  ? "border-ink bg-ink text-paper"
                  : "border-black/15 text-ink-muted"
              }`}
            >
              {s.error ? "!" : s.done ? "✓" : i + 1}
            </span>
            <span className={`text-[11px] leading-tight ${s.done || s.error ? "font-semibold text-ink" : "text-ink-muted"}`}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-brand border-2 border-ink bg-white px-5 py-4">
        <div>
          <p className="text-xs text-ink-soft">Tu código de pedido</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-ink">{shortId}</p>
        </div>
        <p className="max-w-[16rem] text-xs text-ink-soft">
          Guárdalo: con él puedes ver el estado de tu pedido en{" "}
          <Link href="/seguimiento" className="font-semibold text-ink underline">
            Rastrear pedido
          </Link>
          .
        </p>
      </div>

      {!done && payment !== "fallido" && (
        <p className="mt-4 rounded-brand bg-paper-soft px-4 py-3 text-center text-sm text-ink">
          Listo aproximadamente el <span className="font-semibold">{formatReadyDate(estimateReadyDate(new Date(order.created_at)))}</span>
          <span className="block text-xs text-ink-soft">{PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos tu pago.</span>
        </p>
      )}

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
          Guarda esta página: aquí puedes ver en todo momento cómo va tu pedido.
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
