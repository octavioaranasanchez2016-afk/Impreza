import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import { StatusChanger } from "@/components/admin/StatusChanger";
import { PaymentStatusChanger } from "@/components/admin/PaymentStatusChanger";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { DesignMockup } from "@/components/DesignMockup";
import { Invoice } from "@/components/Invoice";
import { ZONE_LABEL } from "@/components/GarmentShape";
import { buildInvoiceLines } from "@/lib/pricing";
import { formatBoth, formatCordobas, formatInDollars } from "@/lib/currency";
import { estimateReadyDate, formatReadyDate, isPastDue, toManagua } from "@/lib/delivery";
import { clientWhatsAppUrl, telUrl } from "@/lib/whatsapp";
import { DesignZone, OrderStatus, PaymentStatus, Technique } from "@/lib/types";
import { FontFamilyKey, MockupContent } from "@/lib/design";

export const dynamic = "force-dynamic";

interface StoredDiseno {
  zona: DesignZone;
  tipo: "imagen" | "texto";
  path?: string;
  ajuste?: "completa" | "llenar";
  anchoPx?: number;
  altoPx?: number;
  texto?: string;
  color?: string;
  fuente?: FontFamilyKey;
  posX: number;
  posY: number;
  escala: number;
  rotacion?: number;
}

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

  const firstItem = orderItems[0];
  const firstProduct = firstItem ? getProductById(firstItem.productId) : undefined;
  const firstColorHex = firstProduct?.variants.find((v) => v.color === firstItem?.color)?.colorHex ?? "#111111";

  const nombre = order.cliente_nombre as string;
  const telefono = order.cliente_telefono as string;
  const quickMessages = [
    {
      label: "Confirmar pago",
      text: `Hola ${nombre}, confirmamos tu pago del pedido #${shortId}. ¡Ya está en producción! Estará listo aproximadamente el ${formatReadyDate(estimateReadyDate())}.`,
    },
    {
      label: "Problema con el pago",
      text: `Hola ${nombre}, no pudimos verificar la transferencia de tu pedido #${shortId} por ${formatBoth(total)}. ¿Nos puedes enviar el comprobante de nuevo o confirmar a qué cuenta transferiste?`,
    },
    {
      label: "Consulta sobre el diseño",
      text: `Hola ${nombre}, te escribo de Impreza sobre el diseño de tu pedido #${shortId}.`,
    },
    {
      label: "Pedido listo",
      text: `Hola ${nombre}, ¡tu pedido #${shortId} está listo! ¿Cuándo te queda bien para la entrega o recogida?`,
    },
  ];

  return (
    <div>
      <Link href="/admin/pedidos" className="text-sm text-ink-soft hover:text-ink">
        ← Volver a pedidos
      </Link>

      <div className="mt-4 rounded-brand border border-black/10 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink">Pedido #{shortId}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {toManagua(createdAt).toLocaleString("es-NI", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" })}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <PaymentBadge status={paymentStatus} />
            <StatusBadge status={status} />
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
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
                {technique === "serigrafia" ? "Serigrafía" : "Sublimado"} · {totalPieces} pieza{totalPieces === 1 ? "" : "s"}
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

            {firstProduct && disenosConUrl.length > 0 && (
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                {disenosConUrl.map((d) => {
                  const content: MockupContent | null =
                    d.tipo === "imagen"
                      ? d.signedUrl
                        ? {
                            kind: "imagen",
                            previewUrl: d.signedUrl,
                            width: d.anchoPx ?? 0,
                            height: d.altoPx ?? 0,
                            fill: d.ajuste === "llenar",
                          }
                        : null
                      : { kind: "texto", texto: d.texto ?? "", color: d.color ?? "#111111", fontFamily: d.fuente ?? "sans" };

                  return (
                    <div key={d.zona}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        {ZONE_LABEL[d.zona]}
                        {d.tipo === "imagen" && d.ajuste === "llenar" && " · llenar área"}
                      </p>
                      {content ? (
                        <DesignMockup
                          category={firstProduct.category}
                          zone={d.zona}
                          color={firstColorHex}
                          size={firstItem?.size}
                          content={content}
                          transform={{ x: d.posX, y: d.posY, scale: d.escala || 1, rotation: d.rotacion ?? 0 }}
                          interactive={false}
                          showPlacement
                        />
                      ) : (
                        <p className="text-sm text-ink-soft">No se pudo generar la vista previa.</p>
                      )}
                      {d.tipo === "texto" && (
                        <p className="mt-2 text-center text-xs text-ink-soft">
                          Texto: <span className="font-semibold text-ink">“{d.texto}”</span> · color{" "}
                          <span className="inline-block h-3 w-3 rounded-full border border-black/20 align-middle" style={{ backgroundColor: d.color }} />{" "}
                          {d.color}
                        </p>
                      )}
                      {d.tipo === "imagen" && d.signedUrl && (
                        <a
                          href={d.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="mt-2 block rounded-brand border border-black/15 px-3 py-1.5 text-center text-xs font-semibold text-ink hover:border-ink"
                        >
                          Descargar imagen original
                          {d.anchoPx ? ` (${d.anchoPx} × ${d.altoPx} px)` : ""}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {firstProduct && (
              <p className="mt-4 text-xs text-ink-muted">
                Vista previa sobre {firstProduct.name}, {firstItem?.color}, talla {firstItem?.size}. Las medidas en cm son las
                mismas para todas las tallas.
              </p>
            )}
          </section>

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
          />
        </div>

        <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-brand border border-black/10 bg-white p-5">
            <h2 className="font-semibold text-ink">Cliente</h2>
            <p className="mt-2 text-lg font-semibold text-ink">{nombre}</p>
            <p className="text-sm text-ink-soft">{telefono}</p>
            {order.cliente_email && <p className="text-sm text-ink-soft">{order.cliente_email}</p>}
            <p className="mt-2 text-xs text-ink-muted">
              {order.cliente_email
                ? "Recibe un correo automático cuando verificas el pago o avanzas el pedido."
                : "No dejó correo: avísale de cada cambio por WhatsApp."}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
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

            <p className="mt-4 text-xs font-medium text-ink-soft">Mensajes rápidos por WhatsApp</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
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

          <section className="rounded-brand border border-black/10 bg-white p-5">
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
              Revisa en tu banca en línea que el monto llegó a la cuenta en córdobas o en dólares antes de verificar.
            </p>
            <div className="mt-3">
              <PaymentStatusChanger orderId={order.id} status={paymentStatus} />
            </div>
          </section>

          <section className="rounded-brand border border-black/10 bg-white p-5">
            <StatusChanger orderId={order.id} status={status} />
          </section>
        </div>
      </div>
    </div>
  );
}
