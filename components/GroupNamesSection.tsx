"use client";

import { useState } from "react";
import { ProductCategory } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/design";
import { NAME_COLORS, NAME_FONTS, NameStyle, Personalizado, camposDe, fitLugares } from "@/lib/group-names";
import { GroupDesignPreview } from "@/lib/group-design";
import { LugaresPicker } from "./LugaresPicker";
import { NamePreview } from "./NamePreview";

// Apartado del diseñador solo para pedidos de grupo que vienen de una lista
// personalizada: cada camisa lleva lo que escribió su dueño. Llega con los lugares
// que eligió el organizador; aquí se pueden acomodar y se eligen letra y color,
// viendo los nombres reales del grupo.
export function GroupNamesSection({
  category,
  colorHex,
  personalizado,
  examples,
  style,
  onChange,
  designs,
  intro,
}: {
  category: ProductCategory;
  colorHex: string;
  personalizado: Personalizado;
  examples: { texto: string; numero: string }[];
  style: NameStyle;
  onChange: (style: NameStyle) => void;
  designs?: GroupDesignPreview; // lo que está en el diseñador, para verlo junto con los nombres
  intro?: string; // en vez de la explicación de siempre
}) {
  const [shown, setShown] = useState(0);
  const campos = camposDe(personalizado);
  const sample = examples[shown] ?? { texto: campos.nombre ? "CHEPE" : "", numero: "10" };
  const lugares = fitLugares(style.lugares, personalizado, category);
  const set = (patch: Partial<NameStyle>) => onChange({ ...style, lugares, ...patch });
  const what = campos.nombre && campos.numero ? "el nombre y el número" : campos.numero ? "el número" : "el nombre o apodo";

  return (
    <div className="rounded-brand border-2 border-ink bg-white p-4 md:p-5">
      <p className="font-display text-3xl uppercase leading-none tracking-wide text-ink">
        {campos.nombre ? "Nombre de cada persona" : "Número de cada persona"}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {intro ??
          `Cada camisa lleva ${what} que escribió su dueño en la lista. Aquí puedes cambiar dónde va, la letra y el color: nosotros lo ponemos en cada una.`}
      </p>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <fieldset>
          <legend className="text-xs font-semibold text-ink-soft">¿Qué va y dónde?</legend>
          <div className="mt-1.5">
            <LugaresPicker category={category} value={lugares} onChange={(l) => set({ lugares: l })} campos={campos} />
          </div>
        </fieldset>

        <div className="space-y-4">
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
                    {(sample.texto || sample.numero).slice(0, 8) || "Nombre"}
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
      </div>

      <div className="mt-5">
        <NamePreview
          category={category}
          colorHex={colorHex}
          texto={campos.nombre ? sample.texto : ""}
          numero={campos.numero ? sample.numero : undefined}
          style={{ ...style, lugares }}
          designs={designs}
        />
        {examples.length > 1 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1">
            {examples.map((e, i) => (
              <button
                key={`${e.texto}-${i}`}
                type="button"
                onClick={() => setShown(i)}
                className={`max-w-[7rem] truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  shown === i ? "bg-ink text-paper" : "bg-paper-soft text-ink-soft hover:text-ink"
                }`}
              >
                {e.texto || `#${e.numero}`}
              </button>
            ))}
          </div>
        )}
        <p className="mt-1 text-center text-[10px] text-ink-muted">Vista de ejemplo con {examples.length > 0 ? "gente de tu grupo" : "un nombre de muestra"}</p>
      </div>
    </div>
  );
}
