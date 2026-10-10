import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPage } from "@/lib/admin-auth";
import { StatusBadge } from "@/components/StatusBadge";
import { estimateReadyDate, formatShortDate, managuaDayKey, toManagua } from "@/lib/delivery";
import { getProductById } from "@/lib/catalog";
import { parseShipping } from "@/lib/shipping";
import { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Calendario de producción: qué pedidos tienen que estar listos cada día, con cuántas
// piezas. La fecha es la misma que se le promete al cliente (7 días hábiles desde que pidió).

interface OrderRow {
  id: string;
  cliente_nombre: string;
  status: OrderStatus;
  payment_status: string;
  created_at: string;
  entrega?: unknown;
  archivado_at?: string | null;
  descartado?: boolean | null;
}

interface CalendarOrder {
  id: string;
  name: string;
  status: OrderStatus;
  pending: boolean; // pago por verificar: todavía no se debería producir
  done: boolean;
  pieces: number;
  products: string[];
  delivery: "domicilio" | "retiro" | null;
  due: string; // día en Managua, "2026-10-14"
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_SHOWN = 10; // dos semanas de lunes a viernes

// Lunes de la semana de `d` (fecha con la hora de Managua en sus campos UTC).
function mondayOf(d: Date): Date {
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  m.setUTCDate(m.getUTCDate() - ((m.getUTCDay() + 6) % 7));
  return m;
}

export default async function AdminCalendarioPage({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  await requireAdminPage();
  const { semana } = await searchParams;
  const offset = Math.max(-8, Math.min(8, Number.parseInt(semana ?? "0", 10) || 0));

  const supabase = await createClient();
  const [{ data, error }, { data: itemRows }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: true }),
    supabase.from("order_items").select("order_id, product_id, cantidad"),
  ]);

  const itemsByOrder = new Map<string, { pieces: number; products: Set<string> }>();
  for (const it of itemRows ?? []) {
    const entry = itemsByOrder.get(it.order_id) ?? { pieces: 0, products: new Set<string>() };
    entry.pieces += it.cantidad;
    entry.products.add(getProductById(it.product_id)?.name ?? it.product_id);
    itemsByOrder.set(it.order_id, entry);
  }

  // Solo lo que hay que producir: pagados o con pago por verificar, sin archivar ni descartar.
  const orders: CalendarOrder[] = ((data ?? []) as OrderRow[])
    .filter((o) => !o.archivado_at && !o.descartado && (o.payment_status === "pagado" || o.payment_status === "en_revision"))
    .map((o) => {
      const items = itemsByOrder.get(o.id);
      return {
        id: o.id,
        name: o.cliente_nombre,
        status: o.status,
        pending: o.payment_status !== "pagado",
        done: o.status === "listo_entregado",
        pieces: items?.pieces ?? 0,
        products: [...(items?.products ?? [])],
        delivery: parseShipping(o.entrega)?.metodo ?? null,
        due: managuaDayKey(estimateReadyDate(new Date(o.created_at))),
      };
    });

  const todayDate = toManagua(new Date());
  const today = managuaDayKey(todayDate);
  const start = new Date(mondayOf(todayDate).getTime() + offset * 7 * DAY_MS);
  const days: Date[] = [];
  for (let d = new Date(start); days.length < DAYS_SHOWN; d = new Date(d.getTime() + DAY_MS)) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.push(d);
  }
  const late = orders.filter((o) => !o.done && o.due < today);
  const byDay = (key: string) => orders.filter((o) => o.due === key);
  const piecesThisRange = days.reduce((sum, d) => sum + byDay(managuaDayKey(d)).reduce((s, o) => s + o.pieces, 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Calendario de producción</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft">
            Qué pedidos tienen que estar listos cada día y cuántas piezas son. La fecha es la que se le prometió al
            cliente: 7 días hábiles desde que hizo el pedido.
          </p>
        </div>
        <nav className="flex items-center gap-1.5 text-sm">
          <Link href={`/admin/calendario?semana=${offset - 1}`} className="rounded-brand border border-black/15 bg-white px-3 py-1.5 hover:border-ink">
            ← Antes
          </Link>
          <Link href="/admin/calendario" className="rounded-brand border border-black/15 bg-white px-3 py-1.5 font-semibold hover:border-ink">
            Hoy
          </Link>
          <Link href={`/admin/calendario?semana=${offset + 1}`} className="rounded-brand border border-black/15 bg-white px-3 py-1.5 hover:border-ink">
            Después →
          </Link>
        </nav>
      </div>

      {error && (
        <p className="mt-6 rounded-brand bg-red-50 p-4 text-sm text-red-700">No se pudieron leer los pedidos. Intenta de nuevo.</p>
      )}

      <p className="mt-4 text-sm text-ink-soft">
        En estas dos semanas: <span className="font-semibold text-ink">{piecesThisRange} piezas</span> por entregar.
      </p>

      {late.length > 0 && (
        <section className="mt-6 rounded-brand border-2 border-red-300 bg-red-50 p-4">
          <h2 className="text-sm font-bold text-red-800">
            Atrasados: {late.length} {late.length === 1 ? "pedido" : "pedidos"}, {late.reduce((s, o) => s + o.pieces, 0)} piezas
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {late.map((o) => (
              <OrderCard key={o.id} order={o} showDue />
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {days.map((d) => {
          const key = managuaDayKey(d);
          const list = byDay(key);
          const pieces = list.reduce((s, o) => s + o.pieces, 0);
          const isToday = key === today;
          return (
            <section
              key={key}
              className={`min-h-28 rounded-brand border bg-white p-3 ${isToday ? "border-2 border-ink" : "border-black/10"} ${key < today ? "opacity-60" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-bold capitalize text-ink">
                  {formatShortDate(d)}
                  {isToday && <span className="ml-1 text-[11px] font-semibold text-ink-muted">(hoy)</span>}
                </h2>
                {pieces > 0 && <span className="text-xs font-semibold text-ink-soft">{pieces} pzs</span>}
              </div>
              <div className="mt-2 space-y-2">
                {list.length === 0 ? (
                  <p className="text-xs text-ink-muted">Nada para este día.</p>
                ) : (
                  list.map((o) => <OrderCard key={o.id} order={o} />)
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Los pedidos con «Pago por verificar» salen en gris: todavía no conviene producirlos. Los ya entregados salen
        tachados.
      </p>
    </div>
  );
}

function OrderCard({ order, showDue = false }: { order: CalendarOrder; showDue?: boolean }) {
  return (
    <Link
      href={`/admin/pedidos/${order.id}`}
      className={`block rounded-brand border border-black/10 bg-paper-soft p-2.5 text-xs transition-colors hover:border-ink ${
        order.pending ? "opacity-60" : ""
      }`}
    >
      <p className={`font-semibold text-ink ${order.done ? "line-through" : ""}`}>
        #{order.id.slice(0, 6)} · {order.name}
      </p>
      <p className="mt-0.5 text-ink-soft">
        {order.pieces} {order.pieces === 1 ? "pieza" : "piezas"}
        {order.products.length > 0 && ` · ${order.products.join(", ")}`}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={order.status} />
        {order.pending && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">Pago por verificar</span>}
        {order.delivery === "domicilio" && <span className="text-[10px] font-semibold text-ink-soft">A domicilio</span>}
        {order.delivery === "retiro" && <span className="text-[10px] font-semibold text-ink-soft">Retira en taller</span>}
        {showDue && <span className="text-[10px] font-semibold text-red-700">Era para el {formatShortDate(new Date(`${order.due}T12:00:00Z`))}</span>}
      </div>
    </Link>
  );
}
