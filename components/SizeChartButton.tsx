"use client";

import { useEffect, useState } from "react";
import { ProductCategory } from "@/lib/types";
import { SIZE_MEASUREMENTS } from "./GarmentShape";

// Botón chico junto a las tallas del diseñador: abre la tabla de medidas de la prenda.
export function SizeChartButton({ category, productName }: { category: ProductCategory; productName: string }) {
  const [open, setOpen] = useState(false);
  const sizes = Object.entries(SIZE_MEASUREMENTS[category]);

  // Esc cierra la tabla.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-black/15 px-2.5 py-1 text-[11px] font-semibold text-ink hover:border-ink"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
          <path d="M3 8.5 8.5 3 21 15.5 15.5 21 3 8.5Z M7 7l1.5 1.5 M10 10l1.5 1.5 M13 13l1.5 1.5" />
        </svg>
        Tabla de tallas
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Tabla de tallas"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-brand bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-3xl uppercase leading-none tracking-wide text-ink">Tabla de tallas</p>
                <p className="mt-1 text-xs text-ink-soft">{productName} · medidas de la prenda extendida</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-brand border border-black/15 px-3 py-1.5 text-sm font-semibold text-ink hover:border-ink"
              >
                Cerrar
              </button>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted">
                  <th className="pb-2 font-medium">Talla</th>
                  <th className="pb-2 font-medium">Ancho (pecho)</th>
                  <th className="pb-2 font-medium">Largo</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map(([size, m]) => (
                  <tr key={size} className="border-t border-black/5">
                    <td className="py-2 font-semibold text-ink">{size}</td>
                    <td className="py-2 text-ink">{m.ancho} cm</td>
                    <td className="py-2 text-ink">{m.largo} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 rounded-brand bg-paper-soft p-3 text-xs text-ink-soft">
              <span className="font-semibold text-ink">¿Cómo saber tu talla?</span> Extiende una camisa que te quede bien,
              mide de axila a axila (ancho) y del hombro al borde de abajo (largo), y compárala con la tabla.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
