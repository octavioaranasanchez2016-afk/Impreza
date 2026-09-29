import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TECHNIQUE_LABEL, getProductById } from "@/lib/catalog";
import { StatusChanger } from "@/components/admin/StatusChanger";
import { PaymentStatusChanger } from "@/components/admin/PaymentStatusChanger";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { ShippingCard } from "@/components/admin/ShippingCard";
import { PrintButton } from "@/components/admin/PrintButton";
import { ArchiveButton } from "@/components/admin/ArchiveButton";
import { OrderDesigns } from "@/components/admin/OrderDesigns";
import { StatusBadge } from "@/components/StatusBadge";
import { Invoice } from "@/components/Invoice";
import { buildInvoiceLines } from "@/lib/pricing";
import { formatBoth, formatCordobas, formatInDollars } from "@/lib/currency";
import { estimateReadyDate, formatReadyDate, isPastDue, toManagua } from "@/lib/delivery";
import { clientWhatsAppUrl, telUrl } from "@/lib/whatsapp";
import { NotifyInfo, statusWhatsAppMessage, trackingPath } from "@/lib/notifications";
import { parseShipping } from "@/lib/shipping";
import { parseBilling } from "@/lib/billing";
import { OrderStatus, PaymentStatus, Technique } from "@/lib/types";
import { StoredDiseno } from "@/lib/design-groups";

export const dynamic = "force-dynamic";

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "Único"];

