// En el pedido del panel: la lista de tallas del grupo con la que se armó, ordenada
// por talla, para empacar y entregar cada camisa a su dueño. También sale al imprimir.
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export interface OrderSizeListEntry {
  nombre: string;
  talla: string;
  cantidad: number;
}

export function OrderSizeList({
  nombre,
  organizador,
  entries,
}: {
  nombre: string;
  organizador: string | null;
  entries: OrderSizeListEntry[];
}) {
  const rank = (t: string) => (SIZE_ORDER.indexOf(t) + 1 || 99);
  const sorted = [...entries].sort((a, b) => rank(a.talla) - rank(b.talla) || a.nombre.localeCompare(b.nombre, "es"));
  const counts = new Map<string, number>();
  for (const e of sorted) counts.set(e.talla, (counts.get(e.talla) ?? 0) + e.cantidad);
  const total = sorted.reduce((sum, e) => sum + e.cantidad, 0);

  return (
    <section className="rounded-brand border border-black/10 bg-white p-5 print:break-inside-avoid print:border-black">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-ink">Lista del grupo · {nombre}</h2>
        <p className="text-xs text-ink-soft">
          {sorted.length} persona{sorted.length === 1 ? "" : "s"} · {total} pieza{total === 1 ? "" : "s"}
          {organizador ? ` · organiza ${organizador}` : ""}
        </p>
      </div>
      <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
        {[...counts].map(([talla, n]) => (
          <span key={talla} className="rounded-full bg-paper-soft px-2.5 py-1 font-semibold text-ink">
            {talla}: {n}
          </span>
        ))}
      </p>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-muted">
            <th className="pb-2 font-medium">Nombre</th>
            <th className="pb-2 font-medium">Talla</th>
            <th className="pb-2 text-right font-medium">Piezas</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e, i) => (
            <tr key={`${e.nombre}-${i}`} className="border-t border-black/5">
              <td className="py-1.5 text-ink">{e.nombre}</td>
              <td className="py-1.5 font-semibold text-ink">{e.talla}</td>
              <td className="py-1.5 text-right text-ink">{e.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
