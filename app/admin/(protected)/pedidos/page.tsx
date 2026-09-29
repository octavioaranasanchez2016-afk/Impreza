import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentBadge } from "@/components/admin/PaymentBadge";
import { formatCordobas, formatInDollars } from "@/lib/currency";
import { estimateReadyDate, formatShortDate, isPastDue, managuaDayKey, toManagua } from "@/lib/delivery";
import { getProductById } from "@/lib/catalog";
import { DesignZone, OrderStatus } from "@/lib/types";
import { isDarkColor } from "@/components/GarmentShape";
import { parseShipping, shippingSummary } from "@/lib/shipping";
import { parseBilling } from "@/lib/billing";
import { ArchiveButton } from "@/components/admin/ArchiveButton";
import { TestEmailButton } from "@/components/admin/TestEmailButton";

export const dynamic = "force-dynamic";

interface StoredDiseno {
  zona: DesignZone;
  tipo: "imagen" | "texto";
  path?: string;
  texto?: string;
  color?: string;
}

interface OrderRow {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  total: number;
  status: OrderStatus;
  payment_status: string;
  created_at: string;
  disenos: StoredDiseno[] | null;
  entrega?: unknown; // columna nueva: no llega hasta correr supabase/entrega.sql
  archivado_at?: string | null; // columna nueva: supabase/archivo.sql
  factura?: unknown; // columna nueva: supabase/factura-ruc.sql
  descartado?: boolean | null; // columna nueva: supabase/descartados.sql
}

type FilterKey =
  | "todos"
  | "verificar"
  | "proceso"
  | "atrasados"
  | "domicilio"
  | "entregados"
  | "rechazados"
  | "archivados"
  | "descartados";

const isActive = (o: OrderRow) => o.payment_status === "pagado" && o.status !== "listo_entregado";
const isLate = (o: OrderRow) => isActive(o) && isPastDue(estimateReadyDate(new Date(o.created_at)));

const FILTERS: { key: FilterKey; label: string; match: (o: OrderRow) => boolean }[] = [
  { key: "todos", label: "Activos", match: () => true },
  { key: "verificar", label: "Pago por verificar", match: (o) => o.payment_status === "en_revision" },
  { key: "proceso", label: "En proceso", match: isActive },
  { key: "atrasados", label: "Atrasados", match: isLate },
  { key: "domicilio", label: "A domicilio", match: (o) => parseShipping(o.entrega)?.metodo === "domicilio" },
  { key: "entregados", label: "Listos / entregados", match: (o) => o.status === "listo_entregado" },
  { key: "rechazados", label: "Pago rechazado", match: (o) => o.payment_status === "fallido" },
  // Archivados y descartados no salen en ningún otro filtro.
  { key: "archivados", label: "Archivados", match: () => true },
  { key: "descartados", label: "Descartados", match: () => true },
];

