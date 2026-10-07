"use client";

import { DesignZone, ProductCategory } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/design";
import {
  LLEVA_LABEL,
  Lleva,
  Lugares,
  NAME_COLORS,
  NAME_FONTS,
  NameChoice,
  NameStyle,
  llevaNombre,
  llevaNumero,
  lugarDeZona,
  lugarLabel,
  lugarZone,
  lugaresEnOrden,
  lugaresFor,
} from "@/lib/group-names";
import { ZONE_NAME } from "./GarmentShape";

// Camisas de grupo, dentro del diseñador: qué lleva de cada persona el lado que se
// está viendo (nombre, número o los dos), con qué letra y color. El nombre de ejemplo
// se ve sobre la prenda, junto al diseño, así que no hace falta otra vista previa.
export function GroupNamesControls({
  category,
  zone,
  onZoneChange,
  campos,
  style,
  onChange,
  keepOne,
  choice,
  onChoiceChange,
  examples,
  shown,
  onShow,
}: {
  category: ProductCategory;
  zone: DesignZone; // el lado que se está viendo
  onZoneChange: (zone: DesignZone) => void;
  campos: { nombre: boolean; numero: boolean }; // lo que se puede poner
  style: NameStyle; // style.lugares ya ajustados a la prenda
  onChange: (style: NameStyle) => void;
  keepOne: boolean; // en el pedido, los nombres que ya escribieron tienen que ir en algún lado
  choice?: NameChoice; // solo al diseñar la lista: lo que cada quien puede elegir
  onChoiceChange?: (choice: NameChoice) => void;
  examples: { texto: string; numero: string }[];
  shown: number;
  onShow: (index: number) => void;
}) {
  const lugar = lugarDeZona(zone);
  const enPrenda = lugar && lugaresFor(category).includes(lugar) ? lugar : null;
  const current = enPrenda ? style.lugares[enPrenda] : undefined;
  const others = lugaresEnOrden(style.lugares).filter(([l]) => l !== enPrenda);
  const active = Object.keys(style.lugares).length > 0;
  const titulo = campos.nombre && campos.numero ? "Nombre y número" : campos.nombre ? "Nombre" : "Número";

  function toggle(campo: "nombre" | "numero") {
    if (!enPrenda) return;
    const has = { nombre: llevaNombre(current), numero: llevaNumero(current) };
    has[campo] = !has[campo];
    const lleva: Lleva | null = has.nombre && has.numero ? "ambos" : has.nombre ? "nombre" : has.numero ? "numero" : null;
    const lugares: Lugares = { ...style.lugares };
    if (lleva) lugares[enPrenda] = lleva;
    else delete lugares[enPrenda];
    if (keepOne && Object.keys(lugares).length === 0) return;
    onChange({ ...style, lugares });
  }

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      on ? "border-ink bg-ink text-paper" : "border-black/15 bg-white text-ink-soft hover:border-ink hover:text-ink"
    }`;
  const sample = examples[shown] ?? { texto: "CHEPE", numero: "10" };

  return (
    <div className="mt-4 rounded-brand border-2 border-ink bg-white p-4">
      <p className="text-sm font-semibold text-ink">{titulo} de cada persona</p>
      <p className="mt-0.5 text-xs text-ink-soft">
        Cada quien escribe lo suyo al anotarse en la lista. Aquí eliges dónde va y lo ves sobre la prenda, junto al diseño.
      </p>

      {enPrenda ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">¿Qué lleva {ZONE_NAME[zone]}?</span>
          <span className="flex gap-1.5">
            {campos.nombre && (
              <button type="button" onClick={() => toggle("nombre")} aria-pressed={llevaNombre(current)} className={chip(llevaNombre(current))}>
                {llevaNombre(current) ? "✓ " : ""}Nombre
              </button>
            )}
            {campos.numero && (
              <button type="button" onClick={() => toggle("numero")} aria-pressed={llevaNumero(current)} className={chip(llevaNumero(current))}>
                {llevaNumero(current) ? "✓ " : ""}Número
              </button>
            )}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-muted">En {ZONE_NAME[zone]} no va el nombre: elige otro lado de la prenda.</p>
      )}

      {others.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
          {enPrenda && current ? "También en:" : "Va en:"}
          {others.map(([l, lleva]) => (
            <button
              key={l}
              type="button"
              onClick={() => onZoneChange(lugarZone(l))}
              className="rounded-full bg-paper-soft px-2.5 py-1 font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              {lugarLabel(l, category)} · {LLEVA_LABEL[lleva]}
            </button>
          ))}
        </p>
      )}

      {active && (
        <div className="mt-4 space-y-3 border-t border-black/10 pt-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Letra de los nombres</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {NAME_FONTS.map((f) => {
                const option = FONT_OPTIONS.find((o) => o.value === f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => onChange({ ...style, fuente: f })}
                    aria-pressed={style.fuente === f}
                    title={option?.label}
                    className={`h-9 rounded-brand border px-3 text-sm transition-colors ${
                      style.fuente === f ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                    }`}
                    style={{ fontFamily: option?.cssVar, fontWeight: option?.weight }}
                  >
                    {(sample.texto || sample.numero).slice(0, 8)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-soft">Color de los nombres</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {NAME_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onChange({ ...style, color: c.hex })}
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
          </div>

          {choice && onChoiceChange && (
            <div className="rounded-brand bg-paper-soft p-3">
              <p className="text-xs font-semibold text-ink">¿Dejas que cada quien elija?</p>
              <p className="text-[11px] text-ink-soft">Lo de arriba queda como lo normal; cada quien lo puede cambiar al anotarse.</p>
              <div className="mt-2 space-y-1.5">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={choice.color}
                    onChange={(e) => onChoiceChange({ ...choice, color: e.target.checked })}
                    className="h-4 w-4 accent-ink"
                  />
                  El color de su nombre
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={choice.fuente}
                    onChange={(e) => onChoiceChange({ ...choice, fuente: e.target.checked })}
                    className="h-4 w-4 accent-ink"
                  />
                  Su letra
                </label>
              </div>
            </div>
          )}

          {examples.length > 1 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-ink-muted">Ver con:</span>
              {examples.map((e, i) => (
                <button
                  key={`${e.texto}-${i}`}
                  type="button"
                  onClick={() => onShow(i)}
                  className={`max-w-[7rem] truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    shown === i ? "bg-ink text-paper" : "bg-paper-soft text-ink-soft hover:text-ink"
                  }`}
                >
                  {e.texto || `#${e.numero}`}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