export default async function AdminPedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*").eq("order_id", id),
  ]);

  if (!order) notFound();

  const disenos: StoredDiseno[] = Array.isArray(order.disenos) ? order.disenos : [];

  // Los buckets son privados: URLs firmadas de corta duración, solo para el admin.
  const service = createServiceClient();
  const [disenosConUrl, comprobanteSigned] = await Promise.all([
    Promise.all(
      disenos.map(async (d) => {
        if (d.tipo !== "imagen" || !d.path) return { ...d, signedUrl: null as string | null };
        const { data } = await service.storage.from("disenos").createSignedUrl(d.path, 60 * 30);
        return { ...d, signedUrl: data?.signedUrl ?? null };
      })
    ),
    order.comprobante_url
      ? service.storage.from("comprobantes").createSignedUrl(order.comprobante_url, 60 * 30)
      : Promise.resolve(null),
  ]);

  const shortId = order.id.slice(0, 8).toUpperCase();
  const total = Number(order.total);
  const status = order.status as OrderStatus;
  const paymentStatus = order.payment_status as PaymentStatus;
  const technique = order.tecnica as Technique;
  const createdAt = new Date(order.created_at);
  const ready = estimateReadyDate(createdAt);
  const done = status === "listo_entregado";
  const late = !done && paymentStatus === "pagado" && isPastDue(ready);
  const archivedAt = order.archivado_at ? new Date(order.archivado_at as string) : null;
  const discarded = Boolean(order.descartado);

  const orderItems = (items ?? []).map((i) => ({
    productId: i.product_id as string,
    color: i.color as string,
    size: i.talla as string,
    quantity: i.cantidad as number,
  }));
  const piecesToMake = [...orderItems].sort(
    (a, b) =>
      a.productId.localeCompare(b.productId) ||
      a.color.localeCompare(b.color) ||
      SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  );
  const totalPieces = orderItems.reduce((sum, i) => sum + i.quantity, 0);


  const nombre = order.cliente_nombre as string;
  const telefono = order.cliente_telefono as string;
  const entrega = parseShipping(order.entrega);
  const factura = parseBilling(order.factura);
  const notify: NotifyInfo = {
    nombre,
    telefono,
    code: shortId,
    totalText: formatBoth(total),
    readyText: formatReadyDate(ready),
    entrega,
  };
  const requestHeaders = await headers();
  const trackUrl = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host")}${trackingPath(shortId)}`;
  const quickMessages = [
    { label: "Confirmar pago", text: statusWhatsAppMessage("pagado", notify, trackUrl)! },
    { label: "Problema con el pago", text: statusWhatsAppMessage("fallido", notify, trackUrl)! },
    { label: "Consulta sobre el diseño", text: `Hola ${nombre}, te escribo de Impreza sobre el diseño de tu pedido #${shortId}.` },
    { label: "Pedido listo", text: statusWhatsAppMessage("listo_entregado", notify, trackUrl)! },
  ];

  return (
    <div>
      <Link href="/admin/pedidos" className="text-sm text-ink-soft hover:text-ink print:hidden">
        ← Volver a pedidos
      </Link>

      {archivedAt && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-brand bg-ink px-5 py-3 text-paper print:hidden">
          <p className="text-sm">
            Pedido {discarded ? "descartado" : "archivado"} el{" "}
            {toManagua(archivedAt).toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.{" "}
            {discarded ? "No cuenta en la facturación." : "No aparece en la lista de pedidos activos."}
          </p>
          <ArchiveButton
            ids={[order.id]}
            accion="restaurar"
            label={discarded ? "Restaurar pedido" : "Sacar del archivo"}
            className="rounded-brand bg-paper px-4 py-2 text-sm font-semibold text-ink hover:opacity-90 disabled:opacity-50"
          />
        </div>
      )}

      <div className="mt-4 rounded-brand border border-black/10 bg-white p-5 print:mt-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">Pedido #{shortId}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {toManagua(createdAt).toLocaleString("es-NI", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <PaymentBadge status={paymentStatus} />
            <StatusBadge status={status} />
            <PrintButton />
          </div>
        </div>
        {!done && paymentStatus !== "fallido" && (
          <p
            className={`mt-4 rounded-brand px-4 py-2.5 text-sm ${
              late ? "bg-red-50 font-semibold text-red-800" : "bg-paper-soft text-ink"
            }`}
          >
            {late ? "Atrasado: debía estar listo el " : "Entrega estimada: "}
            <span className="font-semibold">{formatReadyDate(ready)}</span>
            {!late && <span className="text-ink-soft"> (7 días hábiles; se corre si el pago se verifica después)</span>}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] print:block print:space-y-6">
        <div className="min-w-0 space-y-6">
          {order.notas && (
            <div className="rounded-brand border-2 border-ink bg-white p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Nota del cliente</p>
              <p className="mt-1 text-ink">{order.notas}</p>
            </div>
          )}

          <section className="rounded-brand border border-black/10 bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-ink">Hoja de producción</h2>
              <p className="text-xs text-ink-soft">
                {TECHNIQUE_LABEL[technique] ?? technique} · {totalPieces} pieza{totalPieces === 1 ? "" : "s"}
              </p>
            </div>

            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs text-ink-muted">
                  <th className="pb-2 font-medium">Producto</th>
                  <th className="pb-2 font-medium">Color</th>
                  <th className="pb-2 font-medium">Talla</th>
                  <th className="pb-2 text-right font-medium">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {piecesToMake.map((p, i) => (
                  <tr key={i} className="border-b border-black/5">
                    <td className="py-2 text-ink">{getProductById(p.productId)?.name ?? p.productId}</td>
                    <td className="py-2 text-ink">{p.color}</td>
                    <td className="py-2 font-semibold text-ink">{p.size}</td>
                    <td className="py-2 text-right font-semibold text-ink">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <OrderDesigns disenos={disenosConUrl} items={orderItems} />
          </section>

          <div className="print:hidden">
            <Invoice
              title="Factura"
              lines={buildInvoiceLines(orderItems, technique)}
              pricing={{
                totalQuantity: totalPieces,
                subtotal: Number(order.subtotal),
                discountPct: Number(order.descuento_pct),
                discountAmount: Number(order.descuento_monto),
                setupFee: Number(order.cargo_diseno),
                total,
              }}
              technique={technique}
              clienteNombre={nombre}
              orderNumber={shortId}
              date={createdAt}
              shipping={entrega}
              billing={factura}
            />
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start print:static">
          <section className="rounded-brand border border-black/10 bg-white p-5">
            <h2 className="font-semibold text-ink">Cliente</h2>
            <p className="mt-2 text-lg font-semibold text-ink">{nombre}</p>
            <p className="text-sm text-ink-soft">{telefono}</p>
            {order.cliente_email && <p className="text-sm text-ink-soft">{order.cliente_email}</p>}
            {factura && (
              <div className="mt-3 rounded-brand border-2 border-ink px-3 py-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Pide factura con RUC</p>
                <p className="font-semibold text-ink">{factura.razonSocial}</p>
                <p className="font-mono text-ink">RUC {factura.ruc}</p>
              </div>
            )}
            <p className="mt-2 text-xs text-ink-muted print:hidden">
              Al verificar el pago o avanzar el pedido aparece un botón verde para avisarle por WhatsApp. Su código para
              rastrear el pedido es <span className="font-semibold text-ink">{shortId}</span>.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 print:hidden">
              <a
                href={clientWhatsAppUrl(telefono, `Hola ${nombre}, te escribo de Impreza sobre tu pedido #${shortId}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-brand bg-[#25D366] px-3 py-2 text-center text-sm font-semibold text-white hover:opacity-90"
              >
                WhatsApp
              </a>
              <a
                href={telUrl(telefono)}
                className="rounded-brand border border-black/15 px-3 py-2 text-center text-sm font-semibold text-ink hover:border-ink"
              >
                Llamar
              </a>
            </div>

            <p className="mt-4 text-xs font-medium text-ink-soft print:hidden">Mensajes rápidos por WhatsApp</p>
            <div className="mt-2 flex flex-wrap gap-1.5 print:hidden">
              {quickMessages.map((m) => (
                <a
                  key={m.label}
                  href={clientWhatsAppUrl(telefono, m.text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium text-ink hover:border-ink"
                >
                  {m.label}
                </a>
              ))}
            </div>
          </section>

          <ShippingCard entrega={entrega} nombre={nombre} telefono={telefono} code={shortId} />

          <section className="rounded-brand border border-black/10 bg-white p-5 print:hidden">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-ink">Pago</h2>
              <p className="text-right text-sm">
                <span className="font-bold text-ink">{formatCordobas(total)}</span>
                <span className="block text-xs text-ink-muted">o {formatInDollars(total)}</span>
              </p>
            </div>
            {comprobanteSigned?.data?.signedUrl ? (
              <a href={comprobanteSigned.data.signedUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                <img
                  src={comprobanteSigned.data.signedUrl}
                  alt="Comprobante de transferencia"
                  className="max-h-96 w-full rounded border border-black/10 bg-paper-soft object-contain"
                />
                <span className="mt-1 block text-center text-xs text-ink-soft hover:underline">
                  Toca para ver el comprobante en grande
                </span>
              </a>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Este pedido no tiene comprobante adjunto.</p>
            )}
            <p className="mt-3 text-xs text-ink-muted">
              Revisa en tu banca en línea que el monto llegó a la cuenta en córdobas o en dólares antes de verificar. El
              cliente debió escribir el código <span className="font-semibold text-ink">{shortId}</span> en el concepto de
              la transferencia.
            </p>
            <div className="mt-3">
              <PaymentStatusChanger orderId={order.id} status={paymentStatus} notify={notify} />
            </div>
          </section>

          <section className="rounded-brand border border-black/10 bg-white p-5 print:hidden">
            <StatusChanger orderId={order.id} status={status} notify={notify} />
            {done && !archivedAt && (
              <div className="mt-5 border-t border-black/10 pt-4">
                <p className="mb-2 text-xs text-ink-soft">
                  ¿Ya lo entregaste? Archívalo para sacarlo de la lista de pedidos activos.
                </p>
                <ArchiveButton ids={[order.id]} accion="archivar" label="Archivar pedido" />
              </div>
            )}
          </section>

          {!discarded && (
            <section className="rounded-brand border border-dashed border-red-300 bg-white p-5 print:hidden">
              <h2 className="font-semibold text-ink">Descartar pedido</h2>
              <p className="mt-1 text-xs text-ink-soft">
                Para pedidos de prueba, falsos, duplicados o cancelados. Sale de la lista y no cuenta en la facturación.
                Lo puedes restaurar después.
              </p>
              <div className="mt-3">
                <ArchiveButton
                  ids={[order.id]}
                  accion="descartar"
                  label="Descartar este pedido"
                  confirmText="¿Descartar este pedido?"
                  className="rounded-brand border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:border-red-600 disabled:opacity-50"
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

