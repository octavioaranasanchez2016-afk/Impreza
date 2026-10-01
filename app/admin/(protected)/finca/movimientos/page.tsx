import Link from "next/link";
import { formatCordobas } from "@/lib/currency";
import {
  TIPO_LABEL,
  fechaCorta,
  fincaSelect,
  isMes,
  mesActual,
  mesMover,
  mesNombre,
  mesRango,
  normCultivo,
  normMov,
  type Cultivo,
  type Movimiento,
} from "@/lib/finca";
import { MovimientoForm, BorrarButton } from "@/components/admin/FincaForms";
import { FincaMissing } from "@/components/admin/FincaMissing";

export const dynamic = "force-dynamic";

const TONE = { ingreso: "text-green-700", gasto: "text-ink", perdida: "text-red-700" } as const;

export default async function MovimientosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes: mesParam } = await searchParams;
  const mes = isMes(mesParam) ? mesParam : mesActual();
  const { desde, hasta } = mesRango(mes);

  const [movs, cultivos] = await Promise.all([
    fincaSelect<Movimiento>("finca_movimientos", { desde, hasta, order: "fecha" }),
    fincaSelect<Cultivo>("finca_cultivos", { order: "nombre", asc: true }),
  ]);
  const cultivoRows = cultivos.rows.map(normCultivo);
  const nombreCultivo = (id: string | null) => cultivoRows.find((c) => c.id === id)?.nombre ?? "—";
  const rows = movs.rows.map(normMov);

  return (
    <div>
      {(movs.missing || cultivos.missing) && <FincaMissing />}
      <MovimientoForm cultivos={cultivoRows.filter((c) => c.estado === "activo").map((c) => ({ id: c.id, nombre: c.nombre }))} />

      <div className="mb-3 mt-8 flex items-center justify-between gap-3">
        <Link href={`/admin/finca/movimientos?mes=${mesMover(mes, -1)}`} className="text-sm font-semibold text-ink underline">
          ← Anterior
        </Link>
        <p className="font-bold text-ink">{mesNombre(mes)}</p>
        <Link href={`/admin/finca/movimientos?mes=${mesMover(mes, 1)}`} className="text-sm font-semibold text-ink underline">
          Siguiente →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-brand border border-dashed border-black/15 bg-white p-8 text-center text-sm text-ink-soft">
          Sin movimientos este mes.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-brand border border-black/10 bg-white">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-soft">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Categoría y detalle</th>
                <th className="px-4 py-2">Cultivo</th>
                <th className="px-4 py-2 text-right">Monto</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-ink-soft">{fechaCorta(m.fecha)}</td>
                  <td className={`px-4 py-2 font-semibold ${TONE[m.tipo]}`}>{TIPO_LABEL[m.tipo]}</td>
                  <td className="px-4 py-2">
                    <span className="font-medium text-ink">{m.categoria}</span>
                    {m.descripcion && <span className="block text-xs text-ink-soft">{m.descripcion}</span>}
                  </td>
                  <td className="px-4 py-2 text-ink-soft">{nombreCultivo(m.cultivo_id)}</td>
                  <td className={`whitespace-nowrap px-4 py-2 text-right font-semibold ${TONE[m.tipo]}`}>
                    {m.tipo === "ingreso" ? "+" : "−"}
                    {formatCordobas(m.monto)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <BorrarButton tabla="movimientos" id={m.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
