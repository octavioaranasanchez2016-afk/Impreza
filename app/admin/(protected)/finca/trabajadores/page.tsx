import { formatCordobas } from "@/lib/currency";
import {
  fechaCorta,
  fincaSelect,
  mesActual,
  mesRango,
  normCultivo,
  normPago,
  normTrab,
  type Cultivo,
  type Pago,
  type Trabajador,
} from "@/lib/finca";
import { PagoForm, TrabajadorForm, ToggleButton, BorrarButton } from "@/components/admin/FincaForms";
import { FincaMissing } from "@/components/admin/FincaMissing";

export const dynamic = "force-dynamic";

export default async function TrabajadoresPage() {
  const { desde, hasta } = mesRango(mesActual());
  const [trab, pagos, mesPagos, cultivos] = await Promise.all([
    fincaSelect<Trabajador>("finca_trabajadores", { order: "nombre", asc: true }),
    fincaSelect<Pago>("finca_pagos", { order: "fecha", limit: 60 }),
    fincaSelect<Pago>("finca_pagos", { desde, hasta }),
    fincaSelect<Cultivo>("finca_cultivos", { order: "nombre", asc: true }),
  ]);
  const trabajadores = trab.rows.map(normTrab);
  const cultivoRows = cultivos.rows.map(normCultivo);
  const nombreT = (id: string) => trabajadores.find((t) => t.id === id)?.nombre ?? "—";
  const nombreC = (id: string | null) => cultivoRows.find((c) => c.id === id)?.nombre;

  const delMes = new Map<string, { monto: number; dias: number }>();
  for (const p of mesPagos.rows.map(normPago)) {
    const cur = delMes.get(p.trabajador_id) ?? { monto: 0, dias: 0 };
    delMes.set(p.trabajador_id, { monto: cur.monto + p.monto, dias: cur.dias + (p.dias ?? 0) });
  }
  const totalMes = [...delMes.values()].reduce((s, v) => s + v.monto, 0);

  return (
    <div className="space-y-8">
      {(trab.missing || pagos.missing) && <FincaMissing />}

      <div className="grid gap-4 lg:grid-cols-2">
        <PagoForm
          trabajadores={trabajadores.filter((t) => t.activo).map((t) => ({ id: t.id, nombre: t.nombre, pago_dia: t.pago_dia }))}
          cultivos={cultivoRows.filter((c) => c.estado === "activo").map((c) => ({ id: c.id, nombre: c.nombre }))}
        />
        <TrabajadorForm />
      </div>

      <div>
        <p className="mb-3 font-bold text-ink">
          Trabajadores <span className="font-normal text-ink-soft">· pagado este mes: {formatCordobas(totalMes)}</span>
        </p>
        {trabajadores.length === 0 ? (
          <p className="rounded-brand border border-dashed border-black/15 bg-white p-8 text-center text-sm text-ink-soft">
            Agrega a tu primer trabajador arriba.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-brand border border-black/10 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2 text-right">Jornal</th>
                  <th className="px-4 py-2 text-right">Días este mes</th>
                  <th className="px-4 py-2 text-right">Pagado este mes</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {trabajadores.map((t) => {
                  const m = delMes.get(t.id);
                  return (
                    <tr key={t.id} className={t.activo ? "" : "opacity-50"}>
                      <td className="px-4 py-2">
                        <span className="font-medium text-ink">{t.nombre}</span>
                        {t.telefono && <span className="block text-xs text-ink-soft">{t.telefono}</span>}
                      </td>
                      <td className="px-4 py-2 text-right">{formatCordobas(t.pago_dia)}</td>
                      <td className="px-4 py-2 text-right">{m?.dias ?? 0}</td>
                      <td className="px-4 py-2 text-right font-semibold">{formatCordobas(m?.monto ?? 0)}</td>
                      <td className="px-4 py-2 text-right">
                        <ToggleButton
                          body={{ accion: "trabajador_activo", id: t.id, activo: !t.activo }}
                          label={t.activo ? "Ya no trabaja" : "Reactivar"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 font-bold text-ink">Últimos pagos</p>
        {pagos.rows.length === 0 ? (
          <p className="rounded-brand border border-dashed border-black/15 bg-white p-8 text-center text-sm text-ink-soft">
            Todavía no hay pagos.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-brand border border-black/10 bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-black/5">
                {pagos.rows.map(normPago).map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-ink-soft">{fechaCorta(p.fecha)}</td>
                    <td className="px-4 py-2">
                      <span className="font-medium text-ink">{nombreT(p.trabajador_id)}</span>
                      <span className="block text-xs text-ink-soft">
                        {[p.dias ? `${p.dias} día${p.dias === 1 ? "" : "s"}` : null, nombreC(p.cultivo_id), p.nota]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right font-semibold">{formatCordobas(p.monto)}</td>
                    <td className="px-4 py-2 text-right">
                      <BorrarButton tabla="pagos" id={p.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
