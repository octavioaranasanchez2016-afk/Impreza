import Link from "next/link";
import { formatCordobas } from "@/lib/currency";
import {
  calcularResumen,
  fincaSelect,
  isMes,
  mesActual,
  mesMover,
  mesNombre,
  mesRango,
  normCultivo,
  normItem,
  normMov,
  normPago,
  type Cultivo,
  type Item,
  type Movimiento,
  type Pago,
} from "@/lib/finca";
import { FincaMissing } from "@/components/admin/FincaMissing";

export const dynamic = "force-dynamic";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "neutral" }) {
  const color = tone === "good" ? "text-green-700" : tone === "bad" ? "text-red-700" : "text-ink";
  return (
    <div className="rounded-brand border border-black/10 bg-white p-4">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Lista({ titulo, filas }: { titulo: string; filas: { k: string; v: number }[] }) {
  return (
    <div className="rounded-brand border border-black/10 bg-white p-4">
      <p className="font-semibold text-ink">{titulo}</p>
      {filas.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">Nada este mes.</p>
      ) : (
        <ul className="mt-2 divide-y divide-black/5 text-sm">
          {filas.map((f) => (
            <li key={f.k} className="flex justify-between gap-3 py-1.5">
              <span className="text-ink-soft">{f.k}</span>
              <span className="font-semibold text-ink">{formatCordobas(f.v)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function FincaResumenPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes: mesParam } = await searchParams;
  const mes = isMes(mesParam) ? mesParam : mesActual();
  const { desde, hasta } = mesRango(mes);

  const [movs, pagos, cultivos, inventario] = await Promise.all([
    fincaSelect<Movimiento>("finca_movimientos", { desde, hasta }),
    fincaSelect<Pago>("finca_pagos", { desde, hasta }),
    fincaSelect<Cultivo>("finca_cultivos"),
    fincaSelect<Item>("finca_inventario", { order: "nombre", asc: true }),
  ]);
  const missing = movs.missing || pagos.missing || cultivos.missing || inventario.missing;

  const r = calcularResumen(movs.rows.map(normMov), pagos.rows.map(normPago), cultivos.rows.map(normCultivo));
  const bajos = inventario.rows.map(normItem).filter((i) => i.minimo > 0 && i.cantidad <= i.minimo);
  const resultadoTone = r.resultado > 0 ? "good" : r.resultado < 0 ? "bad" : "neutral";

  return (
    <div>
      {missing && <FincaMissing />}

      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href={`/admin/finca?mes=${mesMover(mes, -1)}`} className="rounded-brand border border-black/15 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-paper-soft">
          ← Anterior
        </Link>
        <p className="text-lg font-bold text-ink">{mesNombre(mes)}</p>
        <Link href={`/admin/finca?mes=${mesMover(mes, 1)}`} className="rounded-brand border border-black/15 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-paper-soft">
          Siguiente →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ingresos" value={formatCordobas(r.ingresos)} tone="good" />
        <Stat label="Gastos (con mano de obra)" value={formatCordobas(r.gastos)} />
        <Stat label="Pérdidas" value={formatCordobas(r.perdidas)} tone={r.perdidas > 0 ? "bad" : "neutral"} />
        <Stat label={r.resultado >= 0 ? "Ganancia del mes" : "Pérdida del mes"} value={formatCordobas(r.resultado)} tone={resultadoTone} />
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        Ganancia = ingresos − gastos − pérdidas. Los pagos a trabajadores cuentan como gasto de «Mano de obra».
      </p>

      {bajos.length > 0 && (
        <div className="mt-5 rounded-brand border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Inventario bajo</p>
          <ul className="mt-1 list-disc pl-5">
            {bajos.map((i) => (
              <li key={i.id}>
                {i.nombre}: quedan {i.cantidad} {i.unidad} (mínimo {i.minimo})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Lista titulo="Gastos por categoría" filas={r.gastosPorCategoria.map((g) => ({ k: g.categoria, v: g.monto }))} />
        <Lista titulo="Pérdidas por causa" filas={r.perdidasPorCategoria.map((g) => ({ k: g.categoria, v: g.monto }))} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-brand border border-black/10 bg-white">
        <p className="p-4 pb-2 font-semibold text-ink">Por cultivo</p>
        {r.porCultivo.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-ink-soft">Todavía no hay movimientos este mes.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-soft">
              <tr>
                <th className="px-4 py-2">Cultivo</th>
                <th className="px-4 py-2 text-right">Ingresos</th>
                <th className="px-4 py-2 text-right">Gastos</th>
                <th className="px-4 py-2 text-right">Pérdidas</th>
                <th className="px-4 py-2 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {r.porCultivo.map((c) => (
                <tr key={c.id ?? "general"}>
                  <td className="px-4 py-2 font-medium text-ink">{c.nombre}</td>
                  <td className="px-4 py-2 text-right">{formatCordobas(c.ingresos)}</td>
                  <td className="px-4 py-2 text-right">{formatCordobas(c.gastos)}</td>
                  <td className="px-4 py-2 text-right">{formatCordobas(c.perdidas)}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${c.resultado < 0 ? "text-red-700" : "text-green-700"}`}>
                    {formatCordobas(c.resultado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
