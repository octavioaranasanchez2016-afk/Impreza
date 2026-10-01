import { fechaCorta, fincaSelect, normCultivo, type Cultivo } from "@/lib/finca";
import { CultivoForm, ToggleButton, BorrarButton } from "@/components/admin/FincaForms";
import { FincaMissing } from "@/components/admin/FincaMissing";

export const dynamic = "force-dynamic";

export default async function CultivosPage() {
  const { rows, missing } = await fincaSelect<Cultivo>("finca_cultivos", { order: "created_at" });
  const cultivos = rows.map(normCultivo);

  return (
    <div>
      {missing && <FincaMissing />}
      <CultivoForm />

      <p className="mb-3 mt-8 font-bold text-ink">Cultivos</p>
      {cultivos.length === 0 ? (
        <p className="rounded-brand border border-dashed border-black/15 bg-white p-8 text-center text-sm text-ink-soft">
          Agrega tus cultivos para saber cuánto gana o pierde cada uno.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cultivos.map((c) => (
            <li key={c.id} className="rounded-brand border border-black/10 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-ink">{c.nombre}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    c.estado === "activo" ? "bg-green-100 text-green-800" : "bg-black/5 text-ink-soft"
                  }`}
                >
                  {c.estado === "activo" ? "En curso" : "Cosechado"}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                {[c.area_mz ? `${c.area_mz} mz` : null, c.fecha_siembra ? `sembrado ${fechaCorta(c.fecha_siembra)}` : null]
                  .filter(Boolean)
                  .join(" · ") || "Sin datos"}
              </p>
              {c.notas && <p className="mt-2 text-sm text-ink-soft">{c.notas}</p>}
              <div className="mt-3 flex items-center justify-between">
                <ToggleButton
                  body={{ accion: "cultivo_estado", id: c.id, estado: c.estado === "activo" ? "cosechado" : "activo" }}
                  label={c.estado === "activo" ? "Marcar como cosechado" : "Volver a en curso"}
                />
                <BorrarButton tabla="cultivos" id={c.id} aviso="Sus movimientos quedan sin cultivo." />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
