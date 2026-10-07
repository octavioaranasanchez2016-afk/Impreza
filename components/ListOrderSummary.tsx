"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCategory } from "@/lib/types";
import { GroupDesignPreview } from "@/lib/group-design";
import { Ejemplos, GroupPersonal, describePersonal } from "@/lib/group-names";
import { GroupShirtPreview } from "./GroupShirtPreview";

// Pedido armado desde una lista con su camisa de ejemplo: el organizador ya hizo el
// diseño y cada quien escribió lo suyo, así que aquí no se vuelve a diseñar. Se ve la
// camisa terminada, cuántas van de cada talla y lo de cada quien; si hay que cambiar
// algo, se cambia en la lista.
export function ListOrderSummary({
  listName,
  category,
  colorHex,
  details,
  sizes,
  designs,
  personal,
  examples,
  changeHref,
  backHref,
  missingPieces,
  onAddPieces,
  onCustomize,
}: {
  listName: string;
  category: ProductCategory;
  colorHex: string;
  details: string; // "Camisa polo · Blanco · Bordado · Algodón 100%"
  sizes: [string, number][]; // piezas en el pedido por talla
  designs: GroupDesignPreview;
  personal: GroupPersonal | null;
  examples: { nombre: string; valores: Ejemplos }[];
  changeHref: string | null; // al diseño de la lista (solo con la clave del organizador)
  backHref: string;
  missingPieces: number; // piezas escritas en las tallas que todavía no están en el pedido
  onAddPieces: () => void;
  onCustomize: () => void;
}) {
  const [shown, setShown] = useState(-1);
  const total = sizes.reduce((sum, [, n]) => sum + n, 0);

  return (
    <div className="mt-3 rounded-brand border-2 border-ink bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-ink">«{listName}»</p>
        <p className="text-xs text-ink-soft">{details}</p>
      </div>

      <div className="mt-4">
        <GroupShirtPreview
          category={category}
          colorHex={colorHex}
          designs={designs}
          personal={personal}
          valores={shown >= 0 ? examples[shown]?.valores : undefined}
        />
        {personal && examples.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
            <span className="text-[11px] text-ink-muted">Ver la camisa de:</span>
            {[{ nombre: "La de ejemplo" }, ...examples].map((e, i) => (
              <button
                key={`${e.nombre}-${i}`}
                type="button"
                onClick={() => setShown(i - 1)}
                className={`max-w-[8rem] truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  shown === i - 1 ? "bg-ink text-paper" : "bg-paper-soft text-ink-soft hover:text-ink"
                }`}
              >
                {e.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-brand bg-paper-soft p-3">
          <p className="text-xs font-semibold text-ink-soft">En tu pedido</p>
          {total > 0 ? (
            <>
              <p className="mt-0.5 font-display text-3xl leading-none tracking-wide text-ink">
                {total} pieza{total === 1 ? "" : "s"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sizes.map(([talla, n]) => (
                  <span key={talla} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink">
                    {talla}: {n}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">Todavía no hay piezas en el pedido.</p>
          )}
          {missingPieces > 0 && (
            <button
              type="button"
              onClick={onAddPieces}
              className="mt-3 w-full rounded-brand bg-ink px-3 py-2 text-sm font-semibold text-paper hover:opacity-80"
            >
              + Agregar {missingPieces} pieza{missingPieces === 1 ? "" : "s"} al pedido
            </button>
          )}
        </div>
        <div className="rounded-brand bg-paper-soft p-3">
          <p className="text-xs font-semibold text-ink-soft">Lo de cada quien</p>
          <p className="mt-1 text-sm text-ink">
            {personal
              ? `${describePersonal(personal)}. Cada camisa lleva lo que escribió su dueño en la lista; el taller lo pone una por una.`
              : "Todas las camisas van iguales; solo cambia la talla."}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-black/10 pt-3 text-sm">
        {changeHref && (
          <Link href={changeHref} className="font-semibold text-ink underline">
            Cambiar el diseño
          </Link>
        )}
        <Link href={backHref} className="font-semibold text-ink-soft hover:text-ink hover:underline">
          Volver a la lista
        </Link>
        <button type="button" onClick={onCustomize} className="text-xs text-ink-muted hover:text-ink hover:underline">
          Agregar otras prendas al pedido
        </button>
      </div>
    </div>
  );
}
