import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { AccountOrderPrompt } from "@/components/AccountOrderPrompt";
import { Invoice } from "@/components/Invoice";
import { ReviewForm } from "@/components/ReviewForm";
import { ReceiptReupload } from "@/components/ReceiptReupload";
import { getOrderReviewState } from "@/lib/reviews";
import { parseBilling } from "@/lib/billing";
import { formatBoth } from "@/lib/currency";
import { buildInvoiceLines } from "@/lib/pricing";
import { PRODUCTION_BUSINESS_DAYS, estimateReadyDate, formatReadyDate } from "@/lib/delivery";
import { OrderStatus, PaymentStatus, Technique } from "@/lib/types";
import { ShippingInfo, WORKSHOP, areaLabel, parseShipping } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
};

const STATUS_ORDER: OrderStatus[] = ["recibido", "diseno_aprobado", "en_produccion", "listo_entregado"];

function readyText(entrega: ShippingInfo | null) {
  if (entrega?.metodo === "domicilio") return "Sale del Taller Impreza hacia tu dirección. Te avisamos cuando vaya en camino.";
  if (entrega?.metodo === "retiro") return `Ya puedes recogerlo en ${WORKSHOP.name} (${WORKSHOP.hours}).`;
  return "Escríbenos por WhatsApp para coordinar la entrega o recogida.";
}

function headline(status: OrderStatus, payment: PaymentStatus, entrega: ShippingInfo | null) {
  if (payment === "fallido") return { title: "Necesitamos revisar tu pago", text: "No pudimos verificar tu transferencia. Sube de nuevo tu comprobante aquí abajo y lo revisamos otra vez." };
  if (status === "listo_entregado") return { title: "¡Tu pedido está listo!", text: readyText(entrega) };
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
    // "*" y no una lista: la columna entrega puede no existir todavía en la base de datos.
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);

  if (!order) notFound();

  const technique = order.tecnica as Technique;
  const status = order.status as OrderStatus;
  const payment = order.payment_status as PaymentStatus;
  const orderItems = (items ?? []).map((i) => ({
    productId: i.product_id,
    technique: (i.tecnica as Technique | null) ?? null,
    fabric: (i.tela as string | null) ?? null,
    color: i.color,
    size: i.talla,
    quantity: i.cantidad,
  }));
  const shortId = order.id.slice(0, 8).toUpperCase();
  const total = Number(order.total);
  const statusIndex = STATUS_ORDER.indexOf(status);
  const entrega = parseShipping(order.entrega);
  const { title, text } = headline(status, payment, entrega);
  const done = status === "listo_entregado";
  const reviewState = done ? await getOrderReviewState(order.id) : null;

  const steps = [
    { label: "Pedido recibido", done: true },
    { label: payment === "fallido" ? "Pago con problema" : "Pago verificado", done: payment === "pagado", error: payment === "fallido" },
    { label: "Diseño aprobado", done: statusIndex >= 1 },
    { label: "En producción", done: statusIndex >= 2 },
    { label: entrega?.metodo === "retiro" ? "Listo para recoger" : "Listo", done: statusIndex >= 3 },
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

      {payment === "fallido" && (
        <div className="mt-4">
          <ReceiptReupload orderId={order.id} orderCode={shortId} />
        </div>
      )}

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

      <AccountOrderPrompt orderId={order.id} hasEmail={Boolean(order.cliente_email)} />

      {entrega && (
        <div className="mt-4 flex items-start gap-3 rounded-brand border border-black/10 bg-white px-5 py-4 text-sm">
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-ink-muted">Entrega</span>
          {entrega.metodo === "domicilio" ? (
            <p className="text-ink">
              <span className="font-semibold">A domicilio</span> en {areaLabel(entrega)}
              {entrega.envio && (
                <span className="block text-xs text-ink-soft">
                  Delivery: C${entrega.envio.costo} · {entrega.envio.km} km desde el Taller Impreza
                </span>
              )}
            </p>
          ) : (
            <p className="text-ink">
              <span className="font-semibold">Recoges en el taller</span>: {WORKSHOP.name}
              <span className="block text-xs text-ink-soft">
                {WORKSHOP.hours} ·{" "}
                <a href={WORKSHOP.mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline">
                  Ver en el mapa
                </a>
              </span>
            </p>
          )}
        </div>
      )}

      {!done && payment !== "fallido" && (
        <p className="mt-4 rounded-brand bg-paper-soft px-4 py-3 text-center text-sm text-ink">
          Listo aproximadamente el <span className="font-semibold">{formatReadyDate(estimateReadyDate(new Date(order.created_at)))}</span>
          <span className="block text-xs text-ink-soft">{PRODUCTION_BUSINESS_DAYS} días hábiles desde que verificamos tu pago.</span>
        </p>
      )}

      {reviewState === "pendiente" && (
        <div className="mt-8">
          <ReviewForm orderId={order.id} defaultName={String(order.cliente_nombre).split(" ")[0] ?? ""} />
        </div>
      )}
      {reviewState === "enviada" && (
        <p className="mt-8 rounded-brand bg-paper-soft px-4 py-3 text-center text-sm text-ink">
          ¡Gracias por dejarnos tu reseña!
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
            shipping: entrega?.envio?.costo ?? 0,
            shippingKm: entrega?.envio?.km,
            total,
          }}
          technique={technique}
          clienteNombre={order.cliente_nombre}
          orderNumber={shortId}
          date={new Date(order.created_at)}
          shipping={entrega}
          billing={parseBilling(order.factura)}
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
