import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCordobas } from "@/lib/currency";
import { DesignZone } from "@/lib/types";

export const dynamic = "force-dynamic";

interface StoredDiseno {
  zona: DesignZone;
  tipo: "imagen" | "texto";
  path?: string;
  texto?: string;
  color?: string;
}

export default async function AdminPedidosPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, cliente_nombre, cliente_telefono, tecnica, total, status, payment_status, created_at, disenos"
    )
    .order("created_at", { ascending: false });

  // Miniatura del diseño de "frente" para reconocer el pedido de un vistazo,
  // sin tener que entrar al detalle. Los buckets son privados, así que cada
  // imagen necesita su propia URL firmada.
  const service = createServiceClient();
  const thumbnails = await Promise.all(
    (orders ?? []).map(async (order) => {
      const disenos: StoredDiseno[] = Array.isArray(order.disenos) ? order.disenos : [];
      const frente = disenos.find((d) => d.zona === "frente") ?? disenos[0];
      if (!frente) return null;
      if (frente.tipo === "texto") return { kind: "texto" as const, texto: frente.texto, color: frente.color };
      if (frente.tipo === "imagen" && frente.path) {
        const { data } = await service.storage.from("disenos").createSignedUrl(frente.path, 60 * 10);
        return data?.signedUrl ? { kind: "imagen" as const, url: data.signedUrl } : null;
      }
      return null;
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Pedidos</h1>

      {error && (
        <p className="mt-4 rounded-brand bg-red-50 p-4 text-sm text-red-700">
          Error cargando pedidos: {error.message}
        </p>
      )}

      {!error && orders?.length === 0 && (
        <p className="mt-6 text-ink-soft">Todavía no hay pedidos.</p>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-brand border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Diseño</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Técnica</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const thumb = thumbnails[i];
                return (
                <tr key={order.id} className="border-b border-black/5 last:border-0 hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${order.id}`}>
                      {thumb?.kind === "imagen" ? (
                        <img
                          src={thumb.url}
                          alt="Diseño"
                          className="h-12 w-12 rounded border border-black/10 object-cover"
                        />
                      ) : thumb?.kind === "texto" ? (
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded border border-black/10 bg-paper p-1 text-center text-[10px] font-bold leading-tight"
                          style={{ color: thumb.color || "#111111" }}
                        >
                          {thumb.texto}
                        </span>
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-black/10 text-[10px] text-ink-soft">
                          —
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${order.id}`} className="font-medium text-ink hover:underline">
                      {order.cliente_nombre}
                    </Link>
                    <p className="text-xs text-ink-soft">{order.cliente_telefono}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{order.tecnica}</td>
                  <td className="px-4 py-3 font-medium">{formatCordobas(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={order.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {new Date(order.created_at).toLocaleDateString("es-NI")}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pendiente: "bg-black/5 text-ink-soft",
    en_revision: "bg-black/10 text-ink",
    pagado: "bg-green-100 text-green-700",
    fallido: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    en_revision: "En revisión",
    pagado: "Pagado",
    fallido: "Fallido",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}
