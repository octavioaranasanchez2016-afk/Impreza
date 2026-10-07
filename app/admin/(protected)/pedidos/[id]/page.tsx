import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TECHNIQUE_LABEL, getFabric, getProductById } from "@/lib/catalog";
import { StatusChanger } from "@/components/admin/StatusChanger";
import { PaymentStatusChanger } from "@/components/admin/PaymentStatusChanger";
import { OrderSizeList } from "@/components/admin/OrderSizeList";
import { describePersonStyle, describePersonal, fieldLabel, fieldsEnOrden, parsePersonExtra, valoresDePersona } from "@/lib/group-names";
import { SizeList, exampleEntryId, listPersonal, loadGroupDesign } from "@/lib/size-lists";
import { groupDesignPreview } from "@/lib/group-design";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { ShippingCard } from "@/components/admin/ShippingCard";
import { PrintButton } from "@/components/admin/PrintButton";
import { ArchiveButton } from "@/components/admin/ArchiveButton";
import { OrderDesigns } from "@/components/admin/OrderDesigns";
import { StatusBadge } from "@/components/StatusBadge";
import { Invoice } from "@/components/Invoice";
import { buildInvoiceLines, techniquesText } from "@/lib/pricing";
import { formatBoth, formatCordobas, formatInDollars } from "@/lib/currency";
import { estimateReadyDate, formatReadyDate, formatShortDate, isPastDue, toManagua } from "@/lib/delivery";
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
  const [disenosConUrl, comprobanteSigned, previousReceipts, groupList] = await Promise.all([
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
    // Comprobantes rechazados que el cliente reemplazó desde la página de su pedido.
    service
      .from("payment_transactions")
      .select("provider_reference, created_at")
      .eq("order_id", id)
      .eq("provider", "comprobante")
      .order("created_at", { ascending: false })
      .then(async ({ data }) =>
        Promise.all(
          (data ?? []).map(async (t) => {
            const { data: signed } = await service.storage
              .from("comprobantes")
              .createSignedUrl(t.provider_reference ?? "", 60 * 30);
            return { url: signed?.signedUrl ?? null, replacedAt: new Date(t.created_at) };
          })
        )
      ),
    // Lista de tallas del grupo con la que se armó el pedido (null si no hay o falta listas.sql).
    service
      .from("listas_tallas")
      .select("*")
      .eq("order_id", id)
      .maybeSingle()
      .then(async ({ data: list }) => {
        if (!list) return null;
        const { data: people } = await service.from("listas_tallas_personas").select("*").eq("lista_id", list.id);
        // Lo que pone cada quien (dónde, con qué letra y color) y la camisa de ejemplo,
        // para que el taller vea cómo va cada una.
        const personal = listPersonal(list as SizeList);
        const product = getProductById(list.product_id as string);
        const ejemploId = exampleEntryId(list as SizeList);
        const design = await loadGroupDesign(list as SizeList);
        return {
          nombre: list.nombre as string,
          organizador: list.organizador as string | null,
          estilo: personal ? describePersonal(personal) : null,
          // Una columna por cada texto de cada quien, con el lugar donde va ("Manga izquierda").
          columns: personal ? fieldsEnOrden(personal).map((f) => ({ id: f.id, label: fieldLabel(personal, f) })) : [],
          personal,
          category: product?.category ?? null,
          colorHex: product?.variants.find((v) => v.color === list.color)?.colorHex ?? "#FFFFFF",
          designs: groupDesignPreview(design),
          entries: (people ?? []).map((p) => {
            const extra = parsePersonExtra(p.estilo);
            return {
              nombre: (p.nombre as string) + (p.id === ejemploId ? " (organiza)" : ""),
              talla: p.talla as string,
              cantidad: p.cantidad as number,
              propio: describePersonStyle(extra) || null,
              valores: valoresDePersona(personal, { texto: p.texto, numero: p.numero, estilo: extra }),
              estilo: extra,
            };
          }),
        };
      }),
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
    technique: ((i.tecnica as Technique | null) ?? technique) as Technique,
    fabric: (i.tela as string | null) ?? null,
    color: i.color as string,
    size: i.talla as string,
    quantity: i.cantidad as number,
  }));
  const piecesToMake = [...orderItems].sort(
    (a, b) =>
      a.productId.localeCompare(b.productId) ||
      a.technique.localeCompare(b.technique) ||
      (a.fabric ?? "").localeCompare(b.fabric ?? "") ||
      a.color.localeCompare(b.color) ||
      SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  );
  const totalPieces = orderItems.reduce((sum, i) => sum + i.quantity, 0);
  const hasFabrics = orderItems.some((i) => i.fabric);


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
                {techniquesText(orderItems, technique)} · {totalPieces} pieza{totalPieces === 1 ? "" : "s"}
              </p>
            </div>

            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs text-ink-muted">
                  <th className="pb-2 font-medium">Producto</th>
                  <th className="pb-2 font-medium">Técnica</th>
                  {hasFabrics && <th className="pb-2 font-medium">Tela</th>}
                  <th className="pb-2 font-medium">Color</th>
                  <th className="pb-2 font-medium">Talla</th>
                  <th className="pb-2 text-right font-medium">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {piecesToMake.map((p, i) => (
                  <tr key={i} className="border-b border-black/5">
                    <td className="py-2 text-ink">{getProductById(p.productId)?.name ?? p.productId}</td>
                    <td className="py-2 font-semibold text-ink">{TECHNIQUE_LABEL[p.technique] ?? p.technique}</td>
                    {hasFabrics && (
                      <td className="py-2 font-semibold text-ink">{getFabric(p.productId, p.fabric)?.name ?? "—"}</td>
                    )}
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
                shipping: entrega?.envio?.costo ?? 0,
                shippingKm: entrega?.envio?.km,
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

          {groupList && (
            <OrderSizeList
              nombre={groupList.nombre}
              organizador={groupList.organizador}
              entries={groupList.entries}
              nombresEstilo={groupList.estilo}
              columns={groupList.columns}
              shirt={
                groupList.category && (groupList.personal || Object.keys(groupList.designs).length > 0)
                  ? {
                      category: groupList.category,
                      colorHex: groupList.colorHex,
                      designs: groupList.designs,
                      personal: groupList.personal,
                    }
                  : null
              }
            />
          )}
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
            {previousReceipts.length > 0 && (
              <p className="mt-3 rounded-brand bg-paper-soft px-3 py-2 text-xs font-semibold text-ink">
                Comprobante reenviado por el cliente el {formatShortDate(toManagua(previousReceipts[0].replacedAt))}, después
                de que el pago fue rechazado.
              </p>
            )}
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
            {previousReceipts.length > 0 && (
              <p className="mt-2 text-xs text-ink-soft">
                {previousReceipts.length === 1 ? "Comprobante anterior (rechazado):" : "Comprobantes anteriores (rechazados):"}{" "}
                {previousReceipts.map((r, i) =>
                  r.url ? (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="mr-2 font-semibold text-ink underline">
                      Ver {previousReceipts.length > 1 ? previousReceipts.length - i : ""}
                    </a>
                  ) : null
                )}
              </p>
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

