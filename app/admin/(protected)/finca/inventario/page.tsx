import { formatCordobas } from "@/lib/currency";
import { INVENTARIO_LABEL, fincaSelect, normItem, type Item } from "@/lib/finca";
import { ItemForm, ItemMovForm, BorrarButton } from "@/components/admin/FincaForms";
import { FincaMissing } from "@/components/admin/FincaMissing";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const { rows, missing } = await fincaSelect<Item>("finca_inventario", { order: "nombre", asc: true });
  const items = rows.map(normItem);
  const valor = items.reduce((s, i) => s + i.cantidad * i.costo_unit, 0);

  return (
    <div>
      {missing && <FincaMissing />}
      <ItemForm />

      <div className="mb-3 mt-8 flex items-baseline justify-between gap-3">
        <p className="font-bold text-ink">Lo que hay en la finca</p>
        <p className="text-sm text-ink-soft">
          Valor del inventario: <b className="text-ink">{formatCordobas(Math.round(valor * 100) / 100)}</b>
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-brand border border-dashed border-black/15 bg-white p-8 text-center text-sm text-ink-soft">
          Todavía no hay nada en el inventario. Agrega semillas, abono, herramientas o cosecha guardada.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-brand border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-soft">
              <tr>
                <th className="px-4 py-2">Artículo</th>
                <th className="px-4 py-2 text-right">Hay</th>
                <th className="px-4 py-2 text-right">Valor</th>
                <th className="px-4 py-2">Movimiento</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {items.map((i) => {
                const bajo = i.minimo > 0 && i.cantidad <= i.minimo;
                return (
                  <tr key={i.id} className={bajo ? "bg-amber-50" : ""}>
                    <td className="px-4 py-2">
                      <span className="font-medium text-ink">{i.nombre}</span>
                      <span className="block text-xs text-ink-soft">{INVENTARIO_LABEL[i.categoria]}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <b className={bajo ? "text-amber-800" : "text-ink"}>{i.cantidad}</b> {i.unidad}
                      {bajo && <span className="block text-[11px] font-semibold text-amber-800">¡Bajo!</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-ink-soft">
                      {formatCordobas(Math.round(i.cantidad * i.costo_unit * 100) / 100)}
                    </td>
                    <td className="px-4 py-2">
                      <ItemMovForm item={{ id: i.id, unidad: i.unidad }} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <BorrarButton tabla="inventario" id={i.id} aviso="Se borra con su historial." />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-soft">
        «Entró / compré» con costo anota la compra como gasto. «Se dañó / perdió» anota la pérdida valorada al costo del artículo.
        «Usé / saqué» solo baja la cantidad.
      </p>
    </div>
  );
}
