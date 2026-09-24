import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getProductById } from "@/lib/catalog";
import { StatusChanger } from "@/components/admin/StatusChanger";
import { WhatsAppLinkButton } from "@/components/WhatsAppButton";
import { DesignMockup } from "@/components/DesignMockup";
import { ZONE_LABEL } from "@/components/GarmentShape";
import { formatCordobas } from "@/lib/currency";
import { DesignZone } from "@/lib/types";
import { FontFamilyKey, MockupContent } from "@/lib/design";

export const dynamic = "force-dynamic";

interface StoredDiseno {
  zona: DesignZone;
  tipo: "imagen" | "texto";
  path?: string;
  texto?: string;
  color?: string;
  fuente?: FontFamilyKey;
  posX: number;
  posY: number;
  escala: number;
  rotacion?: number;
}

export default async function AdminPedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  const disenos: StoredDiseno[] = Array.isArray(order.disenos) ? order.disenos : [];

  // Los buckets son privados: generamos URLs firmadas de corta duración con
  // la service role, solo visibles para el admin ya autenticado en esta página.
  const service = createServiceClient();
  const disenosConUrl = await Promise.all(
    disenos.map(async (d) => {
      if (d.tipo !== "imagen" || !d.path) return { ...d, signedUrl: null as string | null };
      const { data } = await service.storage.from("disenos").createSignedUrl(d.path, 60 * 10);
      return { ...d, signedUrl: data?.signedUrl ?? null };
    })
  );

  const comprobanteSigned = order.comprobante_url
    ? await service.storage.from("comprobantes").createSignedUrl(order.comprobante_url, 60 * 10)
    : null;

  const whatsappMessage = `Hola ${order.cliente_nombre}, te escribo de Impreza sobre tu pedido #${order.id
    .slice(0, 8)
    .toUpperCase()}.`;

  const firstItem = items?.[0];
  const firstProduct = firstItem ? getProductById(firstItem.product_id) : undefined;
  const firstColorHex = firstProduct?.variants.find((v) => v.color === firstItem?.color)?.colorHex ?? "#111111";

  return (
    <div>
      <Link href="/admin/pedidos" className="text-sm text-ink-soft hover:text-ink">
        ← Volver a pedidos
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="rounded-brand border border-black/10 bg-white p-5">
            <h1 className="text-xl font-bold text-ink">Pedido #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {new Date(order.created_at).toLocaleString("es-NI")}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Cliente" value={order.cliente_nombre} />
              <Info label="Teléfono" value={order.cliente_telefono} />
              <Info label="Correo" value={order.cliente_email ?? "—"} />
              <Info label="Técnica" value={order.tecnica === "serigrafia" ? "Serigrafía" : "Sublimado"} />
            </dl>

            {order.notas && (
              <div className="mt-4 rounded-brand bg-paper p-3 text-sm">
                <span className="font-medium text-ink">Notas: </span>
                {order.notas}
              </div>
            )}
          </div>

          {firstProduct && disenosConUrl.length > 0 && (
            <div className="rounded-brand border border-black/10 bg-white p-5">
              <p className="text-sm font-semibold text-ink">Diseño del cliente</p>
              <div className="mt-3 grid gap-6 sm:grid-cols-2">
                {disenosConUrl.map((d) => {
                  const content: MockupContent | null =
                    d.tipo === "imagen"
                      ? d.signedUrl
                        ? { kind: "imagen", previewUrl: d.signedUrl, width: 0, height: 0 }
                        : null
                      : {
                          kind: "texto",
                          texto: d.texto ?? "",
                          color: d.color ?? "#111111",
                          fontFamily: d.fuente ?? "sans",
                        };

                  return (
                    <div key={d.zona}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                        {ZONE_LABEL[d.zona]}
                      </p>
                      <div className="max-w-[220px]">
                        {content ? (
                          <DesignMockup
                            category={firstProduct.category}
                            zone={d.zona}
                            color={firstColorHex}
                            content={content}
                            transform={{ x: d.posX, y: d.posY, scale: d.escala || 1, rotation: d.rotacion ?? 0 }}
                            interactive={false}
                          />
                        ) : (
                          <p className="text-sm text-ink-soft">No se pudo generar la vista previa.</p>
                        )}
                      </div>
                      {d.tipo === "imagen" && d.signedUrl && (
                        <a
                          href={d.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-ink hover:underline"
                        >
                          Abrir archivo original
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                Referencia sobre {firstProduct.name} — {firstItem?.color}.
              </p>
            </div>
          )}

          <div className="rounded-brand border border-black/10 bg-white p-5">
            <p className="text-sm font-semibold text-ink">Productos</p>
            <ul className="mt-3 divide-y divide-black/5">
              {items?.map((item) => (
                <li key={item.id} className="flex justify-between py-2 text-sm">
                  <span>
                    {item.cantidad}× {getProductById(item.product_id)?.name ?? item.product_id} —{" "}
                    {item.color} — {item.talla}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {comprobanteSigned?.data?.signedUrl && (
            <div className="rounded-brand border border-black/10 bg-white p-5">
              <p className="text-sm font-semibold text-ink">Comprobante de transferencia</p>
              <a
                href={comprobanteSigned.data.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-ink hover:underline"
              >
                Ver comprobante
              </a>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-brand border border-black/10 bg-white p-5">
            <p className="text-sm font-semibold text-ink">Total</p>
            <p className="mt-1 text-2xl font-bold text-ink">{formatCordobas(Number(order.total))}</p>
            <p className="mt-1 text-xs text-ink-soft">
              Subtotal {formatCordobas(Number(order.subtotal))}
              {order.descuento_monto > 0 &&
                ` · Descuento -${formatCordobas(Number(order.descuento_monto))}`}
              {order.cargo_diseno > 0 && ` · Diseño ${formatCordobas(Number(order.cargo_diseno))}`}
            </p>
            <p className="mt-3 text-sm text-ink-soft">Pago: {order.payment_method}</p>
          </div>

          <div className="rounded-brand border border-black/10 bg-white p-5">
            <StatusChanger orderId={order.id} status={order.status} />
          </div>

          <WhatsAppLinkButton
            message={whatsappMessage}
            className="block rounded-brand bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white hover:opacity-90"
          >
            Escribir al cliente
          </WhatsAppLinkButton>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
