"use client";

import { ProductCategory } from "@/lib/types";
import { Lleva, Lugar, Lugares, llevaNombre, llevaNumero, lugarLabel, lugaresFor } from "@/lib/group-names";

// Qué lleva cada lugar de la camisa: el nombre, el número o los dos. Lo usa el
// organizador al crear la lista y el diseñador para acomodarlo después.
export function LugaresPicker({
  category,
  value,
  onChange,
  campos = { nombre: true, numero: true },
}: {
  category: ProductCategory;
  value: Lugares;
  onChange: (lugares: Lugares) => void;
  campos?: { nombre: boolean; numero: boolean }; // lo que se puede poner (en el diseñador: lo que la gente escribió)
}) {
  function toggle(lugar: Lugar, campo: "nombre" | "numero") {
    const current = value[lugar];
    const has = { nombre: llevaNombre(current), numero: llevaNumero(current) };
    has[campo] = !has[campo];
    const lleva: Lleva | null = has.nombre && has.numero ? "ambos" : has.nombre ? "nombre" : has.numero ? "numero" : null;
    const next: Lugares = { ...value };
    if (lleva) next[lugar] = lleva;
    else delete next[lugar];
    // Siempre queda al menos un lugar con algo.
    if (Object.keys(next).length > 0) onChange(next);
  }

  const chip = (on: boolean) =>
    `min-w-[4.75rem] rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      on ? "border-ink bg-ink text-paper" : "border-black/15 bg-white text-ink-soft hover:border-ink hover:text-ink"
    }`;

  return (
    <div className="divide-y divide-black/5 rounded-brand border border-black/10 bg-white">
      {lugaresFor(category).map((lugar) => {
        const lleva = value[lugar];
        return (
          <div key={lugar} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className={`text-sm ${lleva ? "font-semibold text-ink" : "text-ink-soft"}`}>{lugarLabel(lugar, category)}</span>
            <span className="flex gap-1.5">
              {campos.nombre && (
                <button type="button" onClick={() => toggle(lugar, "nombre")} aria-pressed={llevaNombre(lleva)} className={chip(llevaNombre(lleva))}>
                  {llevaNombre(lleva) ? "✓ " : ""}Nombre
                </button>
              )}
              {campos.numero && (
                <button type="button" onClick={() => toggle(lugar, "numero")} aria-pressed={llevaNumero(lleva)} className={chip(llevaNumero(lleva))}>
                  {llevaNumero(lleva) ? "✓ " : ""}Número
                </button>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