// Sin tildes ni mayúsculas, para que "maria" encuentre a "María".
function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; q?: string }>;
}) {
  const { f, q } = await searchParams;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];
  const query = (q ?? "").trim();

  const supabase = await createClient();
  const [{ data, error }, { data: itemRows }] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("order_items").select("order_id, product_id, cantidad"),
  ]);
  const orders = (data ?? []) as OrderRow[];

  const itemsByOrder = new Map<string, { pieces: number; products: Set<string> }>();
  for (const it of itemRows ?? []) {
    const entry = itemsByOrder.get(it.order_id) ?? { pieces: 0, products: new Set<string>() };
    entry.pieces += it.cantidad;
    entry.products.add(getProductById(it.product_id)?.name ?? it.product_id);
    itemsByOrder.set(it.order_id, entry);
  }

  // Facturación: pedidos pagados, sin contar los descartados (pruebas, falsos, cancelados).
  // Los archivados sí cuentan: son pedidos que se entregaron.
  const thisMonth = managuaDayKey(toManagua(new Date())).slice(0, 7);
  const paid = orders.filter((o) => o.payment_status === "pagado" && !o.descartado);
  const monthSales = paid
    .filter((o) => managuaDayKey(toManagua(new Date(o.created_at))).startsWith(thisMonth))
    .reduce((sum, o) => sum + Number(o.total), 0);
  const totalSales = paid.reduce((sum, o) => sum + Number(o.total), 0);

  const discarded = orders.filter((o) => o.descartado);
  const archived = orders.filter((o) => o.archivado_at && !o.descartado);
  const active = orders.filter((o) => !o.archivado_at && !o.descartado);
  const listFor = (key: FilterKey) => (key === "archivados" ? archived : key === "descartados" ? discarded : active);
  const inFilter = (key: FilterKey) => listFor(key).filter(FILTERS.find((x) => x.key === key)!.match);
  const counts = Object.fromEntries(FILTERS.map((x) => [x.key, inFilter(x.key).length])) as Record<FilterKey, number>;
  const completedIds = active.filter((o) => o.status === "listo_entregado").map((o) => o.id);

  const needle = normalize(query.replace(/^#/, ""));
  const needleDigits = query.replace(/\D/g, "");
  const visible = inFilter(filter.key).filter((o) => {
    if (!needle) return true;
    return (
      normalize(o.cliente_nombre).includes(needle) ||
      o.id.toLowerCase().startsWith(needle) ||
      (needleDigits.length >= 3 && o.cliente_telefono.replace(/\D/g, "").includes(needleDigits))
    );
  });

  // Miniatura del diseño del frente. Los buckets son privados: URL firmada por imagen.
  const service = createServiceClient();
  const thumbnails = await Promise.all(
    visible.map(async (order) => {
      const disenos = Array.isArray(order.disenos) ? order.disenos : [];
      const frente = disenos.find((d) => d.zona === "frente") ?? disenos[0];
      if (!frente) return null;
      if (frente.tipo === "texto") return { kind: "texto" as const, texto: frente.texto, color: frente.color };
      if (frente.path) {
        const { data: signed } = await service.storage.from("disenos").createSignedUrl(frente.path, 60 * 10);
        return signed?.signedUrl ? { kind: "imagen" as const, url: signed.signedUrl } : null;
      }
      return null;
    })
  );

  const hrefFor = (key: FilterKey) => {
    const params = new URLSearchParams();
    if (key !== "todos") params.set("f", key);
    if (query) params.set("q", query);
    const s = params.toString();
    return `/admin/pedidos${s ? `?${s}` : ""}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">Pedidos</h1>
        <TestEmailButton />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          href={hrefFor("verificar")}
          label="Pagos por verificar"
          value={String(counts.verificar)}
          tone={counts.verificar > 0 ? "attention" : "plain"}
        />
        <SummaryCard href={hrefFor("proceso")} label="En proceso" value={String(counts.proceso)} tone="plain" />
        <SummaryCard
          href={hrefFor("atrasados")}
          label="Atrasados"
          value={String(counts.atrasados)}
          tone={counts.atrasados > 0 ? "danger" : "plain"}
        />
        <SummaryCard
          label="Ventas pagadas del mes"
          value={formatCordobas(monthSales)}
          sub={`${formatInDollars(monthSales)} · Total: ${formatCordobas(totalSales)}`}
          tone="plain"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Filtrar pedidos">
          {FILTERS.map((x) => (
            <Link
              key={x.key}
              href={hrefFor(x.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                filter.key === x.key ? "border-ink bg-ink text-paper" : "border-black/15 bg-white text-ink hover:border-ink"
              }`}
            >
              {x.label} <span className={filter.key === x.key ? "text-paper/60" : "text-ink-muted"}>{counts[x.key]}</span>
            </Link>
          ))}
        </nav>
        <form action="/admin/pedidos" className="flex gap-2">
          {filter.key !== "todos" && <input type="hidden" name="f" value={filter.key} />}
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar nombre, teléfono o #pedido"
            className="input w-full lg:w-72"
          />
          <button type="submit" className="rounded-brand bg-ink px-4 text-sm font-semibold text-paper hover:opacity-80">
            Buscar
          </button>
        </form>
      </div>

      {(filter.key === "todos" || filter.key === "entregados") && completedIds.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-brand border border-black/10 bg-white px-4 py-3">
          <p className="text-sm text-ink-soft">
            {completedIds.length === 1 ? "1 pedido ya está listo o entregado" : `${completedIds.length} pedidos ya están listos o entregados`}. Archívalos para
            limpiar la lista; los encuentras en «Archivados».
          </p>
          <ArchiveButton
            ids={completedIds}
            accion="archivar"
            label={completedIds.length === 1 ? "Archivar" : `Archivar los ${completedIds.length}`}
          />
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-brand bg-red-50 p-4 text-sm text-red-700">Error cargando pedidos: {error.message}</p>
      )}

      {!error && visible.length === 0 && (
        <p className="mt-8 rounded-brand border border-dashed border-black/15 bg-white p-8 text-center text-sm text-ink-soft">
          {orders.length === 0
            ? "Todavía no hay pedidos."
            : filter.key === "archivados"
            ? "No hay pedidos archivados. Archiva los pedidos listos o entregados para sacarlos de la lista."
            : filter.key === "descartados"
            ? "No hay pedidos descartados. Descarta desde cada pedido los que sean de prueba, falsos o cancelados."
            : "No hay pedidos con este filtro."}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {visible.map((order, i) => {
          const thumb = thumbnails[i];
          const items = itemsByOrder.get(order.id);
          const ready = estimateReadyDate(new Date(order.created_at));
          const late = isLate(order);
          const done = order.status === "listo_entregado";
          return (
            <li key={order.id}>
              <Link
                href={`/admin/pedidos/${order.id}`}
                className={`grid grid-cols-[48px_1fr_auto] items-center gap-x-4 gap-y-2 rounded-brand border bg-white p-3 transition-colors hover:border-ink md:grid-cols-[48px_1.4fr_1fr_auto_auto] ${
                  late ? "border-red-300" : "border-black/10"
                }`}
              >
                <Thumb thumb={thumb} />

                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{order.cliente_nombre}</p>
                  <p className="truncate text-xs text-ink-soft">
                    #{order.id.slice(0, 8).toUpperCase()} · {order.cliente_telefono}
                  </p>
                  <p className="truncate text-xs text-ink-muted">
                    {items ? `${items.pieces} pieza${items.pieces === 1 ? "" : "s"} · ${[...items.products].join(", ")}` : "—"}
                  </p>
                  <p className="truncate text-xs font-medium text-ink-soft">
                    {shippingSummary(parseShipping(order.entrega))}
                    {parseBilling(order.factura) && " · Factura con RUC"}
                  </p>
                </div>

                <div className="text-right md:text-left">
                  <p className="font-semibold text-ink">{formatCordobas(Number(order.total))}</p>
                  <p className="text-xs text-ink-muted">{formatInDollars(Number(order.total))}</p>
                </div>

                <div className="col-span-3 flex flex-wrap items-center gap-1.5 md:col-span-1 md:flex-col md:items-start">
                  <PaymentBadge status={order.payment_status} />
                  <StatusBadge status={order.status} />
                </div>

                <div className="col-span-3 text-xs md:col-span-1 md:text-right">
                  <p className="text-ink-muted">Pedido {formatShortDate(toManagua(new Date(order.created_at)))}</p>
                  {order.archivado_at && (
                    <p className={order.descartado ? "font-semibold text-red-700" : "text-ink-soft"}>
                      {order.descartado ? "Descartado" : "Archivado"} {formatShortDate(toManagua(new Date(order.archivado_at)))}
                    </p>
                  )}
                  {!done && !order.archivado_at && order.payment_status !== "fallido" && (
                    <p className={late ? "font-semibold text-red-700" : "text-ink-soft"}>
                      {late ? "Atrasado · " : "Entrega est. "}
                      {formatShortDate(ready)}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SummaryCard({
  href,
  label,
  value,
  sub,
  tone,
}: {
  href?: string;
  label: string;
  value: string;
  sub?: string;
  tone: "plain" | "attention" | "danger";
}) {
  const toneClass =
    tone === "attention"
      ? "border-ink bg-ink text-paper"
      : tone === "danger"
      ? "border-red-300 bg-red-50 text-red-800"
      : "border-black/10 bg-white text-ink";
  const body = (
    <>
      <p className={`text-xs font-medium ${tone === "attention" ? "text-paper/70" : "opacity-70"}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-70">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className={`rounded-brand border p-4 transition-opacity hover:opacity-90 ${toneClass}`}>
      {body}
    </Link>
  ) : (
    <div className={`rounded-brand border p-4 ${toneClass}`}>{body}</div>
  );
}

function Thumb({ thumb }: { thumb: { kind: "imagen"; url: string } | { kind: "texto"; texto?: string; color?: string } | null }) {
  if (thumb?.kind === "imagen") {
    return <img src={thumb.url} alt="Diseño" className="h-12 w-12 rounded border border-black/10 object-cover" />;
  }
  if (thumb?.kind === "texto") {
    return (
      <span
        className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded border border-black/10 p-1 text-center text-[9px] font-bold leading-tight ${
          isDarkColor(thumb.color || "#111111") ? "bg-paper-soft" : "bg-ink"
        }`}
        style={{ color: thumb.color || "#111111" }}
      >
        {thumb.texto}
      </span>
    );
  }
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-black/10 text-[10px] text-ink-soft">
      —
    </span>
  );
}
