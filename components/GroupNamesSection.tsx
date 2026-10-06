"use client";

import { useState } from "react";
import { ProductCategory } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/design";
import { NAME_COLORS, NAME_FONTS, NameStyle, Personalizado, UBICACIONES } from "@/lib/group-names";
import { getZonesForCategory } from "./GarmentShape";
import { NamePreview } from "./NamePreview";

// Apartado del diseñador solo para pedidos de grupo que vienen de una lista con
// nombres: cada camisa lleva lo que escribió su dueño; aquí se elige dónde va y
// cómo se ve, viendo los nombres reales del grupo.
export function GroupNamesSection({
  category,
  colorHex,
  personalizado,
  examples,
  style,
  onChange,
}: {
  category: ProductCategory;
  colorHex: string;
  personalizado: Personalizado;
  examples: { texto: string; numero: string }[];
  style: NameStyle;
  onChange: (style: NameStyle) => void;
}) {
  const [shown, setShown] = useState(0);
  const sample = examples[shown] ?? { texto: "CHEPE", numero: "10" };
  const zones = getZonesForCategory(category);
  const places = UBICACIONES.filter((u) =>
    u.value.startsWith("espalda") ? zones.includes("espalda") : u.value === "manga-izq" ? zones.includes("manga-izq") : true
  );
  const set = (patch: Partial<NameStyle>) => onChange({ ...style, ...patch });

  return (
    <div className="rounded-brand border-2 border-ink bg-white p-4 md:p-5">
      <p className="font-display text-3xl uppercase leading-none tracking-wide text-ink">Nombre de cada persona</p>
      <p className="mt-1 text-sm text-ink-soft">
        Cada camisa lleva {personalizado === "nombre_numero" ? "el nombre y el número" : "el nombre o apodo"} que escribió su
        dueño en la lista. Elige dónde va y cómo se ve: nosotros lo ponemos en cada una.
      </p>

      <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_12rem]">
        <div className="space-y-4">
          <fieldset>
            <legend className="text-xs font-semibold text-ink-soft">¿Dónde va?</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {places.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => set({ ubicacion: u.value })}
                  aria-pressed={style.ubicacion === u.value}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    style.ubicacion === u.value ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-ink-soft">Letra</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {NAME_FONTS.map((f) => {
                const option = FONT_OPTIONS.find((o) => o.value === f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set({ fuente: f })}
                    aria-pressed={style.fuente === f}
                    title={option?.label}
                    className={`h-9 rounded-brand border px-3 text-sm transition-colors ${
                      style.fuente === f ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                    }`}
                    style={{ fontFamily: option?.cssVar, fontWeight: option?.weight }}
                  >
                    {sample.texto.slice(0, 8) || "Nombre"}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-ink-soft">Color</legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {NAME_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => set({ color: c.hex })}
                  aria-label={c.name}
                  aria-pressed={style.color === c.hex}
                  title={c.name}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    style.color === c.hex ? "scale-110 border-ink" : "border-black/10"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <NamePreview
            category={category}
            colorHex={colorHex}
            texto={sample.texto}
            numero={personalizado === "nombre_numero" ? sample.numero : undefined}
            style={style}
          />
          {examples.length > 1 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {examples.map((e, i) => (
                <button
                  key={`${e.texto}-${i}`}
                  type="button"
                  onClick={() => setShown(i)}
                  className={`max-w-[6rem] truncate rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    shown === i ? "bg-ink text-paper" : "bg-paper-soft text-ink-soft hover:text-ink"
                  }`}
                >
                  {e.texto || `#${e.numero}`}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1 text-center text-[10px] text-ink-muted">Vista de ejemplo con nombres de tu grupo</p>
        </div>
      </div>
    </div>
  );
}
