"use client";

import { useState } from "react";
import { DesignMockup } from "./DesignMockup";
import { isDarkColor } from "./GarmentShape";
import { FONT_OPTIONS, FontFamilyKey } from "@/lib/design";
import { DesignTransform } from "@/lib/types";

const SHIRTS = [
  { name: "Negro", hex: "#111111" },
  { name: "Blanco", hex: "#FFFFFF" },
  { name: "Rojo", hex: "#C8102E" },
  { name: "Azul rey", hex: "#1D4ED8" },
  { name: "Beige", hex: "#E8DCC4" },
];
const FONTS: FontFamilyKey[] = ["display", "colegial", "script", "gotica"];

// Probadita del diseñador en el inicio: escribe, cambia color y letra, y arrastra.
// Es el mismo dibujo a escala real del diseñador, con sus medidas en cm.
export function HomeDesignDemo() {
  const [text, setText] = useState("IMPREZA");
  const [shirt, setShirt] = useState(SHIRTS[0]);
  const [font, setFont] = useState<FontFamilyKey>("display");
  const [transform, setTransform] = useState<DesignTransform>({ x: 50, y: 34, scale: 0.8, rotation: 0 });
  const ink = isDarkColor(shirt.hex) ? "#FFFFFF" : "#111111";

  return (
    <div className="relative mx-auto max-w-md rounded-brand bg-white p-4 shadow-xl ring-1 ring-black/5">
      <span className="absolute -right-3 -top-3 z-10 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper shadow">
        Pruébalo aquí
      </span>
      <DesignMockup
        category="camisa"
        zone="frente"
        color={shirt.hex}
        size="M"
        content={{ kind: "texto", texto: text, color: ink, fontFamily: font }}
        transform={transform}
        onTransformChange={setTransform}
      />

      <label className="mt-4 block">
        <span className="sr-only">Tu texto</span>
        <input
          value={text}
          maxLength={20}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe tu texto"
          className="input text-center text-base font-semibold"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5" role="group" aria-label="Color de la camisa">
          {SHIRTS.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setShirt(s)}
              aria-label={s.name}
              aria-pressed={shirt === s}
              title={s.name}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                shirt === s ? "scale-110 border-ink" : "border-black/10"
              }`}
              style={{ backgroundColor: s.hex }}
            />
          ))}
        </div>
        <div className="flex gap-1" role="group" aria-label="Tipo de letra">
          {FONTS.map((f) => {
            const option = FONT_OPTIONS.find((o) => o.value === f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFont(f)}
                aria-label={option?.label}
                aria-pressed={font === f}
                title={option?.label}
                className={`h-8 w-9 rounded-brand border text-base leading-none transition-colors ${
                  font === f ? "border-ink bg-ink text-paper" : "border-black/15 text-ink hover:border-ink"
                }`}
                style={{ fontFamily: option?.cssVar, fontWeight: option?.weight }}
              >
                Aa
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-muted">
        Arrastra el texto para moverlo; la bolita de abajo cambia el tamaño.
      </p>
    </div>
  );
}
