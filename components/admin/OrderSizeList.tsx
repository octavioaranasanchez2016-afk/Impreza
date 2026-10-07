"use client";

import { useState } from "react";
import { ProductCategory } from "@/lib/types";
import { GroupDesignPreview } from "@/lib/group-design";
import { Ejemplos, GroupPersonal, PersonExtra } from "@/lib/group-names";
import { GroupShirtPreview } from "../GroupShirtPreview";

// En el pedido del panel: la lista de tallas del grupo con la que se armó, ordenada
// por talla, para empacar y entregar cada camisa a su dueño. También sale al imprimir.
// Tocar a alguien muestra cómo va su camisa.
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export interface OrderSizeListEntry {
  nombre: string;
  talla: string;
  cantidad: number;
  texto?: string | null; // lo que dice su camisa
  numero?: string | null;
  propio?: string | null; // la letra y el color que eligió, si se podía ("Colegial, dorado")
  extra?: string | null; // su otro texto
  valores?: Ejemplos; // lo que escribió, para dibujar su camisa
  estilo?: PersonExtra;
}

export function OrderSizeList({
  nombre,
  organizador,
  entries,
  nombresEstilo,
  etiqueta,
  labels,
  shirt,
}: {
  nombre: string;
  organizador: string | null;
  entries: OrderSizeListEntry[];
  nombresEstilo?: string | null; // "Espalda: nombre (Colegial, blanco) y número (Impacto, blanco) · …"
  etiqueta?: string | null; // lo que se pidió en "otro texto"
  labels?: { texto: string; numero: string; extra: string } | null; // dónde va cada cosa
  shirt?: { category: ProductCategory; colorHex: string; designs: GroupDesignPreview; personal: GroupPersonal | null } | null;
}) {
  const [shown, setShown] = useState(0);
  const withText = entries.some((e) => e.texto);
  const withNumber = entries.some((e) => e.numero);
  const withOwn = entries.some((e) => e.propio);
  const withExtra = entries.some((e) => e.extra);
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
      {shirt && sorted[shown] && (
        <div className="mt-3 rounded-brand bg-paper-soft p-3">
          <p className="text-xs font-semibold text-ink">
            Así va la camisa de {sorted[shown].nombre}
            <span className="font-normal text-ink-soft"> · toca a alguien en la tabla para ver la suya</span>
          </p>
          <div className="mt-2">
            <GroupShirtPreview
              category={shirt.category}
              colorHex={shirt.colorHex}
              designs={shirt.designs}
              personal={shirt.personal}
              valores={sorted[shown].valores}
              propio={sorted[shown].estilo}
            />
          </div>
        </div>
      )}
      {(withText || withNumber || withExtra || nombresEstilo) && (
        <p className="mt-3 rounded-brand border-2 border-ink px-3 py-2 text-sm text-ink">
          <span className="font-semibold">Cada camisa personalizada</span>
          {nombresEstilo ? `: ${nombresEstilo}` : " (no quedó guardado dónde va ni cómo; pregúntalo al cliente)"}
        </p>
      )}
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-muted">
            <th className="pb-2 font-medium">Nombre</th>
            <th className="pb-2 font-medium">Talla</th>
            {withText && <th className="pb-2 font-medium">{labels?.texto ?? "Dice la camisa"}</th>}
            {withNumber && <th className="pb-2 font-medium">{labels?.numero ?? "Número"}</th>}
            {withExtra && <th className="pb-2 font-medium">{labels?.extra ?? etiqueta ?? "Otro texto"}</th>}
            {withOwn && <th className="pb-2 font-medium">Letra y color</th>}
            <th className="pb-2 text-right font-medium">Piezas</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((e, i) => (
            <tr
              key={`${e.nombre}-${i}`}
              onClick={() => setShown(i)}
              className={`cursor-pointer border-t border-black/5 ${shirt && i === shown ? "bg-paper-soft" : "hover:bg-paper-soft/60"}`}
            >
              <td className="py-1.5 text-ink">{e.nombre}</td>
              <td className="py-1.5 font-semibold text-ink">{e.talla}</td>
              {withText && <td className="py-1.5 font-semibold text-ink">{e.texto ?? "—"}</td>}
              {withNumber && <td className="py-1.5 font-semibold text-ink">{e.numero ?? "—"}</td>}
              {withExtra && <td className="py-1.5 font-semibold text-ink">{e.extra ?? "—"}</td>}
              {withOwn && <td className="py-1.5 text-ink">{e.propio ?? "—"}</td>}
              <td className="py-1.5 text-right text-ink">{e.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
